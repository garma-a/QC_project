"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { PageBackground } from "@/components/PageBackground";

interface AppShellProps {
  children: ReactNode;
}

const PROTECTED_ROUTES = ["/dashboard", "/monitor", "/qc", "/errors", "/users"];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuth();

  const isLoginPage = pathname === "/login";
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    if (isProtectedRoute && !currentUser) {
      router.replace("/login");
    }
  }, [isProtectedRoute, currentUser, router]);

  if (isProtectedRoute && !currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#faf8f5] via-[#fff8f0] to-[#fef3e2] dark:from-[#121212] dark:via-[#1a1a1a] dark:to-[#1e1e1e] transition-colors myc-pattern relative overflow-hidden">
      <PageBackground />
      {!isLoginPage && <Sidebar />}
      <main className="flex-1 overflow-auto relative z-10">{children}</main>
    </div>
  );
}
