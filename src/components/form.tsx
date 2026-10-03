import type { ReactNode } from "react";

export const inputClass = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      {children}
    </label>
  );
}
