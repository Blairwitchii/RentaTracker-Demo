"use client";

import type { FormEvent } from "react";
import type { PaymentMethod } from "@/data/demo";
import { actions } from "@/lib/store";
import { inputClass } from "@/components/form";

const METHODS: PaymentMethod[] = ["GCash", "Maya", "Cash", "Bank transfer"];

export function ordinal(n: number) {
  const s = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${s}`;
}

/** Inline form that puts a tenant into a bed or a door. */
export function AddTenantForm({ spaceId, spaceLabel, onDone }: { spaceId: string; spaceLabel: string; onDone: () => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    actions.addTenant(spaceId, { name: String(f.get("name")).trim(), dueDay: Number(f.get("dueDay")), method: f.get("method") as PaymentMethod });
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="text-xs font-medium text-muted">New tenant · {spaceLabel}</div>
      <input name="name" required autoFocus placeholder="Tenant or family name" className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <select name="dueDay" defaultValue="5" className={inputClass} aria-label="Rent due day">
          {[1, 5, 10, 15, 20, 25, 30].map((d) => (
            <option key={d} value={d}>
              Due every {ordinal(d)}
            </option>
          ))}
        </select>
        <select name="method" className={inputClass} aria-label="Payment method">
          {METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">Save tenant</button>
        <button type="button" onClick={onDone} className="rounded-full border border-border px-3 py-1 text-xs">
          Cancel
        </button>
      </div>
    </form>
  );
}
