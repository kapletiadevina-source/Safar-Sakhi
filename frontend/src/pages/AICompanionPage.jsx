import React, { useState, useRef, useEffect } from 'react';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../context/JourneyContext';
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
  Compass,
  AlertTriangle
} from 'lucide-react';

export default function AICompanionPage() {
  const { user } = useAuth();
  const { activeJourney, setShowSosModal } = useJourney();
  const {
    isListening,
    isSpeaking,
    chatMessages,
    isAiLoading,
    speechSupported,
    voiceEnabled,
    setVoiceEnabled,
    startListening,
    stopListening,
    stopSpeaking,
    sendMessageToAI
  } = useVoice();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isAiLoading]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAiLoading) return;
    sendMessageToAI(inputMessage);
    setInputMessage('');
  };

  const sampleChips = [
    'How is my ETA going?',
    'I feel a bit uneasy, talk to me.',
    'Night travel safety checklist',
    'What should I check before boarding a cab?',
    'What are the emergency helpline numbers?'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card: Lavender (#E8E0F7) */}
      <div className="bg-[#E8E0F7] border border-[#D6C8EE] rounded-3xl p-6 text-[#494354] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#D6C8EE] flex items-center justify-center text-[#494354] shadow-xs">
              <Bot className="w-8 h-8 text-[#494354]" />
            </div>
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#494354]">Sakhi AI Companion</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-[#494354] border border-[#D6C8EE]">
                Gemini Powered
              </span>
            </div>
            <p className="text-xs text-[#6B6477] mt-0.5 font-medium">
              Friendly travel guardian • Conversational voice & text support
            </p>
          </div>
        </div>

        {/* Audio Controls & SOS */}
        <div className="flex items-center space-x-2">
          {/* TTS Voice Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`p-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs border ${
              voiceEnabled
                ? 'bg-white text-[#494354] border-[#D6C8EE] hover:bg-[#FFFCF8]'
                : 'bg-[#D6C8EE]/60 text-[#6B6477] border-[#D6C8EE]'
            }`}
            title={voiceEnabled ? 'Voice Responses Enabled' : 'Voice Responses Muted'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-[#494354]" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline font-bold">{voiceEnabled ? 'Speech On' : 'Muted'}</span>
          </button>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-3 py-2 bg-white text-[#DC2626] border border-red-200 rounded-xl text-xs font-bold shadow-xs hover:bg-red-50 transition"
            >
              Stop Voice
            </button>
          )}

          {/* Emergency SOS Override (Strictly RED) */}
          <button
            onClick={() => setShowSosModal(true)}
            className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 border border-red-500"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* Safety Disclaimer Banner: Butter Yellow (#FFF0BD) */}
      <div className="p-4 bg-[#FFF0BD] border border-[#F5DC96] rounded-2xl text-[#494354] text-[11px] flex items-center space-x-2.5 shadow-xs">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
        <span className="leading-relaxed">
          <b>Safety Boundary:</b> Sakhi is an AI companion for emotional reassurance, ETA awareness, and travel tips. Sakhi cannot replace police/medical dispatch. In real danger, immediately tap Emergency SOS or dial <b>112</b>.
        </span>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-3xl border border-[#D6C8EE] shadow-soft overflow-hidden flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FFFCF8]">
          {chatMessages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={index}
                className={`flex items-end space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#E8E0F7] text-[#494354] border border-[#D6C8EE] flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
                    🌸
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#F8DDE5] border border-[#EEC5D1] text-[#494354] rounded-br-xs font-medium'
                      : 'bg-[#E8E0F7] border border-[#D6C8EE] text-[#494354] rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`text-[9px] block mt-1.5 ${
                      isUser ? 'text-[#8E869B] text-right font-medium' : 'text-[#8E869B]'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isUser && (
                  <img
                    src={user?.profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover border border-[#EEC5D1] flex-shrink-0"
                  />
                )}
              </div>
            );
          })}

          {isAiLoading && (
            <div className="flex items-center space-x-2 text-[#494354] text-xs font-semibold p-2">
              <div className="w-2 h-2 rounded-full bg-[#494354] animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-[#494354] animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-[#494354] animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-[#8E869B] ml-1">Sakhi is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Quick Chips */}
        <div className="px-4 py-2.5 bg-[#E8E0F7]/30 border-t border-[#D6C8EE] flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-[#8E869B] uppercase tracking-wider flex-shrink-0">
            Suggested:
          </span>
          {sampleChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessageToAI(chip)}
              className="text-[11px] whitespace-nowrap px-3.5 py-1 bg-white hover:bg-[#E8E0F7] text-[#494354] border border-[#D6C8EE] rounded-full font-medium transition shadow-xs flex-shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#D6C8EE] flex items-center space-x-2">
          {/* Voice Microphone Button */}
          {speechSupported ? (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-3 rounded-2xl font-bold transition flex-shrink-0 ${
                isListening
                  ? 'bg-[#DC2626] text-white animate-pulse shadow-md'
                  : 'bg-[#E8E0F7] hover:bg-[#DED3F2] text-[#494354] border border-[#D6C8EE]'
              }`}
              title={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? <Mic className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-[#494354]" />}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="p-3 rounded-2xl bg-slate-100 text-slate-400 cursor-not-allowed flex-shrink-0"
              title="Browser speech recognition not supported in this browser"
            >
              <MicOff className="w-5 h-5" />
            </button>
          )}

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isListening ? 'Listening to your voice...' : 'Talk with Sakhi or ask a question...'}
            disabled={isAiLoading}
            className="flex-1 px-4 py-3 bg-[#FFFCF8] border border-[#D6C8EE] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#9C85C7] font-medium"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isAiLoading}
            className="p-3 bg-[#494354] hover:bg-[#383340] disabled:opacity-50 text-white rounded-2xl shadow-xs transition flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

