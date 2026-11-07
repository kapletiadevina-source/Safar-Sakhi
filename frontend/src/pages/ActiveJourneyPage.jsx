import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useJourney } from '../context/JourneyContext';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import LeafletMap from '../components/LeafletMap';
import {
  ShieldAlert,
  Navigation,
  Clock,
  MapPin,
  CheckCircle,
  Pause,
  Play,
  Share2,
  AlertTriangle,
  Bot,
  Compass,
  Radio,
  Wifi,
  WifiOff,
  Copy,
  Check
} from 'lucide-react';

export default function ActiveJourneyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    activeJourney,
    currentLocation,
    locationTrail,
    isTracking,
    trackingError,
    completeJourney,
    cancelJourney,
    pauseJourney,
    resumeJourney,
    confirmSafe,
    setShowSosModal,
    setShowDelayModal,
    simulateStep
  } = useJourney();

  const { startListening, isListening } = useVoice();
  const [copied, setCopied] = useState(false);
  const [safeCheckLoading, setSafeCheckLoading] = useState(false);

  // If no active journey, redirect to start
  useEffect(() => {
    if (!activeJourney) {
      navigate('/journey/start');
    }
  }, [activeJourney, navigate]);

  if (!activeJourney) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/track/${activeJourney.trackingToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmSafe = async () => {
    setSafeCheckLoading(true);
    try {
      await confirmSafe('I am safe and on track.');
    } finally {
      setSafeCheckLoading(false);
    }
  };

  const etaDate = new Date(activeJourney.expectedArrivalTime);
  const isOverdue = new Date() > etaDate && activeJourney.status !== 'COMPLETED';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Emergency Trigger: Sky Blue (#DCEFFA) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#DCEFFA] border border-[#C1E3F5] shadow-soft">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#494354] border border-[#C1E3F5] flex items-center justify-center font-bold shadow-xs">
            <Navigation className="w-6 h-6 animate-pulse text-[#494354]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black tracking-wider uppercase text-[#494354]">
                Live Journey Tracking Session
              </span>
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Broadcasting GPS</span>
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-[#494354] mt-0.5">
              {activeJourney.startLocation} → <span className="underline decoration-2 decoration-[#494354]/40">{activeJourney.destination}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Emergency SOS Button (Preserved strictly in RED) */}
          <button
            onClick={() => setShowSosModal(true)}
            className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/30 hover:scale-102 active:scale-98 transition flex items-center space-x-2 border border-red-500"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Emergency SOS</span>
          </button>

          {/* Share Family Link Button */}
          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 bg-white hover:bg-white/80 text-[#494354] rounded-2xl font-bold text-xs transition flex items-center space-x-1.5 border border-[#C1E3F5] shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Share Live Link'}</span>
          </button>
        </div>
      </div>

      {/* 2. Overdue Delay Alert (if ETA passed): Butter Yellow (#FFF0BD) */}
      {isOverdue && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FFF0BD] border border-[#F5DC96] text-[#494354] shadow-soft flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-700 animate-pulse" />
            <div>
              <h4 className="font-black text-sm text-[#494354]">Your Expected Arrival Time Has Passed</h4>
              <p className="text-xs text-[#6B6477]">Please confirm if you are safe or update your ETA to notify family members.</p>
            </div>
          </div>
          <button
            onClick={() => setShowDelayModal(true)}
            className="px-4 py-2 bg-white text-[#494354] border border-[#F5DC96] rounded-2xl font-bold text-xs shadow-xs hover:bg-[#FFFCF8] transition flex-shrink-0"
          >
            Check In Now
          </button>
        </div>
      )}

      {/* 3. Main Map & Live Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#C1E3F5] shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs font-black text-[#494354]">
                <Compass className="w-4 h-4 text-[#494354]" />
                <span>Live Route & GPS Radar</span>
              </div>

              {/* GPS Status Indicator */}
              <div className="flex items-center space-x-2">
                {isTracking ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700">
                    <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>GPS Active</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-800">
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>GPS Suspended</span>
                  </span>
                )}

                {/* Simulate Movement Button for Testing */}
                <button
                  type="button"
                  onClick={simulateStep}
                  className="px-3 py-1 bg-[#DCEFFA] hover:bg-[#CFE9F8] border border-[#C1E3F5] text-[#494354] rounded-xl text-[11px] font-bold transition shadow-xs"
                  title="Simulate 1 GPS movement checkpoint along route"
                >
                  📍 Advance GPS
                </button>
              </div>
            </div>

            {/* Interactive Leaflet Map */}
            <LeafletMap
              currentLocation={currentLocation}
              startPoint={{
                latitude: activeJourney.startLatitude,
                longitude: activeJourney.startLongitude,
                label: activeJourney.startLocation
              }}
              destinationPoint={{
                latitude: activeJourney.destinationLatitude,
                longitude: activeJourney.destinationLongitude,
                label: activeJourney.destination
              }}
              path={locationTrail}
              height="450px"
            />

            {trackingError && (
              <div className="mt-3 p-3 bg-[#FFF0BD] rounded-2xl border border-[#F5DC96] text-[#494354] text-xs font-medium">
                ⚠️ GPS Note: {trackingError}. (You can use the "Advance GPS" button above to test real-time movement!)
              </div>
            )}

            {/* Browser Limitation Notice */}
            <div className="mt-4 p-3.5 bg-[#FFFCF8] rounded-2xl border border-[#C1E3F5] text-[11px] text-[#6B6477] leading-relaxed">
              ℹ️ <b>Technical Note:</b> Browser Geolocation broadcasts live updates while this tab is active. If your device sleeps or the browser restricts background activity, updates resume immediately upon returning to the app.
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry & Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Trip Status & ETA Card */}
          <div className="bg-white rounded-3xl p-5 border border-[#C1E3F5] shadow-soft space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#494354]">
              Journey Metrics
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#DCEFFA]/40 border border-[#C1E3F5] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#6B6477] font-medium block">Current ETA</span>
                  <span className="text-lg font-black text-[#494354] flex items-center space-x-1">
                    <Clock className="w-4 h-4 inline" />
                    <span>{etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
                <button
                  onClick={() => setShowDelayModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-white/80 border border-[#C1E3F5] text-[#494354] text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Adjust ETA
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#DCEFFA]/40 border border-[#C1E3F5] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#6B6477] font-medium block">Started At</span>
                  <span className="text-sm font-bold text-[#494354]">
                    {new Date(activeJourney.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#494354] border border-[#C1E3F5]">
                  {activeJourney.journeyType}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#DCEFFA]/40 border border-[#C1E3F5]">
                <span className="text-[11px] text-[#6B6477] font-medium block">Last GPS Ping</span>
                <span className="text-xs font-bold text-[#494354] block mt-0.5">
                  {currentLocation?.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'Just now'} (±{Math.round(currentLocation?.accuracy || 10)}m)
                </span>
              </div>

              {activeJourney.notes && (
                <div className="p-3.5 rounded-2xl bg-[#FFFCF8] border border-[#C1E3F5] text-xs">
                  <span className="text-[10px] text-[#8E869B] font-bold uppercase block">Vehicle / Ride Notes</span>
                  <span className="text-[#494354] font-semibold">{activeJourney.notes}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-[#C1E3F5] space-y-2">
              <button
                onClick={handleConfirmSafe}
                disabled={safeCheckLoading}
                className="w-full py-3 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Quick Check-In: "I Am Safe"</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {activeJourney.status === 'PAUSED' ? (
                  <button
                    onClick={resumeJourney}
                    className="py-2.5 bg-white hover:bg-slate-100 text-[#494354] border border-[#C1E3F5] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseJourney}
                    className="py-2.5 bg-white hover:bg-slate-100 text-[#494354] border border-[#C1E3F5] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow-xs"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={cancelJourney}
                  className="py-2.5 bg-white hover:bg-slate-100 text-[#6B6477] border border-[#C1E3F5] rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Cancel Trip
                </button>
              </div>

              <button
                onClick={completeJourney}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition"
              >
                Complete Journey Safely
              </button>
            </div>
          </div>

          {/* AI Companion Floating Box: Lavender (#E8E0F7) */}
          <div className="bg-[#E8E0F7] border border-[#D6C8EE] rounded-3xl p-5 text-[#494354] shadow-soft flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#494354] border border-[#D6C8EE] flex items-center justify-center shadow-xs">
                <Bot className="w-6 h-6 text-[#494354]" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#494354]">AI Companion Sakhi</h4>
                <p className="text-[11px] text-[#6B6477]">Ready to chat or talk</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={startListening}
                className={`p-2.5 rounded-xl font-bold text-xs transition ${
                  isListening ? 'bg-[#DC2626] text-white animate-pulse' : 'bg-white text-[#494354] hover:bg-white/80 border border-[#D6C8EE] shadow-xs'
                }`}
                title="Speak to companion"
              >
                🎤
              </button>
              <Link
                to="/companion"
                className="px-3.5 py-2 bg-white hover:bg-white/80 border border-[#D6C8EE] text-[#494354] rounded-xl font-bold text-xs shadow-xs transition"
              >
                Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

