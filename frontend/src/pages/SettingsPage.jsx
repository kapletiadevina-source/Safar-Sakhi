import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  User,
  Shield,
  Bell,
  Mic,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  LogOut,
  MapPin,
  Heart
} from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, updateSettings, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatar, setAvatar] = useState(user?.profile?.avatar || '');
  const [bloodGroup, setBloodGroup] = useState(user?.profile?.bloodGroup || 'B+');
  const [emergencyNotes, setEmergencyNotes] = useState(user?.profile?.emergencyNotes || '');
  const [homeAddress, setHomeAddress] = useState(user?.profile?.homeAddress || '');

  // Safety & Voice Settings
  const [emergencyPhrase, setEmergencyPhrase] = useState(user?.settings?.emergencyPhrase || 'Sakhi Help');
  const [voiceTriggerEnabled, setVoiceTriggerEnabled] = useState(user?.settings?.voiceTriggerEnabled ?? true);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(user?.settings?.voiceFeedbackEnabled ?? true);
  const [delayGracePeriodMinutes, setDelayGracePeriodMinutes] = useState(user?.settings?.delayGracePeriodMinutes || 5);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateProfile({
        fullName,
        phoneNumber,
        avatar,
        bloodGroup,
        emergencyNotes,
        homeAddress
      });

      await updateSettings({
        emergencyPhrase,
        voiceTriggerEnabled,
        voiceFeedbackEnabled,
        delayGracePeriodMinutes: parseInt(delayGracePeriodMinutes, 10)
      });

      setSuccessMsg('Your profile and safety preferences were updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] text-xs font-bold mb-2">
            <Settings className="w-4 h-4 text-[#494354]" />
            <span>Preferences & Identity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#494354]">
            Account Settings & Privacy
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6477] mt-1 font-medium">
            Manage your personal profile, medical emergency details, voice activation phrase, and privacy rules.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-soft">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-soft">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* 1. Personal & Medical Profile */}
        <div className="bg-[#FFFCF8] rounded-3xl p-6 border border-[#EEC5D1] shadow-soft space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#494354] flex items-center space-x-2">
            <User className="w-4 h-4 text-[#494354]" />
            <span>1. Profile & Emergency Medical Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">Mobile Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">Profile Avatar URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#494354] mb-1">Saved Home Address</label>
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="e.g. Indirapuram, Ghaziabad"
                className="w-full px-3.5 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#494354] mb-1">
                Emergency Notes / Medical Allergies
              </label>
              <textarea
                rows={2}
                value={emergencyNotes}
                onChange={(e) => setEmergencyNotes(e.target.value)}
                placeholder="e.g. Asthmatic, carries inhaler. Speaks Hindi and English."
                className="w-full px-3.5 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5]"
              />
              <span className="text-[11px] text-[#6B6477] block mt-1">
                This information is shared with trusted contacts during an emergency SOS activation.
              </span>
            </div>
          </div>
        </div>

        {/* 2. Voice Companion & Emergency Trigger Settings - Lavender Card */}
        <div className="bg-[#E8E0F7] rounded-3xl p-6 border-2 border-[#D2C4EC] shadow-soft space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#494354] flex items-center space-x-2">
            <Mic className="w-4 h-4 text-[#494354]" />
            <span>2. Voice-Triggered SOS & Companion Controls</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">
                Emergency Voice Phrase
              </label>
              <input
                type="text"
                value={emergencyPhrase}
                onChange={(e) => setEmergencyPhrase(e.target.value)}
                placeholder="e.g. Sakhi Help"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#D2C4EC] rounded-xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#E8E0F7] font-bold"
              />
              <span className="text-[11px] text-[#6B6477] block mt-1 font-medium">
                Speaking this phrase while voice listening is enabled triggers the SOS emergency workflow immediately.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <label className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-[#D2C4EC] flex-1 cursor-pointer shadow-xs">
                <input
                  type="checkbox"
                  checked={voiceTriggerEnabled}
                  onChange={(e) => setVoiceTriggerEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#494354] rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#494354] block">Voice Emergency Trigger</span>
                  <span className="text-[11px] text-[#6B6477]">Enable microphone phrase detection</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-[#D2C4EC] flex-1 cursor-pointer shadow-xs">
                <input
                  type="checkbox"
                  checked={voiceFeedbackEnabled}
                  onChange={(e) => setVoiceFeedbackEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#494354] rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#494354] block">Spoken AI Feedback</span>
                  <span className="text-[11px] text-[#6B6477]">Sakhi speaks replies aloud via TTS</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 3. Journey Delay & Privacy Settings */}
        <div className="bg-[#FFFCF8] rounded-3xl p-6 border border-[#EEC5D1] shadow-soft space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#494354] flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#494354]" />
            <span>3. Smart Delay & Location Privacy</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">
                Delay Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={delayGracePeriodMinutes}
                onChange={(e) => setDelayGracePeriodMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#F8DDE5]"
              />
              <span className="text-[11px] text-[#6B6477] block mt-1">
                Time after ETA before triggering the "Are You Safe?" delay prompt.
              </span>
            </div>

            <div className="p-4 bg-[#FFF0BD]/60 rounded-2xl border border-[#F5DC96] text-xs text-[#494354] leading-relaxed">
              <span className="font-bold block mb-1">🔒 Strict Privacy Policy:</span>
              Your GPS coordinates are never tracked without your explicit activation. Sharing automatically ceases the instant you complete or cancel a journey.
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-[#494354] hover:bg-[#383340] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-soft hover:scale-102 active:scale-98 transition flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
