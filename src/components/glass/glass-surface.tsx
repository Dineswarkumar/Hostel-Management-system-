import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Glass surface — the workhorse of the UI.
 * Combines backdrop blur, translucency, border, shadow.
 */
export function GlassSurface({
  className,
  intensity = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  intensity?: "subtle" | "default" | "strong";
}) {
  return (
    <div
      className={cn(
        intensity === "subtle" && "glass-subtle",
        intensity === "default" && "glass",
        intensity === "strong" && "glass-strong",
        "rounded-2xl",
        className
      )}
      {...props}
    />
  );
}
