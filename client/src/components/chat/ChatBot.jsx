import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatBot({ data }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am theEdge Sense. How can I assist you with battery analytics today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          contextData: data // sending current battery state
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setMessages(prev => [...prev, resData.data]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, an error occurred: ${resData.error || 'Unknown error'}. Did you restart the backend server after the API key was added?` }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failed. Ensure the server is running.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        className="btn btn-primary"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          padding: 0
        }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare size={24} color="#000" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              bottom: '90px',
              right: '24px',
              width: '380px',
              height: '600px',
              maxHeight: '80vh',
              background: 'var(--surface)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--surface-2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bot size={20} color="var(--yellow)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Edge Sense</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '12px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: msg.role === 'user' ? 'var(--blue-bg)' : 'var(--yellow-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {msg.role === 'user' ? <User size={16} color="var(--blue)" /> : <Bot size={16} color="var(--yellow)" />}
                  </div>
                  <div style={{
                    background: msg.role === 'user' ? 'var(--blue)' : 'var(--surface-3)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    borderTopLeftRadius: msg.role === 'assistant' ? 0 : '12px',
                    borderTopRightRadius: msg.role === 'user' ? 0 : '12px',
                    fontSize: '13px',
                    maxWidth: '80%',
                    boxShadow: 'var(--shadow-xs)'
                  }}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="prose prose-sm prose-invert" style={{ margin: 0 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--yellow-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Bot size={16} color="var(--yellow)" />
                  </div>
                  <div style={{
                    background: 'var(--surface-3)',
                    padding: '10px 14px',
                    borderRadius: '12px', borderTopLeftRadius: 0,
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <Loader2 size={16} className="animate-spin" color="var(--text-3)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{
              padding: '16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '10px',
              background: 'var(--surface-2)'
            }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your battery..."
                className="input"
                style={{ flex: 1, borderRadius: '20px', padding: '10px 16px' }}
                disabled={isTyping}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, flexShrink: 0 }}
                disabled={isTyping || !input.trim()}
              >
                <Send size={18} color="#000" style={{ transform: 'translateX(1px)' }} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
