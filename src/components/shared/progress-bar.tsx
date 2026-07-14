"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // When route successfully changes, reset/hide progress bar
  React.useEffect(() => {
    setActive(false);
    setProgress(0);
  }, [pathname, searchParams]);

  React.useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      // Skip empty, target="_blank", hashes, and external links
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.includes(":") ||
        anchor.target === "_blank"
      ) {
        return;
      }

      // Check if it is pointing to a different local page
      const targetUrl = href.split("#")[0].split("?")[0];
      const currentUrl = window.location.pathname;
      if (targetUrl === currentUrl) return;

      // Start the progress loader
      setActive(true);
      setProgress(10);
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => document.removeEventListener("click", handleAnchorClick, { capture: true });
  }, []);

  // Animate the progress bar incrementally up to 90%
  React.useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const diff = prev < 40 ? 15 : prev < 70 ? 8 : 2;
        return prev + diff;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 pointer-events-none bg-primary/10">
      <div
        className="h-full bg-primary shadow-[0_0_8px_#3b82f6] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function ProgressBar() {
  return (
    <React.Suspense fallback={null}>
      <ProgressBarInner />
    </React.Suspense>
  );
}
