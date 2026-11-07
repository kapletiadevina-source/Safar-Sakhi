import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import LeafletMap from '../components/LeafletMap';
import api from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  MapPin,
  PhoneCall,
  Navigation,
  Compass,
  Radio,
  CheckCircle,
  AlertTriangle,
  Heart,
  Share2
} from 'lucide-react';

export default function FamilyTrackingPage() {
  const { trackingToken } = useParams();
  const [journey, setJourney] = useState(null);
  const [locations, setLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Load journey by token
  useEffect(() => {
    const fetchSharedJourney = async () => {
      try {
        const res = await api.get(`/journeys/track/${trackingToken}`);
        if (res.data.success && res.data.journey) {
          const j = res.data.journey;
          setJourney(j);
          if (j.locations && j.locations.length > 0) {
            setLocations(j.locations);
            const latest = j.locations[j.locations.length - 1];
            setCurrentLocation({
              latitude: latest.latitude,
              longitude: latest.longitude,
              accuracy: latest.accuracy || 10,
              timestamp: latest.timestamp
            });
          } else if (j.startLatitude && j.startLongitude) {
            setCurrentLocation({
              latitude: j.startLatitude,
              longitude: j.startLongitude,
              accuracy: 15,
              timestamp: j.startTime
            });
          }
        }
      } catch (err) {
        setError('This shared tracking link is invalid, expired, or access is restricted.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedJourney();
  }, [trackingToken]);

  // Real-time updates via Socket.IO without manual refresh
  useEffect(() => {
    if (!trackingToken) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_journey', { trackingToken });
    });

    socket.on('location_updated', (data) => {
      const newPoint = {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        timestamp: data.timestamp
      };
      setCurrentLocation(newPoint);
      setLocations((prev) => [...prev, newPoint]);
    });

    socket.on('journey_delayed', () => {
      setJourney((prev) => prev ? { ...prev, status: 'DELAYED' } : null);
    });

    socket.on('eta_updated', (data) => {
      setJourney((prev) => prev ? { ...prev, expectedArrivalTime: data.newEta, status: 'ACTIVE' } : null);
    });

    socket.on('sos_activated', () => {
      setJourney((prev) => prev ? { ...prev, status: 'EMERGENCY' } : null);
    });

    socket.on('sos_cancelled', () => {
      setJourney((prev) => prev ? { ...prev, status: 'ACTIVE' } : null);
    });

    socket.on('journey_completed', () => {
      setJourney((prev) => prev ? { ...prev, status: 'COMPLETED' } : null);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [trackingToken]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#EEC5D1] border-t-[#494354] animate-spin"></div>
        <p className="text-sm font-bold text-[#494354]">Connecting to live family tracking radar...</p>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-[#FFFCF8] rounded-3xl border border-[#EEC5D1] shadow-soft text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-[#DC2626] mx-auto flex items-center justify-center font-bold border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#494354]">Invalid Tracking Link</h2>
        <p className="text-xs text-[#6B6477] leading-relaxed">
          {error || 'This live session is unavailable. The traveler may have completed or cancelled the journey.'}
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-[#494354] text-white rounded-2xl text-xs font-bold shadow-soft hover:bg-[#383340] transition"
        >
          Return to Safar Sakhi
        </Link>
      </div>
    );
  }

  const traveler = journey.user || {};
  const isEmergency = journey.status === 'EMERGENCY';
  const isCompleted = journey.status === 'COMPLETED';
  const isDelayed = journey.status === 'DELAYED';

  return (
    <div className="space-y-6">
      {/* 1. Emergency Banner (If active SOS) - strictly RED */}
      {isEmergency && (
        <div className="p-5 rounded-3xl bg-[#DC2626] text-white shadow-emergency flex items-center justify-between gap-4 animate-pulse border-2 border-red-700">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="text-base font-black tracking-wide uppercase">
                🚨 EMERGENCY SOS ACTIVATED BY TRAVELER
              </h3>
              <p className="text-xs text-red-100">
                Live location broadcasted. Please contact the traveler or dial emergency services immediately!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={`tel:${traveler.phoneNumber}`}
              className="px-4 py-2 bg-white text-[#DC2626] font-black text-xs rounded-xl shadow-sm hover:bg-slate-100 transition"
            >
              Call Traveler
            </a>
            <a
              href="tel:112"
              className="px-4 py-2 bg-red-950 text-white font-black text-xs rounded-xl shadow-sm hover:bg-black transition"
            >
              Dial 112
            </a>
          </div>
        </div>
      )}

      {/* 2. Top Header Card */}
      <div className="bg-[#FFFCF8] rounded-3xl p-6 border border-[#EEC5D1] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            src={traveler.profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={traveler.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#EEC5D1] shadow-soft"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#494354]">
                Live Family Guardian View
              </span>
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCEFFA] text-[#494354] border border-[#B3DCF2]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Socket Live</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#494354]">
              Tracking: {traveler.fullName || 'Traveler'}
            </h1>
            <p className="text-xs text-[#6B6477] mt-0.5">
              Contact: <b>{traveler.phoneNumber || 'Protected'}</b> • Mode: <b>{journey.journeyType}</b>
            </p>
          </div>
        </div>

        {/* Live Status Pill & Call Action */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[11px] text-[#6B6477] font-bold uppercase block">Journey Status</span>
            <span
              className={`inline-block mt-0.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                isEmergency
                  ? 'bg-[#DC2626] text-white border-red-700 animate-pulse'
                  : isCompleted
                  ? 'bg-[#DCEFFA] text-[#494354] border-[#B3DCF2]'
                  : isDelayed
                  ? 'bg-[#FFF0BD] text-[#494354] border-[#F5DC96]'
                  : 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1]'
              }`}
            >
              {journey.status}
            </span>
          </div>

          <a
            href={`tel:${traveler.phoneNumber}`}
            className="px-4 py-3 bg-[#494354] hover:bg-[#383340] text-white font-bold text-xs rounded-2xl shadow-soft transition flex items-center space-x-1.5"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call {traveler.fullName?.split(' ')[0]}</span>
          </a>
        </div>
      </div>

      {/* 3. Main Live Map & Journey Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Display in Sky Blue Container */}
        <div className="lg:col-span-8 bg-[#DCEFFA] rounded-3xl p-5 border-2 border-[#B3DCF2] shadow-soft space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#494354]">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-[#494354]" />
              <span>Real-Time GPS Location Stream</span>
            </div>
            <span className="text-[11px] text-[#6B6477] font-semibold">
              Updated automatically via Socket.IO
            </span>
          </div>

          <LeafletMap
            currentLocation={currentLocation}
            startPoint={{
              latitude: journey.startLatitude,
              longitude: journey.startLongitude,
              label: journey.startLocation
            }}
            destinationPoint={{
              latitude: journey.destinationLatitude,
              longitude: journey.destinationLongitude,
              label: journey.destination
            }}
            path={locations}
            height="460px"
          />

          <div className="p-3.5 bg-white/80 rounded-2xl border border-[#B3DCF2] text-[11px] text-[#494354] leading-relaxed">
            ℹ️ <b>Live Sync Status:</b> The location updates dynamically on this screen without requiring a page refresh whenever the traveler's device transmits new GPS coordinates.
          </div>
        </div>

        {/* Journey Details & Emergency Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Details Card */}
          <div className="bg-[#FFFCF8] rounded-3xl p-5 border border-[#EEC5D1] shadow-soft space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#494354]">
              Trip Details
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#DCEFFA]/50 border border-[#B3DCF2]">
                <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Route</span>
                <p className="text-xs font-bold text-[#494354] mt-1">
                  Start: <span className="font-semibold text-[#6B6477]">{journey.startLocation}</span>
                </p>
                <p className="text-xs font-bold text-[#494354] mt-0.5">
                  Destination: <span className="font-bold text-[#494354]">{journey.destination}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF0BD]/50 border border-[#F5DC96] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Expected Arrival</span>
                  <span className="text-lg font-black text-[#494354] flex items-center space-x-1.5 mt-0.5">
                    <Clock className="w-4 h-4 text-[#494354] inline" />
                    <span>{new Date(journey.expectedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
                <span className="text-xs text-[#6B6477]">
                  Started at {new Date(journey.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#EEC5D1]">
                <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Last Known Location Timestamp</span>
                <span className="text-xs font-bold text-[#494354] mt-0.5 block">
                  {currentLocation?.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'Just now'} (Accuracy: ±{Math.round(currentLocation?.accuracy || 10)}m)
                </span>
              </div>

              {journey.notes && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#EEC5D1] text-xs">
                  <span className="text-[10px] text-[#6B6477] font-bold uppercase block">Vehicle / Driver Notes</span>
                  <span className="text-[#494354] font-semibold">{journey.notes}</span>
                </div>
              )}
            </div>

            {/* Quick Emergency Actions for Family */}
            <div className="pt-3 border-t border-[#EEC5D1]/60 space-y-2">
              <span className="text-[10px] text-[#6B6477] font-bold uppercase block">
                Family Emergency Assistance
              </span>
              <a
                href="tel:112"
                className="w-full py-3 bg-[#DC2626] hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-soft"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Call Police: 112</span>
              </a>
              <a
                href="tel:1091"
                className="w-full py-2.5 bg-[#F8DDE5] hover:bg-[#F2C4CE] border border-[#EEC5D1] text-[#494354] rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <PhoneCall className="w-4 h-4 text-[#494354]" />
                <span>Women Helpline: 1091</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
