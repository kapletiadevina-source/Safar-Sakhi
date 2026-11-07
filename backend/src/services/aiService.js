const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

const SYSTEM_INSTRUCTION = `
You are "Sakhi", a compassionate, watchful, and highly practical AI travel companion designed specifically for Safar Sakhi (a women's safety & smart journey platform).
Your motto is: "Your Safety, Our Responsibility."

Key Personality & Behavioral Guidelines:
1. Tone: Friendly, calm, reassuring, respectful, concise, and safety-focused.
2. Purpose: Check in on the user's travel comfort, provide practical solo/night commute safety tips, answer questions about journey features, and keep anxiety low.
3. CRITICAL SAFETY BOUNDARY: You are an AI companion, NOT a replacement for emergency police/medical dispatch. If the user indicates immediate danger, violence, being followed, or an emergency, immediately and calmly advise them to press the Emergency SOS button in Safar Sakhi, call 112 / 1091 (or local emergency line), move to a well-lit crowded place, or seek immediate help. NEVER delay or discourage SOS activation.
4. Keep replies relatively concise (2-4 sentences) so they can be easily spoken aloud via Text-to-Speech (TTS) while the user is commuting.
5. Provide practical travel guidance (e.g., checking cab child-lock, sharing live ride details, staying on well-lit main roads, noting vehicle registration number, pretending to talk on a call if feeling uneasy).
`;

const SUPPORTED_MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

/**
 * Intelligent rule-based fallback responses when Gemini API key is not configured or fails
 */
function getSmartFallbackResponse(userMessage, context = {}) {
  const msg = (userMessage || '').toLowerCase();
  const userName = context.userName || 'there';
  const journey = context.activeJourney;

  if (msg.includes('help') || msg.includes('danger') || msg.includes('emergency') || msg.includes('followed') || msg.includes('scared') || msg.includes('unsafe')) {
    return `Please stay calm, ${userName}. If you feel unsafe or in danger, tap the red SOS button right now! It immediately notifies your trusted contacts and shares your location. Try to stay in well-lit areas or near people. Emergency helpline: 112 / 1091.`;
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('namaste')) {
    if (journey && journey.status === 'ACTIVE') {
      return `Hi ${userName}! I'm Sakhi, your safety companion. Your journey to ${journey.destination || 'your destination'} is active. How is your commute going? Let me know if you need anything!`;
    }
    return `Hello ${userName}! I'm Sakhi, your personal safety companion. Wherever you travel today, I'm here to watch your back. Are you preparing for a journey?`;
  }

  if (msg.includes('eta') || msg.includes('arrival') || msg.includes('reach') || msg.includes('time')) {
    if (journey && journey.expectedArrivalTime) {
      const etaTime = new Date(journey.expectedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `Your current expected arrival time at ${journey.destination} is ${etaTime}. If you're running late or facing traffic, you can update your ETA anytime from the journey card.`;
    }
    return `You don't have an active journey with an ETA right now. Once you start a journey, I'll track your arrival time and remind you if there are delays.`;
  }

  if (msg.includes('delay') || msg.includes('late') || msg.includes('traffic')) {
    return `Traffic and route delays happen! You can tap "Update ETA" on your active journey screen to let your trusted contacts know you're safe and give them a refreshed arrival estimate.`;
  }

  if (msg.includes('tip') || msg.includes('advice') || msg.includes('safety') || msg.includes('night') || msg.includes('cab')) {
    const tips = [
      "When boarding a cab, always check that the child lock is deactivated and ensure the car registration matches your app booking.",
      "Stay in well-lit corridors and keep your phone charged. Keep your trusted contacts informed of any unscheduled route deviations.",
      "If you ever feel uneasy, you can activate voice check-in, call a friend, or press the SOS button to alert your inner circle instantly.",
      "Always keep your location sharing active during late night commutes so your family can monitor your route seamlessly."
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    return `Safety tip: ${randomTip}`;
  }

  if (msg.includes('contact') || msg.includes('family') || msg.includes('friend')) {
    return `Your trusted contacts receive automatic notifications when you start a journey, when your ETA changes, or if you activate Emergency SOS. You can manage them in the Trusted Contacts tab.`;
  }

  if (msg.includes('feature') || msg.includes('how to use') || msg.includes('what can you do')) {
    return `Safar Sakhi provides Live Journey Tracking, Delay Detection, Instant Emergency SOS, Real-time Family Sharing, Voice Companion support, and Travel Safety Tips. I'm here to accompany your trips!`;
  }

  // Default pleasant supportive reply
  if (journey && journey.status === 'ACTIVE') {
    return `I hear you, ${userName}. Your journey is active and being monitored. Remember to stay alert and let me know if your route changes or if you need assistance!`;
  }

  return `I'm here with you, ${userName}. You can talk to me about your trip, ask for safety tips, check your journey status, or use the SOS button whenever you need immediate help.`;
}

/**
 * Generate AI response via Gemini or intelligent fallback
 */
async function generateAIResponse(userMessage, context = {}) {
  // If Gemini API Key is configured, attempt real Gemini API call
  if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
    for (const modelName of SUPPORTED_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey.trim());
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION
        });

        const journeyContext = context.activeJourney 
          ? `Active Journey Info: Destination is "${context.activeJourney.destination}", Start is "${context.activeJourney.startLocation}", Status: ${context.activeJourney.status}, ETA: ${context.activeJourney.expectedArrivalTime}. User name: "${context.userName || 'User'}".`
          : `No active journey right now. User name: "${context.userName || 'User'}".`;

        const prompt = `[Context: ${journeyContext}]\nUser: ${userMessage}\nSakhi (Companion):`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (error) {
        console.warn(`[Gemini API Call with ${modelName} notice]:`, error.message);
      }
    }
  }

  // Return intelligent local fallback
  return getSmartFallbackResponse(userMessage, context);
}

/**
 * Generate customized, contextual safety tips using Gemini
 */
async function generateSafetyTips(query = 'solo women commute safety', context = {}) {
  if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
    for (const modelName of SUPPORTED_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey.trim());
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: `You are "Sakhi AI Safety Specialist", an expert advisor on women's personal safety, smart commuting, and emergency preparedness. Provide practical, highly actionable, bulleted safety protocols tailored to the user's travel situation. Keep it empowering, calm, concise, and realistic.`
        });

        const prompt = `Provide 3-4 specific, actionable travel safety tips for: "${query}".
Context: Commute type: ${context.commuteType || 'Any'}, Time: ${context.timeOfDay || 'Current time'}. User: ${context.userName || 'Traveler'}.
Format each tip clearly with a bold title and a concise 1-2 sentence practical explanation.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err) {
        console.warn(`[Gemini generateSafetyTips notice with ${modelName}]:`, err.message);
      }
    }
  }

  // Fallback tips
  return `1. **Verify Your Ride & Lock**: Check license plates and confirm rear door child-lock is disengaged before boarding.
2. **Share Live Telemetry**: Keep your Safar Sakhi live journey link shared with trusted family members.
3. **Stay in Lit Corridors**: Walk along primary avenues with open shops, and keep your phone above 30% battery.
4. **Emergency Shortcut Ready**: Remember your voice emergency trigger ("Sakhi Help") or press the SOS button if uneasy.`;
}

module.exports = {
  generateAIResponse,
  generateSafetyTips,
  getSmartFallbackResponse
};
