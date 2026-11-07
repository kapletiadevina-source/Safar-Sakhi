import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../context/JourneyContext';
import { useVoice } from '../context/VoiceContext';
import {
  Shield,
  ShieldAlert,
  Navigation,
  MapPin,
  Clock,
  Users,
  Bot,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  Radio,
  Share2,
  Pause,
  Play,
  PhoneCall,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Compass
} from 'lucide-react';
import api from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    activeJourney,
    currentLocation,
    completeJourney,
    pauseJourney,
    resumeJourney,
    confirmSafe,
    setShowSosModal,
    setShowDelayModal,
    simulateStep
  } = useJourney();

  const { startListening, isListening } = useVoice();
  const [contacts, setContacts] = useState([]);
  const [recentJourneys, setRecentJourneys] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, safetyScore: 100 });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [contactsRes, journeysRes, notifsRes, statsRes] = await Promise.allSettled([
          api.get('/contacts'),
          api.get('/journeys?limit=3'),
          api.get('/notifications'),
          api.get('/journeys/analytics/summary')
        ]);

        if (contactsRes.status === 'fulfilled' && contactsRes.value.data.success) {
          setContacts(contactsRes.value.data.contacts || []);
        }
        if (journeysRes.status === 'fulfilled' && journeysRes.value.data.success) {
          setRecentJourneys(journeysRes.value.data.journeys || []);
        }
        if (notifsRes.status === 'fulfilled' && notifsRes.value.data.success) {
          setNotifications(notifsRes.value.data.notifications?.slice(0, 3) || []);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
          setStats(statsRes.value.data.stats || { total: 0, completed: 0, safetyScore: 100 });
        }
      } catch (err) {
        console.error('Error loading dashboard overview:', err);
      }
    };

    loadDashboardData();
  }, [activeJourney]);

  // Determine user status badge
  let statusBadge = {
    label: 'Safe & Monitored',
    color: 'bg-white/80 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500'
  };

  if (activeJourney?.status === 'EMERGENCY') {
    statusBadge = {
      label: 'EMERGENCY SOS ACTIVE',
      color: 'bg-red-50 text-red-700 border-red-300 animate-pulse',
      dot: 'bg-red-600 animate-ping'
    };
  } else if (activeJourney?.status === 'DELAYED') {
    statusBadge = {
      label: 'Journey Delayed (Check-In Needed)',
      color: 'bg-[#FFF0BD] text-[#494354] border-[#F5DC96]',
      dot: 'bg-amber-500'
    };
  } else if (activeJourney?.status === 'ACTIVE') {
    statusBadge = {
      label: 'On Active Journey',
      color: 'bg-[#DCEFFA] text-[#494354] border-[#C1E3F5]',
      dot: 'bg-blue-600 animate-pulse'
    };
  } else if (activeJourney?.status === 'PAUSED') {
    statusBadge = {
      label: 'Journey Paused',
      color: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-400'
    };
  }

  const copyTrackingLink = () => {
    if (!activeJourney) return;
    const url = `${window.location.origin}/track/${activeJourney.trackingToken}`;
    navigator.clipboard.writeText(url);
    alert('Family tracking link copied to clipboard!');
  };

  return (
    <div className="space-y-7">
      {/* 1. Hero Welcome & Status Header: Baby Pink (#F8DDE5) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#F8DDE5] border border-[#EEC5D1] text-[#494354] p-6 sm:p-8 shadow-soft">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 text-xs font-bold mb-3 border border-[#EEC5D1] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[#494354]">AI-Protected Women Safety Guardian</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#494354]">
              Hello, {user?.fullName?.split(' ')[0] || 'Sakhi'}! 🌸
            </h1>
            <p className="text-[#6B6477] text-xs sm:text-sm mt-1.5 max-w-xl font-medium leading-relaxed">
              "Your Safety, Our Responsibility." We're actively watching over your journey, your ETA, and your peace of mind.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!activeJourney ? (
              <Link
                to="/journey/start"
                className="px-6 py-3.5 bg-white hover:bg-[#FFF0BD] text-[#494354] border border-[#EEC5D1] hover:border-[#F5DC96] rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xs hover:scale-102 active:scale-98 transition flex items-center justify-center space-x-2"
              >
                <Compass className="w-4 h-4 text-[#494354]" />
                <span>Start New Journey</span>
              </Link>
            ) : (
              <Link
                to="/journey/active"
                className="px-6 py-3.5 bg-white hover:bg-[#DCEFFA] text-[#494354] border border-[#EEC5D1] hover:border-[#C1E3F5] rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xs hover:scale-102 active:scale-98 transition flex items-center justify-center space-x-2"
              >
                <Navigation className="w-4 h-4 text-[#494354] animate-spin-slow" />
                <span>View Live Journey Map</span>
              </Link>
            )}

            <button
              onClick={() => setShowSosModal(true)}
              className="px-6 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/25 hover:scale-102 active:scale-98 transition flex items-center justify-center space-x-2 border border-red-500"
            >
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>Emergency SOS</span>
            </button>
          </div>
        </div>

        {/* Current Safety Status Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-[#EEC5D1]/70 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <span className="text-[#6B6477]">Status:</span>
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border shadow-xs ${statusBadge.color}`}>
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`}></span>
              <span className="font-bold">{statusBadge.label}</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[#6B6477]">
            <span>🛡️ Trusted Circle: <b className="text-[#494354]">{contacts.length} Family Contacts</b></span>
            <span>✨ Safety Score: <b className="text-[#494354]">{stats.safetyScore}%</b></span>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE JOURNEY HIGHLIGHT CARD: Sky Blue (#DCEFFA) */}
      {activeJourney && (
        <div className="bg-[#DCEFFA] rounded-3xl p-6 border border-[#C1E3F5] shadow-soft relative overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#C1E3F5]">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#494354] border border-[#C1E3F5] flex items-center justify-center font-bold shadow-xs">
                <Navigation className="w-6 h-6 animate-pulse text-[#494354]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#494354]">
                    Active Live Journey
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#494354] border border-[#C1E3F5]">
                    {activeJourney.journeyType}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#494354] mt-0.5">
                  {activeJourney.startLocation} → <span className="underline decoration-2 decoration-[#494354]/40">{activeJourney.destination}</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyTrackingLink}
                className="px-3.5 py-2 bg-white hover:bg-white/80 text-[#494354] border border-[#C1E3F5] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
                title="Copy secure family tracking link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>

              <Link
                to="/journey/active"
                className="px-4 py-2 bg-[#494354] hover:bg-[#383340] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
              >
                <span>Full Map</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
            <div className="p-4 rounded-2xl bg-white/80 border border-[#C1E3F5] shadow-xs">
              <span className="text-[11px] text-[#6B6477] font-medium block">Expected Arrival Time (ETA)</span>
              <span className="text-lg font-black text-[#494354] flex items-center space-x-1 mt-0.5">
                <Clock className="w-4 h-4 text-[#494354] inline" />
                <span>{new Date(activeJourney.expectedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 border border-[#C1E3F5] shadow-xs">
              <span className="text-[11px] text-[#6B6477] font-medium block">Started At</span>
              <span className="text-lg font-black text-[#494354] mt-0.5 block">
                {new Date(activeJourney.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 border border-[#C1E3F5] shadow-xs">
              <span className="text-[11px] text-[#6B6477] font-medium block">Live GPS Telemetry</span>
              <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1 mt-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Broadcasting to {contacts.length} Family Contacts</span>
              </span>
            </div>
          </div>

          {/* Quick Actions for active trip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => confirmSafe('I am safe and on track.')}
                className="px-3.5 py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Check-in: "I Am Safe"</span>
              </button>

              <button
                onClick={() => setShowDelayModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-[#FFF0BD] border border-[#F5DC96] text-[#494354] text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              >
                <Clock className="w-4 h-4 text-[#494354]" />
                <span>Update ETA</span>
              </button>

              {activeJourney.status === 'PAUSED' ? (
                <button
                  onClick={resumeJourney}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-[#494354] border border-[#C1E3F5] text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs"
                >
                  <Play className="w-4 h-4 text-[#494354]" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseJourney}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-[#494354] border border-[#C1E3F5] text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs"
                >
                  <Pause className="w-4 h-4 text-[#494354]" />
                  <span>Pause</span>
                </button>
              )}

              {/* Simulation test button */}
              <button
                onClick={simulateStep}
                className="px-3 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl transition shadow-xs"
                title="Test simulated GPS advancement"
              >
                📍 Simulate GPS Step
              </button>
            </div>

            <button
              onClick={completeJourney}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Complete Journey Safely
            </button>
          </div>
        </div>
      )}

      {/* 3. Three Primary Interactive Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: AI Voice Companion Sakhi in Lavender (#E8E0F7) */}
        <div className="bg-[#E8E0F7] rounded-3xl p-6 border border-[#D6C8EE] shadow-soft flex flex-col justify-between hover:shadow-soft-md transition">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#494354] border border-[#D6C8EE] flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-6 h-6 text-[#494354]" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#494354] border border-[#D6C8EE]">
                Voice & Chat
              </span>
            </div>
            <h3 className="text-base font-extrabold text-[#494354]">AI Companion "Sakhi"</h3>
            <p className="text-xs text-[#6B6477] mt-1.5 leading-relaxed font-medium">
              Friendly travel companion who speaks with you, checks arrival comfort, and answers safety questions during late commutes.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#D6C8EE] flex items-center justify-between">
            <button
              onClick={startListening}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs ${
                isListening
                  ? 'bg-[#DC2626] text-white animate-pulse'
                  : 'bg-white text-[#494354] hover:bg-white/80 border border-[#D6C8EE]'
              }`}
            >
              <span>{isListening ? 'Listening...' : 'Tap & Speak'}</span>
            </button>

            <Link
              to="/companion"
              className="text-xs font-bold text-[#494354] hover:underline flex items-center space-x-1"
            >
              <span>Open Chat</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Pillar 2: Trusted Contacts Circle in Baby Pink (#F8DDE5) */}
        <div className="bg-[#F8DDE5] rounded-3xl p-6 border border-[#EEC5D1] shadow-soft flex flex-col justify-between hover:shadow-soft-md transition">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#494354] border border-[#EEC5D1] flex items-center justify-center font-bold shadow-xs">
                <Users className="w-6 h-6 text-[#494354]" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
                {contacts.length} Connected
              </span>
            </div>
            <h3 className="text-base font-extrabold text-[#494354]">Trusted Contacts Circle</h3>
            <p className="text-xs text-[#6B6477] mt-1.5 leading-relaxed font-medium">
              Family members and close friends who receive your live coordinates, ETA updates, and emergency SOS alerts.
            </p>

            {/* Contacts Avatars */}
            <div className="mt-3 flex items-center space-x-2">
              {contacts.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="px-2.5 py-1 rounded-xl bg-white text-[#494354] text-xs font-bold border border-[#EEC5D1] shadow-xs"
                >
                  {c.name.split(' ')[0]} ({c.relationship})
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EEC5D1] flex items-center justify-between">
            <span className="text-[11px] text-[#8E869B]">Authorized sharing only</span>
            <Link
              to="/contacts"
              className="text-xs font-bold text-[#494354] hover:underline flex items-center space-x-1"
            >
              <span>Manage Contacts</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Pillar 3: Emergency SOS Readiness in Warm White (#FFFCF8) with RED SOS button */}
        <div className="bg-[#FFFCF8] rounded-3xl p-6 border border-red-200 shadow-soft flex flex-col justify-between hover:shadow-soft-md transition">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#DC2626] border border-red-200 flex items-center justify-center font-bold shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800">
                24/7 Rapid SOS
              </span>
            </div>
            <h3 className="text-base font-extrabold text-[#494354]">Instant SOS System</h3>
            <p className="text-xs text-[#6B6477] mt-1.5 leading-relaxed font-medium">
              Triggers instant high-priority alerts with your real-time GPS coordinates. Also activates via voice phrase: <b className="text-[#494354]">"{user?.settings?.emergencyPhrase || 'Sakhi Help'}"</b>.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-red-100 flex items-center justify-between">
            <button
              onClick={() => setShowSosModal(true)}
              className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-black uppercase tracking-wide transition shadow-xs"
            >
              Test Emergency SOS
            </button>

            <Link
              to="/sos"
              className="text-xs font-bold text-[#DC2626] hover:underline flex items-center space-x-1"
            >
              <span>SOS Logs</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Recent Journeys & Butter Yellow Safety Highlight Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Journeys History Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#F8DDE5] shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#494354]" />
              <h3 className="text-base font-extrabold text-[#494354]">Recent Safe Journeys</h3>
            </div>
            <Link to="/history" className="text-xs font-bold text-[#494354] hover:underline">
              View All History
            </Link>
          </div>

          {recentJourneys.length === 0 ? (
            <div className="text-center py-8 text-[#8E869B] text-xs">
              No recent journeys recorded. Start a new journey to protect your travel!
            </div>
          ) : (
            <div className="space-y-3">
              {recentJourneys.map((j) => (
                <div
                  key={j.id}
                  className="p-4 rounded-2xl bg-[#DCEFFA]/40 hover:bg-[#DCEFFA]/70 border border-[#C1E3F5] transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#494354] border border-[#C1E3F5] flex items-center justify-center font-bold text-xs shadow-xs">
                      {j.journeyType?.substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#494354]">
                        {j.startLocation} → {j.destination}
                      </h4>
                      <p className="text-[11px] text-[#6B6477]">
                        {new Date(j.createdAt).toLocaleDateString()} at{' '}
                        {new Date(j.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        j.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : j.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-700'
                          : j.status === 'EMERGENCY'
                          ? 'bg-red-100 text-red-800 font-black'
                          : 'bg-[#F8DDE5] text-[#494354]'
                      }`}
                    >
                      {j.status}
                    </span>
                    <Link
                      to={`/history`}
                      className="p-1.5 rounded-lg text-[#8E869B] hover:text-[#494354] hover:bg-white transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Safety Tips Card: Butter Yellow (#FFF0BD) Highlight Card */}
        <div className="bg-[#FFF0BD] rounded-3xl p-6 border border-[#F5DC96] shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#494354] mb-3">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-wide">Commute Safety Pro-Tip</h3>
            </div>

            <div className="bg-white/85 rounded-2xl p-4 border border-[#F5DC96] shadow-xs mb-4">
              <h4 className="text-xs font-extrabold text-[#494354] mb-1">
                Cab Boarding Verification
              </h4>
              <p className="text-xs text-[#6B6477] leading-relaxed">
                Before getting into any taxi or auto, double-check that the vehicle number plate matches your app, and ask the driver to state your name instead of you asking theirs.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] text-[#6B6477] flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-[#494354] rounded-full"></span>
                <span>Keep phone battery above 30% when traveling after dusk.</span>
              </div>
              <div className="text-[11px] text-[#6B6477] flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-[#494354] rounded-full"></span>
                <span>Pre-share live tracking link with at least 2 family members.</span>
              </div>
            </div>
          </div>

          <Link
            to="/safety-tips"
            className="mt-6 w-full py-3 bg-white hover:bg-[#FFFCF8] border border-[#F5DC96] text-[#494354] text-center rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <span>Explore All 20+ Safety Guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

