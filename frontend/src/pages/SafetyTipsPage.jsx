import React, { useState } from 'react';
import api from '../services/api';
import {
  BookOpen,
  Moon,
  Bus,
  User,
  ShieldAlert,
  Smartphone,
  Share2,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Bot,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function SafetyTipsPage() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [checklist, setChecklist] = useState({
    battery: false,
    liveTrack: false,
    routeNoted: false,
    cabMatched: false,
    emergencySpeedDial: false,
  });

  // AI Safety Advisor State (Gemini Powered)
  const [aiQuery, setAiQuery] = useState('');
  const [aiTips, setAiTips] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const handleGenerateAiTips = async (queryToUse) => {
    const query = (queryToUse || aiQuery).trim();
    if (!query) return;

    if (queryToUse) setAiQuery(queryToUse);
    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await api.post('/ai/safety-tips', {
        query,
        timeOfDay: new Date().getHours() >= 19 || new Date().getHours() < 6 ? 'Night' : 'Day'
      });

      if (res.data.success && res.data.tips) {
        setAiTips(res.data.tips);
      } else {
        setAiTips('Stay alert, keep emergency contacts on speed dial, and share your live location via Safar Sakhi.');
      }
    } catch (err) {
      console.error('AI Safety Tips error:', err);
      setAiError(err.response?.data?.message || 'Failed to generate AI safety tips. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Guides', icon: BookOpen },
    { id: 'NIGHT', label: 'Night Travel', icon: Moon },
    { id: 'PUBLIC', label: 'Public Transport', icon: Bus },
    { id: 'SOLO', label: 'Solo Commutes', icon: User },
    { id: 'EMERGENCY', label: 'Emergency Readiness', icon: ShieldAlert },
    { id: 'DIGITAL', label: 'Digital Safety', icon: Smartphone },
    { id: 'LOCATION', label: 'Location Sharing', icon: Share2 }
  ];

  const tips = [
    {
      category: 'NIGHT',
      title: 'Cab Boarding & Child-Lock Check',
      summary: 'Before entering a taxi at night, verify license plate numbers and check the rear door child locks.',
      details: 'Check if the child-lock mechanism on the rear passenger door is engaged (which would prevent opening from inside). If suspicious, insist on opening the window or change vehicles immediately.',
      badge: 'Crucial',
      theme: 'pink'
    },
    {
      category: 'NIGHT',
      title: 'Active Voice Call Impression',
      summary: 'If feeling uneasy during an isolated ride, pretend to be on an active phone call with family.',
      details: 'Say loudly: "Yes dad, I just crossed the Flyover in a white Dzire cab, ETA is 15 minutes, sending live location now." Drivers who realize family is monitoring are significantly less likely to divert.',
      badge: 'Practical',
      theme: 'yellow'
    },
    {
      category: 'PUBLIC',
      title: 'Metro / Train Women-Only Coach',
      summary: 'Utilize designated women-only coaches especially during peak rush or late night hours.',
      details: 'Position yourself near the central safety intercom or close to the train operator cabin where CCTV visibility is highest.',
      badge: 'Commute',
      theme: 'blue'
    },
    {
      category: 'SOLO',
      title: 'Avoid Wearing Both Earphones',
      summary: 'Never wear noise-cancelling headphones over both ears when walking alone.',
      details: 'Keep one ear free at all times so you can detect footsteps, approaching vehicles, or environmental shifts immediately.',
      badge: 'Awareness',
      theme: 'lavender'
    },
    {
      category: 'EMERGENCY',
      title: 'Set Up Rapid Hardware SOS Shortcuts',
      summary: 'Configure your smartphone power button (press 5 times) to dial 112 instantly.',
      details: 'Both Android and iOS support hardware trigger shortcuts. In Safar Sakhi, you can also use your custom voice phrase: "Sakhi Help" to alert your family.',
      badge: 'Essential',
      theme: 'yellow'
    },
    {
      category: 'DIGITAL',
      title: 'Keep Power Bank & 30% Battery Threshold',
      summary: 'Do not embark on solo late commutes with under 25% battery.',
      details: 'Smartphones lose battery faster when tracking GPS and broadcasting cellular telemetry. Carry a mini 5000mAh battery pack in your bag.',
      badge: 'Hardware',
      theme: 'pink'
    },
    {
      category: 'LOCATION',
      title: 'Pre-Share Safar Sakhi Live Link',
      summary: 'Send your tracking link before getting into the vehicle rather than after.',
      details: 'Once the ride starts, your family already has the route and driver notes. If anything unexpected happens, they can monitor your route right away.',
      badge: 'Feature',
      theme: 'blue'
    },
    {
      category: 'EMERGENCY',
      title: 'The "Two-Minute Crowded Shop" Rule',
      summary: 'If you suspect someone is following you on foot, step into a shop immediately.',
      details: 'Enter an open pharmacy, bank ATM with a guard, restaurant, or petrol pump. Explain calmly to the store manager that you are being followed and request assistance.',
      badge: 'Tactic',
      theme: 'lavender'
    }
  ];

  const filteredTips = activeCategory === 'ALL'
    ? tips
    : tips.filter(t => t.category === activeCategory);

  const toggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getThemeCardStyles = (theme) => {
    switch (theme) {
      case 'yellow':
        return 'bg-[#FFF0BD]/60 border-[#F5DC96]';
      case 'blue':
        return 'bg-[#DCEFFA]/60 border-[#B3DCF2]';
      case 'lavender':
        return 'bg-[#E8E0F7]/60 border-[#D2C4EC]';
      case 'pink':
      default:
        return 'bg-[#F8DDE5]/60 border-[#EEC5D1]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] text-xs font-bold mb-2">
            <BookOpen className="w-4 h-4 text-[#494354]" />
            <span>Practical Safety Manual</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#494354]">
            Safety Tips & Travel Protocols
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6477] mt-1">
            Proven, field-tested guidance designed by women travelers and safety specialists.
          </p>
        </div>
      </div>

      {/* 2. Interactive AI Safety Advisor: Lavender (#E8E0F7) & Warm White */}
      <div className="bg-[#E8E0F7] border border-[#D6C8EE] rounded-3xl p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#D6C8EE] flex items-center justify-center text-[#494354] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#494354]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-[#494354]">Ask Sakhi AI for Custom Safety Advice</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white text-[#494354] border border-[#D6C8EE]">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-[#6B6477] font-medium">
                Get real-time tailored safety protocols for your specific commute, city, or time of day.
              </p>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateAiTips();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Describe your commute situation (e.g., 'Late night cab in Delhi', 'Walking to hostel at 10 PM')..."
            disabled={isAiLoading}
            className="flex-1 px-4 py-3 bg-[#FFFCF8] border border-[#D6C8EE] rounded-2xl text-xs sm:text-sm text-[#494354] placeholder-[#8E869B] focus:outline-none focus:ring-2 focus:ring-[#9C85C7] font-medium shadow-xs"
          />

          <button
            type="submit"
            disabled={!aiQuery.trim() || isAiLoading}
            className="px-5 py-3 bg-[#494354] hover:bg-[#383340] disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs flex-shrink-0"
          >
            {isAiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating Advice...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Get AI Safety Protocol</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[10px] font-bold text-[#8E869B] uppercase tracking-wider flex-shrink-0">
            Popular Scenarios:
          </span>
          {[
            'Late night cab boarding checklist',
            'Walking alone from metro to hostel',
            'Cab driver takes an unapproved detour',
            'Traveling alone on overnight bus or train'
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleGenerateAiTips(chip)}
              className="text-[11px] whitespace-nowrap px-3 py-1 bg-white hover:bg-[#FFFCF8] text-[#494354] border border-[#D6C8EE] rounded-full font-medium transition shadow-xs flex-shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* AI Generated Advice Display */}
        {aiTips && (
          <div className="mt-4 p-5 bg-[#FFFCF8] rounded-2xl border border-[#D6C8EE] shadow-soft space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#D6C8EE] pb-2.5">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-[#494354]" />
                <span className="text-xs font-black text-[#494354]">Sakhi AI Safety Guidance:</span>
              </div>
              <button
                type="button"
                onClick={() => setAiTips(null)}
                className="text-[11px] font-bold text-[#8E869B] hover:text-[#494354] transition"
              >
                Clear
              </button>
            </div>
            <div className="text-xs sm:text-sm text-[#494354] font-medium leading-relaxed whitespace-pre-line space-y-1">
              {aiTips}
            </div>
            <div className="pt-2 border-t border-[#D6C8EE]/60 flex items-center justify-between text-[10px] text-[#8E869B]">
              <span>Powered by Google Gemini • Real-time Safety Advisory</span>
              <span className="font-bold text-[#494354]">Safar Sakhi AI</span>
            </div>
          </div>
        )}

        {aiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{aiError}</span>
          </div>
        )}
      </div>

      {/* Interactive "Before You Step Out" Checklist in Butter Yellow */}
      <div className="bg-[#FFF0BD] rounded-3xl p-6 border-2 border-[#F5DC96] shadow-soft">
        <div className="flex items-center space-x-2.5 text-[#494354] mb-3">
          <Sparkles className="w-5 h-5 text-[#494354]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-[#494354]">
            Before You Step Out Checklist
          </h3>
        </div>
        <p className="text-xs text-[#6B6477] mb-4 font-medium">
          Take 20 seconds before starting your journey to check these critical preparedness steps:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'battery', text: 'Phone battery is above 30%' },
            { id: 'liveTrack', text: 'Live journey session started in Safar Sakhi' },
            { id: 'routeNoted', text: 'Family member informed of your destination' },
            { id: 'cabMatched', text: 'Vehicle number & driver name verified' },
            { id: 'emergencySpeedDial', text: 'Emergency 112 & family contact on speed dial' }
          ].map((item) => (
            <label
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center space-x-3 shadow-xs ${
                checklist[item.id]
                  ? 'bg-white border-[#494354] text-[#494354]'
                  : 'bg-white/80 hover:bg-white border-[#F5DC96] text-[#6B6477]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                  checklist[item.id]
                    ? 'bg-[#494354] border-[#494354] text-white'
                    : 'border-[#EEC5D1] bg-white'
                }`}
              >
                {checklist[item.id] && <CheckCircle className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold text-[#494354]">{item.text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 border ${
                isActive
                  ? 'bg-[#494354] text-white border-[#494354] shadow-soft'
                  : 'bg-white hover:bg-[#F8DDE5] border-[#EEC5D1] text-[#494354]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tips Cards Grid - Harmonized Pastel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTips.map((tip, idx) => (
          <div
            key={idx}
            className={`rounded-3xl p-6 border shadow-soft hover:shadow-soft-lg transition flex flex-col justify-between ${getThemeCardStyles(tip.theme)}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 text-[#494354] border border-[#EEC5D1] shadow-xs">
                  {tip.badge}
                </span>
                <span className="text-[11px] text-[#6B6477] font-bold uppercase">{tip.category}</span>
              </div>

              <h3 className="text-base font-black text-[#494354] mb-1.5">{tip.title}</h3>
              <p className="text-xs font-bold text-[#494354] mb-2">{tip.summary}</p>
              <p className="text-xs text-[#6B6477] leading-relaxed font-medium">{tip.details}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
              <span className="text-[#6B6477] text-[11px] font-medium">Safar Sakhi Protocol</span>
              <span className="font-bold text-[#494354] flex items-center space-x-1.5">
                <span>Verified Guide</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
