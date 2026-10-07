import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';
import { ConfigModal } from '../common/ConfigModal';
import { LogIn, UserPlus, Database, ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, enableDemoMode, isConfigured } = useAuth();
  const { showToast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          setErrorMsg(error.message);
          showToast(error.message, 'error');
        } else {
          showToast('Account created successfully! Welcome to Jefextech.', 'success');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
          showToast(error.message, 'error');
        } else {
          showToast('Welcome back! Logged in successfully.', 'success');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2F80FF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#00C896]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#111A2E] border border-[#1E2B45] shadow-xl shadow-black/40 mb-4 relative group">
            <div className="absolute inset-0 rounded-2xl bg-[#2F80FF]/20 blur-md group-hover:bg-[#2F80FF]/30 transition-all" />
            <TrendingUp className="w-7 h-7 text-[#2F80FF] relative z-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Jefextech Trading Journal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Precision FX & Crypto execution analytics
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111A2E] border border-[#1E2B45] rounded-xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#0B1220] border border-[#1E2B45] rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                !isSignUp
                  ? 'bg-[#16223B] text-white shadow-sm border border-[#2F80FF]/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                isSignUp
                  ? 'bg-[#16223B] text-white shadow-sm border border-[#2F80FF]/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-[#FF4D5E]/10 border border-[#FF4D5E]/30 text-[#FF4D5E] text-xs leading-relaxed animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@domain.com"
                autoComplete="email"
                required
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] focus:ring-1 focus:ring-[#2F80FF] text-white px-3.5 py-2.5 rounded-lg text-sm placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex justify-between">
                <span>Password</span>
                <span className="text-[11px] text-slate-500">Min 6 characters</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] focus:ring-1 focus:ring-[#2F80FF] text-white px-3.5 py-2.5 rounded-lg text-sm placeholder:text-slate-600 outline-none transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#2F80FF] hover:bg-[#2F80FF]/90 text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#2F80FF]/25 hover:shadow-[#2F80FF]/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Trader Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Journal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Mode fallback */}
          <div className="mt-5 pt-5 border-t border-[#1E2B45]/80 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={enableDemoMode}
              className="w-full py-2.5 px-4 bg-[#16223B] hover:bg-[#1C2A48] border border-[#1E2B45] text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00C896]" />
              <span>Explore Instant Demo Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className="w-full py-2 px-3 text-[11px] text-slate-400 hover:text-[#2F80FF] transition-colors flex items-center justify-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Configure Supabase Keys & SQL Tables</span>
            </button>
          </div>
        </div>

        {/* Supabase status indicator footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
          <span>Connected to Supabase: tqqttaswtuwqflbtbwmd</span>
        </div>
      </div>

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSaved={() => {
          showToast('Credentials updated.', 'success');
        }}
      />
    </div>
  );
};
