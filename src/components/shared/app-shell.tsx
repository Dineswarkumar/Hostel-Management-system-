"use client";

import * as React from "react";
import { TopNav } from "./top-nav";
import { BottomTabs } from "./bottom-tabs";

/**
 * Authenticated app shell — wraps every page after signin.
 * Renders the glass top nav and the mobile bottom tab bar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container py-6 pb-24 md:pb-6">{children}</main>
      <BottomTabs />
    </div>
  );
}
