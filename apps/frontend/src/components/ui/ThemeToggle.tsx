"use client";

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-xl bg-white dark:bg-[#1e1e1e] shadow-lg hover:shadow-xl transition-all border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 text-gray-600 dark:text-gray-300 hover:border-[#c41e3a] dark:hover:border-[#e84855] z-50"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
