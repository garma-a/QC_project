"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageBackground } from "@/components/layout/PageBackground";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      {mounted && <Sidebar />}
      <main className="flex-1 overflow-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
