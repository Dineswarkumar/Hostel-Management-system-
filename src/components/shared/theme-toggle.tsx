"use client";

import * as React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

/**
 * Theme toggle. Cycles through light / dark / system.
 * Shows the current effective theme as the icon, with a small badge
 * indicating the mode (auto/manual).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolved, toggle } = useTheme();

  const Icon = resolved === "dark" ? Moon : Sun;
  const label =
    theme === "system"
      ? `System (${resolved})`
      : theme === "dark"
      ? "Dark"
      : "Light";

  return (
    <button
      onClick={toggle}
      className={cn(
        "relative h-10 w-10 rounded-xl grid place-items-center",
        "bg-surface-2/60 hover:bg-surface-2 border border-border",
        "transition-colors",
        className
      )}
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
    >
      <Icon className="h-4 w-4" />
      {theme === "system" && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent" />
      )}
    </button>
  );
}

/**
 * Three-button segmented control variant. Use in settings or auth pages.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const options: Array<{ value: typeof theme; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Dark", Icon: Moon },
    { value: "system", label: "System", Icon: Monitor },
  ];
  return (
    <div
      className={cn(
        "inline-flex p-1 rounded-2xl bg-surface-2/60 border border-border gap-1",
        className
      )}
    >
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
            theme === value
              ? "bg-primary text-primary-fg"
              : "text-muted hover:text-text"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
