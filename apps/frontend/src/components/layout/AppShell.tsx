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

  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";

  // On auth pages, render children directly without the shell layout.
  // This avoids the Sidebar + shell appearing on the login/signup page.
  if (isAuthPage) {
    return <>{children}</>;
  }

  // For all other (protected) routes, render the full shell.
  // Middleware ensures unauthenticated users never reach here.
  // We defer Sidebar rendering until after mount to avoid hydration
  // mismatches from Zustand store rehydrating user data from localStorage.
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#faf8f5] via-[#fff8f0] to-[#fef3e2] dark:from-[#121212] dark:via-[#1a1a1a] dark:to-[#1e1e1e] transition-colors relative overflow-hidden">
      {/* Premium Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxbC00MCAwem0wIDM5aDQwdjFsLTQwIDB6bTM5LTM5aDF2NDBoLTF6TTAgMGgxdjQwaC0xeiIgZmlsbD0icmdiYSgyNTUsIDAsIDAsIDAuMDMpIi8+Cjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxbC00MCAwem0wIDM5aDQwdjFsLTQwIDB6bTM5LTM5aDF2NDBoLTF6TTAgMGgxdjQwaC0xeiIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIvPgo8L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none z-0" />
      
      <PageBackground />
      {mounted && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#c41e3a]/10 dark:border-[#e84855]/10 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c41e3a] to-[#8b1e3f] flex items-center justify-center text-white font-black shadow-lg shadow-[#c41e3a]/20">
              M
            </div>
            <span className="font-bold text-gray-900 dark:text-white tracking-tight">MYC <span className="text-[#c41e3a] dark:text-[#e84855]">QC System</span></span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200/50 dark:border-gray-700/50"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
