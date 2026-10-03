"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { MonthSummary } from "@/lib/reports";
import { monthLabel } from "@/lib/reports";
import { useMoney } from "@/lib/currency";

const axis = { fontSize: 11, fill: "var(--muted)" };
const HATCH = "repeating-linear-gradient(135deg, var(--series-1) 0 2px, #dbe8f8 2px 5px)";

export function Legend({ items }: { items: { label: string; color: string; hatched?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.hatched ? HATCH : i.color }} aria-hidden />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string; strong?: boolean }[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs shadow-xl">
      <div className="mb-1 font-semibold text-foreground">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className={`flex items-center justify-between gap-6 ${r.strong ? "mt-1 border-t border-border pt-1 font-semibold text-foreground" : "text-muted"}`}>
          <span className="flex items-center gap-1.5">
            {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} aria-hidden />}
            {r.label}
          </span>
          <span className="tabular text-foreground">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Revenue (hatched) vs. expenses per month. */
export function RevenueExpenseChart({ data }: { data: MonthSummary[] }) {
  const money = useMoney();
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={3} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="5" height="5" fill="#dbe8f8" />
              <rect width="2" height="5" fill="var(--series-1)" />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m)} tick={axis} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => money.compact(v)} tick={axis} axisLine={false} tickLine={false} width={60} />
          <Tooltip
            cursor={{ fill: "var(--brand-soft)", radius: 8 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as MonthSummary;
              return (
                <TooltipBox
                  title={monthLabel(d.month, "long")}
                  rows={[
                    { label: "Revenue", value: money.format(d.revenue), color: "var(--series-1)" },
                    { label: "Expenses", value: money.format(d.expenses), color: "var(--series-2)" },
                    { label: "Net profit", value: money.format(d.netProfit), strong: true },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="revenue" fill="url(#hatch)" stroke="var(--series-1)" strokeWidth={1} radius={[6, 6, 0, 0]} maxBarSize={18} />
          <Bar dataKey="expenses" fill="var(--series-2)" radius={[6, 6, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Occupancy per month; the best month is highlighted with its value. */
export function OccupancyBars({ data }: { data: { month: string; occupancy: number }[] }) {
  const best = data.reduce((a, b) => (b.occupancy > a.occupancy ? b : a), data[0]);
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m).slice(0, 3)} tick={axis} axisLine={false} tickLine={false} interval={0} />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as { month: string; occupancy: number };
              return <TooltipBox title={monthLabel(d.month, "long")} rows={[{ label: "Occupancy", value: `${Math.round(d.occupancy * 100)}%` }]} />;
            }}
          />
          <Bar dataKey="occupancy" radius={8}>
            {data.map((d) => (
              <Cell key={d.month} fill={d.month === best?.month ? "var(--brand)" : "var(--brand-light)"} />
            ))}
            <LabelList
              dataKey="occupancy"
              content={(props) => {
                const { x, y, width, value, index } = props as { x: number; y: number; width: number; value: number; index: number };
                if (data[index]?.month !== best?.month) return null;
                const cx = x + width / 2;
                return (
                  <g>
                    <rect x={cx - 18} y={y - 22} width={36} height={18} rx={9} fill="var(--brand)" />
                    <text x={cx} y={y - 9.5} textAnchor="middle" fontSize={10} fontWeight={600} fill="#fff">
                      {Math.round(value * 100)}%
                    </text>
                  </g>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Smooth monthly cash flow after the loan payment. */
export function CashFlowLine({ data }: { data: MonthSummary[] }) {
  const money = useMoney();
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cashfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m).slice(0, 3)} tick={axis} axisLine={false} tickLine={false} minTickGap={8} />
          <YAxis tickFormatter={(v) => money.compact(v)} tick={axis} axisLine={false} tickLine={false} width={56} />
          <ReferenceLine y={0} stroke="var(--muted)" strokeDasharray="4 4" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as MonthSummary;
              return (
                <TooltipBox
                  title={monthLabel(d.month, "long")}
                  rows={[
                    { label: "Net profit", value: money.format(d.netProfit) },
                    { label: "Loan principal", value: `− ${money.format(d.principal)}` },
                    { label: d.cashFlow >= 0 ? "Cash left over" : "Cash shortfall", value: money.format(d.cashFlow), strong: true },
                  ]}
                />
              );
            }}
          />
          <Area type="monotone" dataKey="cashFlow" stroke="var(--series-1)" strokeWidth={2} fill="url(#cashfill)" activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 100-dot grid showing each channel's share of bookings. */
export function ChannelDots({ items }: { items: { label: string; count: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  const dots: string[] = [];
  let used = 0;
  items.forEach((item, i) => {
    const n = i === items.length - 1 ? 100 - used : Math.round((item.count / total) * 100);
    for (let k = 0; k < n; k++) dots.push(item.color);
    used += n;
  });
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="grid grid-cols-10 gap-1.5" role="img" aria-label={items.map((i) => `${i.label} ${Math.round((i.count / total) * 100)}%`).join(", ")}>
        {dots.map((color, i) => (
          <span key={i} className="h-3.5 w-3.5 rounded-full" style={{ background: color }} />
        ))}
      </div>
      <ul className="w-full space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} aria-hidden />
              {i.label}
            </span>
            <span className="tabular font-semibold">
              {i.count} <span className="font-normal text-muted">· {Math.round((i.count / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const COLLECTION = [
  { key: "paid", label: "Paid", icon: CheckCircle2, tint: "bg-green-50", ink: "text-good" },
  { key: "due-soon", label: "Due soon", icon: Clock, tint: "bg-amber-50", ink: "text-warning" },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, tint: "bg-red-50", ink: "text-critical" },
] as const;

/** Rounded blocks sized by how many tenants are paid, due soon, or overdue. */
export function CollectionBlocks({ counts, owed }: { counts: Record<"paid" | "due-soon" | "overdue", number>; owed: number }) {
  const money = useMoney();
  return (
    <div className="flex h-36 gap-1.5">
      {COLLECTION.map(({ key, label, icon: Icon, tint, ink }) => (
        <div key={key} className={`flex min-w-[64px] flex-col justify-between rounded-2xl p-3 ${tint}`} style={{ flexGrow: Math.max(counts[key], 0.6) }}>
          <Icon size={16} className={ink} aria-hidden />
          <div>
            <div className={`tabular text-xl font-semibold ${ink}`}>{counts[key]}</div>
            <div className="text-[11px] text-muted">{label}</div>
            {key === "overdue" && owed > 0 && <div className="tabular text-[11px] font-medium text-critical">{money.format(owed)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Horizontal bars in plain HTML: every value is labelled, so no tooltip is needed. */
export function CategoryBars({ items }: { items: { category: string; amount: number }[] }) {
  const money = useMoney();
  const max = Math.max(...items.map((i) => i.amount), 1);
  const total = items.reduce((s, i) => s + i.amount, 0);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.category}>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="text-foreground">{i.category}</span>
            <span className="tabular text-muted">
              {money.format(i.amount)} · {Math.round((i.amount / total) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-soft">
            <div className="h-2 rounded-full bg-series-2" style={{ width: `${(i.amount / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
