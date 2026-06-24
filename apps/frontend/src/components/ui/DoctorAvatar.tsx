import React from 'react';

export function DoctorAvatar({ className = '', seed = '' }: { className?: string, seed?: string }) {
  // We can use a deterministic color based on seed, but for now just use a premium static SVG that looks like a doctor
  return (
    <div className={`relative ${className} bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex items-end justify-center`}>
      <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-slate-400 dark:text-slate-500">
        {/* Shoulders / Lab Coat */}
        <path d="M20 100 C20 70, 35 60, 50 60 C65 60, 80 70, 80 100 Z" fill="currentColor" />
        
        {/* Head */}
        <circle cx="50" cy="35" r="18" fill="#ffd1b3" />
        <circle cx="50" cy="35" r="18" fill="currentColor" opacity="0.4" className="dark:hidden" />

        {/* Stethoscope around neck */}
        <path d="M35 65 C35 80, 65 80, 65 65" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-slate-900" />
        <circle cx="65" cy="65" r="2.5" fill="#333" className="dark:fill-slate-900" />
        
        {/* Inner Shirt */}
        <path d="M42 60 L50 72 L58 60 Z" fill="#4a90e2" />
      </svg>
    </div>
  );
}
