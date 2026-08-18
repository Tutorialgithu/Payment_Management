import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@lendingtracker.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('==================================================');
    console.log('[Login Page]: Attempting admin sign in...');
    console.log('[Login Page]: Submitting credentials:', { email, password });

    try {
      const res = await loginAdmin(email, password);
      console.log('[Login Page]: Response from loginAdmin:', res);

      if (res && res.success) {
        console.log('[Login Page]: Authentication successful! Navigating to /dashboard');
        navigate('/dashboard');
      } else {
        console.warn('[Login Page]: Unsuccessful login status:', res);
        setError((res && res.message) || 'Invalid admin credentials');
      }
    } catch (err) {
      console.error('[Login Page Error Catch]:', err);
      console.error('[Login Page Error Detail]:', err?.message || err);
      setError(err?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
      console.log('==================================================');
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotMsg('Password reset instructions have been logged. Please check server logs or contact tech support.');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle Glowing Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl z-10 relative">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">Payment Management & Lending Tracker</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Mobile */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email / Mobile</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lendingtracker.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] font-semibold text-blue-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Remember session</span>
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Access Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-8 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Default Demo Credentials:</span>
            <p>Email: <code className="text-blue-400">admin@lendingtracker.com</code></p>
            <p>Password: <code className="text-blue-400">admin123</code></p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-sm font-bold text-white mb-2">Admin Password Reset</h3>
            <p className="text-xs text-slate-400 mb-4">Enter your registered admin email address to request a reset link.</p>

            {forgotMsg ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-4">
                {forgotMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="admin@lendingtracker.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
