"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Menu,
  Package,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/ui/logout-button";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <aside className="hidden md:flex md:w-60 flex-col border-r sidebar px-5 py-6">
        <div className="mb-8 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
              DeepStaq
            </div>
            <div className="mt-1 text-[11px] text-subtle">
              Inventory & Godown Suite
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map((n) => {
            const isActive = activeHref === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  isActive
                    ? "sidebar-link-active flex items-center justify-between rounded-lg px-3 py-2"
                    : "sidebar-link flex items-center gap-2 rounded-lg px-3 py-2"
                }
              >
                <span className="flex items-center gap-2">
                  {n.icon}
                  {n.label}
                </span>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t app-border">
          <div className="pb-2">
            <LogoutButton />
          </div>
          <div className="pt-3 text-[11px] text-subtle">
            Audit-safe stock, multi-godown ready.
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-xs border-r sidebar">
            <div className="flex items-center justify-between px-4 py-4 border-b app-border">
              <div>
                <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
                  DeepStaq
                </div>
                <div className="mt-1 text-[11px] text-subtle">Navigation</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border app-border app-surface hover:bg-slate-200/60"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-4">
              <nav className="space-y-1 text-sm">
                {navItems.map((n) => {
                  const isActive = activeHref === n.href;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setMobileOpen(false)}
                      className={
                        isActive
                          ? "sidebar-link-active flex items-center justify-between rounded-lg px-3 py-2"
                          : "sidebar-link flex items-center gap-2 rounded-lg px-3 py-2"
                      }
                    >
                      <span className="flex items-center gap-2">
                        {n.icon}
                        {n.label}
                      </span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 border-t app-border pt-4">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-40 md:hidden border-b app-border app-surface/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border app-border app-surface hover:bg-slate-200/60"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0 text-center">
              <div className="truncate text-sm font-semibold tracking-tight">
                {title ?? "DeepStaq"}
              </div>
              {subtitle ? (
                <div className="truncate text-[11px] text-subtle">{subtitle}</div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <main className="px-4 md:px-8 py-6 pb-24 md:pb-6">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t app-border app-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
            {navItems.map((n) => {
              const isActive = activeHref === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={
                    isActive
                      ? "flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-indigo-600"
                      : "flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-subtle hover:text-foreground"
                  }
                >
                  <span
                    className={
                      isActive
                        ? "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10"
                        : "inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    }
                  >
                    {n.icon}
                  </span>
                  <span className="text-[11px] font-medium">{n.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
