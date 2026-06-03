"use client";

import {
  Clipboard,
  LayoutDashboard,
  X,
  Moon,
  Sun,
  Users,
  LogOut,
  Heart,
  AlertCircle,
  Database,
  TestTube,
  Server,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/store/useAuthStore";
import { logoutAccount } from "@/lib/actions";
import { Logo, LogoCompact } from "./Logo";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose = () => { } }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const pathname = usePathname();
  const router = useRouter();

const menuItems = [
  { href: "/dashboard",    label: "Dashboard",            icon: LayoutDashboard },
  { href: "/qc",           label: "QC Results History",   icon: Clipboard },
  { href: "/qc-tests",     label: "QC Test Types",        icon: TestTube },
  { href: "/control-lots", label: "Control Lots",         icon: Database },
  { href: "/machines",     label: "Equipment Directory",  icon: Server },
  { href: "/alerts",       label: "Alerts",               icon: AlertCircle },
];

  // Add User Management for admins only
  if (isAdmin) {
    menuItems.push({
      href: "/users",
      label: "User Management",
      icon: Users,
    });
  }

  const isPathActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    clearAuth();
    // Clear cookies via server action, then navigate to login
    await logoutAccount();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile overlay with blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Magdi Yacoub Branded */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-full sm:w-80 lg:w-72 flex flex-col h-screen
        bg-white dark:bg-[#1a1a1a]
        border-r-2 border-[#c41e3a]/20 dark:border-[#e84855]/30
        transform transition-all duration-300 ease-in-out
        shadow-2xl shadow-[#c41e3a]/10 dark:shadow-[#e84855]/20 lg:shadow-none
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Header with Logo and Pattern Background */}
        <div className="relative p-4 sm:p-6 flex flex-shrink-0 items-center justify-between border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-gradient-to-br from-white to-[#fff8f0] dark:from-[#1a1a1a] dark:to-[#2a2a2a] myc-pattern">
          {/* Decorative heart pulse in background */}
          <div className="absolute top-2 right-2 opacity-5 dark:opacity-10">
            <Heart
              size={60}
              className="text-[#c41e3a] dark:text-[#e84855]"
              fill="currentColor"
            />
          </div>

          <div className="hidden lg:block relative z-10">
            <LogoCompact />
          </div>
          <div className="lg:hidden relative z-10">
            <Logo />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-[#c41e3a] dark:hover:text-[#e84855] relative z-10"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isPathActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold overflow-hidden ${isActive
                  ? "bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 ring-1 ring-white/20 scale-[1.02]"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent dark:hover:from-red-900/10 hover:text-[#c41e3a] dark:hover:text-[#e84855] hover:scale-[1.01]"
                  }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffd700] rounded-r-full shadow-[0_0_10px_#ffd700]" />
                )}
                
                {/* Shine effect for active state */}
                {isActive && (
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_forwards]" />
                )}

                <Icon size={20} className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info, Theme Toggle and Logout */}
        <div className="flex-shrink-0 p-4 border-t-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 space-y-2 bg-gradient-to-t from-[#fff8f0] to-white dark:from-[#2a2a2a] dark:to-[#1a1a1a]">
          {/* User Info */}
          <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-[#fff8f0] to-white dark:from-[#2a2a2a] dark:to-[#1e1e1e] border border-[#c41e3a]/10 dark:border-[#e84855]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] flex items-center justify-center text-white text-sm flex-shrink-0 shadow-lg ring-2 ring-[#b8860b] dark:ring-[#ffd700]">
                {currentUser?.firstName?.[0] || ''}
                {currentUser?.lastName?.[0] || ''}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-900 dark:text-white text-sm font-medium truncate">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-[#b8860b] dark:text-[#ffd700] text-xs truncate font-semibold">
                  {isAdmin ? "Administrator" : "Technician"}
                </p>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] hover:text-[#003366] dark:hover:text-[#4a90e2] transition-all"
          >
            {theme === "light" ? (
              <>
                <Moon size={20} />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun size={20} />
                <span>Light Mode</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#c41e3a] dark:text-[#e84855] hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
