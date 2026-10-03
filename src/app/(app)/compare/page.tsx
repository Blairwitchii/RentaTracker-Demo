"use client";

import { useState } from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MONTHS, type Property } from "@/data/demo";
import { sum } from "@/lib/finance";
import { shortStayStats } from "@/lib/reports";
import { useDemoData } from "@/lib/store";
import { useMoney } from "@/lib/currency";
import { Card, CardTitle, PageHeader, Select } from "@/components/ui";

const axis = { fontSize: 12, fill: "var(--muted)" };

export default function ComparePage() {
  const data = useDemoData();
  const units = data.properties.filter((p) => p.mode === "short-stay");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const unit = units.find((u) => u.id === unitId) ?? units[0];

  if (!unit) {
    return (
      <>
        <PageHeader title="Short stay vs. monthly rental" />
        <Card className="text-sm text-muted">
          Add a short-stay unit on the{" "}
          <Link href="/properties" className="font-medium text-brand underline">
            Properties page
          </Link>{" "}
          to compare it against a monthly tenant.
        </Card>
      </>
    );
  }

  const stats = shortStayStats(data, unit.id);
  // Dues stay with the owner on a monthly lease; the tenant pays utilities and internet.
  const dues = sum(data.expenses.filter((e) => e.propertyId === unit.id && e.category === "Association dues").map((e) => e.amount)) / MONTHS.length;
  return (
    <Comparison
      key={unit.id}
      unit={unit}
      stats={stats}
      longTermCosts={dues + 800}
      picker={units.length > 1 && <Select label="Unit" value={unit.id} onChange={setUnitId} options={units.map((u) => ({ value: u.id, label: u.name }))} />}
    />
  );
}

function Comparison({ unit, stats, longTermCosts, picker }: { unit: Property; stats: ReturnType<typeof shortStayStats>; longTermCosts: number; picker: React.ReactNode }) {
  const money = useMoney();
  // All inputs are stored in PHP and shown in the selected currency.
  const [nightly, setNightly] = useState(Math.round(stats.adr || 2800));
  const [occupancy, setOccupancy] = useState(Math.round(stats.occupancy * 100) || 40);
  const [rent, setRent] = useState(22_000);
  const [vacantMonths, setVacantMonths] = useState(1);

  const shortStay = (occ: number) => (occ / 100) * 30.4 * (nightly - stats.variablePerNight) - stats.fixedMonthly;
  const longTerm = (rent * (12 - vacantMonths)) / 12 - longTermCosts - stats.loanPayment;

  const ss = shortStay(occupancy);
  const winner = ss >= longTerm ? "short" : "long";
  const diff = Math.abs(ss - longTerm);
  // Occupancy at which both options earn the same.
  const perPoint = (30.4 * (nightly - stats.variablePerNight)) / 100;
  const equalAt = perPoint > 0 ? (longTerm + stats.fixedMonthly) / perPoint : Infinity;

  const curve = Array.from({ length: 17 }, (_, i) => {
    const occ = 10 + i * 5;
    return { occ, shortStay: shortStay(occ), longTerm };
  });

  return (
    <>
      <PageHeader
        title="Short stay vs. monthly rental"
        description={`Should ${unit.name} stay on Airbnb, or go to a long-term tenant? Both options pay the same loan. Adjust the numbers to match your unit.`}
        actions={picker}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardTitle>Short stay (Airbnb)</CardTitle>
          <MoneyInput label="Average nightly payout" php={nightly} onChange={setNightly} />
          <Slider label="Occupancy" value={occupancy} onChange={setOccupancy} min={10} max={90} suffix="%" />
          <p className="mt-3 text-xs text-muted">
            Costs from your data: {money.format(stats.variablePerNight)} per booked night (cleaning, supplies, fees, utilities) plus{" "}
            {money.format(stats.fixedMonthly)} a month fixed, including the loan.
          </p>

          <div className="my-5 border-t border-border" />

          <CardTitle>Monthly rental</CardTitle>
          <MoneyInput label="Monthly rent" php={rent} onChange={setRent} />
          <Slider label="Vacant months per year" value={vacantMonths} onChange={setVacantMonths} min={0} max={4} suffix=" mo" />
          <p className="mt-3 text-xs text-muted">Tenant pays utilities and internet. You keep paying dues, upkeep and the loan.</p>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultCard title="Short stay" value={ss} highlight={winner === "short"} />
            <ResultCard title="Monthly rental" value={longTerm} highlight={winner === "long"} />
          </div>
          <div className="rounded-xl border border-brand/30 bg-brand-soft p-4 text-sm text-foreground">
            <strong>{winner === "short" ? "Short stay" : "Monthly rental"}</strong> earns {money.format(diff)} more per month at these numbers.{" "}
            {Number.isFinite(equalAt) && equalAt > 0 && equalAt < 100
              ? `Short stay only wins above ${Math.round(equalAt)}% occupancy, and it also needs a turnover, cleaning and guest messages for every booking.`
              : "Short stay can't beat the monthly rent at this nightly rate."}
          </div>
          <Card>
            <CardTitle hint="Monthly cash flow after the loan payment, by Airbnb occupancy">How occupancy changes the answer</CardTitle>
            <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-series-1" aria-hidden /> Short stay
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-t-2 border-dashed border-series-2" aria-hidden /> Monthly rental
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="occ" tickFormatter={(v) => `${v}%`} tick={axis} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => money.compact(v)} tick={axis} axisLine={false} tickLine={false} width={64} />
                  <ReferenceLine y={0} stroke="var(--muted)" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as (typeof curve)[number];
                      return (
                        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
                          <div className="mb-1 font-semibold">{d.occ}% occupancy</div>
                          <div className="flex justify-between gap-6 text-muted">
                            Short stay <span className="tabular text-foreground">{money.format(d.shortStay)}</span>
                          </div>
                          <div className="flex justify-between gap-6 text-muted">
                            Monthly rental <span className="tabular text-foreground">{money.format(d.longTerm)}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line dataKey="longTerm" stroke="var(--series-2)" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                  <Line dataKey="shortStay" stroke="var(--series-1)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  <ReferenceDot x={Math.min(90, Math.max(10, Math.round(occupancy / 5) * 5))} y={shortStay(Math.min(90, Math.max(10, Math.round(occupancy / 5) * 5)))} r={5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function ResultCard({ title, value, highlight }: { title: string; value: number; highlight: boolean }) {
  const money = useMoney();
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-brand bg-surface ring-1 ring-brand" : "border-border bg-surface"}`}>
      <div className="flex items-center justify-between text-xs font-medium text-muted">
        {title}
        {highlight && <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">Better</span>}
      </div>
      <div className={`tabular mt-1 text-2xl font-semibold ${value >= 0 ? "text-good" : "text-critical"}`}>{money.format(value)}</div>
      <div className="text-xs text-muted">cash flow / month after loan</div>
    </div>
  );
}

function MoneyInput({ label, php, onChange }: { label: string; php: number; onChange: (php: number) => void }) {
  const money = useMoney();
  return (
    <label className="mb-3 block text-xs font-medium text-muted">
      {label} ({money.code})
      <input
        type="number"
        min="0"
        value={Math.round(money.fromPhp(php) * 100) / 100}
        onChange={(e) => onChange(money.toPhp(Number(e.target.value)))}
        className="tabular mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground"
      />
    </label>
  );
}

function Slider({ label, value, onChange, min, max, suffix }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; suffix: string }) {
  return (
    <label className="block text-xs font-medium text-muted">
      <span className="flex justify-between">
        {label}
        <span className="tabular text-foreground">
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-[var(--brand)]" />
    </label>
  );
}
