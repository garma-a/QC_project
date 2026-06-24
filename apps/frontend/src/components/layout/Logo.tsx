import React from 'react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className} group cursor-pointer`}>
      <style>{`
        @keyframes pulse-ekg {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: -100; }
        }
        @keyframes heart-beat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.05); }
          30% { transform: scale(1); }
          45% { transform: scale(1.05); }
        }
        .animate-ekg {
          stroke-dasharray: 100;
          animation: pulse-ekg 2s linear infinite;
        }
        .animate-heart {
          transform-origin: center;
          animation: heart-beat 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="relative flex-shrink-0 w-12 h-12">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-xl animate-heart">
          <defs>
            <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c41e3a" />
              <stop offset="100%" stopColor="#8b1e3f" />
            </linearGradient>
            <linearGradient id="ekgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffd700" />
            </linearGradient>
            <filter id="glowHeart">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Animated Heart Background Outline */}
          <path
            d="M50 85 C50 85 15 55 15 30 C15 15 30 5 45 15 C50 20 50 20 50 20 C50 20 50 20 55 15 C70 5 85 15 85 30 C85 55 50 85 50 85 Z"
            fill="url(#heartGrad)"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.2"
            filter="url(#glowHeart)"
          />
          
          {/* Animated EKG Line */}
          <path
            d="M 15 45 L 35 45 L 42 25 L 52 75 L 60 40 L 65 45 L 85 45"
            fill="none"
            stroke="url(#ekgGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ekg"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-tight pt-1">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#ff99a8] font-black text-xl tracking-tighter drop-shadow-sm">
          MAGDI YACOUB
        </span>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[#003366] dark:text-[#4a90e2] text-xs font-bold tracking-[0.2em] uppercase">
            Heart Center
          </span>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-[#b8860b] via-[#ffd700] to-transparent my-1" />
        <span className="text-[#b8860b] dark:text-[#ffd700] text-[10px] font-bold tracking-widest">
          LABORATORY QC
        </span>
      </div>
    </div>
  );
}

export function LogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative flex-shrink-0 w-10 h-10 group cursor-pointer">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-md transition-transform group-hover:scale-110 duration-300">
          <defs>
            <linearGradient id="heartGradSm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c41e3a" />
              <stop offset="100%" stopColor="#8b1e3f" />
            </linearGradient>
            <linearGradient id="ekgGradSm" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffd700" />
            </linearGradient>
          </defs>
          
          <path
            d="M50 85 C50 85 15 55 15 30 C15 15 30 5 45 15 C50 20 50 20 50 20 C50 20 50 20 55 15 C70 5 85 15 85 30 C85 55 50 85 50 85 Z"
            fill="url(#heartGradSm)"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.2"
          />
          
          <path
            d="M 15 45 L 35 45 L 42 25 L 52 75 L 60 40 L 65 45 L 85 45"
            fill="none"
            stroke="url(#ekgGradSm)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
