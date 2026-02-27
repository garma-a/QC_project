import { Heart } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Magdi Yacoub Heart Icon - Red/Burgundy Heart */}
        <div className="relative">
          <Heart 
            className="text-[#c41e3a] dark:text-[#e84855]" 
            size={40} 
            fill="currentColor"
            strokeWidth={2}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Medical Cross inside heart */}
            <div className="relative">
              <div className="w-4 h-0.5 bg-white" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-white" />
            </div>
          </div>
          {/* Gold accent pulse */}
          <div className="absolute -inset-1 bg-[#b8860b] dark:bg-[#ffd700] rounded-full opacity-20 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[#c41e3a] dark:text-[#e84855] font-bold text-xl tracking-tight">
          MAGDI YACOUB
        </span>
        <span className="text-[#003366] dark:text-[#4a90e2] text-sm font-bold tracking-wide">
          HEART CENTER
        </span>
        <span className="text-[#b8860b] dark:text-[#ffd700] text-xs font-semibold">
          Aswan Branch • Laboratory QC
        </span>
      </div>
    </div>
  );
}

export function LogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative">
        <Heart 
          className="text-[#c41e3a] dark:text-[#e84855]" 
          size={28} 
          fill="currentColor"
          strokeWidth={2}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-2.5 h-0.5 bg-white" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-white" />
          </div>
        </div>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[#c41e3a] dark:text-[#e84855] font-bold text-sm tracking-tight">
          MAGDI YACOUB
        </span>
        <span className="text-[#003366] dark:text-[#4a90e2] text-[10px] font-semibold tracking-wide">
          Heart Center
        </span>
        <span className="text-[#b8860b] dark:text-[#ffd700] text-[9px] font-medium">
          Aswan Lab QC
        </span>
      </div>
    </div>
  );
}
