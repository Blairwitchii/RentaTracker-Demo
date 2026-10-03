"use client";

import { useState } from "react";
import { MessageCircle, Snowflake, Zap } from "lucide-react";
import { TODAY, rooms as demoRooms, type Room } from "@/data/demo";
import { sum } from "@/lib/finance";
import { useMoney } from "@/lib/currency";
import { Card, CardTitle, PageHeader, Stat, StatusBadge } from "@/components/ui";

export default function BedspacePage() {
  const money = useMoney();
  const [rooms, setRooms] = useState<Room[]>(demoRooms);
  const [ratePerKwh, setRatePerKwh] = useState(12.5);

  const beds = rooms.flatMap((r) => r.beds);
  const occupied = beds.filter((b) => b.tenant);
  const rentRoll = sum(occupied.map((b) => b.rent));
  const unpaid = sum(occupied.map((b) => b.tenant!.balance));
  const overdue = occupied.filter((b) => b.tenant!.status === "overdue");

  function recordPayment(bedId: string) {
    setRooms((prev) =>
      prev.map((room) => ({
        ...room,
        beds: room.beds.map((bed) =>
          bed.id === bedId && bed.tenant ? { ...bed, tenant: { ...bed.tenant, balance: 0, status: "paid", lastPayment: TODAY } } : bed,
        ),
      })),
    );
  }

  function setReading(roomId: string, field: "prevReading" | "currReading", value: number) {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, [field]: value } : r)));
  }

  return (
    <>
      <PageHeader
        title="Bedspace"
        description="Casa Verde Dorm · Sampaloc, Manila. Track every bed, who owes what, and split each room's electric bill from its sub-meter."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Beds occupied" value={`${occupied.length} / ${beds.length}`} hint={`${beds.length - occupied.length} vacant`} />
        <Stat label="Monthly rent roll" value={money.format(rentRoll)} />
        <Stat label="Unpaid balances (utang)" value={money.format(unpaid)} tone={unpaid ? "critical" : "good"} hint={`${overdue.length} overdue tenants`} />
        <Stat label="Electricity rate" value={`₱${ratePerKwh.toFixed(2)} / kWh`} hint="From the building's main bill" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((room) => {
          const kwh = Math.max(0, room.currReading - room.prevReading);
          const roomBill = kwh * ratePerKwh;
          const tenants = room.beds.filter((b) => b.tenant).length;
          const share = tenants ? roomBill / tenants : 0;
          return (
            <Card key={room.id}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold">
                  {room.name}
                  {room.aircon && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-series-1">
                      <Snowflake size={12} aria-hidden /> Aircon
                    </span>
                  )}
                </h2>
                <span className="text-xs text-muted">
                  {tenants}/{room.beds.length} beds
                </span>
              </div>

              <ul className="divide-y divide-border">
                {room.beds.map((bed) => (
                  <li key={bed.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{bed.tenant ? bed.tenant.name : <span className="text-muted">Vacant</span>}</div>
                      <div className="text-xs text-muted">
                        {bed.label} · {money.format(bed.rent)}/mo
                        {bed.tenant && ` · due every ${ordinal(bed.tenant.dueDay)} · ${bed.tenant.method}`}
                      </div>
                    </div>
                    {bed.tenant && (
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={bed.tenant.status} />
                        {bed.tenant.balance > 0 && <span className="tabular text-xs text-critical">Owes {money.format(bed.tenant.balance)}</span>}
                        {bed.tenant.status !== "paid" && (
                          <div className="flex gap-1">
                            <button
                              title="Send a Messenger reminder (full version)"
                              className="rounded border border-border p-1 text-muted hover:text-foreground"
                              aria-label={`Remind ${bed.tenant.name}`}
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button onClick={() => recordPayment(bed.id)} className="rounded bg-brand px-2 py-0.5 text-xs font-medium text-white">
                              Record payment
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-3 rounded-lg bg-background p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                  <Zap size={14} className="text-warning" aria-hidden /> Sub-meter billing
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <MeterInput label="Previous" value={room.prevReading} onChange={(v) => setReading(room.id, "prevReading", v)} />
                  <MeterInput label="Current" value={room.currReading} onChange={(v) => setReading(room.id, "currReading", v)} />
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
          <input
            type="number"
            step="0.1"
            min="0"
            value={ratePerKwh}
            onChange={(e) => setRatePerKwh(Number(e.target.value))}
            className="w-28 rounded-md border border-border bg-surface px-2.5 py-1.5"
          />
        </label>
      </Card>
    </>
  );
}

function MeterInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label>
      <div className="text-muted">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tabular mt-1 w-full rounded border border-border bg-surface px-1.5 py-1"
      />
    </label>
  );
}

function ordinal(n: number) {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}
