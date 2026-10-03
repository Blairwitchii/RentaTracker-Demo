"use client";

import { useState } from "react";
import Link from "next/link";
import { DoorOpen, Droplets, LogOut, MessageCircle, UserPlus, Zap } from "lucide-react";
import type { Door } from "@/data/demo";
import { sum } from "@/lib/finance";
import { actions, useDemoData } from "@/lib/store";
import { useMoney } from "@/lib/currency";
import { Card, PageHeader, Select, Stat, StatusBadge } from "@/components/ui";
import { AddTenantForm, ordinal } from "@/components/tenant";

type Rates = { elec: number; water: number };

export default function ApartmentsPage() {
  const money = useMoney();
  const data = useDemoData();
  const buildings = data.properties.filter((p) => p.mode === "multi-door");
  const [propertyId, setPropertyId] = useState(buildings[0]?.id ?? "");
  const [rates, setRates] = useState<Rates>({ elec: 12.5, water: 55 });

  const property = buildings.find((p) => p.id === propertyId) ?? buildings[0];
  if (!property) {
    return (
      <>
        <PageHeader title="Apartments" />
        <Card className="text-sm text-muted">
          You have no multi-door apartments.{" "}
          <Link href="/properties" className="font-medium text-brand underline">
            Add one on the Properties page
          </Link>
          .
        </Card>
      </>
    );
  }

  const doors = data.doors.filter((d) => d.propertyId === property.id);
  const occupied = doors.filter((d) => d.tenant);
  const unpaid = sum(occupied.map((d) => d.tenant!.balance));
  const utilities = sum(occupied.map((d) => utilityBill(d, rates)));

  return (
    <>
      <PageHeader
        title="Apartments"
        description="Multi-door buildings: each door has its own tenant, rent, due date and sub-metered electricity and water."
        actions={buildings.length > 1 && <Select label="Building" value={property.id} onChange={setPropertyId} options={buildings.map((b) => ({ value: b.id, label: b.name }))} />}
      />
      <h2 className="mb-4 text-sm font-semibold">
        {property.name} <span className="font-normal text-muted">· {property.location}</span>
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Doors occupied" value={`${occupied.length} / ${doors.length}`} hint={`${doors.length - occupied.length} vacant`} />
        <Stat label="Monthly rent roll" value={money.format(sum(occupied.map((d) => d.rent)))} />
        <Stat label="Unpaid balances (utang)" value={money.format(unpaid)} tone={unpaid ? "critical" : "good"} hint={`${occupied.filter((d) => d.tenant!.status === "overdue").length} overdue`} />
        <Stat label="Utilities to bill this month" value={money.format(utilities)} hint="Passed on to tenants" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {doors.map((door) => (
          <DoorCard key={door.id} door={door} rates={rates} />
        ))}
      </div>

      <Card className="mt-4">
        <h3 className="mb-1 text-base font-semibold">Utility rates</h3>
        <p className="mb-3 text-xs text-muted">Copy these from the building&apos;s main Meralco and water bills. Every door&apos;s bill updates.</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <RateInput label="₱ per kWh" value={rates.elec} onChange={(elec) => setRates((r) => ({ ...r, elec }))} />
          <RateInput label="₱ per m³ water" value={rates.water} onChange={(water) => setRates((r) => ({ ...r, water }))} />
        </div>
      </Card>
    </>
  );
}

function utilityBill(door: Door, rates: Rates) {
  return Math.max(0, door.elecCurr - door.elecPrev) * rates.elec + Math.max(0, door.waterCurr - door.waterPrev) * rates.water;
}

function DoorCard({ door, rates }: { door: Door; rates: Rates }) {
  const money = useMoney();
  const [adding, setAdding] = useState(false);
  const { tenant } = door;
  const kwh = Math.max(0, door.elecCurr - door.elecPrev);
  const m3 = Math.max(0, door.waterCurr - door.waterPrev);
  const elecBill = kwh * rates.elec;
  const waterBill = m3 * rates.water;
  const totalDue = tenant ? door.rent + elecBill + waterBill + tenant.balance : 0;

  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tenant ? "bg-brand-soft text-brand" : "bg-surface-soft text-muted"}`}>
            <DoorOpen size={19} aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold">{door.name}</h3>
            <p className="tabular text-xs text-muted">{money.format(door.rent)} / month</p>
          </div>
        </div>
        {tenant ? <StatusBadge status={tenant.status} /> : <span className="rounded-full bg-surface-soft px-2 py-0.5 text-xs font-medium text-muted">Vacant</span>}
      </div>

      {adding ? (
        <AddTenantForm spaceId={door.id} spaceLabel={door.name} onDone={() => setAdding(false)} />
      ) : tenant ? (
        <>
          <div className="text-sm font-medium">{tenant.name}</div>
          <div className="text-xs text-muted">
            Due every {ordinal(tenant.dueDay)} · {tenant.method}
          </div>

          <div className="mt-3 space-y-1.5 rounded-2xl bg-surface-soft p-3 text-xs">
            <MeterRow icon={<Zap size={13} className="text-warning" aria-hidden />} label="Electricity" prev={door.elecPrev} curr={door.elecCurr} unit="kWh" bill={elecBill} onChange={(f, v) => actions.setDoorReading(door.id, f === "prev" ? "elecPrev" : "elecCurr", v)} />
            <MeterRow icon={<Droplets size={13} className="text-series-1" aria-hidden />} label="Water" prev={door.waterPrev} curr={door.waterCurr} unit="m³" bill={waterBill} onChange={(f, v) => actions.setDoorReading(door.id, f === "prev" ? "waterPrev" : "waterCurr", v)} />
            {tenant.balance > 0 && (
              <div className="flex justify-between text-critical">
                <span>Unpaid balance</span>
                <span className="tabular font-medium">{money.format(tenant.balance)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5 text-sm font-semibold">
              <span>This month&apos;s bill</span>
              <span className="tabular">{money.format(totalDue)}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {tenant.status !== "paid" && (
              <>
                <button onClick={() => actions.recordPayment(door.id)} className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">
                  Record payment
                </button>
                <button title="Send a Messenger reminder (full version)" className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted">
                  <MessageCircle size={13} aria-hidden /> Remind
                </button>
              </>
            )}
            <button
              onClick={() => window.confirm(`Move out ${tenant.name} from ${door.name}?`) && actions.removeTenant(door.id)}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-critical"
            >
              <LogOut size={13} aria-hidden /> Move out
            </button>
          </div>
        </>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed border-brand py-2 text-sm font-medium text-brand hover:bg-brand-soft">
          <UserPlus size={15} aria-hidden /> Add tenant
        </button>
      )}
    </Card>
  );
}

function MeterRow({ icon, label, prev, curr, unit, bill, onChange }: { icon: React.ReactNode; label: string; prev: number; curr: number; unit: string; bill: number; onChange: (field: "prev" | "curr", value: number) => void }) {
  const money = useMoney();
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
      <span className="flex items-center gap-1 text-muted">
        {icon} {label}
      </span>
      <span className="flex items-center gap-1">
        <input type="number" value={prev} onChange={(e) => onChange("prev", Number(e.target.value))} aria-label={`${label} previous reading`} className="tabular w-14 rounded-md border border-border bg-surface px-1 py-0.5" />
        →
        <input type="number" value={curr} onChange={(e) => onChange("curr", Number(e.target.value))} aria-label={`${label} current reading`} className="tabular w-14 rounded-md border border-border bg-surface px-1 py-0.5" />
        <span className="text-muted">
          {Math.max(0, curr - prev)} {unit}
        </span>
      </span>
      <span className="tabular font-medium">{money.format(bill)}</span>
    </div>
  );
}

function RateInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-muted">{label}</span>
      <input type="number" step="0.1" min="0" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-24 rounded-full border border-border bg-surface px-3 py-1.5" />
    </label>
  );
}
