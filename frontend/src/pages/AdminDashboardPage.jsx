import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Users,
  Navigation,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('INCIDENTS'); // 'INCIDENTS' | 'USERS'
  const [resolvingId, setResolvingId] = useState(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, incidentsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/incidents')
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        setStats(statsRes.value.data.stats);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
        setUsersList(usersRes.value.data.users || []);
      }
      if (incidentsRes.status === 'fulfilled' && incidentsRes.value.data.success) {
        setIncidents(incidentsRes.value.data.incidents || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleResolveIncident = async (id) => {
    setResolvingId(id);
    try {
      const res = await api.put(`/admin/incidents/${id}/resolve`, {
        resolutionNotes: `Resolved by administrator (${user?.fullName})`
      });
      if (res.data.success) {
        await loadAdminData();
      }
    } catch (err) {
      alert('Failed to resolve incident.');
    } finally {
      setResolvingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-red-200 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Restricted Administrative Area</h2>
        <p className="text-xs text-slate-500">
          Your account does not have administrator privileges to access platform-wide incident oversight.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E8E0F7] text-[#494354] border border-[#D6C8EE] text-xs font-bold mb-2 shadow-xs">
            <UserCheck className="w-4 h-4 text-[#494354]" />
            <span>Platform Operations & Oversight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#494354]">
            Admin Emergency Control Center
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6477] mt-1 font-medium">
            Real-time platform metrics, active SOS incidents audit, and user accounts.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-4 py-2.5 bg-white hover:bg-[#F8DDE5] border border-[#EEC5D1] text-[#494354] rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards in Pastel Harmony */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-[#F8DDE5] rounded-3xl p-5 border border-[#EEC5D1] shadow-soft">
            <span className="text-[11px] text-[#6B6477] font-bold uppercase block">Total Users</span>
            <span className="text-2xl font-black text-[#494354] mt-1 block">{stats.totalUsers}</span>
            <span className="text-[10px] text-[#8E869B]">Registered women travelers</span>
          </div>

          <div className="bg-[#DCEFFA] rounded-3xl p-5 border border-[#C1E3F5] shadow-soft">
            <span className="text-[11px] text-[#494354] font-bold uppercase block">Active Trips</span>
            <span className="text-2xl font-black text-[#494354] mt-1 block">{stats.activeJourneys}</span>
            <span className="text-[10px] text-blue-700 font-semibold">Broadcasting now</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#F8DDE5] shadow-soft">
            <span className="text-[11px] text-[#6B6477] font-bold uppercase block">Completed Trips</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.completedJourneys}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">Safely arrived</span>
          </div>

          <div className="bg-[#FFF0BD] rounded-3xl p-5 border border-[#F5DC96] shadow-soft">
            <span className="text-[11px] text-[#494354] font-bold uppercase block">Delayed Trips</span>
            <span className="text-2xl font-black text-[#494354] mt-1 block">{stats.delayedJourneys}</span>
            <span className="text-[10px] text-amber-800 font-semibold">Overdue monitor</span>
          </div>

          <div className="bg-[#FFFCF8] rounded-3xl p-5 border-2 border-[#DC2626]/40 shadow-soft">
            <span className="text-[11px] text-[#DC2626] font-bold uppercase block">Active SOS</span>
            <span className="text-2xl font-black text-[#DC2626] mt-1 block">{stats.activeSOS}</span>
            <span className="text-[10px] text-red-600 font-bold">Needs resolution</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#F8DDE5] pb-2">
        <button
          onClick={() => setActiveTab('INCIDENTS')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'INCIDENTS'
              ? 'bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] shadow-xs'
              : 'bg-white hover:bg-[#F8DDE5]/40 text-[#6B6477]'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
          <span>SOS Incidents ({incidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'USERS'
              ? 'bg-[#E8E0F7] text-[#494354] border border-[#D6C8EE] shadow-xs'
              : 'bg-white hover:bg-[#E8E0F7]/40 text-[#6B6477]'
          }`}
        >
          <Users className="w-4 h-4 text-[#494354]" />
          <span>User Directory ({usersList.length})</span>
        </button>
      </div>

      {/* Incident Management Table */}
      {activeTab === 'INCIDENTS' && (
        <div className="bg-white rounded-3xl border border-[#F8DDE5] shadow-soft overflow-hidden">
          <div className="p-4 border-b border-[#F8DDE5] flex items-center justify-between bg-[#FFFCF8]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#494354]">
              Platform Emergency SOS Logs
            </h3>
            <span className="text-xs text-[#8E869B]">Total Incidents: {incidents.length}</span>
          </div>

          {incidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8E869B]">No SOS incidents recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8DDE5]/30 text-[#494354] border-b border-[#F8DDE5] font-bold">
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Trigger</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8DDE5]/40">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-[#FFF0BD]/15 transition">
                      <td className="p-3.5 font-bold text-[#494354]">
                        {inc.user?.fullName || 'Traveler'}
                        <span className="block text-[11px] text-[#8E869B] font-normal">
                          {inc.user?.phoneNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {inc.triggerType}
                        </span>
                        {inc.emergencyPhrase && (
                          <span className="block text-[10px] text-[#DC2626] font-medium">
                            "{inc.emergencyPhrase}"
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[#6B6477]">
                        {inc.latitude && inc.longitude
                          ? `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`
                          : 'GPS Pending'}
                      </td>
                      <td className="p-3.5 text-[#6B6477]">
                        {new Date(inc.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            inc.status === 'ACTIVE'
                              ? 'bg-[#DC2626] text-white animate-pulse'
                              : inc.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {inc.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleResolveIncident(inc.id)}
                            disabled={resolvingId === inc.id}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            {resolvingId === inc.id ? 'Resolving...' : 'Mark Resolved'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#8E869B] font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* User Directory Table */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-3xl border border-[#F8DDE5] shadow-soft overflow-hidden">
          <div className="p-4 border-b border-[#F8DDE5] bg-[#FFFCF8]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#494354]">
              Registered Travelers & Guardians
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E8E0F7]/30 text-[#494354] border-b border-[#D6C8EE] font-bold">
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Contacts</th>
                  <th className="p-3.5">Trips</th>
                  <th className="p-3.5">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8DDE5]/40">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-[#E8E0F7]/15 transition">
                    <td className="p-3.5 font-bold text-[#494354]">{u.fullName}</td>
                    <td className="p-3.5 text-[#6B6477]">{u.email}</td>
                    <td className="p-3.5 text-[#6B6477]">{u.phoneNumber}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        u.role === 'FAMILY' ? 'bg-[#E8E0F7] text-[#494354]' : 'bg-[#F8DDE5] text-[#494354]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-[#494354]">{u._count?.contacts || 0}</td>
                    <td className="p-3.5 font-bold text-[#494354]">{u._count?.journeys || 0}</td>
                    <td className="p-3.5 text-[#8E869B]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

