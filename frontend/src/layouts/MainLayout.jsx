import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import DelayAlertModal from '../components/DelayAlertModal';
import SOSConfirmModal from '../components/SOSConfirmModal';
import ToastContainer from '../components/ToastContainer';
import { ShieldCheck, PhoneCall, Heart } from 'lucide-react';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFCF8] text-[#494354]">
      {/* Slide-out Left Sidebar */}
      <Sidebar />

      {/* Top Navbar with Hamburger (☰) Trigger */}
      <Navbar />

      {/* Main Routed Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Interactive Global Modals */}
      <DelayAlertModal />
      <SOSConfirmModal />
      <ToastContainer />

      {/* Footer in Pastel Harmony */}
      <footer className="mt-auto border-t border-[#F8DDE5] bg-[#FFFCF8]/90 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Emergency Helplines Banner: Butter Yellow Highlight (#FFF0BD) */}
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-[#FFF0BD] border border-[#F5DC96] flex flex-wrap items-center justify-between gap-4 shadow-soft">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center font-bold shadow-xs">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#494354] uppercase tracking-wide">
                  Emergency National Helplines (24/7 Toll-Free)
                </h4>
                <p className="text-[11px] text-[#6B6477]">
                  Instant real-time connection to verified emergency services across India
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="tel:112"
                className="px-3.5 py-2 bg-white/90 border border-[#F5DC96] text-[#DC2626] font-bold rounded-2xl shadow-xs hover:bg-white hover:scale-102 transition flex items-center space-x-1.5"
              >
                <span>🚨 All-in-One Emergency: 112</span>
              </a>
              <a
                href="tel:1091"
                className="px-3.5 py-2 bg-white/90 border border-[#F5DC96] text-[#494354] font-bold rounded-2xl shadow-xs hover:bg-white hover:scale-102 transition flex items-center space-x-1.5"
              >
                <span>🌸 Women in Distress: 1091</span>
              </a>
              <a
                href="tel:181"
                className="px-3.5 py-2 bg-white/90 border border-[#F5DC96] text-[#494354] font-bold rounded-2xl shadow-xs hover:bg-white hover:scale-102 transition flex items-center space-x-1.5"
              >
                <span>📞 Women Helpline: 181</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-[#6B6477] pt-2 border-t border-[#F8DDE5]">
            <div className="flex items-center space-x-2 mb-2 md:mb-0">
              <span className="font-extrabold text-[#494354]">Safar Sakhi</span>
              <span>— "Your Safety, Our Responsibility."</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span>Designed with</span>
              <Heart className="w-3.5 h-3.5 text-[#DC2626] fill-[#DC2626] inline" />
              <span>for women traveling safely everywhere.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
