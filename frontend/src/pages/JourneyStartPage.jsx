import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJourney } from '../context/JourneyContext';
import { useAuth } from '../context/AuthContext';
import LeafletMap from '../components/LeafletMap';
import api from '../services/api';
import {
  MapPin,
  Clock,
  Car,
  Users,
  FileText,
  Navigation,
  Compass,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function JourneyStartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startJourney, activeJourney } = useJourney();

  // Redirect if already on active journey
  useEffect(() => {
    if (activeJourney) {
      navigate('/journey/active');
    }
  }, [activeJourney, navigate]);

  const [startLocation, setStartLocation] = useState('Cyber City, Gurugram');
  const [startCoords, setStartCoords] = useState({ latitude: 28.4950, longitude: 77.0895 });
  const [destination, setDestination] = useState('Indirapuram, Ghaziabad');
  const [destCoords, setDestCoords] = useState({ latitude: 28.6369, longitude: 77.3697 });

  const [journeyType, setJourneyType] = useState('CAB');
  const [etaMinutes, setEtaMinutes] = useState(45);
  const [notes, setNotes] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load contacts and family connections
  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const [contactRes, familyRes] = await Promise.allSettled([
          api.get('/contacts'),
          api.get('/family/connections')
        ]);

        if (contactRes.status === 'fulfilled' && contactRes.value.data.success) {
          const list = contactRes.value.data.contacts || [];
          setContacts(list);
          setSelectedContacts(list.map(c => c.id));
        }

        if (familyRes.status === 'fulfilled' && familyRes.value.data.success) {
          const fList = familyRes.value.data.connections || [];
          setFamilyMembers(fList);
          // By default, select all registered family members that have account or are accepted
          setSelectedFamilyIds(fList.map(f => f.familyMemberId || f.id).filter(Boolean));
        }
      } catch (err) {
        console.error('Failed to load recipients:', err);
      }
    };
    loadRecipients();
  }, []);

  // Use Current GPS
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setStartCoords({ latitude, longitude });
        setStartLocation(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (err) => {
        setIsLocating(false);
        alert(`Could not acquire GPS: ${err.message}. Using default location.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleToggleContact = (id) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(cid => cid !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  const handleToggleFamily = (id) => {
    if (selectedFamilyIds.includes(id)) {
      setSelectedFamilyIds(selectedFamilyIds.filter(fid => fid !== id));
    } else {
      setSelectedFamilyIds([...selectedFamilyIds, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startLocation || !destination) {
      setError('Please provide both a start location and a destination.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const expectedArrivalTime = new Date(now.getTime() + etaMinutes * 60000);

      await startJourney({
        startLocation,
        startLatitude: startCoords.latitude,
        startLongitude: startCoords.longitude,
        destination,
        destinationLatitude: destCoords.latitude,
        destinationLongitude: destCoords.longitude,
        expectedArrivalTime: expectedArrivalTime.toISOString(),
        journeyType,
        notes,
        sharedContactIds: selectedContacts,
        sharedFamilyIds: selectedFamilyIds
      });

      navigate('/journey/active');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start journey. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const journeyTypes = [
    { id: 'CAB', label: 'Cab / Taxi', icon: '🚖' },
    { id: 'AUTO', label: 'Auto Rickshaw', icon: '🛺' },
    { id: 'BUS_METRO', label: 'Metro / Bus', icon: '🚇' },
    { id: 'WALKING', label: 'Walking Alone', icon: '🚶‍♀️' },
    { id: 'PERSONAL_VEHICLE', label: 'Personal Car/Scooter', icon: '🛵' },
    { id: 'NIGHT_COMMUTE', label: 'Late Night Commute', icon: '🌙' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#DCEFFA] text-[#494354] border border-[#C1E3F5] text-xs font-bold mb-2 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#494354]" />
            <span>Smart Journey Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#494354]">
            Start a Safe Journey
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6477] mt-1 font-medium">
            Configure your destination and ETA. Your trusted contacts will be notified in real-time.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Locations Card: Sky Blue Accent (#DCEFFA) */}
          <div className="bg-white rounded-3xl p-6 border border-[#C1E3F5] shadow-soft space-y-4">
            <h3 className="text-xs font-black text-[#494354] uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#494354]" />
              <span>1. Route & Locations</span>
            </h3>

            {/* Starting Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#494354]">Starting Location</label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="text-xs text-[#494354] font-bold hover:underline flex items-center space-x-1"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{isLocating ? 'Detecting GPS...' : 'Use Current GPS'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="e.g. Current Location or Office Address"
                  required
                  className="w-full pl-4 pr-10 py-3 bg-[#FFFCF8] border border-[#C1E3F5] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#7FB6DE] font-medium"
                />
                <div className="absolute right-3.5 top-3.5 w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1.5">
                Destination Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Home, Hostel, Station, Airport"
                  required
                  className="w-full pl-4 pr-10 py-3 bg-[#FFFCF8] border border-[#C1E3F5] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#7FB6DE] font-medium"
                />
                <div className="absolute right-3.5 top-3.5 w-3 h-3 rounded-full bg-[#DC2626]"></div>
              </div>
            </div>
          </div>

          {/* 2. Journey Type & ETA Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#F8DDE5] shadow-soft space-y-4">
            <h3 className="text-xs font-black text-[#494354] uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#494354]" />
              <span>2. Mode & Estimated Duration</span>
            </h3>

            {/* Journey Mode Selection */}
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-2">Select Transport Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {journeyTypes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setJourneyType(mode.id)}
                    className={`p-3 rounded-2xl text-xs font-bold flex items-center space-x-2.5 transition border ${
                      journeyType === mode.id
                        ? 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1] shadow-xs'
                        : 'bg-[#FFFCF8] hover:bg-[#FFF0BD]/40 border-[#EEC5D1]/50 text-[#6B6477]'
                    }`}
                  >
                    <span className="text-lg">{mode.icon}</span>
                    <span className="truncate">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Expected Duration (ETA) */}
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-2">
                Expected Travel Time: <span className="font-black text-[#494354]">{etaMinutes} Minutes</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[15, 30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEtaMinutes(mins)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                      etaMinutes === mins
                        ? 'bg-[#F8DDE5] text-[#494354] border-[#EEC5D1]'
                        : 'bg-[#FFFCF8] hover:bg-[#F8DDE5]/30 border-[#EEC5D1] text-[#6B6477]'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="5"
                max="180"
                step="5"
                value={etaMinutes}
                onChange={(e) => setEtaMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-[#494354] cursor-pointer"
              />
              <span className="text-[11px] text-[#8E869B] block mt-1">
                Estimated arrival at ~{new Date(Date.now() + etaMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
              </span>
            </div>
          </div>

          {/* 3. Trusted Contacts & Notes Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#F8DDE5] shadow-soft space-y-4">
            <h3 className="text-xs font-black text-[#494354] uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#494354]" />
              <span>3. Family Notifications & Notes</span>
            </h3>

            {/* Family Members with App Accounts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#494354]">
                  Registered Family Guardians (Live Radar on Family Dashboard)
                </label>
                <span className="text-[10px] text-[#494354] font-semibold bg-[#E8E0F7] px-2 py-0.5 rounded-full border border-[#D6C8EE]">
                  {familyMembers.length} connected
                </span>
              </div>
              {familyMembers.length === 0 ? (
                <div className="p-3 bg-[#E8E0F7]/40 border border-[#D6C8EE] rounded-2xl text-[#6B6477] text-xs flex items-center justify-between">
                  <span>No family guardians connected yet. They can connect via your email or invite link.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {familyMembers.map((f) => {
                    const id = f.familyMemberId || f.id;
                    const isChecked = selectedFamilyIds.includes(id);
                    return (
                      <label
                        key={f.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-[#E8E0F7]/60 border-[#D6C8EE] text-[#494354]'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-[#6B6477]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFamily(id)}
                            className="w-4 h-4 accent-[#494354] rounded"
                          />
                          <div>
                            <span className="text-xs font-bold block text-[#494354]">{f.name || f.familyMember?.fullName || f.email}</span>
                            <span className="text-[11px] text-[#8E869B]">
                              {f.relationship} • {f.email || f.familyMember?.email}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8E0F7] text-[#494354] border border-[#D6C8EE]">
                          Family Member
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Emergency Contacts */}
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-2">
                Emergency Contacts (SMS & Call Alerts)
              </label>
              {contacts.length === 0 ? (
                <div className="p-3 bg-[#FFF0BD]/50 border border-[#F5DC96] rounded-2xl text-[#494354] text-xs">
                  No emergency contacts added yet. You can add them in the Contacts tab.
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                        selectedContacts.includes(c.id)
                          ? 'bg-[#F8DDE5]/60 border-[#EEC5D1] text-[#494354]'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-[#6B6477]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(c.id)}
                          onChange={() => handleToggleContact(c.id)}
                          className="w-4 h-4 accent-[#494354] rounded"
                        />
                        <div>
                          <span className="text-xs font-bold block text-[#494354]">{c.name}</span>
                          <span className="text-[11px] text-[#8E869B]">{c.relationship} • {c.phoneNumber}</span>
                        </div>
                      </div>
                      {c.isPrimary && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1]">
                          Primary
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Ride Notes */}
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1.5">
                Ride Details / Vehicle Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Uber DL 1Y 9823 (Driver Ramesh) or White Honda Activa"
                className="w-full px-4 py-2.5 bg-[#FFFCF8] border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#D98A9F]"
              />
            </div>
          </div>
        </div>

        {/* Right Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Map Preview */}
          <div className="bg-white rounded-3xl p-5 border border-[#C1E3F5] shadow-soft">
            <h4 className="text-xs font-black text-[#494354] uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-[#494354]" />
              <span>Interactive Route Preview</span>
            </h4>

            <LeafletMap
              currentLocation={startCoords}
              startPoint={{ ...startCoords, label: startLocation }}
              destinationPoint={{ ...destCoords, label: destination }}
              height="280px"
            />

            <div className="mt-3 p-3.5 bg-[#DCEFFA]/40 rounded-2xl border border-[#C1E3F5] text-[11px] text-[#6B6477] leading-relaxed">
              💡 <b>Privacy Guarantee:</b> Location tracking only starts upon your explicit confirmation and automatically stops when you tap "Complete Journey" or "Cancel".
            </div>
          </div>

          {/* Start Button Hero Box: Baby Pink (#F8DDE5) */}
          <div className="bg-[#F8DDE5] border border-[#EEC5D1] rounded-3xl p-6 text-[#494354] shadow-soft space-y-4">
            <h4 className="text-base font-black flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#494354]" />
              <span>Ready for Departure?</span>
            </h4>
            <p className="text-xs text-[#6B6477] leading-relaxed font-medium">
              Once you start, Safar Sakhi begins monitoring your ETA, alerts your family via live link, and keeps the AI companion available.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#494354] hover:bg-[#383340] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-102 active:scale-98 transition flex items-center justify-center space-x-2"
            >
              <Navigation className="w-4 h-4 text-white" />
              <span>{isSubmitting ? 'Starting Journey...' : 'Start Active Journey Now'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

