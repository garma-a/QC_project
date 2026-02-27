import { Heart } from 'lucide-react';

export function PageBackground() {
  return (
    <>
      {/* Decorative background elements - Magdi Yacoub colors */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#c41e3a] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#b8860b] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#003366] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Floating hearts decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10">
        <Heart className="absolute top-10 right-1/4 text-[#c41e3a] dark:text-[#e84855]" size={40} fill="currentColor" />
        <Heart className="absolute bottom-20 left-1/4 text-[#c41e3a] dark:text-[#e84855]" size={60} fill="currentColor" />
        <Heart className="absolute top-1/3 left-10 text-[#b8860b] dark:text-[#ffd700]" size={30} fill="currentColor" />
        <Heart className="absolute top-2/3 right-10 text-[#003366] dark:text-[#4a90e2]" size={45} fill="currentColor" />
        <Heart className="absolute bottom-1/3 right-1/3 text-[#b8860b] dark:text-[#ffd700]" size={35} fill="currentColor" />
      </div>
    </>
  );
}
