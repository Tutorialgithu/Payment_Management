import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import img from '../assets/acgback.png';

const TARGET_EMAIL = 'adarshchoudhary835@gmail.com';

const Login = () => {
  const { sendOtpAdmin, verifyOtpAdmin } = useAuth();
  const navigate = useNavigate();

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await sendOtpAdmin(TARGET_EMAIL);
      if (res && res.success) {
        setOtpSent(true);
        setSuccessMsg(res.message || `OTP sent to registered Admin Email.`);
        setResendTimer(30);
      } else {
        setError(res?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('[Login OTP Send Error]:', err);
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter valid 6-digit OTP code.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await verifyOtpAdmin(otp.trim(), TARGET_EMAIL);
      if (res && res.success) {
        navigate('/dashboard');
      } else {
        setError(res?.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      console.error('[Login OTP Verify Error]:', err);
      setError(err?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle Glowing Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl z-10 relative">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div className="w-48 mx-auto mb-4 flex items-center rounded-2xl justify-center shadow-lg shadow-blue-600/30">
            <img src={img} className="w-full" alt="ACG Group Logo" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">Payment Management & Lending Tracker</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {!otpSent ? (
          /* Step 1: Send OTP Button (No email input shown) */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
              <KeyRound className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs text-slate-300 font-medium">
                Click below to send a secure sign-in OTP to your registered Admin Email.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Sending OTP...</span>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Step 2: Verify OTP Input & Submit */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                Enter 6-Digit OTP Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-mono font-bold text-white tracking-[0.4em] placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying OTP...</span>
              ) : (
                <>
                  <span>Verify & Access Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend & Reset Actions */}
            <div className="flex items-center justify-between pt-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                ← Back
              </button>

              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={handleSendOtp}
                className={`flex items-center gap-1.5 font-semibold ${resendTimer > 0 || loading
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-blue-400 hover:underline'
                  }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Security Info Badge */}
        <div className="mt-8 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Secure Email Authentication</span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              OTP codes are valid for 10 minutes and sent securely to your registered admin email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
