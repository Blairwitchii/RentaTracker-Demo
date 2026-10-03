"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, Home, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { PropertyKind, PropertyMode } from "@/data/demo";
import { monthlyPayment } from "@/lib/finance";
import { MODE_LABEL } from "@/lib/reports";
import { actions, useDemoData } from "@/lib/store";
import { useMoney } from "@/lib/currency";
import { Card, PageHeader, primaryButton, secondaryButton } from "@/components/ui";
import { Field, inputClass } from "@/components/form";

const KINDS: PropertyKind[] = ["Condo unit", "House", "Apartment", "Dorm building"];
const MODE_HELP: Record<PropertyMode, string> = {
  "short-stay": "Nightly guests from Airbnb, Booking.com or Facebook",
  "long-term": "One tenant paying monthly rent (condo, house, single unit)",
  "multi-door": "An apartment building with several doors, one tenant each",
  bedspace: "Rooms with beds rented per head",
};
const MANAGE_LINK: Record<PropertyMode, { href: string; label: string }> = {
  "short-stay": { href: "/calendar", label: "Bookings & guests" },
  "long-term": { href: "/expenses", label: "Expenses" },
  "multi-door": { href: "/apartments", label: "Doors & tenants" },
  bedspace: { href: "/bedspace", label: "Rooms & tenants" },
};

export default function PropertiesPage() {
  const money = useMoney();
  const data = useDemoData();
  const [showForm, setShowForm] = useState(false);

  function remove(id: string, name: string) {
    if (window.confirm(`Remove ${name}? Its bookings, tenants and expenses will be removed too.`)) actions.removeProperty(id);
  }

  return (
    <>
      <PageHeader
        title="Properties"
        description="Every unit you manage: condos on Airbnb, units with monthly tenants, and bedspace buildings."
        actions={
          <>
            <button
              onClick={() => window.confirm("Reset all demo data? Anything you added will be removed.") && actions.reset()}
              className={secondaryButton}
            >
              <RotateCcw size={15} aria-hidden /> Reset demo
            </button>
            <button onClick={() => setShowForm((s) => !s)} className={primaryButton}>
              <Plus size={16} aria-hidden /> Add property
            </button>
          </>
        }
      />

      {showForm && <AddPropertyForm onDone={() => setShowForm(false)} />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.properties.map((p) => {
          const Icon = p.kind === "Dorm building" || p.kind === "House" ? Home : Building2;
          const beds = data.rooms.filter((r) => r.propertyId === p.id).flatMap((r) => r.beds);
          const doors = data.doors.filter((d) => d.propertyId === p.id);
          const bookings = data.bookings.filter((b) => b.propertyId === p.id).length;
          return (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                    <Icon size={20} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{p.name}</h2>
                    <p className="text-xs text-muted">
                      {p.kind} · {p.location}
                    </p>
                  </div>
                </div>
                <button onClick={() => remove(p.id, p.name)} className="rounded p-1 text-muted hover:bg-red-50 hover:text-critical" aria-label={`Remove ${p.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-muted">Rented as</dt>
                <dd className="text-right font-medium">{MODE_LABEL[p.mode]}</dd>
                {p.mode === "short-stay" && (
                  <>
                    <dt className="text-muted">Bookings</dt>
                    <dd className="text-right font-medium">{bookings}</dd>
                  </>
                )}
                {p.mode === "long-term" && (
                  <>
                    <dt className="text-muted">Monthly rent</dt>
                    <dd className="tabular text-right font-medium">{money.format(p.monthlyRent ?? 0)}</dd>
                  </>
                )}
                {p.mode === "multi-door" && (
                  <>
                    <dt className="text-muted">Doors occupied</dt>
                    <dd className="text-right font-medium">
                      {doors.filter((d) => d.tenant).length} / {doors.length}
                    </dd>
                  </>
                )}
                {p.mode === "bedspace" && (
                  <>
                    <dt className="text-muted">Beds occupied</dt>
                    <dd className="text-right font-medium">
                      {beds.filter((b) => b.tenant).length} / {beds.length}
                    </dd>
                  </>
                )}
                <dt className="text-muted">Bank loan</dt>
                <dd className="tabular text-right font-medium">{p.loan ? `${money.format(monthlyPayment(p.loan))}/mo` : "None"}</dd>
              </dl>

              <Link href={MANAGE_LINK[p.mode].href} className="mt-4 rounded-full border border-border py-2 text-center text-sm font-medium hover:bg-surface-soft">
                {MANAGE_LINK[p.mode].label} →
              </Link>
            </Card>
          );
        })}
        {data.properties.length === 0 && <Card className="text-sm text-muted md:col-span-2 lg:col-span-3">No properties yet. Click “Add property” to start.</Card>}
      </div>
    </>
  );
}

function AddPropertyForm({ onDone }: { onDone: () => void }) {
  const money = useMoney();
  const [mode, setMode] = useState<PropertyMode>("short-stay");
  const [hasLoan, setHasLoan] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const num = (key: string) => Number(f.get(key) || 0);
    const php = (key: string) => money.toPhp(num(key));
    actions.addProperty({
      name: String(f.get("name")),
      kind: f.get("kind") as PropertyKind,
      location: String(f.get("location")),
      mode,
      monthlyCosts: php("monthlyCosts"),
      ...(mode === "short-stay" && { cleaningFee: php("cleaningFee"), suppliesPerStay: php("suppliesPerStay") }),
      ...(mode === "long-term" && { monthlyRent: php("monthlyRent") }),
      ...(mode === "multi-door" && { doors: num("doors"), doorRent: php("doorRent") }),
      ...(mode === "bedspace" && { rooms: num("rooms"), bedsPerRoom: num("bedsPerRoom"), bedRent: php("bedRent"), aircon: f.get("aircon") === "on" }),
      ...(hasLoan && { loan: { principal: php("loanAmount"), annualRate: num("loanRate") / 100, years: num("loanYears"), startMonth: String(f.get("loanStart")) } }),
    });
    onDone();
  }

  const c = money.code;
  return (
    <Card className="mb-6">
      <form onSubmit={submit} className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">How is it rented?</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(MODE_HELP) as PropertyMode[]).map((m) => (
              <label key={m} className={`cursor-pointer rounded-2xl border p-3 text-sm ${mode === m ? "border-brand bg-brand-soft" : "border-border"}`}>
                <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                <span className="font-medium">{MODE_LABEL[m]}</span>
                <span className="mt-0.5 block text-xs text-muted">{MODE_HELP[m]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name">
            <input name="name" required placeholder="e.g. Seaview Tower — Unit 8B" className={inputClass} />
          </Field>
          <Field label="Type">
            <select name="kind" defaultValue={mode === "bedspace" ? "Dorm building" : mode === "multi-door" ? "Apartment" : "Condo unit"} key={mode} className={inputClass}>
              {KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input name="location" required placeholder="e.g. Cebu City" className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={`Monthly dues & fixed bills (${c})`}>
            <input name="monthlyCosts" type="number" min="0" step="any" defaultValue={money.fromPhp(3500).toFixed(0)} className={inputClass} />
          </Field>
          {mode === "short-stay" && (
            <>
              <Field label={`Cleaning per turnover (${c})`}>
                <input name="cleaningFee" type="number" min="0" step="any" defaultValue={money.fromPhp(600).toFixed(0)} className={inputClass} />
              </Field>
              <Field label={`Guest supplies per stay (${c})`}>
                <input name="suppliesPerStay" type="number" min="0" step="any" defaultValue={money.fromPhp(200).toFixed(0)} className={inputClass} />
              </Field>
            </>
          )}
          {mode === "long-term" && (
            <Field label={`Monthly rent (${c})`}>
              <input name="monthlyRent" type="number" min="0" step="any" required defaultValue={money.fromPhp(18000).toFixed(0)} className={inputClass} />
            </Field>
          )}
          {mode === "multi-door" && (
            <>
              <Field label="Number of doors">
                <input name="doors" type="number" min="1" max="50" defaultValue={4} className={inputClass} />
              </Field>
              <Field label={`Rent per door (${c})`}>
                <input name="doorRent" type="number" min="0" step="any" defaultValue={money.fromPhp(8000).toFixed(0)} className={inputClass} />
              </Field>
            </>
          )}
          {mode === "bedspace" && (
            <>
              <Field label="Rooms">
                <input name="rooms" type="number" min="1" max="30" defaultValue={3} className={inputClass} />
              </Field>
              <Field label="Beds per room">
                <input name="bedsPerRoom" type="number" min="1" max="12" defaultValue={4} className={inputClass} />
              </Field>
              <Field label={`Rent per bed (${c})`}>
                <input name="bedRent" type="number" min="0" step="any" defaultValue={money.fromPhp(3500).toFixed(0)} className={inputClass} />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input name="aircon" type="checkbox" className="h-4 w-4 accent-[var(--brand)]" /> Air-conditioned rooms
              </label>
            </>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={hasLoan} onChange={(e) => setHasLoan(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
            It has a bank or Pag-IBIG loan
          </label>
          {hasLoan && (
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Field label={`Loan amount (${c})`}>
                <input name="loanAmount" type="number" min="1" step="any" required defaultValue={money.fromPhp(2_500_000).toFixed(0)} className={inputClass} />
              </Field>
              <Field label="Interest rate (% per year)">
                <input name="loanRate" type="number" min="0" step="0.01" required defaultValue={7} className={inputClass} />
              </Field>
              <Field label="Term (years)">
                <input name="loanYears" type="number" min="1" max="30" required defaultValue={20} className={inputClass} />
              </Field>
              <Field label="First payment">
                <input name="loanStart" type="month" required defaultValue="2025-01" className={inputClass} />
              </Field>
            </div>
          )}
        </div>

        <p className="text-xs text-muted">Demo: your monthly bills and loan are filled in for the last 12 months so the dashboard has something to show.</p>

        <div className="flex gap-2">
          <button className={primaryButton}>Save property</button>
          <button type="button" onClick={onDone} className={secondaryButton}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
