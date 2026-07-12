import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Mic, MicOff, Volume2, VolumeX, PhoneOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^\s*[-*>]\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .trim();
}

export default function ChatBot({ data }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am EV Guardian AI. Tap the mic and speak — I\'ll reply with voice too!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCallMode, setIsCallMode] = useState(false);   // continuous call mode
  const [isListening, setIsListening] = useState(false); // mic is actively picking up audio
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [interimText, setInterimText] = useState('');    // live transcript preview
  const [micSupported] = useState(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);
  const speechRecRef = useRef(null);
  const isTypingRef = useRef(false);
  const callModeRef = useRef(false);
  const currentLangRef = useRef('hi-IN');
  const isSpeakingRef = useRef(false);

  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);
  useEffect(() => { callModeRef.current = isCallMode; }, [isCallMode]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) { stopSpeaking(); stopCallMode(); }
  }, [isOpen]);

  // ── Sarvam TTS ──────────────────────────────────────────────────────
  const stopSpeaking = () => { 
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false); 
  };

  const speak = useCallback(async (text, onDone) => {
    if (!ttsEnabled) { onDone?.(); return; }
    stopSpeaking();
    
    try {
      setInterimText('Generating voice...');
      const res = await fetch('/api/chat/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: stripMarkdown(text), target_language_code: currentLangRef.current })
      });
      const resData = await res.json();
      setInterimText('');
      
      if (resData.success && resData.data.audio) {
        const audioSrc = `data:audio/wav;base64,${resData.data.audio}`;
        const audio = new Audio(audioSrc);
        currentAudioRef.current = audio;
        
        audio.onplay = () => {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
        };
        audio.onended = () => { 
          isSpeakingRef.current = false;
          setIsSpeaking(false); 
          onDone?.(); 
        };
        audio.onerror = () => { 
          isSpeakingRef.current = false;
          setIsSpeaking(false); 
          onDone?.(); 
        };
        
        await audio.play();
      } else {
        onDone?.();
      }
    } catch (e) {
      console.error("TTS Error", e);
      setInterimText('');
      onDone?.();
    }
  }, [ttsEnabled]);

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = useCallback(async (userMessage, resumeListeningAfter = false) => {
    if (!userMessage.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);
    setInterimText('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages, contextData: data, isVoice: resumeListeningAfter })
      });
      const resData = await response.json();
      const aiMsg = resData.success
        ? resData.data
        : { role: 'assistant', content: `Sorry, an error occurred: ${resData.error || 'Unknown error'}.` };
      setMessages(prev => [...prev, aiMsg]);
      if (callModeRef.current) {
        if (resumeListeningAfter) {
          speak(aiMsg.content, () => { if (callModeRef.current) startRecognition(); });
        } else {
          speak(aiMsg.content);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failed. Ensure the server is running.' }]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, data, speak]);

  // ── Speech Recognition via MediaRecorder & Sarvam API ─────────────
  const startRecognition = useCallback(async () => {
    if (!micSupported) return;
    if (isTypingRef.current || isSpeakingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      // Visual live captions (UI only)
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              interim += event.results[i][0].transcript;
            }
            if (interim) setInterimText(interim);
          };
          rec.start();
          speechRecRef.current = rec;
        } catch (err) {
          console.warn('SpeechRecognition UI fallback failed', err);
        }
      }

      mediaRecorder.onstart = () => {
        setIsListening(true);
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.minDecibels = -50;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        let silenceStart = Date.now();
        let hasSpoken = false;

        const checkSilence = () => {
          if (mediaRecorder.state !== 'recording') {
            audioContext.close();
            return;
          }
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          
          if (sum > 200) { 
            silenceStart = Date.now();
            hasSpoken = true;
          }
          
          const silenceDuration = Date.now() - silenceStart;
          if ((hasSpoken && silenceDuration > 1000) || (!hasSpoken && silenceDuration > 7000)) {
            mediaRecorder.stop();
          } else {
            requestAnimationFrame(checkSilence);
          }
        };
        checkSilence();
      };
      
      mediaRecorder.onstop = async () => {
        setIsListening(false);
        if (speechRecRef.current) {
          try { speechRecRef.current.stop(); } catch(e){}
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0 && callModeRef.current) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];
            setInterimText('Transcribing via Sarvam AI...');
            try {
              const res = await fetch('/api/chat/speech-to-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: base64Audio, mimeType: 'audio/webm' })
              });
              const sttData = await res.json();
              setInterimText('');
              if (sttData.success && sttData.data.text) {
                if (sttData.data.language_code) {
                  currentLangRef.current = sttData.data.language_code;
                }
                
                if (callModeRef.current) {
                  sendMessage(sttData.data.text, true);
                } else {
                  setInput(sttData.data.text);
                }
              } else {
                if (sttData.error) {
                  setInterimText(`Error: ${sttData.error}`);
                  setTimeout(() => { 
                    setInterimText(''); 
                    if (callModeRef.current) startRecognition(); 
                  }, 3000);
                } else {
                  if (callModeRef.current) startRecognition();
                }
              }
            } catch (err) {
              setInterimText('');
              if (callModeRef.current) startRecognition();
            }
          };
        } else {
           if (callModeRef.current) startRecognition();
        }
      };
      
      mediaRecorder.start();
    } catch (e) {
      console.error('Mic error:', e);
    }
  }, [micSupported, sendMessage]);

  // ── Call Mode ────────────────────────────────────────────────
  const startCallMode = () => {
    setIsCallMode(true);
    callModeRef.current = true;
    startRecognition();
  };

  const stopCallMode = () => {
    setIsCallMode(false);
    callModeRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecRef.current) {
      try { speechRecRef.current.stop(); } catch(e){}
    }
    setIsListening(false);
    setInterimText('');
    stopSpeaking();
  };

  // ── Text send ────────────────────────────────────────────────
  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    const msg = input.trim();
    setInput('');
    stopSpeaking();
    sendMessage(msg, false);
  };

  return (
    <>
      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        className="btn btn-primary"
        style={{ position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%', boxShadow: 'var(--shadow-lg)', zIndex: 9999, padding: 0 }}
        onClick={() => setIsOpen(true)}>
        <MessageSquare size={22} color="#fff" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', bottom: 90, right: 24, width: 390, height: 620, maxHeight: '82vh', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-lg)', zIndex: 10000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── Header ── */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <Bot size={20} color="var(--primary)" />
                  {isSpeaking && (
                    <motion.div animate={{ scale: [1, 1.7, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                      style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid var(--primary)', opacity: 0.4 }} />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>EV Guardian AI</h3>
                  <span style={{ fontSize: 10, fontWeight: 600, color: isCallMode ? (isListening ? 'var(--red)' : isSpeaking ? 'var(--primary)' : 'var(--green)') : 'var(--text-4)' }}>
                    {isCallMode
                      ? isListening ? '🎙️ Listening...' : isSpeaking ? '🔊 Speaking...' : isTyping ? '⏳ Thinking...' : '📞 Call Active'
                      : '● Ready'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <motion.button whileTap={{ scale: 0.9 }} title={ttsEnabled ? 'Mute AI voice' : 'Unmute AI voice'}
                  onClick={() => { setTtsEnabled(v => !v); if (isSpeaking) stopSpeaking(); }}
                  style={{ background: ttsEnabled ? 'rgba(50,83,220,0.1)' : 'var(--surface-3)', border: `1px solid ${ttsEnabled ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, padding: '5px 7px', cursor: 'pointer', display: 'flex' }}>
                  {ttsEnabled ? <Volume2 size={15} color="var(--primary)" /> : <VolumeX size={15} color="var(--text-4)" />}
                </motion.button>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ── CALL MODE overlay ── */}
            <AnimatePresence>
              {isCallMode && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ background: 'linear-gradient(135deg, rgba(50,83,220,0.08), rgba(50,83,220,0.03))', borderBottom: '1px solid rgba(50,83,220,0.15)', padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  {/* Sound bars */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 36 }}>
                    {[...Array(7)].map((_, i) => (
                      <motion.div key={i}
                        animate={isListening
                          ? { height: [8, 28 + (i % 3) * 8, 10, 32, 8], transition: { duration: 0.9, repeat: Infinity, delay: i * 0.1 } }
                          : isSpeaking
                            ? { height: [8, 22, 8], transition: { duration: 0.6, repeat: Infinity, delay: i * 0.08 } }
                            : { height: 6 }}
                        style={{ width: 5, background: isListening ? 'var(--red)' : isSpeaking ? 'var(--primary)' : 'var(--border)', borderRadius: 99, minHeight: 6 }} />
                    ))}
                  </div>
                  {/* Live interim transcript */}
                  {interimText && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic', textAlign: 'center', maxWidth: 300 }}>
                      "{interimText}"
                    </motion.p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-4)' }}>
                      {isListening ? 'Speak now...' : isSpeaking ? 'AI is replying...' : isTyping ? 'Processing...' : 'Waiting for you...'}
                    </span>
                  </div>
                  {/* End call button */}
                  <motion.button whileTap={{ scale: 0.95 }} onClick={stopCallMode}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 99, background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 16px rgba(239,68,68,0.35)' }}>
                    <PhoneOff size={15} /> Stop
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Messages ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: msg.role === 'user' ? 'var(--blue-bg)' : 'rgba(50,83,220,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {msg.role === 'user' ? <User size={15} color="var(--blue)" /> : <Bot size={15} color="var(--primary)" />}
                  </div>
                  <div style={{ background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-3)', color: msg.role === 'user' ? '#fff' : 'var(--text)', padding: '10px 14px', borderRadius: 12, borderTopLeftRadius: msg.role === 'assistant' ? 0 : 12, borderTopRightRadius: msg.role === 'user' ? 0 : 12, fontSize: 13, maxWidth: '80%' }}>
                    {msg.role === 'user' ? msg.content : (
                      <div className="prose prose-sm" style={{ margin: 0 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    {msg.role === 'assistant' && (
                      <button onClick={() => speak(msg.content)} title="Read aloud"
                        style={{ marginTop: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: 0 }}>
                        <Volume2 size={11} /> Read aloud
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(50,83,220,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={15} color="var(--primary)" />
                  </div>
                  <div style={{ background: 'var(--surface-3)', padding: '10px 14px', borderRadius: 12, borderTopLeftRadius: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Loader2 size={14} className="animate-spin" color="var(--text-3)" />
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input bar ── */}
            {!isCallMode && (
              <form onSubmit={handleSend} style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--surface-2)', alignItems: 'center' }}>
                {/* Call Mode button */}
                {micSupported && (
                  <motion.button type="button" whileTap={{ scale: 0.9 }}
                    onClick={startCallMode}
                    title="Start voice call mode"
                    style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid var(--border)', background: 'var(--surface-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mic size={16} color="var(--text-3)" />
                  </motion.button>
                )}
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type or tap 🎙️ for voice call..."
                  className="input"
                  style={{ flex: 1, borderRadius: 20, padding: '9px 16px', fontSize: 13 }}
                  disabled={isTyping}
                />
                <motion.button type="submit" whileTap={{ scale: 0.9 }}
                  className="btn btn-primary"
                  style={{ borderRadius: '50%', width: 38, height: 38, padding: 0, flexShrink: 0 }}
                  disabled={isTyping || !input.trim()}>
                  <Send size={16} color="#fff" style={{ transform: 'translateX(1px)' }} />
                </motion.button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
