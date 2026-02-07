"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-subtle)",
        color: "var(--foreground)",
      }}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="hidden lg:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

