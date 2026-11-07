import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  TrendingUp,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  BarChart2,
  PieChart as PieIcon,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function JourneyHistoryPage() {
  const [journeys, setJourneys] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedJourney, setSelectedJourney] = useState(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const [historyRes, analyticsRes] = await Promise.allSettled([
        api.get(`/journeys?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        api.get('/journeys/analytics/summary')
      ]);

      if (historyRes.status === 'fulfilled' && historyRes.value.data.success) {
        setJourneys(historyRes.value.data.journeys || []);
      }
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data.success) {
        setAnalytics(analyticsRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadHistory();
  };

  // Pastel Harmony Chart Colors
  const PASTEL_PALETTE = ['#E28FA4', '#79BAE6', '#ECC558', '#A795DE', '#494354'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] text-xs font-bold mb-2">
            <TrendingUp className="w-4 h-4 text-[#494354]" />
            <span>Travel Logs & Insights</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#494354]">
            Journey History & Safety Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6477] mt-1 font-medium">
            Review past commute logs, arrival performance, safety confirmations, and analytics.
          </p>
        </div>
      </div>

      {/* Analytics Summary Cards - 4 Pastel Harmony Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#F8DDE5] rounded-3xl p-5 border border-[#EEC5D1] shadow-soft">
            <span className="text-[11px] text-[#494354] font-black uppercase tracking-wider block">Total Trips</span>
            <span className="text-2xl sm:text-3xl font-black text-[#494354] mt-1 block">
              {analytics.stats?.total || 0}
            </span>
            <span className="text-[11px] text-[#6B6477] font-semibold">Tracked journeys</span>
          </div>

          <div className="bg-[#DCEFFA] rounded-3xl p-5 border border-[#B3DCF2] shadow-soft">
            <span className="text-[11px] text-[#494354] font-black uppercase tracking-wider block">Safely Completed</span>
            <span className="text-2xl sm:text-3xl font-black text-[#494354] mt-1 block">
              {analytics.stats?.completed || 0}
            </span>
            <span className="text-[11px] text-[#6B6477] font-semibold">Destination reached</span>
          </div>

          <div className="bg-[#FFF0BD] rounded-3xl p-5 border border-[#F5DC96] shadow-soft">
            <span className="text-[11px] text-[#494354] font-black uppercase tracking-wider block">Delayed Trips</span>
            <span className="text-2xl sm:text-3xl font-black text-[#494354] mt-1 block">
              {analytics.stats?.delayed || 0}
            </span>
            <span className="text-[11px] text-[#6B6477] font-semibold">Overdue checked-in</span>
          </div>

          <div className="bg-[#E8E0F7] rounded-3xl p-5 border border-[#D2C4EC] shadow-soft">
            <span className="text-[11px] text-[#494354] font-black uppercase tracking-wider block">Safety Index</span>
            <span className="text-2xl sm:text-3xl font-black text-[#494354] mt-1 block">
              {analytics.stats?.safetyScore || 100}%
            </span>
            <span className="text-[11px] text-[#6B6477] font-semibold">Reliability rating</span>
          </div>
        </div>
      )}

      {/* Visual Charts Row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Weekly Activity Bar Chart */}
          <div className="lg:col-span-8 bg-[#FFFCF8] rounded-3xl p-6 border border-[#EEC5D1] shadow-soft">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#494354] mb-4 flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-[#494354]" />
              <span>Weekly Travel Activity</span>
            </h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trend || []}>
                  <XAxis dataKey="day" stroke="#6B6477" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6B6477" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFCF8', borderRadius: '16px', border: '1px solid #EEC5D1', fontSize: '12px', color: '#494354' }}
                  />
                  <Bar dataKey="journeys" fill="#E28FA4" radius={[8, 8, 0, 0]} name="Journeys" />
                  <Bar dataKey="completed" fill="#79BAE6" radius={[8, 8, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mode of Transport Breakdown */}
          <div className="lg:col-span-4 bg-[#FFFCF8] rounded-3xl p-6 border border-[#EEC5D1] shadow-soft flex flex-col justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#494354] mb-2 flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-[#494354]" />
              <span>Transport Modes</span>
            </h3>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.typeBreakdown || [{ name: 'CAB', count: 1 }]}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={40}
                  >
                    {(analytics.typeBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PASTEL_PALETTE[index % PASTEL_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFCF8', borderRadius: '16px', border: '1px solid #EEC5D1', fontSize: '12px', color: '#494354' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-[#494354] pt-2 border-t border-[#EEC5D1]/60">
              {(analytics.typeBreakdown || []).map((item, idx) => (
                <span key={idx} className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PASTEL_PALETTE[idx % PASTEL_PALETTE.length] }}></span>
                  <span>{item.name}: {item.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFCF8] rounded-3xl p-4 border border-[#EEC5D1] shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by destination..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5]"
          />
          <Search className="w-4 h-4 text-[#6B6477] absolute left-3 top-3" />
        </form>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'COMPLETED', 'DELAYED', 'CANCELLED', 'EMERGENCY'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                statusFilter === st
                  ? 'bg-[#494354] text-white border-[#494354] shadow-soft'
                  : 'bg-white hover:bg-[#F8DDE5] border-[#EEC5D1] text-[#494354]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Journeys Table / Cards */}
      {loading ? (
        <div className="py-12 text-center text-[#6B6477] text-xs font-medium">Loading travel records...</div>
      ) : journeys.length === 0 ? (
        <div className="bg-[#FFFCF8] rounded-3xl p-12 text-center border border-[#EEC5D1] shadow-soft space-y-3">
          <Clock className="w-12 h-12 text-[#EEC5D1] mx-auto" />
          <h3 className="text-base font-bold text-[#494354]">No Journeys Match Your Search</h3>
          <p className="text-xs text-[#6B6477]">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {journeys.map((j) => (
            <div
              key={j.id}
              onClick={() => setSelectedJourney(j)}
              className="bg-[#FFFCF8] rounded-2xl p-5 border border-[#EEC5D1] hover:border-[#494354]/40 shadow-soft hover:shadow-soft-lg transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#DCEFFA] text-[#494354] border border-[#B3DCF2] flex items-center justify-center font-black text-xs">
                  {j.journeyType?.substring(0, 3)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#494354]">
                    {j.startLocation} → <span className="font-extrabold text-[#494354] underline decoration-[#F8DDE5] decoration-2">{j.destination}</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6477] mt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-[#6B6477]" />
                      <span>{new Date(j.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-[#6B6477]" />
                      <span>{new Date(j.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    {j.notes && (
                      <span className="text-[11px] text-[#6B6477] truncate max-w-[200px]">
                        Note: {j.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    j.status === 'COMPLETED'
                      ? 'bg-[#DCEFFA] text-[#494354] border-[#B3DCF2]'
                      : j.status === 'CANCELLED'
                      ? 'bg-white text-[#6B6477] border-[#EEC5D1]'
                      : j.status === 'EMERGENCY'
                      ? 'bg-[#DC2626] text-white border-red-700 animate-pulse'
                      : 'bg-[#FFF0BD] text-[#494354] border-[#F5DC96]'
                  }`}
                >
                  {j.status}
                </span>
                <ChevronRight className="w-5 h-5 text-[#6B6477]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Journey Detail Modal */}
      {selectedJourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-[#FFFCF8] rounded-3xl p-6 border border-[#EEC5D1] shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEC5D1]/60">
              <h3 className="text-base font-black text-[#494354]">Journey Log Details</h3>
              <button
                onClick={() => setSelectedJourney(null)}
                className="p-1 rounded-full text-[#6B6477] hover:text-[#494354]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#494354]">
              <div className="p-3.5 bg-[#DCEFFA]/50 rounded-2xl border border-[#B3DCF2]">
                <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Route</span>
                <p className="font-bold text-[#494354] mt-1">From: {selectedJourney.startLocation}</p>
                <p className="font-bold text-[#494354] mt-0.5">To: {selectedJourney.destination}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#EEC5D1] rounded-2xl">
                  <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Start Time</span>
                  <p className="font-bold mt-0.5 text-[#494354]">
                    {new Date(selectedJourney.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-white border border-[#EEC5D1] rounded-2xl">
                  <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Expected Arrival</span>
                  <p className="font-bold mt-0.5 text-[#494354]">
                    {new Date(selectedJourney.expectedArrivalTime).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedJourney.notes && (
                <div className="p-3 bg-white border border-[#EEC5D1] rounded-2xl">
                  <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Vehicle / Route Notes</span>
                  <p className="font-semibold text-[#494354] mt-0.5">{selectedJourney.notes}</p>
                </div>
              )}

              <div className="p-3 bg-white border border-[#EEC5D1] rounded-2xl">
                <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Public Tracking Token</span>
                <p className="font-mono text-[#494354] mt-0.5 text-[11px]">{selectedJourney.trackingToken}</p>
              </div>

              {selectedJourney.sosIncidents && selectedJourney.sosIncidents.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-800">
                  <span className="text-[10px] font-bold uppercase block">Emergency SOS Logs</span>
                  <p className="font-semibold mt-0.5">
                    Triggered {selectedJourney.sosIncidents.length} time(s). Status: {selectedJourney.sosIncidents[0].status}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedJourney(null)}
                className="w-full py-2.5 bg-[#494354] hover:bg-[#383340] text-white rounded-xl text-xs font-bold transition shadow-soft"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
