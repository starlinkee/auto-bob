import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "neutral";

const tones: Record<BadgeTone, string> = {
  success: "bg-green-100 text-green-900",
  warning: "bg-brand text-brand-ink",
  neutral: "bg-surface-muted text-ink",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
