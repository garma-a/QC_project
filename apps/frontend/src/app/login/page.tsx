import { Heart } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Auth redirects are handled by middleware.ts — no need for cookies() here.

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#fff8f0] to-[#fef3e2] dark:from-[#121212] dark:via-[#1a1a1a] dark:to-[#1e1e1e] flex items-center justify-center p-4 transition-colors duration-300 myc-pattern relative overflow-hidden">
      {/* Decorative background elements - Magdi Yacoub colors */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#c41e3a] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#b8860b] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#003366] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Floating hearts decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10">
        <Heart className="absolute top-10 right-1/4 text-[#c41e3a] dark:text-[#e84855]" size={40} fill="currentColor" />
        <Heart className="absolute bottom-20 left-1/4 text-[#c41e3a] dark:text-[#e84855]" size={60} fill="currentColor" />
        <Heart className="absolute top-1/3 left-10 text-[#b8860b] dark:text-[#ffd700]" size={30} fill="currentColor" />
      </div>

      {/* Theme Toggle - Top Right */}
      <ThemeToggle />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-[#b8860b]/20 dark:bg-[#ffd700]/20 rounded-full blur-2xl" />
            <Logo className="relative" />
          </div>
          <h1 className="text-gray-900 dark:text-white mb-2 text-2xl sm:text-3xl font-bold">
            Laboratory Quality Control
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Aswan Branch - QC Management System
          </p>

          {/* Decorative line */}
          <div className="mt-4 h-1 w-32 mx-auto bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full" />
        </div>

        {/* Login Card - Magdi Yacoub Branded */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-6 sm:p-8 transition-colors duration-300 relative overflow-hidden">
          {/* Card header decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#b8860b]/10 to-transparent dark:from-[#ffd700]/10 rounded-bl-full" />

          <h2 className="text-gray-900 dark:text-white mb-6 text-center text-xl font-bold relative z-10">
            Welcome Back
          </h2>

          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-600 dark:text-gray-400">
          <p>© 2025 Magdi Yacoub Heart Center • Aswan Branch</p>
          <p className="mt-1 text-[#b8860b] dark:text-[#ffd700]">Laboratory Quality Control System</p>
        </div>
      </div>
    </div>
  );
}
