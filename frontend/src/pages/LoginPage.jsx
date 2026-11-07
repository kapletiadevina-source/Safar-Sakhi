import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  KeyRound
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      const role = res.user?.role;
      if (role === 'FAMILY') {
        navigate('/family');
      } else if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo auto-fill helpers
  const fillDemoUser = () => {
    setEmail('priya@safarsakhi.com');
    setPassword('Password@123');
  };

  const fillDemoFamily = () => {
    setEmail('sunita@safarsakhi.com');
    setPassword('Password@123');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@safarsakhi.com');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFFCF8] rounded-3xl p-8 border border-[#EEC5D1] shadow-soft-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F8DDE5] text-[#494354] mx-auto flex items-center justify-center border border-[#EEC5D1] shadow-soft mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#494354]">Welcome Back</h2>
          <p className="text-xs text-[#6B6477] mt-1 font-medium">
            Sign in to access your journeys, family guardian portal, and safety radar.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Continue with Google Authentication */}
        <div>
          <GoogleAuthButton label="Continue with Google" />
          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-[#EEC5D1]/60"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-[#6B6477]">
              Or sign in with email
            </span>
            <div className="flex-grow border-t border-[#EEC5D1]/60"></div>
          </div>
        </div>

        {/* 2. Email Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#494354] mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
              />
              <Mail className="w-4 h-4 text-[#6B6477] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#494354]">Password</label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-bold text-[#494354] hover:text-[#6B6477] underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm text-[#494354] placeholder-[#6B6477]/60 focus:outline-none focus:ring-2 focus:ring-[#F8DDE5] font-medium"
              />
              <Lock className="w-4 h-4 text-[#6B6477] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#494354] hover:bg-[#383340] disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-soft hover:scale-101 active:scale-99 transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo One-Click Login Badges */}
        <div className="pt-4 border-t border-[#EEC5D1]/60">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6477] block text-center mb-2">
            One-Click Test Accounts
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={fillDemoUser}
              className="py-2.5 px-2 bg-[#F8DDE5] hover:bg-[#F2C4CE] text-[#494354] font-bold rounded-xl border border-[#EEC5D1] transition text-center truncate shadow-xs"
              title="Priya Patel (User Traveler)"
            >
              👩 Traveler
            </button>
            <button
              type="button"
              onClick={fillDemoFamily}
              className="py-2.5 px-2 bg-[#E8E0F7] hover:bg-[#D8CCEF] text-[#494354] font-bold rounded-xl border border-[#D2C4EC] transition text-center truncate shadow-xs"
              title="Sunita Patel (Family Guardian)"
            >
              🛡️ Family
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="py-2.5 px-2 bg-[#FFF0BD] hover:bg-[#F5DC96] text-[#494354] font-bold rounded-xl border border-[#EED07C] transition text-center truncate shadow-xs"
              title="Ananya Sharma (Admin)"
            >
              👑 Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-[#6B6477]">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-[#494354] hover:underline">
            Create Safe Account
          </Link>
        </div>
      </div>
    </div>
  );
}
