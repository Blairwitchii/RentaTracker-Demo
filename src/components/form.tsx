import type { ReactNode } from "react";

export const inputClass = "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      {children}
    </label>
  );
}
