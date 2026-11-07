import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useJourney } from './JourneyContext';

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const { user } = useAuth();
  const { triggerSOS, activeJourney } = useJourney();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hi! I am Sakhi, your personal AI safety companion. How is your travel going?',
      timestamp: new Date()
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize Speech APIs
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          handleVoiceInput(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Text to Speech
  const speakText = (text) => {
    if (!synthRef.current || !voiceEnabled) return;
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Slightly warmer pitch for supportive tone
    utterance.lang = 'en-US';

    // Select preferred female/natural voice if available
    const voices = synthRef.current.getVoices();
    const friendlyVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Google')));
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Start / Stop Listening
  const startListening = () => {
    if (!recognitionRef.current) return;
    stopSpeaking();
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.warn('Recognition start exception:', e.message);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (e) {
      // Ignored
    }
  };

  // Process user speech / text message
  const handleVoiceInput = async (inputText) => {
    const text = inputText.trim();
    if (!text) return;

    // Check emergency trigger phrase
    const emergencyPhrase = (user?.settings?.emergencyPhrase || 'Sakhi Help').toLowerCase();
    const normalizedInput = text.toLowerCase();

    if (normalizedInput.includes(emergencyPhrase) || normalizedInput.includes('help me emergency') || normalizedInput.includes('sos sos')) {
      speakText('Emergency phrase detected! Activating SOS and notifying your contacts now.');
      await triggerSOS({
        triggerType: 'VOICE',
        emergencyPhrase: text
      });
      return;
    }

    // Normal conversational query
    await sendMessageToAI(text);
  };

  const sendMessageToAI = async (messageText) => {
    if (!messageText.trim()) return;

    // Append user message
    const userMsg = {
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: messageText,
        context: {
          activeJourneyId: activeJourney?.id || null
        }
      });

      const reply = res.data.reply || 'I am right here with you. Let me know if you need assistance.';
      const aiMsg = {
        sender: 'ai',
        text: reply,
        timestamp: new Date()
      };

      setChatMessages((prev) => [...prev, aiMsg]);
      speakText(reply);
    } catch (err) {
      const fallbackReply = 'I am here with you. Your active journey is secure and monitored. Let me know if you need any help!';
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: fallbackReply, timestamp: new Date() }
      ]);
      speakText(fallbackReply);
    } finally {
      setIsAiLoading(false);
      setTranscript('');
    }
  };

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isSpeaking,
        transcript,
        chatMessages,
        isAiLoading,
        speechSupported,
        voiceEnabled,
        setVoiceEnabled,
        startListening,
        stopListening,
        speakText,
        stopSpeaking,
        sendMessageToAI,
        handleVoiceInput
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used within a VoiceProvider');
  return context;
};

