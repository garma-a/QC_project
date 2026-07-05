"use client";

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  forgotPasswordAction,
  verifyResetOtpAction,
  resetPasswordAction,
} from '@/lib/actions';

type Step = 'enter-email' | 'verify-otp' | 'set-password';

const STEP_LABELS: Record<Step, string> = {
  'enter-email': 'Enter Email',
  'verify-otp': 'Verify OTP',
  'set-password': 'New Password',
};

const STEP_ORDER: Step[] = ['enter-email', 'verify-otp', 'set-password'];

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>('enter-email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer: decrements by 1 every second while cooldown > 0
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-fill email from URL if user came from the login page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  const router = useRouter();

  const currentStepIndex = STEP_ORDER.indexOf(step);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsPending(true);

    const result = await forgotPasswordAction(email);
    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccessMsg(result.message ?? 'OTP sent!');
      setResendCooldown(45);
      setStep('verify-otp');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsPending(true);

    const result = await verifyResetOtpAction(email, otp);
    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccessMsg(result.message ?? 'OTP verified!');
      setStep('set-password');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsPending(true);
    const result = await resetPasswordAction(email, newPassword);
    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccessMsg('Password updated! Redirecting to login...');
      setTimeout(() => router.replace('/login'), 2000);
    }
  };

  const resendOtp = async () => {
    setError('');
    setSuccessMsg('');
    setIsPending(true);
    const result = await forgotPasswordAction(email);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccessMsg('A new OTP has been sent.');
      setResendCooldown(45);
    }
  };

  return (
    <>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-10 relative z-10 w-full px-4">
        {STEP_ORDER.map((s, i) => (
          <Fragment key={s}>
            <div className="flex flex-col items-center relative group">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10 ${
                  i < currentStepIndex
                    ? 'bg-[#003366] dark:bg-[#4a90e2] text-white'
                    : i === currentStepIndex
                    ? 'bg-[#c41e3a] dark:bg-[#e84855] text-white ring-4 ring-[#c41e3a]/20 dark:ring-[#e84855]/20'
                    : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-500'
                }`}
              >
                {i < currentStepIndex ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`absolute top-10 text-[10px] font-medium whitespace-nowrap transition-colors duration-300 ${
                i === currentStepIndex ? 'text-[#c41e3a] dark:text-[#e84855]' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < STEP_ORDER.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                i < currentStepIndex ? 'bg-[#003366] dark:bg-[#4a90e2]' : 'bg-gray-200 dark:bg-[#2a2a2a]'
              }`} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Error / success messages */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20 border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 flex items-start gap-3 relative z-10">
          <AlertCircle size={18} className="text-[#c41e3a] dark:text-[#e84855] flex-shrink-0 mt-0.5" />
          <p className="text-[#c41e3a] dark:text-[#e84855] text-sm font-medium">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700/50 flex items-start gap-3 relative z-10">
          <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 dark:text-green-300 text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* ── Step 1: Enter Email ── */}
      {step === 'enter-email' && (
        <form onSubmit={handleRequestOtp} className="space-y-5 relative z-10">
          <div>
            <label htmlFor="reset-email" className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-semibold">
              Registered Email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60">
                <Mail size={20} />
              </div>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Enter your registered email"
                autoComplete="email"
                disabled={isPending}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              We&apos;ll send a one-time code to your email if it&apos;s registered.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || !email}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-bold text-base disabled:opacity-70"
          >
            {isPending ? 'Sending OTP...' : (
              <>
                Send Reset OTP <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Remember your password?{' '}
            <a href="/login" className="text-[#c41e3a] dark:text-[#e84855] font-semibold hover:underline">
              Sign In
            </a>
          </p>
        </form>
      )}

      {/* ── Step 2: Verify OTP ── */}
      {step === 'verify-otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-5 relative z-10">
          <div className="bg-blue-50 dark:bg-[#1a2a3a] border border-blue-200 dark:border-[#2a4a6a] rounded-xl p-4 text-sm text-blue-700 dark:text-[#7fb3e8] mb-2">
            We sent a 6-digit OTP to <strong>{email}</strong>. Check your inbox (and spam folder).
          </div>

          <div>
            <label htmlFor="reset-otp" className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-semibold">
              6-Digit OTP
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60">
                <KeyRound size={20} />
              </div>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent transition-all text-center text-2xl font-mono tracking-[12px] placeholder:text-gray-400 placeholder:tracking-normal"
                placeholder="••••••"
                disabled={isPending}
                autoComplete="one-time-code"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || otp.length !== 6}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-bold text-base disabled:opacity-70"
          >
            {isPending ? 'Verifying...' : (
              <>
                Verify OTP <ArrowRight size={18} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resendOtp}
            disabled={isPending || resendCooldown > 0}
            className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-[#c41e3a] dark:hover:text-[#e84855] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400"
          >
            <RotateCcw size={14} />
            {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
          </button>
        </form>
      )}

      {/* ── Step 3: Set New Password ── */}
      {step === 'set-password' && (
        <form onSubmit={handleResetPassword} className="space-y-4 relative z-10">
          <div>
            <label htmlFor="new-password" className="block text-gray-700 dark:text-gray-300 mb-1.5 text-sm font-semibold">
              New Password <span className="text-gray-400 font-normal">(min. 8 characters)</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60">
                <Lock size={18} />
              </div>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Create a strong password"
                disabled={isPending}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="block text-gray-700 dark:text-gray-300 mb-1.5 text-sm font-semibold">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60">
                <Lock size={18} />
              </div>
              <input
                id="confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Repeat your new password"
                disabled={isPending}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !newPassword || !confirmPassword}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-bold text-base ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50 disabled:opacity-70"
          >
            <Lock size={18} />
            {isPending ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      )}
    </>
  );
}
