"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginAccount } from '@/lib/actions';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserResponseDto } from '@/lib/types/api';

export function LoginForm({ isMockMode }: { isMockMode?: boolean }) {
  const [email, setEmail] = useState(isMockMode ? 'admin@qc.local' : '');
  const [password, setPassword] = useState(isMockMode ? 'password123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsPending(true);
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await loginAccount(formData);

    setIsPending(false);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success && result.token && result.user) {
      setAuth(result.user as UserResponseDto, result.token);
      router.replace('/dashboard');
    }
  };

  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20 border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 flex items-start gap-3 relative z-10">
          <AlertCircle size={20} className="text-[#c41e3a] dark:text-[#e84855] flex-shrink-0 mt-0.5" />
          <p className="text-[#c41e3a] dark:text-[#e84855] text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div>
          <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-2 text-sm font-semibold">
            Email
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60">
              <Mail size={20} />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isPending}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold">
              Password
            </label>
            <a
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="text-xs text-[#c41e3a] dark:text-[#e84855] font-medium hover:underline"
            >
              Forgot Password?
            </a>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60">
              <Lock size={20} />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isPending}
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl hover:shadow-[#c41e3a]/30 dark:hover:shadow-[#e84855]/30 flex items-center justify-center gap-2 font-bold text-base ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50 disabled:opacity-70"
        >
          <Lock size={18} />
          {isPending ? 'Signing In...' : 'Sign In to MYGHC Lab'}
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
          <div className="relative flex justify-center"><span className="bg-white dark:bg-[#1e1e1e] px-3 text-xs text-gray-400 dark:text-gray-500">New staff member?</span></div>
        </div>

        <a
          href="/signup"
          className="w-full py-3 rounded-xl border-2 border-[#003366]/40 dark:border-[#4a90e2]/40 text-[#003366] dark:text-[#4a90e2] hover:bg-[#003366]/5 dark:hover:bg-[#4a90e2]/10 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
        >
          Register with your work email
        </a>
      </form>
    </>
  );
}
