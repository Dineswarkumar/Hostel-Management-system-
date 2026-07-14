import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { neu?: boolean; invalid?: boolean }
>(({ className, neu, invalid, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 px-4 rounded-xl text-sm",
        "bg-surface border border-border text-text placeholder:text-muted",
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
        "transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        neu && "neu-inset border-transparent focus:ring-primary/30",
        invalid && "border-danger focus:ring-danger/30 focus:border-danger",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-[88px] p-4 rounded-xl text-sm resize-y",
        "bg-surface border border-border text-text placeholder:text-muted",
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
        "transition-all",
        invalid && "border-danger focus:ring-danger/30 focus:border-danger",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
