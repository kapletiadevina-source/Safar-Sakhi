import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError('Could not process password recovery request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFFCF8] rounded-3xl p-8 border border-[#EEC5D1] shadow-soft-lg space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F8DDE5] text-[#494354] mx-auto flex items-center justify-center border border-[#EEC5D1] shadow-soft mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#494354]">Password Recovery</h2>
          <p className="text-xs text-[#6B6477] mt-1 font-medium">
            Enter your registered email to receive a secure recovery verification link.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="p-5 bg-[#FFF0BD]/50 border border-[#F5DC96] text-[#494354] rounded-2xl text-xs space-y-2 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-[#494354]">Recovery Link Dispatched</h4>
            <p className="leading-relaxed text-[#6B6477]">
              If an account is associated with <b>{email}</b>, an email has been dispatched with reset instructions.
            </p>
            <div className="pt-3">
              <Link
                to="/login"
                className="inline-block px-5 py-2.5 bg-[#494354] text-white rounded-xl font-bold shadow-soft hover:bg-[#383340] transition"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#494354] hover:bg-[#383340] disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-soft transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Sending...' : 'Send Recovery Email'}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-xs font-bold text-[#494354] hover:text-[#6B6477] inline-flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Log In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
