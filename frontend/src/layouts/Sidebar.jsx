import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../context/JourneyContext';
import { useSocket } from '../context/SocketContext';
import { useSidebar } from '../context/SidebarContext';
import {
  ShieldCheck,
  ShieldAlert,
  LayoutDashboard,
  Bot,
  BookOpen,
  MapPin,
  Radio,
  Users,
  History,
  Bell,
  User,
  Settings,
  UserCheck,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAuthenticated, isAdmin, isFamily, logout } = useAuth();
  const { activeJourney, setShowSosModal } = useJourney();
  const { unreadCount } = useSocket();
  const { isOpen, closeSidebar, isCollapsed, toggleCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    closeSidebar();
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    // On small screens, close the sidebar when a link is clicked
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  const homePath = isFamily ? '/family' : '/';

  // Define the 12 navigation items with Pastel Harmony categories
  const allNavItems = [
    {
      id: 'dashboard',
      name: isFamily ? 'Family Dashboard' : 'Dashboard',
      path: isFamily ? '/family' : '/',
      icon: LayoutDashboard,
      role: 'ALL',
      hoverBg: 'hover:bg-[#F8DDE5]/80 hover:text-[#494354]',
      activeClass: 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1] shadow-xs font-black'
    },
    {
      id: 'companion',
      name: 'AI Companion',
      path: '/companion',
      icon: Bot,
      role: 'ALL',
      badge: 'Gemini',
      badgeStyle: 'bg-[#E8E0F7] text-[#494354] border-[#D2C4EC]',
      hoverBg: 'hover:bg-[#E8E0F7]/80 hover:text-[#494354]',
      activeClass: 'bg-[#E8E0F7] text-[#494354] border-[#D2C4EC] shadow-xs font-black'
    },
    {
      id: 'safety-tips',
      name: 'AI Safety Tips',
      path: '/safety-tips',
      icon: BookOpen,
      role: 'ALL',
      hoverBg: 'hover:bg-[#FFF0BD]/80 hover:text-[#494354]',
      activeClass: 'bg-[#FFF0BD] text-[#494354] border-[#F5DC96] shadow-xs font-black'
    },
    {
      id: 'smart-journey',
      name: 'Smart Journey',
      path: '/journey/start',
      icon: MapPin,
      role: 'TRAVELER_ONLY', // Hidden for family members
      hoverBg: 'hover:bg-[#DCEFFA]/80 hover:text-[#494354]',
      activeClass: 'bg-[#DCEFFA] text-[#494354] border-[#B3DCF2] shadow-xs font-black'
    },
    {
      id: 'live-tracking',
      name: 'Live Location Tracking',
      path: activeJourney ? '/journey/active' : '/journey/start',
      icon: Radio,
      role: 'TRAVELER_ONLY', // Hidden for family members
      badge: activeJourney ? 'LIVE' : null,
      badgeStyle: 'bg-[#DC2626] text-white animate-pulse',
      hoverBg: 'hover:bg-[#DCEFFA]/80 hover:text-[#494354]',
      activeClass: 'bg-[#DCEFFA] text-[#494354] border-[#B3DCF2] shadow-xs font-black'
    },
    {
      id: 'trusted-contacts',
      name: 'Trusted Contacts',
      path: '/contacts',
      icon: Users,
      role: 'ALL',
      hoverBg: 'hover:bg-[#F8DDE5]/80 hover:text-[#494354]',
      activeClass: 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1] shadow-xs font-black'
    },
    {
      id: 'family-dashboard',
      name: 'Family Dashboard',
      path: '/family',
      icon: ShieldCheck,
      role: isFamily ? 'HIDDEN' : 'ALL', // For family, item 1 is already Family Dashboard
      hoverBg: 'hover:bg-[#E8E0F7]/80 hover:text-[#494354]',
      activeClass: 'bg-[#E8E0F7] text-[#494354] border-[#D2C4EC] shadow-xs font-black'
    },
    {
      id: 'journey-history',
      name: 'Journey History',
      path: '/history',
      icon: History,
      role: 'ALL',
      hoverBg: 'hover:bg-[#DCEFFA]/80 hover:text-[#494354]',
      activeClass: 'bg-[#DCEFFA] text-[#494354] border-[#B3DCF2] shadow-xs font-black'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      role: 'ALL',
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null,
      badgeStyle: 'bg-[#DC2626] text-white font-black',
      hoverBg: 'hover:bg-[#FFF0BD]/80 hover:text-[#494354]',
      activeClass: 'bg-[#FFF0BD] text-[#494354] border-[#F5DC96] shadow-xs font-black'
    },
    {
      id: 'profile',
      name: 'Profile',
      path: '/settings',
      icon: User,
      role: 'ALL',
      hoverBg: 'hover:bg-[#F8DDE5]/80 hover:text-[#494354]',
      activeClass: 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1] shadow-xs font-black'
    },
    {
      id: 'settings',
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      role: 'ALL',
      hoverBg: 'hover:bg-[#E8E0F7]/80 hover:text-[#494354]',
      activeClass: 'bg-[#E8E0F7] text-[#494354] border-[#D2C4EC] shadow-xs font-black'
    },
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      path: '/admin',
      icon: UserCheck,
      role: 'ADMIN_ONLY', // Only for authorized admins
      badge: 'Admin',
      badgeStyle: 'bg-[#FFF0BD] text-[#494354] border-[#F5DC96]',
      hoverBg: 'hover:bg-[#FFF0BD]/80 hover:text-[#494354]',
      activeClass: 'bg-[#FFF0BD] text-[#494354] border-[#F5DC96] shadow-xs font-black'
    }
  ];

  // Filter items based on user role
  const visibleNavItems = allNavItems.filter((item) => {
    if (item.role === 'HIDDEN') return false;
    if (item.role === 'ADMIN_ONLY' && !isAdmin) return false;
    if (item.role === 'TRAVELER_ONLY' && isFamily) return false;
    return true;
  });

  return (
    <>
      {/* 1. Backdrop Overlay (Smooth fade-in/out, closes sidebar when clicked outside) */}
      <div
        onClick={closeSidebar}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* 2. Slide-out Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#FFFCF8] border-r border-[#EEC5D1] shadow-2xl transition-all duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isCollapsed ? 'w-20' : 'w-72 sm:w-80'
        }`}
      >
        {/* Sidebar Header: Brand & Controls */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#EEC5D1]/70 bg-[#FFFCF8]">
          <Link
            to={homePath}
            onClick={handleLinkClick}
            className={`flex items-center space-x-3 transition-opacity ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-[#F8DDE5] border border-[#EEC5D1] flex items-center justify-center text-[#494354] shadow-xs flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#494354]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-base font-black tracking-tight text-[#494354] block leading-tight">
                  Safar Sakhi
                </span>
                <span className="text-[10px] text-[#6B6477] font-medium tracking-wide block truncate">
                  Your Safety, Our Responsibility.
                </span>
              </div>
            )}
          </Link>

          {/* Close button on mobile / Drawer view */}
          {!isCollapsed && (
            <div className="flex items-center space-x-1">
              {/* Desktop Collapse Toggle */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden lg:flex p-1.5 rounded-xl text-[#6B6477] hover:text-[#494354] hover:bg-[#F8DDE5]/60 transition"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Close Sidebar Button */}
              <button
                type="button"
                onClick={closeSidebar}
                className="p-1.5 rounded-xl text-[#6B6477] hover:text-[#494354] hover:bg-[#F8DDE5]/60 transition"
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden lg:flex p-1 rounded-lg text-[#6B6477] hover:text-[#494354] hover:bg-[#F8DDE5]/60 transition absolute -right-3 top-5 bg-white border border-[#EEC5D1] shadow-xs"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b border-[#EEC5D1]/60 bg-[#FFFCF8]">
          {!isCollapsed ? (
            <div className="p-3 bg-white rounded-2xl border border-[#EEC5D1] shadow-xs flex items-center space-x-3">
              <img
                src={
                  user?.profile?.avatar ||
                  (isFamily
                    ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
                }
                alt={user?.fullName || 'User'}
                className="w-11 h-11 rounded-xl object-cover border-2 border-[#EEC5D1] flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-[#494354] truncate">
                  {user?.fullName || 'Safar Sakhi User'}
                </h4>
                <p className="text-[11px] text-[#6B6477] truncate font-medium">
                  {user?.email || user?.phoneNumber || 'Active Member'}
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    isFamily
                      ? 'bg-[#E8E0F7] text-[#494354] border-[#D2C4EC]'
                      : isAdmin
                      ? 'bg-[#FFF0BD] text-[#494354] border-[#F5DC96]'
                      : 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1]'
                  }`}
                >
                  {isFamily ? 'Family Guardian' : isAdmin ? 'Admin' : 'Traveler'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`${user?.fullName} (${user?.role})`}>
              <img
                src={
                  user?.profile?.avatar ||
                  (isFamily
                    ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
                }
                alt={user?.fullName || 'User'}
                className="w-10 h-10 rounded-xl object-cover border-2 border-[#EEC5D1]"
              />
            </div>
          )}
        </div>

        {/* Scrollable Navigation List (All 12 items) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 no-scrollbar">
          {!isCollapsed && (
            <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6477] px-3 pt-1 pb-1 block">
              Navigation Menu
            </span>
          )}

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={handleLinkClick}
                title={isCollapsed ? item.name : undefined}
                className={`group flex items-center rounded-2xl transition-all duration-200 border ${
                  isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 space-x-3'
                } ${
                  isActive
                    ? item.activeClass
                    : `text-[#6B6477] border-transparent ${item.hoverBg}`
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#494354]' : 'text-[#6B6477] group-hover:text-[#494354]'
                    }`}
                  />
                  {/* Miniature badge dot in collapsed mode */}
                  {isCollapsed && item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#DC2626]"></span>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="text-xs font-bold truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-xs ml-2 flex-shrink-0 ${
                          item.badgeStyle || 'bg-white text-[#494354] border-[#EEC5D1]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Emergency SOS Button in Sidebar (Prominent RED) */}
        <div className="p-3 border-t border-[#EEC5D1]/60 bg-[#FFFCF8]">
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => {
                closeSidebar();
                setShowSosModal(true);
              }}
              className="w-full py-3 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/30 flex items-center justify-center space-x-2 transition active:scale-95 border border-red-500"
            >
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>Emergency SOS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                closeSidebar();
                setShowSosModal(true);
              }}
              className="w-12 h-12 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-2xl flex items-center justify-center shadow-md shadow-red-600/30 transition active:scale-95 border border-red-500 mx-auto"
              title="Emergency SOS"
            >
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </button>
          )}
        </div>

        {/* Sidebar Footer: Sign Out & Help Badge */}
        <div className="p-3 border-t border-[#EEC5D1]/60 bg-[#FFFCF8]">
          {!isCollapsed ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Sign Out</span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-[#6B6477] font-semibold px-1 pt-1">
                <span>Helpline 112 • 24/7</span>
                <span className="font-bold text-[#494354]">Safar Sakhi v1.0</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow-xs mx-auto transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

