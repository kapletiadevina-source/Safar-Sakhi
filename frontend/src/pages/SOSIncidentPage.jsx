import React, { useState, useEffect } from 'react';
import { useJourney } from '../context/JourneyContext';
import { useAuth } from '../context/AuthContext';
import LeafletMap from '../components/LeafletMap';
import api from '../services/api';
import {
  ShieldAlert,
  AlertOctagon,
  PhoneCall,
  CheckCircle,
  MapPin,
  Clock,
  Radio,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function SOSIncidentPage() {
  const { user } = useAuth();
  const { activeSosIncident, currentLocation, cancelSOS, triggerSOS } = useJourney();

  const [sosHistory, setSosHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelNotes, setCancelNotes] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadSOSData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sos');
      if (res.data.success) {
        setSosHistory(res.data.incidents || []);
      }
    } catch (err) {
      console.error('Error fetching SOS history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSOSData();
  }, [activeSosIncident]);

  const handleConfirmCancel = async () => {
    if (!activeSosIncident?.id) return;
    setCancelling(true);
    try {
      await cancelSOS(activeSosIncident.id, cancelNotes || 'Cancelled by user / false alarm resolved');
      setShowCancelModal(false);
      setCancelNotes('');
      await loadSOSData();
    } catch (err) {
      alert('Error cancelling SOS incident.');
    } finally {
      setCancelling(false);
    }
  };

  const currentIncident = activeSosIncident || (sosHistory.length > 0 ? sosHistory[0] : null);
  const isActive = currentIncident && currentIncident.status === 'ACTIVE';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header Hero - Red if Active SOS, Baby Pink if Normal/Resolved */}
      <div
        className={`rounded-3xl p-6 sm:p-8 shadow-soft transition-colors border ${
          isActive
            ? 'bg-[#DC2626] text-white border-red-700 shadow-emergency animate-pulse-border'
            : 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold border ${
              isActive ? 'bg-white/20 text-white border-white/30' : 'bg-white text-[#494354] border-[#EEC5D1] shadow-soft'
            }`}>
              <ShieldAlert className={`w-8 h-8 ${isActive ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-[#494354] border border-[#EEC5D1]'
                }`}>
                  Emergency Response Portal
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white text-[#DC2626]' : 'bg-[#FFF0BD] text-[#494354] border border-[#F5DC96]'
                }`}>
                  {isActive ? 'STATUS: ACTIVE SOS' : 'STATUS: NORMAL / RESOLVED'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                {isActive ? 'Emergency SOS is Active' : 'Emergency SOS Control'}
              </h1>
              <p className={`text-xs mt-0.5 font-medium ${isActive ? 'text-red-100' : 'text-[#6B6477]'}`}>
                Immediate incident logs, trusted contact alert statuses, and live location beacons.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isActive ? (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-5 py-3 bg-white hover:bg-slate-100 text-[#DC2626] rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition"
              >
                Cancel / Resolve SOS
              </button>
            ) : (
              <button
                onClick={() => triggerSOS({ triggerType: 'MANUAL' })}
                className="px-5 py-3 bg-[#DC2626] hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition flex items-center space-x-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Trigger Emergency SOS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Direct Emergency Call Dialers in Pastel Harmony with Red for 112 */}
      <div className="bg-[#FFFCF8] rounded-3xl p-6 border border-[#EEC5D1] shadow-soft">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#494354] mb-4 flex items-center space-x-2">
          <PhoneCall className="w-4 h-4 text-[#DC2626]" />
          <span>Immediate Hotline Direct Dials</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a
            href="tel:112"
            className="p-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 transition text-center group shadow-xs"
          >
            <span className="text-2xl font-black block group-hover:scale-105 transition-transform text-[#DC2626]">112</span>
            <span className="text-xs font-bold text-red-700 block mt-0.5">National Emergency</span>
            <span className="text-[10px] text-red-600 font-semibold">Police / Medical</span>
          </a>

          <a
            href="tel:1091"
            className="p-4 rounded-2xl bg-[#F8DDE5] hover:bg-[#F2C4CE] border border-[#EEC5D1] text-[#494354] transition text-center group shadow-xs"
          >
            <span className="text-2xl font-black block group-hover:scale-105 transition-transform text-[#494354]">1091</span>
            <span className="text-xs font-bold text-[#494354] block mt-0.5">Women Helpline</span>
            <span className="text-[10px] text-[#6B6477]">24/7 Distress line</span>
          </a>

          <a
            href="tel:181"
            className="p-4 rounded-2xl bg-[#E8E0F7] hover:bg-[#D8CCEF] border border-[#D2C4EC] text-[#494354] transition text-center group shadow-xs"
          >
            <span className="text-2xl font-black block group-hover:scale-105 transition-transform text-[#494354]">181</span>
            <span className="text-xs font-bold text-[#494354] block mt-0.5">Women Support</span>
            <span className="text-[10px] text-[#6B6477]">Counseling & Aid</span>
          </a>

          <a
            href="tel:102"
            className="p-4 rounded-2xl bg-[#FFF0BD] hover:bg-[#F5DC96] border border-[#F5DC96] text-[#494354] transition text-center group shadow-xs"
          >
            <span className="text-2xl font-black block group-hover:scale-105 transition-transform text-[#494354]">102</span>
            <span className="text-xs font-bold text-[#494354] block mt-0.5">Ambulance</span>
            <span className="text-[10px] text-[#6B6477]">Medical Services</span>
          </a>
        </div>
      </div>

      {/* 3. Active Incident Telemetry & Delivery Checklist */}
      {currentIncident && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map of Incident Location */}
          <div className="lg:col-span-7 bg-[#FFFCF8] rounded-3xl p-5 border border-[#EEC5D1] shadow-soft space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-[#494354]">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#DC2626]" />
                <span>Captured Incident GPS Coordinates</span>
              </div>
              <span className="text-[11px] text-[#6B6477] font-semibold">
                {currentIncident.createdAt ? new Date(currentIncident.createdAt).toLocaleString() : 'Just now'}
              </span>
            </div>

            <LeafletMap
              currentLocation={{
                latitude: currentIncident.latitude || 28.5355,
                longitude: currentIncident.longitude || 77.3910,
                accuracy: currentIncident.accuracy || 15,
                timestamp: currentIncident.createdAt
              }}
              height="340px"
            />

            <div className="p-3.5 bg-[#FFF0BD]/60 rounded-2xl border border-[#F5DC96] text-[11px] text-[#494354] leading-relaxed">
              ℹ️ <b>Transparency Notice:</b> Safar Sakhi broadcasts instant high-priority alerts to your configured trusted circle and active web sessions. Police or local emergency dispatch requires direct dialing via the 112 button above.
            </div>
          </div>

          {/* Delivery Status Checklist */}
          <div className="lg:col-span-5 bg-[#FFFCF8] rounded-3xl p-6 border border-[#EEC5D1] shadow-soft space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#494354]">
              Alert Delivery Audit
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#DCEFFA] border border-[#B3DCF2] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#494354] block">Socket.IO Real-time Stream</span>
                    <span className="text-[10px] text-[#6B6477]">Delivered to active family viewers</span>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-white text-[#494354] border border-[#B3DCF2] px-2 py-0.5 rounded-md">LIVE</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#DCEFFA] border border-[#B3DCF2] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#494354] block">In-App Notification Center</span>
                    <span className="text-[10px] text-[#6B6477]">Broadcasted with coordinates</span>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-white text-[#494354] border border-[#B3DCF2] px-2 py-0.5 rounded-md">SENT</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8DDE5] border border-[#EEC5D1] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#494354] flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#494354] block">SMS Gateway Relay</span>
                    <span className="text-[10px] text-[#6B6477]">Payload ready for Twilio/Fast2SMS</span>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-white text-[#494354] border border-[#EEC5D1] px-2 py-0.5 rounded-md">SIMULATED</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#EEC5D1] space-y-1 text-xs text-[#494354]">
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#6B6477] font-bold uppercase">Trigger Type:</span>
                  <span className="font-bold text-[#494354]">{currentIncident.triggerType}</span>
                </div>
                {currentIncident.emergencyPhrase && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#6B6477] font-bold uppercase">Voice Phrase:</span>
                    <span className="font-bold text-[#494354]">"{currentIncident.emergencyPhrase}"</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#6B6477] font-bold uppercase">Status:</span>
                  <span className="font-bold text-[#494354]">{currentIncident.status}</span>
                </div>
              </div>
            </div>

            {/* Immediate Action Steps Guide */}
            <div className="pt-2 border-t border-[#EEC5D1]/60">
              <h4 className="text-xs font-black text-[#494354] mb-2">Immediate Safety Guidance:</h4>
              <ul className="text-[11px] text-[#6B6477] space-y-1.5 list-disc pl-4 font-medium">
                <li>Move quickly into a shop, bank ATM, petrol pump, or populated area.</li>
                <li>Keep your phone in your hand with the emergency call ready.</li>
                <li>Make loud noise or attract public attention if someone is following you.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cancel SOS Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FFFCF8] rounded-3xl p-6 border border-[#EEC5D1] shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-[#494354]">Resolve / Cancel Emergency SOS</h3>
            </div>

            <p className="text-xs text-[#6B6477] leading-relaxed">
              Confirm that you are completely safe and out of harm's way before cancelling this incident.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">
                Resolution Note (Optional)
              </label>
              <input
                type="text"
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                placeholder="e.g. Accidental press, or reached safe location"
                className="w-full px-3.5 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5]"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-[#EEC5D1] text-[#494354] rounded-xl text-xs font-bold transition"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-[#DC2626] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-soft transition"
              >
                {cancelling ? 'Cancelling...' : 'Confirm I Am Safe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
