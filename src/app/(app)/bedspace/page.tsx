"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, MessageCircle, Snowflake, UserPlus, Zap } from "lucide-react";
import { sum } from "@/lib/finance";
import { actions, useDemoData } from "@/lib/store";
import { useMoney } from "@/lib/currency";
import { Card, CardTitle, PageHeader, Select, Stat, StatusBadge } from "@/components/ui";
import { AddTenantForm, ordinal } from "@/components/tenant";

export default function BedspacePage() {
  const money = useMoney();
  const data = useDemoData();
  const buildings = data.properties.filter((p) => p.mode === "bedspace");
  const [propertyId, setPropertyId] = useState(buildings[0]?.id ?? "");
  const [ratePerKwh, setRatePerKwh] = useState(12.5);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const property = buildings.find((p) => p.id === propertyId) ?? buildings[0];
  if (!property) {
    return (
      <>
        <PageHeader title="Bedspace" />
        <Card className="text-sm text-muted">
          You have no bedspace properties.{" "}
          <Link href="/properties" className="font-medium text-brand underline">
            Add one on the Properties page
          </Link>
          .
        </Card>
      </>
    );
  }

  const rooms = data.rooms.filter((r) => r.propertyId === property.id);
  const beds = rooms.flatMap((r) => r.beds);
  const occupied = beds.filter((b) => b.tenant);
  const unpaid = sum(occupied.map((b) => b.tenant!.balance));
  const overdue = occupied.filter((b) => b.tenant!.status === "overdue");

  return (
    <>
      <PageHeader
        title="Bedspace"
        description="Track every bed, who owes what, and split each room's electric bill from its sub-meter."
        actions={buildings.length > 1 && <Select label="Building" value={property.id} onChange={setPropertyId} options={buildings.map((b) => ({ value: b.id, label: b.name }))} />}
      />
      <h2 className="mb-4 text-sm font-semibold">
        {property.name} <span className="font-normal text-muted">· {property.location}</span>
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Beds occupied" value={`${occupied.length} / ${beds.length}`} hint={`${beds.length - occupied.length} vacant`} />
        <Stat label="Monthly rent roll" value={money.format(sum(occupied.map((b) => b.rent)))} />
        <Stat label="Unpaid balances (utang)" value={money.format(unpaid)} tone={unpaid ? "critical" : "good"} hint={`${overdue.length} overdue tenants`} />
        <Stat label="Electricity rate" value={`₱${ratePerKwh.toFixed(2)} / kWh`} hint="From the building's main bill" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((room) => {
          const kwh = Math.max(0, room.currReading - room.prevReading);
          const tenants = room.beds.filter((b) => b.tenant).length;
          const share = tenants ? (kwh * ratePerKwh) / tenants : 0;
          return (
            <Card key={room.id}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                  {room.name}
                  {room.aircon && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-series-1">
                      <Snowflake size={12} aria-hidden /> Aircon
                    </span>
                  )}
                </h3>
                <span className="text-xs text-muted">
                  {tenants}/{room.beds.length} beds
                </span>
              </div>

              <ul className="divide-y divide-border">
                {room.beds.map((bed) =>
                  addingTo === bed.id ? (
                    <li key={bed.id} className="py-2.5">
                      <AddTenantForm spaceId={bed.id} spaceLabel={`${room.name}, ${bed.label}`} onDone={() => setAddingTo(null)} />
                    </li>
                  ) : (
                    <li key={bed.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{bed.tenant ? bed.tenant.name : <span className="text-muted">Vacant</span>}</div>
                        <div className="text-xs text-muted">
                          {bed.label} · {money.format(bed.rent)}/mo
                          {bed.tenant && ` · due every ${ordinal(bed.tenant.dueDay)} · ${bed.tenant.method}`}
                        </div>
                      </div>
                      {bed.tenant ? (
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge status={bed.tenant.status} />
                          {bed.tenant.balance > 0 && <span className="tabular text-xs text-critical">Owes {money.format(bed.tenant.balance)}</span>}
                          <div className="flex gap-1">
                            {bed.tenant.status !== "paid" && (
                              <>
                                <button title="Send a Messenger reminder (full version)" className="rounded border border-border p-1 text-muted hover:text-foreground" aria-label={`Remind ${bed.tenant.name}`}>
                                  <MessageCircle size={14} />
                                </button>
                                <button onClick={() => actions.recordPayment(bed.id)} className="rounded bg-brand px-2 py-0.5 text-xs font-medium text-white">
                                  Record payment
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => window.confirm(`Move out ${bed.tenant!.name}?`) && actions.removeTenant(bed.id)}
                              className="rounded border border-border p-1 text-muted hover:text-critical"
                              aria-label={`Move out ${bed.tenant.name}`}
                              title="Move out"
                            >
                              <LogOut size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAddingTo(bed.id)} className="inline-flex shrink-0 items-center gap-1 rounded border border-brand px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand-soft">
                          <UserPlus size={13} aria-hidden /> Add tenant
                        </button>
                      )}
                    </li>
                  ),
                )}
              </ul>

              <div className="mt-3 rounded-lg bg-background p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                  <Zap size={14} className="text-warning" aria-hidden /> Sub-meter billing
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <MeterInput label="Previous" value={room.prevReading} onChange={(v) => actions.setReading(room.id, "prevReading", v)} />
                  <MeterInput label="Current" value={room.currReading} onChange={(v) => actions.setReading(room.id, "currReading", v)} />
                  <div>
                    <div className="text-muted">Used</div>
                    <div className="tabular mt-1 font-medium">{kwh} kWh</div>
                  </div>
                  <div>
                    <div className="text-muted">Each tenant pays</div>
                    <div className="tabular mt-1 font-semibold text-foreground">{money.format(share)}</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardTitle hint="Change it to match this month's bill. Every room's split updates.">Electricity rate</CardTitle>
        <label className="flex items-center gap-3 text-sm">
          <span className="text-muted">₱ per kWh</span>
          <input type="number" step="0.1" min="0" value={ratePerKwh} onChange={(e) => setRatePerKwh(Number(e.target.value))} className="w-28 rounded-full border border-border bg-surface px-3 py-1.5" />
        </label>
      </Card>
    </>
  );
}

function MeterInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label>
      <div className="text-muted">{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="tabular mt-1 w-full rounded border border-border bg-surface px-1.5 py-1" />
    </label>
  );
}
