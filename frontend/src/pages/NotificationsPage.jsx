import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Navigation,
  Compass,
  Check,
  Trash2
} from 'lucide-react';

export default function NotificationsPage() {
  const { setUnreadCount } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data.success) {
        const notifs = res.data.notifications || [];
        setNotifications(notifs);
        const unread = notifs.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifs = filter === 'UNREAD'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const getIcon = (type) => {
    if (type === 'SOS_ACTIVATED') return <ShieldAlert className="w-5 h-5 text-[#DC2626]" />;
    if (type === 'JOURNEY_DELAYED') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    if (type === 'JOURNEY_COMPLETED' || type === 'SAFETY_CONFIRMED') return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (type === 'ETA_UPDATED') return <Clock className="w-5 h-5 text-[#494354]" />;
    return <Navigation className="w-5 h-5 text-[#494354]" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] text-xs font-bold mb-2">
            <Bell className="w-4 h-4 text-[#494354]" />
            <span>Activity & Alert Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#494354]">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6477] mt-1 font-medium">
            Real-time journey alerts, delay warnings, check-ins, and emergency signals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-white hover:bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] rounded-2xl text-xs font-bold transition shadow-soft flex items-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
            filter === 'ALL'
              ? 'bg-[#494354] text-white border-[#494354] shadow-soft'
              : 'bg-white hover:bg-[#F8DDE5] border-[#EEC5D1] text-[#494354]'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
            filter === 'UNREAD'
              ? 'bg-[#494354] text-white border-[#494354] shadow-soft'
              : 'bg-white hover:bg-[#F8DDE5] border-[#EEC5D1] text-[#494354]'
          }`}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-12 text-center text-[#6B6477] text-xs font-medium">Loading notifications...</div>
      ) : filteredNotifs.length === 0 ? (
        <div className="bg-[#FFFCF8] rounded-3xl p-12 text-center border border-[#EEC5D1] shadow-soft space-y-3">
          <Bell className="w-12 h-12 text-[#EEC5D1] mx-auto" />
          <h3 className="text-base font-bold text-[#494354]">No Notifications</h3>
          <p className="text-xs text-[#6B6477]">You are all caught up! New journey events will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.isRead && handleMarkAsRead(item.id)}
              className={`p-4 rounded-2xl border transition flex items-start space-x-3.5 cursor-pointer ${
                !item.isRead
                  ? 'bg-white border-[#EEC5D1] shadow-soft ring-1 ring-[#F8DDE5]'
                  : 'bg-white/60 border-[#EEC5D1]/60 opacity-80'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#F8DDE5] border border-[#EEC5D1] flex-shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#494354]">{item.title}</h4>
                  <span className="text-[10px] text-[#6B6477] font-semibold">
                    {new Date(item.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-[#6B6477] mt-1 leading-relaxed font-medium">{item.message}</p>
              </div>

              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#494354] flex-shrink-0 mt-2"></span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
