"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageBackground } from "@/components/layout/PageBackground";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar when pathname changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === "/login";

  // On login page, render children directly without the shell layout.
  // This avoids the Sidebar + shell appearing on the login page.
  if (isLoginPage) {
    return <>{children}</>;
  }

  // For all other (protected) routes, render the full shell.
  // Middleware ensures unauthenticated users never reach here.
  // We defer Sidebar rendering until after mount to avoid hydration
  // mismatches from Zustand store rehydrating user data from localStorage.
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#faf8f5] via-[#fff8f0] to-[#fef3e2] dark:from-[#121212] dark:via-[#1a1a1a] dark:to-[#1e1e1e] transition-colors myc-pattern relative overflow-hidden">
      <PageBackground />
      {mounted && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#1a1a1a]">
          <div className="flex items-center">
            {/* The LogoCompact is already included in pages sometimes, but a global one is better */}
            <span className="font-bold text-[#c41e3a] dark:text-[#e84855]">MYC QC System</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
