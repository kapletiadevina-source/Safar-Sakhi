import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertOctagon, X, PhoneCall } from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

export default function SOSConfirmModal() {
  const { showSosModal, setShowSosModal, triggerSOS } = useJourney();
  const [countdown, setCountdown] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!showSosModal) {
      setCountdown(4);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSosModal]);

  const executeSOS = async () => {
    setIsSubmitting(true);
    try {
      await triggerSOS({ triggerType: 'MANUAL' });
    } finally {
      setIsSubmitting(false);
      setShowSosModal(false);
    }
  };

  const handleCancel = () => {
    setShowSosModal(false);
    setCountdown(4);
  };

  if (!showSosModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-[#FFFCF8] rounded-3xl shadow-2xl border-4 border-[#DC2626] animate-pulse-border">
        {/* Top Emergency Bar strictly in RED */}
        <div className="bg-[#DC2626] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-6 h-6 text-white animate-spin-slow" />
            <span className="font-extrabold tracking-wider uppercase text-sm">Emergency SOS Trigger</span>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-75"></div>
            <div className="relative w-20 h-20 rounded-full bg-[#DC2626] text-white flex flex-col items-center justify-center shadow-lg">
              <span className="text-3xl font-black">{countdown}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Sec</span>
            </div>
          </div>

          <h3 className="text-xl font-black text-[#494354] mb-2">
            Activating Emergency SOS
          </h3>
          <p className="text-xs text-[#6B6477] mb-6 leading-relaxed">
            Your live GPS coordinates, battery level, and emergency alert will be broadcasted immediately to your trusted family contacts.
          </p>

          <div className="space-y-3">
            {/* Critical Emergency SOS Button strictly RED */}
            <button
              onClick={executeSOS}
              disabled={isSubmitting}
              className="w-full py-4 bg-[#DC2626] hover:bg-red-700 text-white rounded-2xl font-black tracking-wider uppercase text-sm shadow-lg shadow-red-500/40 transition active:scale-95 flex items-center justify-center space-x-2"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Confirm & Alert Now</span>
            </button>

            <button
              onClick={handleCancel}
              className="w-full py-3.5 bg-white hover:bg-[#F8DDE5] border border-[#EEC5D1] text-[#494354] rounded-2xl font-bold text-xs transition shadow-xs"
            >
              Cancel (Accidental Press)
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EEC5D1]/60 text-left">
            <p className="text-[11px] text-[#6B6477] font-bold mb-2">Direct Emergency Hotlines:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="tel:112"
                className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] rounded-xl font-bold hover:bg-[#F2C4CE] transition shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Police: 112</span>
              </a>
              <a
                href="tel:1091"
                className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-[#FFF0BD] text-[#494354] border border-[#F5DC96] rounded-xl font-bold hover:bg-[#F5DC96] transition shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#494354]" />
                <span>Women: 1091</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
