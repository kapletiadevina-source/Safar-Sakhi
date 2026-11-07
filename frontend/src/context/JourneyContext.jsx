import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const JourneyContext = createContext(null);

export const JourneyProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { socket, addToast } = useSocket();

  const [activeJourney, setActiveJourney] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationTrail, setLocationTrail] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Delays
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [activeSosIncident, setActiveSosIncident] = useState(null);

  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Fetch active journey on auth change
  const fetchActiveJourney = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveJourney(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/journeys/active');
      if (res.data.success && res.data.activeJourney) {
        const j = res.data.activeJourney;
        setActiveJourney(j);
        if (j.locations && j.locations.length > 0) {
          setLocationTrail(j.locations);
          const latest = j.locations[j.locations.length - 1];
          setCurrentLocation({
            latitude: latest.latitude,
            longitude: latest.longitude,
            accuracy: latest.accuracy || 10,
            timestamp: latest.timestamp
          });
        }
        if (j.sosIncidents && j.sosIncidents.length > 0) {
          setActiveSosIncident(j.sosIncidents[0]);
        }
      } else {
        setActiveJourney(null);
      }
    } catch (err) {
      console.error('Failed to fetch active journey:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchActiveJourney();
  }, [fetchActiveJourney]);

  // Handle Socket Events for active journey
  useEffect(() => {
    if (!socket || !activeJourney?.id) return;

    socket.emit('join_journey', {
      journeyId: activeJourney.id,
      trackingToken: activeJourney.trackingToken
    });

    const handleLocationUpdate = (data) => {
      if (data.journeyId === activeJourney.id) {
        const newPoint = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp: data.timestamp
        };
        setCurrentLocation(newPoint);
        setLocationTrail((prev) => [...prev, newPoint]);
      }
    };

    const handleJourneyDelayed = (data) => {
      if (data.journeyId === activeJourney.id) {
        setActiveJourney((prev) => prev ? { ...prev, status: 'DELAYED' } : null);
        setShowDelayModal(true);
      }
    };

    const handleEtaUpdated = (data) => {
      if (data.journeyId === activeJourney.id) {
        setActiveJourney((prev) => prev ? { ...prev, expectedArrivalTime: data.newEta, status: 'ACTIVE' } : null);
        setShowDelayModal(false);
      }
    };

    const handleSosActivated = (data) => {
      if (data.journeyId === activeJourney.id || data.userId === user?.id) {
        setActiveJourney((prev) => prev ? { ...prev, status: 'EMERGENCY' } : null);
        setActiveSosIncident(data.sosIncident || data);
      }
    };

    const handleSosCancelled = () => {
      setActiveSosIncident(null);
      setActiveJourney((prev) => prev ? { ...prev, status: 'ACTIVE' } : null);
    };

    socket.on('location_updated', handleLocationUpdate);
    socket.on('journey_delayed', handleJourneyDelayed);
    socket.on('eta_updated', handleEtaUpdated);
    socket.on('sos_activated', handleSosActivated);
    socket.on('sos_cancelled', handleSosCancelled);

    return () => {
      socket.off('location_updated', handleLocationUpdate);
      socket.off('journey_delayed', handleJourneyDelayed);
      socket.off('eta_updated', handleEtaUpdated);
      socket.off('sos_activated', handleSosActivated);
      socket.off('sos_cancelled', handleSosCancelled);
    };
  }, [socket, activeJourney?.id, activeJourney?.trackingToken, user?.id]);

  // Periodic check for overdue ETA on frontend
  useEffect(() => {
    if (!activeJourney || activeJourney.status !== 'ACTIVE') return;

    const checkOverdue = () => {
      const eta = new Date(activeJourney.expectedArrivalTime);
      if (new Date() > eta) {
        setShowDelayModal(true);
      }
    };

    const interval = setInterval(checkOverdue, 15000);
    return () => clearInterval(interval);
  }, [activeJourney]);

  // Send location to server
  const sendLocationToServer = async (coords) => {
    if (!activeJourney?.id) return;
    try {
      await api.post('/locations', {
        journeyId: activeJourney.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        speed: coords.speed,
        heading: coords.heading,
        timestamp: new Date()
      });

      if (socket) {
        socket.emit('send_location_update', {
          journeyId: activeJourney.id,
          trackingToken: activeJourney.trackingToken,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Failed to transmit location update:', err.message);
    }
  };

  // Start continuous location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setTrackingError('Geolocation is not supported by your browser.');
      return;
    }

    setIsTracking(true);
    setTrackingError(null);

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: new Date()
        };
        setCurrentLocation(coords);
        setLocationTrail((prev) => [...prev, coords]);
        sendLocationToServer(coords);
      },
      (err) => {
        console.warn('Geolocation initial error:', err.message);
        setTrackingError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        // Throttle updates to ~15-30s if desired, or push continuous updates
        if (now - lastUpdateRef.current >= 15000) {
          lastUpdateRef.current = now;
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: new Date()
          };
          setCurrentLocation(coords);
          setLocationTrail((prev) => [...prev, coords]);
          sendLocationToServer(coords);
        }
      },
      (err) => {
        setTrackingError(err.message);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
    );
  }, [activeJourney?.id]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Auto start tracking when active journey starts
  useEffect(() => {
    if (activeJourney && ['ACTIVE', 'DELAYED', 'EMERGENCY'].includes(activeJourney.status)) {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [activeJourney?.id, activeJourney?.status, startTracking, stopTracking]);

  // Simulate movement (Crucial for testing without real mobile walking!)
  const simulateStep = () => {
    if (!activeJourney) return;
    const baseLat = currentLocation?.latitude || activeJourney.startLatitude || 28.5355;
    const baseLng = currentLocation?.longitude || activeJourney.startLongitude || 77.3910;
    const destLat = activeJourney.destinationLatitude || 28.6139;
    const destLng = activeJourney.destinationLongitude || 77.2090;

    // Move 10% towards destination + slight natural jitter
    const newLat = baseLat + (destLat - baseLat) * 0.12 + (Math.random() - 0.5) * 0.0005;
    const newLng = baseLng + (destLng - baseLng) * 0.12 + (Math.random() - 0.5) * 0.0005;

    const simulatedCoords = {
      latitude: parseFloat(newLat.toFixed(6)),
      longitude: parseFloat(newLng.toFixed(6)),
      accuracy: 8,
      speed: 28, // km/h
      heading: 45,
      timestamp: new Date()
    };

    setCurrentLocation(simulatedCoords);
    setLocationTrail((prev) => [...prev, simulatedCoords]);
    sendLocationToServer(simulatedCoords);

    addToast({
      type: 'info',
      title: '📍 Location Checkpoint Updated',
      message: `Simulated GPS update broadcasted to family members.`
    });
  };

  // Actions
  const startJourney = async (journeyData) => {
    const res = await api.post('/journeys', journeyData);
    if (res.data.success) {
      setActiveJourney(res.data.journey);
      fetchActiveJourney();
    }
    return res.data;
  };

  const completeJourney = async () => {
    if (!activeJourney?.id) return;
    const res = await api.post(`/journeys/${activeJourney.id}/complete`);
    if (res.data.success) {
      stopTracking();
      setActiveJourney(null);
      setLocationTrail([]);
      setShowDelayModal(false);
      fetchActiveJourney();
    }
    return res.data;
  };

  const cancelJourney = async () => {
    if (!activeJourney?.id) return;
    const res = await api.post(`/journeys/${activeJourney.id}/cancel`);
    if (res.data.success) {
      stopTracking();
      setActiveJourney(null);
      setLocationTrail([]);
      setShowDelayModal(false);
      fetchActiveJourney();
    }
    return res.data;
  };

  const updateEta = async (newEta) => {
    if (!activeJourney?.id) return;
    const res = await api.put(`/journeys/${activeJourney.id}/eta`, { newEta });
    if (res.data.success) {
      setActiveJourney((prev) => prev ? { ...prev, expectedArrivalTime: newEta, status: 'ACTIVE' } : null);
      setShowDelayModal(false);
    }
    return res.data;
  };

  const pauseJourney = async () => {
    if (!activeJourney?.id) return;
    const res = await api.put(`/journeys/${activeJourney.id}/pause`);
    if (res.data.success) {
      setActiveJourney((prev) => prev ? { ...prev, status: 'PAUSED' } : null);
    }
    return res.data;
  };

  const resumeJourney = async () => {
    if (!activeJourney?.id) return;
    const res = await api.put(`/journeys/${activeJourney.id}/resume`);
    if (res.data.success) {
      setActiveJourney((prev) => prev ? { ...prev, status: 'ACTIVE' } : null);
    }
    return res.data;
  };

  const confirmSafe = async (message) => {
    if (!activeJourney?.id) return;
    const res = await api.post(`/journeys/${activeJourney.id}/confirm-safe`, {
      message: message || 'I am safe and on track.',
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude
    });
    if (res.data.success) {
      setShowDelayModal(false);
      setActiveJourney((prev) => prev ? { ...prev, status: 'ACTIVE' } : null);
    }
    return res.data;
  };

  const triggerSOS = async ({ triggerType = 'MANUAL', emergencyPhrase = null } = {}) => {
    const coords = currentLocation || {};
    const res = await api.post('/sos', {
      journeyId: activeJourney?.id || null,
      latitude: coords.latitude || 28.5355,
      longitude: coords.longitude || 77.3910,
      accuracy: coords.accuracy || 15,
      triggerType,
      emergencyPhrase
    });
    if (res.data.success) {
      setActiveSosIncident(res.data.incident);
      setActiveJourney((prev) => prev ? { ...prev, status: 'EMERGENCY' } : null);
      setShowSosModal(false);
    }
    return res.data;
  };

  const cancelSOS = async (incidentId, resolutionNotes) => {
    const res = await api.put(`/sos/${incidentId}/cancel`, { resolutionNotes });
    if (res.data.success) {
      setActiveSosIncident(null);
      setActiveJourney((prev) => prev ? { ...prev, status: 'ACTIVE' } : null);
    }
    return res.data;
  };

  return (
    <JourneyContext.Provider
      value={{
        activeJourney,
        currentLocation,
        locationTrail,
        isTracking,
        trackingError,
        loading,
        showDelayModal,
        setShowDelayModal,
        showSosModal,
        setShowSosModal,
        activeSosIncident,
        fetchActiveJourney,
        startJourney,
        completeJourney,
        cancelJourney,
        updateEta,
        pauseJourney,
        resumeJourney,
        confirmSafe,
        triggerSOS,
        cancelSOS,
        simulateStep,
        startTracking,
        stopTracking
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourney = () => {
  const context = useContext(JourneyContext);
  if (!context) throw new Error('useJourney must be used within a JourneyProvider');
  return context;
};

