import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "warning" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-black/5 text-foreground dark:bg-white/10",
  accent: "bg-accent-soft text-accent",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
