import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../context/JourneyContext';
import { useSocket } from '../context/SocketContext';
import { useSidebar } from '../context/SidebarContext';
import {
  ShieldAlert,
  Bell,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  Navigation,
  Settings,
  LogOut,
  UserCheck,
  User,
  Radio
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isFamily, logout } = useAuth();
  const { activeJourney, setShowSosModal } = useJourney();
  const { unreadCount } = useSocket();
  const { isOpen, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const homeLink = isFamily ? '/family' : '/';

  return (
    <header className="sticky top-0 z-30 bg-[#FFFCF8]/95 backdrop-blur-md border-b border-[#F8DDE5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Hamburger Menu Icon (☰) & Brand Logo */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2.5 rounded-2xl bg-white hover:bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] shadow-xs hover:shadow-soft transition-all duration-200 active:scale-95 flex items-center justify-center group"
                title="Toggle Navigation Menu (☰)"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? (
                  <X className="w-5 h-5 text-[#494354] transition-transform group-hover:scale-110" />
                ) : (
                  <Menu className="w-5 h-5 text-[#494354] transition-transform group-hover:scale-110" />
                )}
              </button>
            )}

            <Link to={homeLink} className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-2xl bg-[#F8DDE5] border border-[#EEC5D1] flex items-center justify-center text-[#494354] shadow-xs group-hover:scale-105 group-hover:bg-[#F4CFDB] transition-all duration-300">
                <ShieldCheck className="w-6 h-6 text-[#494354]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-[#494354]">
                    Safar Sakhi
                  </span>
                  <span
                    className={`hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                      isFamily
                        ? 'bg-[#E8E0F7] text-[#494354] border-[#D6C8EE]'
                        : 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1]'
                    }`}
                  >
                    {isFamily ? 'Family Guardian' : 'AI Safety Guard'}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6477] hidden sm:block tracking-wide font-medium">
                  Your Safety, Our Responsibility.
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Live Journey Status Pill (when journey is active) */}
          {isAuthenticated && activeJourney && (
            <Link
              to="/journey/active"
              className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-full bg-[#DCEFFA] border border-[#B3DCF2] text-xs font-bold text-[#494354] shadow-soft hover:bg-[#C1E3F5] transition animate-pulse"
            >
              <Radio className="w-4 h-4 text-[#494354] animate-spin-slow" />
              <span>Live Trip Radar Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </Link>
          )}

          {/* Right Action Icons & Emergency SOS */}
          <div className="flex items-center space-x-2.5">
            {isAuthenticated ? (
              <>
                {/* PROMINENT EMERGENCY SOS BUTTON (Strictly RED for clear identification) */}
                <button
                  type="button"
                  onClick={() => setShowSosModal(true)}
                  className="relative group overflow-hidden px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/25 hover:shadow-lg hover:shadow-red-600/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-2 border border-red-500"
                >
                  <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                  <span className="font-extrabold tracking-wide">Emergency SOS</span>
                </button>

                {/* Notifications Bell Button */}
                <Link
                  to="/notifications"
                  className="relative p-2.5 text-[#494354] hover:bg-[#FFF0BD] rounded-2xl border border-transparent hover:border-[#F5DC96] transition-all duration-200"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-[#494354]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#DC2626] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-2xl hover:bg-[#F8DDE5]/60 transition border border-transparent hover:border-[#EEC5D1]"
                  >
                    <img
                      src={
                        user?.profile?.avatar ||
                        (isFamily
                          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
                          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
                      }
                      alt={user?.fullName || 'User Profile'}
                      className="w-9 h-9 rounded-xl object-cover border-2 border-[#EEC5D1]"
                    />
                    <div className="hidden md:block text-left">
                      <span className="text-xs font-bold text-[#494354] max-w-[100px] truncate block leading-tight">
                        {user?.fullName?.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-[#8E869B] font-semibold uppercase">
                        {user?.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8E869B] hidden sm:block" />
                  </button>

                  {/* Dropdown Box in Warm White with Pastel Borders */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-[#FFFCF8] rounded-3xl shadow-xl border border-[#F8DDE5] py-2.5 z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-[#F8DDE5]">
                        <p className="text-xs font-bold text-[#494354] truncate">{user?.fullName}</p>
                        <p className="text-[11px] text-[#8E869B] truncate">{user?.email}</p>
                        <span
                          className={`inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isFamily
                              ? 'bg-[#E8E0F7] text-[#494354] border-[#D6C8EE]'
                              : 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1]'
                          }`}
                        >
                          {user?.role === 'FAMILY' ? 'FAMILY GUARDIAN' : user?.role}
                        </span>
                      </div>

                      <div className="p-1.5 space-y-1">
                        {isFamily ? (
                          <Link
                            to="/family"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs text-[#494354] hover:bg-[#F8DDE5] rounded-xl font-bold transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#494354]" />
                            <span>Family Dashboard</span>
                          </Link>
                        ) : (
                          <Link
                            to="/"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs text-[#494354] hover:bg-[#F8DDE5] rounded-xl font-bold transition"
                          >
                            <Navigation className="w-4 h-4 text-[#494354]" />
                            <span>Traveler Dashboard</span>
                          </Link>
                        )}

                        <Link
                          to="/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-xs text-[#6B6477] hover:bg-[#FFF0BD] hover:text-[#494354] rounded-xl font-medium transition"
                        >
                          <User className="w-4 h-4 text-[#8E869B]" />
                          <span>Profile & Medical</span>
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-xs text-[#6B6477] hover:bg-[#FFF0BD] hover:text-[#494354] rounded-xl font-medium transition"
                        >
                          <Settings className="w-4 h-4 text-[#8E869B]" />
                          <span>Settings & Preferences</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs text-[#494354] hover:bg-[#DCEFFA] rounded-xl font-semibold transition"
                          >
                            <UserCheck className="w-4 h-4 text-[#494354]" />
                            <span>Admin Control Center</span>
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-[#DC2626] hover:bg-[#F8DDE5]/40 rounded-xl font-bold transition border-t border-[#F8DDE5] mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-[#494354] hover:bg-[#F8DDE5] rounded-2xl border border-transparent hover:border-[#EEC5D1] transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-xs font-bold bg-[#F8DDE5] hover:bg-[#F4CFDB] text-[#494354] border border-[#EEC5D1] rounded-2xl shadow-xs transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
