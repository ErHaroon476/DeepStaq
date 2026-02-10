"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Package,
  User,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LogoutButton } from "@/components/ui/logout-button";
import { useAuth } from "@/components/providers/auth-provider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Always set dark mode on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const getUserInitials = () => {
    if (!user) return "U";
    const displayName = user.displayName || user.email || "User";
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return names[0][0].toUpperCase() + names[1][0].toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out");
      router.replace("/login");
      setProfileOpen(false);
    } catch {
      toast.error("Logout failed");
    }
  };

  const navItems: NavItem[] = useMemo(
    () => [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <Home className="h-4 w-4" />,
      },
      {
        href: "/godowns",
        label: "Godowns",
        icon: <Package className="h-4 w-4" />,
      },
      {
        href: "/reports",
        label: "Reports",
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
    [],
  );

  const activeHref = useMemo(() => {
    const first = navItems.find(
      (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
    );
    return first?.href ?? "";
  }, [pathname, navItems]);

  return (
    <div className="app-shell flex">
      <aside className="hidden md:flex md:w-60 flex-col border-r bg-gradient-to-br from-slate-900/95 to-slate-800/95 px-5 py-6 backdrop-blur-xl">
        <div className="mb-8 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-75"></div>
              <div className="relative bg-white rounded-full p-1.5 border border-white/20">
                <Logo size="sm" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest uppercase text-white" style={{ textShadow: '0 0 20px rgba(0, 212, 255, 0.5)' }}>
                DeepStaq
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Inventory & Godown Suite
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-2 text-sm">
          {navItems.map((n) => {
            const isActive = activeHref === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-300 hover:bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <div className={`relative inline-flex items-center justify-center p-1.5 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-white/20 backdrop-blur-sm"
                      : "bg-slate-700/50 group-hover:bg-slate-600/50"
                  }`}>
                    {n.icon}
                  </div>
                  <span className="font-medium">{n.label}</span>
                </span>
                {isActive && (
                  <div className="relative">
                    <div className="absolute -inset-1 bg-emerald-400 rounded-full blur-sm"></div>
                    <div className="relative bg-emerald-500 rounded-full w-2 h-2 animate-pulse"></div>
                  </div>
                )}
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            );
          })}
        </nav>

        {/* Enhanced Profile Option */}
        <div className="relative mt-2">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm w-full text-slate-300 hover:bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:text-white transition-all duration-300"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-75"></div>
              <div className="relative bg-white/20 backdrop-blur rounded-full p-1 border border-white/30">
                <span className="text-xs font-bold text-white">
                  {getUserInitials()}
                </span>
              </div>
            </div>
            <span className="flex-1 text-left">{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* Enhanced Profile Popup */}
          {profileOpen && (
            <div className="absolute left-0 top-12 w-56 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-600/50 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur rounded-full p-2">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      Hi, {user?.displayName || user?.email?.split('@')[0] || 'User'}!
                    </div>
                    <div className="text-xs text-white/80">What are you looking for?</div>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="p-3">
                <div className="border-t border-slate-700 my-2"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-left group"
                >
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg blur-sm opacity-75"></div>
                    <div className="relative bg-slate-700/50 rounded-lg p-1.5 border border-slate-600/50">
                      <LogOut className="h-4 w-4 text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-xs text-white">Logout</div>
                    <div className="text-xs text-slate-400">Sign out of account</div>
                  </div>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </button>
              </div>
            </div>
          )}

          {/* Backdrop */}
          {profileOpen && (
            <button
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 z-40"
              aria-label="Close profile"
            />
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-700/50">
          <div className="pb-2">
            <LogoutButton />
          </div>
          <div className="pt-3 text-[11px] text-slate-400 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            Audit-safe stock, multi-godown ready.
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-50 md:hidden px-4 pt-4 pb-2">
          <div className="relative">
            {/* Floating navbar with premium glass effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-[20px] blur-xl opacity-30"></div>
            <div className="relative bg-white/10 backdrop-blur-2xl rounded-[20px] border border-white/20 shadow-2xl">
              <div className="flex items-center justify-center px-6 py-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-75"></div>
                    <div className="relative bg-white rounded-full p-1">
                      <Logo size="sm" />
                    </div>
                  </div>
                  <div className="text-white">
                    <div className="text-base font-bold tracking-tight">DeepStaq</div>
                  </div>
                </div>

                <div className="ml-auto flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-0.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <div className="bg-white rounded-full p-2">
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          {getUserInitials()}
                        </span>
                      </div>
                    </button>

                    {/* Profile Popup */}
                    {profileOpen && (
                      <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur rounded-full p-2">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-semibold">
                                Hi, {user?.displayName || user?.email?.split('@')[0] || 'User'}!
                              </div>
                              <div className="text-sm text-white/80">What are you looking for?</div>
                            </div>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="p-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <div className="bg-red-100 rounded-lg p-2">
                              <LogOut className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">Logout</div>
                              <div className="text-sm text-gray-500">Sign out of account</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Backdrop */}
                    {profileOpen && (
                      <button
                        onClick={() => setProfileOpen(false)}
                        className="fixed inset-0 z-40"
                        aria-label="Close profile"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="px-4 md:px-8 py-6 pb-16 md:pb-6">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-3 pb-1 pt-0.5">
          <div className="relative">
            {/* Floating bottom navigation with premium glass effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-[16px] blur-xl opacity-30"></div>
            <div className="relative bg-white/10 backdrop-blur-2xl rounded-[16px] border border-white/20 shadow-2xl">
              <div className="flex items-center justify-around px-3 py-1.5">
                {navItems.map((n) => {
                  const isActive = activeHref === n.href;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all duration-300 relative group"
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-lg opacity-50"></div>
                      )}
                      <span
                        className={`relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-md transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-br from-blue-500 to-purple-500 shadow-md shadow-blue-500/40 scale-110 border border-white/30"
                            : "bg-white/20 hover:bg-white/30 group-hover:scale-105 border border-white/20"
                        }`}
                      >
                        {n.icon}
                      </span>
                      <span className={`relative z-10 text-[8px] font-bold tracking-wide transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-gray-700 group-hover:text-gray-900"
                      }`}>
                        {n.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
