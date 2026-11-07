import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, X } from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

export default function DelayAlertModal() {
  const { showDelayModal, setShowDelayModal, activeJourney, confirmSafe, updateEta, triggerSOS } = useJourney();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newEtaTime, setNewEtaTime] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showDelayModal || !activeJourney) return null;

  const handleSafe = async () => {
    setLoading(true);
    try {
      await confirmSafe(customMessage || 'I am safe, just caught in regular commute traffic.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEta = async () => {
    if (!newEtaTime) return;
    setLoading(true);
    try {
      await updateEta(new Date(newEtaTime).toISOString());
      setShowTimePicker(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMinutes = async (minutes) => {
    setLoading(true);
    try {
      const now = new Date();
      const updated = new Date(now.getTime() + minutes * 60000);
      await updateEta(updated.toISOString());
      setShowTimePicker(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-[#FFFCF8] rounded-3xl shadow-2xl border-2 border-[#F5DC96]">
        {/* Header Ribbon in Butter Yellow */}
        <div className="bg-[#FFF0BD] border-b border-[#F5DC96] px-6 py-5 text-[#494354] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/80 rounded-xl border border-[#F5DC96]">
              <AlertTriangle className="w-6 h-6 text-[#494354] animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight text-[#494354]">Safety Check-In</h3>
              <p className="text-xs text-[#6B6477]">Intelligent Delay Monitor</p>
            </div>
          </div>
          <button
            onClick={() => setShowDelayModal(false)}
            className="p-1 rounded-full text-[#6B6477] hover:text-[#494354] hover:bg-white/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h4 className="text-xl font-black text-[#494354]">
              Your expected arrival time has passed.
            </h4>
            <p className="text-sm text-[#6B6477] mt-2">
              Destination: <span className="font-bold text-[#494354]">{activeJourney.destination}</span>
            </p>
            <p className="text-xs text-[#6B6477] mt-1">
              Are you comfortable and safe? Please confirm your status to keep your family informed.
            </p>
          </div>

          {!showTimePicker ? (
            <div className="space-y-3">
              {/* Option 1: I Am Safe */}
              <button
                onClick={handleSafe}
                disabled={loading}
                className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 rounded-2xl font-bold transition shadow-soft"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-950">1. I Am Safe</div>
                    <div className="text-xs text-emerald-700 font-normal">Notify trusted contacts that all is well</div>
                  </div>
                </div>
                <span className="text-xs bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-xl font-bold">Check-in</span>
              </button>

              {/* Option 2: Update ETA */}
              <button
                onClick={() => setShowTimePicker(true)}
                disabled={loading}
                className="w-full flex items-center justify-between p-4 bg-[#DCEFFA] hover:bg-[#C1E3F5] border border-[#B3DCF2] text-[#494354] rounded-2xl font-bold transition shadow-soft"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-[#494354] text-white flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#494354]">2. Update My ETA</div>
                    <div className="text-xs text-[#6B6477] font-normal">Traffic or route delay? Add 15-45 minutes</div>
                  </div>
                </div>
                <span className="text-xs bg-white text-[#494354] border border-[#B3DCF2] px-2.5 py-1 rounded-xl font-bold">Adjust</span>
              </button>

              {/* Option 3: Activate SOS - Keep clearly in RED */}
              <button
                onClick={() => triggerSOS({ triggerType: 'DELAY_TRIGGERED' })}
                disabled={loading}
                className="w-full flex items-center justify-between p-4 bg-[#DC2626] hover:bg-red-700 text-white rounded-2xl font-bold transition shadow-md"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-red-900 text-white flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold">3. Activate Emergency SOS</div>
                    <div className="text-xs text-red-100 font-normal">Immediate alert to contacts & emergency view</div>
                  </div>
                </div>
                <span className="text-xs bg-red-900 text-white px-2.5 py-1 rounded-xl font-bold">Emergency</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#FFF0BD]/40 p-5 rounded-2xl border border-[#F5DC96]">
              <h5 className="font-bold text-sm text-[#494354] mb-3">Quick ETA Extension:</h5>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleAddMinutes(15)}
                  className="py-2.5 px-3 bg-white hover:bg-[#F8DDE5] border border-[#EEC5D1] rounded-xl text-xs font-bold text-[#494354] transition shadow-xs"
                >
                  +15 Mins
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMinutes(30)}
                  className="py-2.5 px-3 bg-white hover:bg-[#F8DDE5] border border-[#EEC5D1] rounded-xl text-xs font-bold text-[#494354] transition shadow-xs"
                >
                  +30 Mins
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMinutes(45)}
                  className="py-2.5 px-3 bg-white hover:bg-[#F8DDE5] border border-[#EEC5D1] rounded-xl text-xs font-bold text-[#494354] transition shadow-xs"
                >
                  +45 Mins
                </button>
              </div>

              <label className="block text-xs font-bold text-[#494354] mb-1">
                Or choose exact arrival time:
              </label>
              <input
                type="datetime-local"
                value={newEtaTime}
                onChange={(e) => setNewEtaTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#EEC5D1] rounded-xl text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] mb-3"
              />

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleUpdateEta}
                  disabled={!newEtaTime || loading}
                  className="flex-1 py-2.5 bg-[#494354] hover:bg-[#383340] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-soft"
                >
                  Confirm New ETA
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimePicker(false)}
                  className="py-2.5 px-4 bg-white hover:bg-slate-100 border border-[#EEC5D1] text-[#494354] rounded-xl text-xs font-bold transition"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
