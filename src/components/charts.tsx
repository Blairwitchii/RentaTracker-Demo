"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthSummary } from "@/lib/reports";
import { monthLabel } from "@/lib/reports";
import { useMoney } from "@/lib/currency";

const axis = { fontSize: 12, fill: "var(--muted)" };

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} aria-hidden />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string; strong?: boolean }[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold text-foreground">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className={`flex items-center justify-between gap-6 ${r.strong ? "mt-1 border-t border-border pt-1 font-semibold text-foreground" : "text-muted"}`}>
          <span className="flex items-center gap-1.5">
            {r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} aria-hidden />}
            {r.label}
          </span>
          <span className="tabular text-foreground">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueExpenseChart({ data }: { data: MonthSummary[] }) {
  const money = useMoney();
  return (
    <div>
      <Legend
        items={[
          { label: "Revenue", color: "var(--series-1)" },
          { label: "Expenses incl. loan interest", color: "var(--series-2)" },
        ]}
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m)} tick={axis} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => money.compact(v)} tick={axis} axisLine={false} tickLine={false} width={64} />
            <Tooltip
              cursor={{ fill: "var(--background)" }}
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
            <Bar dataKey="revenue" name="Revenue" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="expenses" name="Expenses" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CashFlowChart({ data }: { data: MonthSummary[] }) {
  const money = useMoney();
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m)} tick={axis} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => money.compact(v)} tick={axis} axisLine={false} tickLine={false} width={64} />
          <ReferenceLine y={0} stroke="var(--muted)" />
          <Tooltip
            cursor={{ fill: "var(--background)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as MonthSummary;
              return (
                <TooltipBox
                  title={monthLabel(d.month, "long")}
                  rows={[
                    { label: "Net profit", value: money.format(d.netProfit) },
                    { label: "Loan principal paid", value: `− ${money.format(d.principal)}` },
                    { label: d.cashFlow >= 0 ? "Cash left over" : "Cash shortfall", value: money.format(d.cashFlow), strong: true },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="cashFlow" radius={4} maxBarSize={28}>
            {data.map((d) => (
              <Cell key={d.month} fill={d.cashFlow >= 0 ? "var(--series-1)" : "var(--critical)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars in plain HTML: every value is labelled, so no tooltip is needed. */
export function CategoryBars({ items }: { items: { category: string; amount: number }[] }) {
  const money = useMoney();
  const max = Math.max(...items.map((i) => i.amount), 1);
  const total = items.reduce((s, i) => s + i.amount, 0);
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.category}>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="text-foreground">{i.category}</span>
            <span className="tabular text-muted">
              {money.format(i.amount)} · {Math.round((i.amount / total) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-background">
            <div className="h-2 rounded-full bg-series-2" style={{ width: `${(i.amount / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
