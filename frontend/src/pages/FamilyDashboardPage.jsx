import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LeafletMap from '../components/LeafletMap';
import api from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Clock,
  MapPin,
  Navigation,
  PhoneCall,
  Radio,
  CheckCircle,
  AlertTriangle,
  Heart,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  X
} from 'lucide-react';

export default function FamilyDashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [connections, setConnections] = useState([]);
  const [sharedJourneys, setSharedJourneys] = useState([]);
  const [activeSharedJourney, setActiveSharedJourney] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [locationTrail, setLocationTrail] = useState([]);
  const [loading, setLoading] = useState(true);

  // Connect / Invite modal state
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [travelerEmail, setTravelerEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState(null);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      const [connRes, journeysRes] = await Promise.allSettled([
        api.get('/family/connections'),
        api.get('/family/journeys')
      ]);

      if (connRes.status === 'fulfilled' && connRes.value.data.success) {
        setConnections(connRes.value.data.connections || []);
      }

      if (journeysRes.status === 'fulfilled' && journeysRes.value.data.success) {
        const list = journeysRes.value.data.journeys || [];
        setSharedJourneys(list);

        // Find active/delayed/emergency journey
        const active = list.find(j => ['ACTIVE', 'DELAYED', 'EMERGENCY', 'PAUSED'].includes(j.status));
        if (active) {
          setActiveSharedJourney(active);
          if (active.locations && active.locations.length > 0) {
            setLocationTrail(active.locations);
            const latest = active.locations[0]; // sorted desc
            setCurrentCoords({
              latitude: latest.latitude,
              longitude: latest.longitude,
              accuracy: latest.accuracy || 10,
              timestamp: latest.timestamp
            });
          } else if (active.startLatitude && active.startLongitude) {
            setCurrentCoords({
              latitude: active.startLatitude,
              longitude: active.startLongitude,
              accuracy: 15,
              timestamp: active.startTime
            });
          }
        } else {
          setActiveSharedJourney(null);
        }
      }
    } catch (err) {
      console.error('Error fetching family dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyData();
  }, []);

  // Socket.IO real-time stream for active journey
  useEffect(() => {
    if (!socket || !activeSharedJourney) return;

    socket.emit('join_journey', {
      journeyId: activeSharedJourney.id,
      trackingToken: activeSharedJourney.trackingToken
    });

    const handleLocUpdate = (data) => {
      if (data.journeyId === activeSharedJourney.id) {
        const point = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp: data.timestamp
        };
        setCurrentCoords(point);
        setLocationTrail(prev => [...prev, point]);
      }
    };

    const handleJourneyDelayed = (data) => {
      if (data.journeyId === activeSharedJourney.id) {
        setActiveSharedJourney(prev => prev ? { ...prev, status: 'DELAYED' } : null);
      }
    };

    const handleEtaUpdated = (data) => {
      if (data.journeyId === activeSharedJourney.id) {
        setActiveSharedJourney(prev => prev ? { ...prev, expectedArrivalTime: data.newEta, status: 'ACTIVE' } : null);
      }
    };

    const handleSosActivated = (data) => {
      if (data.journeyId === activeSharedJourney.id) {
        setActiveSharedJourney(prev => prev ? { ...prev, status: 'EMERGENCY' } : null);
      }
    };

    const handleSosCancelled = () => {
      setActiveSharedJourney(prev => prev ? { ...prev, status: 'ACTIVE' } : null);
    };

    const handleCompleted = (data) => {
      if (data.journeyId === activeSharedJourney.id) {
        setActiveSharedJourney(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
        loadFamilyData();
      }
    };

    socket.on('location_updated', handleLocUpdate);
    socket.on('journey_delayed', handleJourneyDelayed);
    socket.on('eta_updated', handleEtaUpdated);
    socket.on('sos_activated', handleSosActivated);
    socket.on('sos_cancelled', handleSosCancelled);
    socket.on('journey_completed', handleCompleted);

    return () => {
      socket.off('location_updated', handleLocUpdate);
      socket.off('journey_delayed', handleJourneyDelayed);
      socket.off('eta_updated', handleEtaUpdated);
      socket.off('sos_activated', handleSosActivated);
      socket.off('sos_cancelled', handleSosCancelled);
      socket.off('journey_completed', handleCompleted);
    };
  }, [socket, activeSharedJourney?.id]);

  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    setConnecting(true);
    setConnectMsg(null);

    try {
      const res = await api.post('/family/connect', {
        travelerEmail: travelerEmail ? travelerEmail.trim() : undefined,
        invitationCode: invitationCode ? invitationCode.trim() : undefined
      });
      if (res.data.success) {
        setConnectMsg({ type: 'success', text: res.data.message });
        setTravelerEmail('');
        setInvitationCode('');
        await loadFamilyData();
        setTimeout(() => setConnectModalOpen(false), 2000);
      }
    } catch (err) {
      setConnectMsg({ type: 'error', text: err.response?.data?.message || 'Connection failed.' });
    } finally {
      setConnecting(false);
    }
  };

  const isEmergency = activeSharedJourney?.status === 'EMERGENCY';
  const isDelayed = activeSharedJourney?.status === 'DELAYED';
  const travelerUser = activeSharedJourney?.user || {};

  return (
    <div className="space-y-6">
      {/* 1. Emergency Banner (If Traveler has active SOS) */}
      {isEmergency && (
        <div className="p-6 rounded-3xl bg-red-600 text-white shadow-emergency flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-3.5">
            <ShieldAlert className="w-10 h-10 flex-shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20">
                  Critical Emergency Alert
                </span>
                <span className="text-xs font-bold">{new Date().toLocaleTimeString()}</span>
              </div>
              <h2 className="text-xl font-black mt-1">
                {travelerUser.fullName || 'Your Traveler'} Activated Emergency SOS!
              </h2>
              <p className="text-xs text-red-100">
                Live location beacon is active. Check their position on the map below or contact emergency dispatch immediately.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            {travelerUser.phoneNumber && (
              <a
                href={`tel:${travelerUser.phoneNumber}`}
                className="flex-1 md:flex-none px-4 py-2.5 bg-white text-red-700 font-extrabold text-xs rounded-xl shadow-sm hover:bg-red-50 transition text-center"
              >
                Call {travelerUser.fullName?.split(' ')[0]}
              </a>
            )}
            <a
              href="tel:112"
              className="flex-1 md:flex-none px-4 py-2.5 bg-red-950 text-white font-extrabold text-xs rounded-xl shadow-sm hover:bg-black transition text-center"
            >
              Call Police: 112
            </a>
          </div>
        </div>
      )}

      {/* 2. Top Header Guardian Banner: Baby Pink (#F8DDE5) */}
      <div className="bg-[#F8DDE5] border border-[#EEC5D1] rounded-3xl p-6 sm:p-8 text-[#494354] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 text-xs font-bold mb-3 border border-[#EEC5D1] shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#494354]" />
            <span className="text-[#494354]">Family Guardian Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#494354]">
            Welcome, {user?.fullName?.split(' ')[0] || 'Guardian'}!
          </h1>
          <p className="text-[#6B6477] text-xs sm:text-sm mt-1.5 max-w-xl font-medium leading-relaxed">
            You are in <b>Family Guardian Mode</b>. Monitor journeys shared with you, receive real-time ETA alerts, and stay alert during late-night commutes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setConnectModalOpen(true)}
            className="px-5 py-3 bg-white hover:bg-[#FFF0BD] text-[#494354] border border-[#EEC5D1] hover:border-[#F5DC96] rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xs hover:scale-102 active:scale-98 transition flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4 text-[#494354]" />
            <span>Connect with Traveler</span>
          </button>

          <button
            onClick={loadFamilyData}
            className="px-4 py-3 bg-white/80 hover:bg-white text-[#494354] border border-[#EEC5D1] rounded-2xl font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-xs"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 3. ACTIVE SHARED JOURNEY RADAR: Sky Blue (#DCEFFA) */}
      {activeSharedJourney ? (
        <div className="bg-[#DCEFFA] rounded-3xl p-6 border border-[#C1E3F5] shadow-soft space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#C1E3F5]">
            <div className="flex items-center space-x-4">
              <img
                src={travelerUser.profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={travelerUser.fullName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#C1E3F5] shadow-xs"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#494354]">
                    Live Shared Journey in Progress
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isEmergency
                        ? 'bg-[#DC2626] text-white animate-pulse'
                        : isDelayed
                        ? 'bg-[#FFF0BD] text-[#494354] border border-[#F5DC96]'
                        : 'bg-white text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {activeSharedJourney.status}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#494354] mt-0.5">
                  {travelerUser.fullName || 'Traveler'} is traveling: {activeSharedJourney.startLocation} → <span className="underline decoration-2 decoration-[#494354]/40">{activeSharedJourney.destination}</span>
                </h2>
                <p className="text-xs text-[#6B6477]">
                  Transport: <b>{activeSharedJourney.journeyType}</b> • Mode: Live Socket Stream
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {travelerUser.phoneNumber && (
                <a
                  href={`tel:${travelerUser.phoneNumber}`}
                  className="px-4 py-2.5 bg-[#494354] hover:bg-[#383340] text-white font-bold text-xs rounded-2xl shadow-xs transition flex items-center space-x-1.5"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call {travelerUser.fullName?.split(' ')[0]}</span>
                </a>
              )}
            </div>
          </div>

          {/* Interactive Map & Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#494354]">
                <span className="flex items-center space-x-1.5">
                  <Navigation className="w-4 h-4 animate-spin-slow text-[#494354]" />
                  <span>Live Satellite Route Stream</span>
                </span>
                <span className="text-[11px] text-[#6B6477] font-normal">
                  Auto-updates without page refresh
                </span>
              </div>

              <LeafletMap
                currentLocation={currentCoords}
                startPoint={{
                  latitude: activeSharedJourney.startLatitude,
                  longitude: activeSharedJourney.startLongitude,
                  label: activeSharedJourney.startLocation
                }}
                destinationPoint={{
                  latitude: activeSharedJourney.destinationLatitude,
                  longitude: activeSharedJourney.destinationLongitude,
                  label: activeSharedJourney.destination
                }}
                path={locationTrail}
                height="420px"
              />
            </div>

            <div className="lg:col-span-4 space-y-3">
              <div className="p-4 rounded-2xl bg-white/85 border border-[#C1E3F5] shadow-xs">
                <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Expected Arrival Time (ETA)</span>
                <span className="text-lg font-black text-[#494354] flex items-center space-x-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-[#494354]" />
                  <span>{new Date(activeSharedJourney.expectedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <span className="text-[11px] text-[#6B6477] block mt-1">
                  Trip started at {new Date(activeSharedJourney.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/85 border border-[#C1E3F5] shadow-xs">
                <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Last Location Ping</span>
                <span className="text-xs font-bold text-[#494354] mt-0.5 block">
                  {currentCoords?.timestamp ? new Date(currentCoords.timestamp).toLocaleTimeString() : 'Just now'} (Accuracy: ±{Math.round(currentCoords?.accuracy || 10)}m)
                </span>
              </div>

              {/* Safety Confirmations: Butter Yellow Highlight (#FFF0BD) */}
              {activeSharedJourney.safetyConfirmations && activeSharedJourney.safetyConfirmations.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#FFF0BD] border border-[#F5DC96] shadow-xs">
                  <span className="text-[10px] text-[#494354] font-black uppercase block flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Traveler Safety Check-In</span>
                  </span>
                  <p className="text-xs font-bold text-[#494354] mt-1">
                    "{activeSharedJourney.safetyConfirmations[0].message || 'Traveler checked in as safe.'}"
                  </p>
                  <span className="text-[10px] text-[#6B6477] block mt-0.5">
                    Confirmed at {new Date(activeSharedJourney.safetyConfirmations[0].confirmedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {activeSharedJourney.notes && (
                <div className="p-3.5 rounded-2xl bg-white/80 border border-[#C1E3F5] text-xs text-[#494354]">
                  <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Vehicle Notes</span>
                  <span className="font-semibold">{activeSharedJourney.notes}</span>
                </div>
              )}

              {/* Quick Helplines */}
              <div className="pt-2 border-t border-[#C1E3F5] space-y-2">
                <a
                  href="tel:112"
                  className="w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Call Police: 112</span>
                </a>
                <a
                  href="tel:1091"
                  className="w-full py-2 bg-white hover:bg-[#F8DDE5] border border-[#EEC5D1] text-[#494354] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#494354]" />
                  <span>Women Helpline: 1091</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#DCEFFA]/50 rounded-3xl p-8 border border-[#C1E3F5] shadow-soft text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white text-[#494354] border border-[#C1E3F5] flex items-center justify-center mx-auto shadow-xs">
            <Navigation className="w-7 h-7 text-[#494354]" />
          </div>
          <h3 className="text-lg font-black text-[#494354]">No Active Journeys Right Now</h3>
          <p className="text-xs text-[#6B6477] max-w-md mx-auto leading-relaxed">
            Your connected travelers are currently not on an active journey. When they start a journey and share it with you, their live radar and ETA will appear here instantly!
          </p>
        </div>
      )}

      {/* 4. Bottom Grid: Connected Travelers in Lavender (#E8E0F7) & Past Journeys */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connected Travelers Circle */}
        <div className="lg:col-span-5 bg-[#E8E0F7]/40 rounded-3xl p-6 border border-[#D6C8EE] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#494354] flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#494354]" />
              <span>Connected Travelers ({connections.length})</span>
            </h3>
            <button
              onClick={() => setConnectModalOpen(true)}
              className="text-xs font-bold text-[#494354] hover:underline"
            >
              + Connect
            </button>
          </div>

          {connections.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#8E869B]">
              No travelers connected yet. Click "+ Connect" to link with a traveler using their email.
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((c) => {
                const traveler = c.traveler || {};
                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-[#D6C8EE] transition flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={traveler.profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={traveler.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-[#D6C8EE]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#494354]">{traveler.fullName || c.name}</h4>
                        <span className="text-[11px] text-[#6B6477] block">
                          Relationship: <b>{c.relationship}</b> • {traveler.phoneNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8E0F7] text-[#494354] border border-[#D6C8EE]">
                        Linked
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Shared Trips */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#F8DDE5] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#494354] flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#494354]" />
              <span>Past Journeys Shared with You ({sharedJourneys.length})</span>
            </h3>
          </div>

          {sharedJourneys.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#8E869B]">
              No past journeys have been shared with your guardian account.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {sharedJourneys.map((j) => (
                <div
                  key={j.id}
                  className="p-3.5 rounded-2xl bg-[#DCEFFA]/40 hover:bg-[#DCEFFA]/70 border border-[#C1E3F5] transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#494354] border border-[#C1E3F5] flex items-center justify-center font-bold text-xs shadow-xs">
                      {j.journeyType?.substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#494354]">
                        {j.startLocation} → {j.destination}
                      </h4>
                      <span className="text-[11px] text-[#6B6477]">
                        {new Date(j.createdAt).toLocaleDateString()} at {new Date(j.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      j.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : j.status === 'EMERGENCY'
                        ? 'bg-red-100 text-red-800 font-bold'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {j.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connect with Traveler Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FFFCF8] rounded-3xl p-6 sm:p-7 border border-[#F8DDE5] shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F8DDE5]">
              <h3 className="font-extrabold text-base text-[#494354]">Connect with Traveler</h3>
              <button
                onClick={() => setConnectModalOpen(false)}
                className="p-1.5 rounded-full text-[#8E869B] hover:text-[#494354] hover:bg-[#F8DDE5]/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {connectMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 ${
                  connectMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {connectMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                <span>{connectMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#494354] mb-1.5">
                  Traveler's Registered Email Address
                </label>
                <input
                  type="email"
                  value={travelerEmail}
                  onChange={(e) => setTravelerEmail(e.target.value)}
                  placeholder="e.g. priya@safarsakhi.com"
                  className="w-full px-4 py-2.5 bg-white border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#D98A9F] font-medium"
                />
              </div>

              <div className="text-center text-xs font-bold text-[#8E869B]">OR</div>

              <div>
                <label className="block text-xs font-bold text-[#494354] mb-1.5">
                  Invitation Code (if provided by traveler)
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="e.g. invite-priya-sunita"
                  className="w-full px-4 py-2.5 bg-white border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#D98A9F] font-medium font-mono"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className="flex-1 py-3 bg-[#FFFCF8] hover:bg-[#F8DDE5]/40 text-[#6B6477] rounded-2xl text-xs font-bold transition border border-[#EEC5D1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting || (!travelerEmail && !invitationCode)}
                  className="flex-1 py-3 bg-[#F8DDE5] hover:bg-[#F4CFDB] disabled:opacity-50 text-[#494354] border border-[#EEC5D1] rounded-2xl text-xs font-bold shadow-xs transition"
                >
                  {connecting ? 'Connecting...' : 'Connect Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

