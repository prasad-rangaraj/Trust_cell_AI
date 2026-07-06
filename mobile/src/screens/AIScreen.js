import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import Markdown from 'react-native-markdown-display';
import { C, S, R } from '../theme/colors';
import { Badge } from '../components/SharedComponents';
import { API_URL } from '../config';

const CHIPS = [
  'What is my battery health?',
  'Why is anomaly score high?',
  'Explain cell imbalance',
  'Is it safe to charge now?',
];

// ─── Markdown Styles ────────────────────────────────────────────────────────
const markdownStyles = {
  body: { fontSize: 13, color: C.text, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 8 },
  strong: { fontWeight: '700' },
  em: { fontStyle: 'italic' },
  code_inline: { backgroundColor: C.surface, paddingHorizontal: 4, borderRadius: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  code_block: { backgroundColor: C.surface, padding: 8, borderRadius: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  list_item: { marginTop: 4 },
};

// ─── Animated Ring for Avatar ─────────────────────────────────────────────────
function AnimatedRing() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[ss.avatarRing, { transform: [{ scale }] }]} />;
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Message({ msg, onSpeak, speaking }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[ss.msgRow, isUser ? ss.msgRowUser : ss.msgRowAi]}>
      <View style={[ss.msgAvatar, isUser ? ss.msgAvatarUser : ss.msgAvatarAi]}>
        {isUser ? (
          <Ionicons name="person" size={14} color={C.blue || C.primary} />
        ) : (
          <MaterialCommunityIcons name="robot-outline" size={16} color={C.primary} />
        )}
      </View>
      
      <View style={[ss.bubble, isUser ? ss.userBubble : ss.aiBubble]}>
        {isUser ? (
          <Text style={[ss.bubbleText, { color: C.white }]}>{msg.content}</Text>
        ) : (
          <View>
            <Markdown style={markdownStyles}>{msg.content}</Markdown>
            
            <TouchableOpacity onPress={() => onSpeak(msg.content)} style={ss.readAloudBtn} hitSlop={8}>
              <Ionicons
                name={speaking ? 'volume-high' : 'volume-medium-outline'}
                size={11}
                color={C.text4}
              />
              <Text style={ss.readAloudText}>Read aloud</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Recording waveform animation ────────────────────────────────────────────
function VoiceWave({ mode, metering }) { // mode: 'listening' | 'speaking' | null
  const bars = [...Array(7)].map(() => useRef(new Animated.Value(0.15)).current);

  useEffect(() => {
    if (!mode) {
      bars.forEach(b => Animated.timing(b, { toValue: 0.15, duration: 200, useNativeDriver: false }).start());
      return;
    }
    
    if (mode === 'speaking') {
      const anims = bars.map((b, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(b, { toValue: 1.0, duration: 300 + (i % 3) * 80, useNativeDriver: false }),
            Animated.timing(b, { toValue: 0.25, duration: 300 + (i % 3) * 80, useNativeDriver: false }),
          ])
        )
      );
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    } else if (mode === 'listening') {
      const rawVol = Math.max(0, metering + 50); 
      const targetScale = Math.min(1.0, rawVol / 30);
      
      const anims = bars.map((b, i) => {
        const noise = targetScale > 0.1 ? (Math.random() * 0.4 - 0.2) : 0;
        return Animated.timing(b, {
          toValue: Math.max(0.15, targetScale + noise),
          duration: 100,
          useNativeDriver: false,
        });
      });
      Animated.parallel(anims).start();
    }
  }, [mode, metering]);

  const color = mode === 'listening' ? C.red : mode === 'speaking' ? C.primary : C.border2;

  return (
    <View style={ss.waveRow}>
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={[ss.waveBar, {
            height: b.interpolate({ inputRange: [0, 1], outputRange: [6, 28 + (i % 3) * 8] }),
            backgroundColor: color,
          }]}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AIScreen({ data, connected, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hello! I am Edge Sense AI. Tap the mic and speak — I'll reply with voice too!",
    },
  ]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [recording,   setRecording]   = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [metering,    setMetering]    = useState(-60);
  const [transcribing,setTranscribing]= useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [ttsEnabled,  setTtsEnabled]  = useState(true);
  
  const [isCallMode, setIsCallMode] = useState(false);
  const callModeRef = useRef(false);

  const silenceCountRef = useRef(0);
  const isStoppingRef = useRef(false);
  const recordingRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { callModeRef.current = isCallMode; }, [isCallMode]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync().catch(() => {});
      Speech.stop();
    };
  }, []);

  const send = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg) {
      if (callModeRef.current) startRecording();
      return;
    }
    if (loading) return;
    
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages, contextData: data }),
      });
      const resData = await res.json();
      const reply = resData.success
        ? resData.data
        : { role: 'assistant', content: '⚠️ AI service unavailable. Please try again.' };
      setMessages(prev => [...prev, reply]);
      
      if ((ttsEnabled || callModeRef.current) && reply.content) {
        speakText(reply.content, newMessages.length);
      } else if (callModeRef.current) {
        startRecording();
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection failed. Is the server running?' }]);
      if (callModeRef.current) startRecording();
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  };

  const speakText = (text, idx) => {
    Speech.stop();
    setSpeakingIdx(idx);
    const clean = text.replace(/[*_#`>\[\]]/g, '').replace(/\n+/g, '. ');
    Speech.speak(clean, {
      language: 'en-US', // matching web's en-US preference
      pitch: 1.0,
      rate: 1.05,
      onDone: () => {
        setSpeakingIdx(null);
        if (callModeRef.current) startRecording();
      },
      onError: () => {
        setSpeakingIdx(null);
        if (callModeRef.current) startRecording();
      },
      onStopped: () => {
        setSpeakingIdx(null);
      },
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setSpeakingIdx(null);
  };

  const startRecording = async () => {
    try {
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
        recordingRef.current = null;
      }
      
      // Give the native module time to clean up previous instances
      await new Promise(resolve => setTimeout(resolve, 150));

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        alert('Microphone permission is required to use the voice bot.');
        if (callModeRef.current) setIsCallMode(false);
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      silenceCountRef.current = 0;
      isStoppingRef.current = false;
      setMetering(-60);

      const { recording: rec } = await Audio.Recording.createAsync(
        { ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true },
        (status) => {
          if (status.isRecording) {
            const currentMetering = status.metering ?? -60;
            setMetering(currentMetering);
            // Auto-silence detection (as a fallback if it works on their hardware)
            if (currentMetering < -30) {
              silenceCountRef.current += 1;
            } else {
              silenceCountRef.current = 0;
            }

            if (silenceCountRef.current > 20 && !isStoppingRef.current && callModeRef.current) {
              isStoppingRef.current = true;
              console.log(`[Voice] Silence detected (${status.metering} dB). Stopping recording...`);
              finishRecordingAndSend(rec);
            }
          }
        },
        100
      );
      setRecording(rec);
      recordingRef.current = rec;
      setIsRecording(true);
    } catch (e) {
      console.warn('[Voice] Recording start failed:', e);
      if (callModeRef.current) setIsCallMode(false);
    }
  };

  const finishRecordingAndSend = async (targetRecObj) => {
    const rec = targetRecObj || recordingRef.current;
    if (!rec) return;
    setIsRecording(false);
    setTranscribing(true);
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (recordingRef.current === rec) recordingRef.current = null;
      setRecording(null);

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      console.log(`[Voice] Read audio file. Base64 length: ${base64.length}`);
      
      console.log(`[Voice] Sending to API: ${API_URL}/api/chat/speech`);
      const res = await fetch(`${API_URL}/api/chat/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, mimeType: 'audio/m4a' }),
      });
      const json = await res.json();
      console.log(`[Voice] API response:`, JSON.stringify(json).substring(0, 200));
      
      if (json.success && json.data.text) {
        send(json.data.text);
      } else {
        if (!json.success) {
           console.warn('[Voice] STT API Error:', json.error);
           setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error connecting to transcription server.' }]);
        } else {
           console.log('[Voice] Transcription was empty.');
           setMessages(prev => [...prev, { role: 'assistant', content: 'I didn\'t quite catch that. Could you repeat?' }]);
        }
        
        if (callModeRef.current) {
           // Small delay before listening again if it was an error or empty
           setTimeout(() => startRecording(), 1000);
        }
      }
    } catch (e) {
      console.warn('[Voice] Transcription failed:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Network request failed. Are you sure the backend server is reachable on this Wi-Fi network?' }]);
      if (callModeRef.current) {
        setTimeout(() => startRecording(), 2000);
      }
    } finally {
      setTranscribing(false);
    }
  };

  const startCallMode = () => {
    setIsCallMode(true);
    callModeRef.current = true;
    startRecording();
  };

  const stopCallMode = async () => {
    setIsCallMode(false);
    callModeRef.current = false;
    stopSpeaking();
    if (recordingRef.current) {
      setIsRecording(false);
      try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
      recordingRef.current = null;
      setRecording(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={ss.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={ss.dragHandleRow}>
        <View style={ss.dragHandle} />
      </View>

      <View style={ss.topBar}>
        <View style={ss.topBarLeft}>
          <View style={{ position: 'relative' }}>
            <View style={ss.avatar}>
              <MaterialCommunityIcons name="robot-outline" size={20} color={C.primary} />
            </View>
            {speakingIdx !== null && <AnimatedRing />}
          </View>
          <View>
            <Text style={ss.topBarTitle}>Edge Sense AI</Text>
            <Text style={[ss.topBarSub, { color: isCallMode ? (isRecording ? C.red : speakingIdx !== null ? C.primary : C.green) : C.text4 }]}>
              {isCallMode
                ? (isRecording ? '🎙️ Listening...' : speakingIdx !== null ? '🔊 Speaking...' : transcribing || loading ? '⏳ Thinking...' : '📞 Call Active')
                : '● Ready'}
            </Text>
          </View>
        </View>
        <View style={ss.topBarRight}>
          <TouchableOpacity
            style={[ss.ttsToggle, { backgroundColor: ttsEnabled ? C.primaryBg : C.surface3, borderColor: ttsEnabled ? C.primaryBorder : C.border }]}
            onPress={() => { setTtsEnabled(v => !v); if (speakingIdx !== null) stopSpeaking(); }}
          >
            <Ionicons
              name={ttsEnabled ? 'volume-high' : 'volume-mute'}
              size={15}
              color={ttsEnabled ? C.primary : C.text4}
            />
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity style={ss.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={C.text3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isCallMode && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={ss.chipScroll}
          contentContainerStyle={ss.chipWrap}
        >
          {CHIPS.map((chip, i) => (
            <TouchableOpacity key={i} style={ss.chip} onPress={() => send(chip)} disabled={loading}>
              <Text style={ss.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        ref={scrollRef}
        style={ss.messages}
        contentContainerStyle={ss.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg, i) => (
          <Message
            key={i}
            msg={msg}
            onSpeak={(text) => speakingIdx === i ? stopSpeaking() : speakText(text, i)}
            speaking={speakingIdx === i}
          />
        ))}
        {(loading || transcribing) && (
          <View style={[ss.msgRow, ss.msgRowAi]}>
            <View style={[ss.msgAvatar, ss.msgAvatarAi]}>
              <MaterialCommunityIcons name="robot-outline" size={16} color={C.primary} />
            </View>
            <View style={[ss.bubble, ss.aiBubble, ss.thinkingBubble]}>
              <ActivityIndicator size="small" color={C.text3} />
              <Text style={ss.thinkingText}>
                {transcribing ? 'Transcribing voice…' : 'AI is thinking...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {isCallMode ? (
        <View style={ss.callOverlay}>
          <View style={ss.callStatusRow}>
            <VoiceWave 
              mode={isRecording ? 'listening' : (speakingIdx !== null ? 'speaking' : null)} 
              metering={metering} 
            />
          </View>
          <Text style={ss.callStatusText}>
            {isRecording ? 'Speak now, then tap Send...' : speakingIdx !== null ? 'AI is replying...' : transcribing || loading ? 'Processing...' : 'Waiting for you...'}
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            {isRecording && (
              <TouchableOpacity style={ss.sendVoiceBtn} onPress={() => {
                isStoppingRef.current = true;
                finishRecordingAndSend(recordingRef.current);
              }}>
                <Ionicons name="send" size={16} color={C.white} />
                <Text style={ss.sendVoiceText}>Send</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={ss.endCallBtn} onPress={stopCallMode}>
              <Ionicons name="close" size={18} color={C.white} />
              <Text style={ss.endCallText}>End</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={ss.inputBar}>
          <TouchableOpacity style={ss.micBtn} onPress={startCallMode} disabled={loading || transcribing}>
            <Ionicons name="mic" size={18} color={C.text3} />
          </TouchableOpacity>

          <TextInput
            style={ss.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type or tap 🎙️ for voice call..."
            placeholderTextColor={C.text4}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => send()}
          />

          <TouchableOpacity
            style={[ss.sendBtn, { opacity: (!input.trim() || loading) ? 0.4 : 1 }]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={16} color={C.white} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },

  dragHandleRow: { backgroundColor: C.surface, alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border2 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.base, paddingVertical: S.md,
    backgroundColor: C.surface2, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  topBarRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 32, height: 32, borderRadius: R.full,
    backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  avatarRing: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: R.full, borderWidth: 2, borderColor: C.primary, opacity: 0.4,
    zIndex: 1,
  },
  topBarTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  topBarSub:   { fontSize: 10, fontWeight: '600', marginTop: 1 },
  ttsToggle: {
    width: 30, height: 30, borderRadius: R.md, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: { padding: 5, borderRadius: R.md, backgroundColor: 'transparent' },

  chipScroll: { flexGrow: 0, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  chipWrap:   { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.base, paddingVertical: 8 },
  chip:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.full, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  chipText:   { fontSize: 12, color: C.text3, fontWeight: '600' },

  messages:        { flex: 1 },
  messagesContent: { padding: S.base, gap: 14, paddingBottom: S.lg },

  msgRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  msgRowAi: { flexDirection: 'row' },
  msgRowUser: { flexDirection: 'row-reverse' },
  
  msgAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  msgAvatarAi: { backgroundColor: C.primaryBg },
  msgAvatarUser: { backgroundColor: C.blueBg || 'rgba(50,83,220,0.1)' },

  bubble: { padding: 10, paddingHorizontal: 14, borderRadius: 12, maxWidth: '80%' },
  aiBubble: { backgroundColor: C.surface3, borderTopLeftRadius: 0 },
  userBubble: { backgroundColor: C.primary, borderTopRightRadius: 0 },
  bubbleText: { fontSize: 13, color: C.text, lineHeight: 20 },
  
  readAloudBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, paddingVertical: 2,
  },
  readAloudText: { fontSize: 11, color: C.text4 },

  thinkingBubble: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  thinkingText: { fontSize: 12, color: C.text3 },

  waveRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 36, marginBottom: 4 },
  waveBar: { width: 5, borderRadius: 99, minHeight: 6 },

  callOverlay: {
    paddingHorizontal: S.base, paddingVertical: S.lg,
    paddingBottom: Platform.OS === 'ios' ? S.xl + S.md : S.lg,
    backgroundColor: C.primaryBg, borderTopWidth: 1, borderTopColor: 'rgba(50,83,220,0.15)',
    alignItems: 'center', gap: 10,
  },
  callStatusRow: { alignItems: 'center', justifyContent: 'flex-end', height: 40 },
  callStatusText: { fontSize: 13, color: C.text3, fontWeight: '500' },
  
  sendVoiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: R.full,
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 4,
  },
  sendVoiceText: { color: C.white, fontWeight: '700', fontSize: 14 },

  endCallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: R.full,
    backgroundColor: C.red,
    shadowColor: C.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
    elevation: 2,
  },
  endCallText: { color: C.white, fontWeight: '700', fontSize: 13 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? S.xl : 12,
    backgroundColor: C.surface2, borderTopWidth: 1, borderTopColor: C.border,
  },
  micBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.border,
  },
  input: {
    flex: 1, backgroundColor: C.surface, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9,
    fontSize: 13, color: C.text,
    borderWidth: 1, borderColor: C.border2,
    maxHeight: 90, minHeight: 38,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
});
