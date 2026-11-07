import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import {
  ShieldCheck,
  User,
  Users,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  MapPin,
  Heart
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState('USER'); // 'USER' | 'FAMILY'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await register({
        fullName,
        email,
        phoneNumber,
        password,
        confirmPassword,
        role,
        homeAddress,
        emergencyNotes: emergencyNotes || (role === 'FAMILY' ? 'Family Member Guardian' : '')
      });

      if (role === 'FAMILY' || res.user?.role === 'FAMILY') {
        navigate('/family');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#FFFCF8] rounded-3xl p-8 border border-[#EEC5D1] shadow-soft-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F8DDE5] text-[#494354] mx-auto flex items-center justify-center border border-[#EEC5D1] shadow-soft mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#494354]">Join Safar Sakhi</h2>
          <p className="text-xs text-[#6B6477] mt-1 font-medium">
            "Your Safety, Our Responsibility." Choose your account role to begin.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Account Role Selector */}
        <div>
          <label className="block text-xs font-bold text-[#494354] mb-2">
            Select Your Account Type:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('USER')}
              className={`p-3.5 rounded-2xl border transition text-left flex flex-col justify-between ${
                role === 'USER'
                  ? 'bg-[#F8DDE5] border-[#494354] ring-2 ring-[#EEC5D1] shadow-sm'
                  : 'bg-white hover:bg-[#F8DDE5]/30 border-[#EEC5D1]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">👩</span>
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  role === 'USER' ? 'border-[#494354] bg-[#494354]' : 'border-[#EEC5D1]'
                }`}>
                  {role === 'USER' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </span>
              </div>
              <div>
                <span className="text-xs font-black text-[#494354] block">Traveler Account</span>
                <span className="text-[10px] text-[#6B6477]">I travel & share live journeys</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('FAMILY')}
              className={`p-3.5 rounded-2xl border transition text-left flex flex-col justify-between ${
                role === 'FAMILY'
                  ? 'bg-[#E8E0F7] border-[#494354] ring-2 ring-[#D2C4EC] shadow-sm'
                  : 'bg-white hover:bg-[#E8E0F7]/30 border-[#EEC5D1]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">🛡️</span>
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  role === 'FAMILY' ? 'border-[#494354] bg-[#494354]' : 'border-[#EEC5D1]'
                }`}>
                  {role === 'FAMILY' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </span>
              </div>
              <div>
                <span className="text-xs font-black text-[#494354] block">Family Member</span>
                <span className="text-[10px] text-[#6B6477]">I monitor traveler loved ones</span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Google OAuth Integration */}
        <div>
          <GoogleAuthButton
            role={role}
            label={`Sign up with Google as ${role === 'FAMILY' ? 'Family Member' : 'Traveler'}`}
          />
          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-[#EEC5D1]/60"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-[#6B6477]">
              Or register with email
            </span>
            <div className="flex-grow border-t border-[#EEC5D1]/60"></div>
          </div>
        </div>

        {/* 3. Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'FAMILY' ? 'e.g. Sunita Patel (Mother)' : 'e.g. Priya Sharma'}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
                />
                <User className="w-4 h-4 text-[#6B6477] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">Mobile Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
                />
                <Phone className="w-4 h-4 text-[#6B6477] absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#494354] mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
              />
              <Mail className="w-4 h-4 text-[#6B6477] absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
                />
                <Lock className="w-4 h-4 text-[#6B6477] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
                />
                <Lock className="w-4 h-4 text-[#6B6477] absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#494354] mb-1">Address (Optional)</label>
            <div className="relative">
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="e.g. Sector 62, Noida"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
              />
              <MapPin className="w-4 h-4 text-[#6B6477] absolute left-3.5 top-3" />
            </div>
          </div>

          {role === 'USER' && (
            <div>
              <label className="block text-xs font-bold text-[#494354] mb-1">
                Emergency Medical / Contact Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={emergencyNotes}
                onChange={(e) => setEmergencyNotes(e.target.value)}
                placeholder="e.g. Blood group B+, Asthmatic. Speaks Hindi and English."
                className="w-full px-3.5 py-2 bg-white border border-[#EEC5D1] rounded-xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#494354] hover:bg-[#383340] disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-soft hover:scale-101 active:scale-99 transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Registering...' : `Create ${role === 'FAMILY' ? 'Family Member' : 'Traveler'} Account`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[#6B6477]">
          Already registered on Safar Sakhi?{' '}
          <Link to="/login" className="font-bold text-[#494354] hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
