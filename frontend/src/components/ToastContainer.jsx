import React from 'react';
import { useSocket } from '../context/SocketContext';
import { ShieldAlert, Bell, CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useSocket();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bgStyle = 'bg-[#FFFCF8] border-[#EEC5D1] text-[#494354] shadow-soft-lg';
        let icon = <Bell className="w-5 h-5 text-[#494354]" />;

        if (toast.type === 'emergency' || toast.type === 'SOS_ACTIVATED') {
          bgStyle = 'bg-[#DC2626] border-red-700 text-white shadow-emergency';
          icon = <ShieldAlert className="w-5 h-5 text-white animate-pulse" />;
        } else if (toast.type === 'warning' || toast.type === 'JOURNEY_DELAYED') {
          bgStyle = 'bg-[#FFF0BD] border-[#F5DC96] text-[#494354] shadow-soft';
          icon = <AlertTriangle className="w-5 h-5 text-[#494354]" />;
        } else if (toast.type === 'SAFETY_CONFIRMED' || toast.type === 'JOURNEY_COMPLETED') {
          bgStyle = 'bg-[#DCEFFA] border-[#B3DCF2] text-[#494354] shadow-soft';
          icon = <CheckCircle className="w-5 h-5 text-emerald-700" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border flex items-start space-x-3 transition-all duration-300 transform translate-y-0 ${bgStyle}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <h5 className="font-black text-xs uppercase tracking-wider">{toast.title}</h5>
              <p className="text-xs mt-0.5 opacity-90 break-words font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 opacity-70 hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
