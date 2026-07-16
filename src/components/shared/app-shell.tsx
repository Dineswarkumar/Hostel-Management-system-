"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "./top-nav";
import { BottomTabs } from "./bottom-tabs";

/**
 * Authenticated app shell — wraps every page after signin.
 * Renders the glass top nav, smooth route transitions, and the mobile bottom tab bar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col scroll-smooth">
      <TopNav />
      <main className="flex-1 container mx-auto px-4 py-6 pb-28 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomTabs />
    </div>
  );
}
