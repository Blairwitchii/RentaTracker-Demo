"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { sum } from "@/lib/finance";
import { MODE_LABEL, expenseByCategory, monthlySummary, shortStayStats } from "@/lib/reports";
import { useDemoData } from "@/lib/store";
import { useMoney } from "@/lib/currency";
import { CashFlowChart, CategoryBars, RevenueExpenseChart } from "@/components/charts";
import { Card, CardTitle, PageHeader, Select, Stat } from "@/components/ui";

export default function DashboardPage() {
  const money = useMoney();
  const data = useDemoData();
  const [scope, setScope] = useState("all");
  const inScope = scope === "all" ? data.properties : data.properties.filter((p) => p.id === scope);
  const ids = inScope.map((p) => p.id);

  const months = monthlySummary(data, ids);
  const categories = expenseByCategory(data, ids);
  const shortStay = inScope.find((p) => p.mode === "short-stay");
  const stats = shortStay ? shortStayStats(data, shortStay.id) : null;

  const revenue = sum(months.map((m) => m.revenue));
  const cost = sum(months.map((m) => m.expenses));
  const profit = revenue - cost;
  const cashFlow = sum(months.map((m) => m.cashFlow));

  if (data.properties.length === 0) {
    return (
      <>
        <PageHeader title="Profit dashboard" />
        <Card className="text-center text-sm text-muted">
          No properties yet.{" "}
          <Link href="/properties" className="font-medium text-brand underline">
            Add your first unit
          </Link>
          .
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Profit dashboard"
        description="Last 12 months (Oct 2025 – Sep 2026). Loan interest counts as an expense; loan principal is equity you keep, so it's only subtracted for cash flow."
        actions={
          <Select
            label="Property"
            value={inScope.length === 1 ? scope : "all"}
            onChange={setScope}
            options={[{ value: "all", label: "All properties" }, ...data.properties.map((p) => ({ value: p.id, label: p.name }))]}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={money.format(revenue)} hint={`${money.format(revenue / 12)} / month`} />
        <Stat label="Expenses" value={money.format(cost)} hint="Includes loan interest" />
        <Stat label="Net profit" value={money.format(profit)} tone={profit >= 0 ? "good" : "critical"} hint={revenue ? `${Math.round((profit / revenue) * 100)}% margin` : undefined} />
        <Stat label="Cash flow after loan" value={money.format(cashFlow)} tone={cashFlow >= 0 ? "good" : "critical"} hint="What actually reached your pocket" />
      </div>

      {shortStay && stats && stats.loanPayment > 0 && Number.isFinite(stats.breakEven) && (
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <Lightbulb size={20} className="mt-0.5 shrink-0 text-warning" aria-hidden />
          <p>
            <strong>
              {shortStay.name} needs {stats.breakEven} booked nights a month to break even
            </strong>{" "}
            after the full loan payment. It averaged {stats.avgNightsPerMonth.toFixed(1)} nights.
            {stats.revenue > 0 && ` The loan payment alone takes ${Math.round((stats.loanPayment / (stats.revenue / 12)) * 100)}% of its booking revenue.`}
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle hint="Hover a month for the breakdown">Revenue vs. expenses</CardTitle>
          <RevenueExpenseChart data={months} />
        </Card>
        <Card>
          <CardTitle hint="12-month total">Where the money goes</CardTitle>
          <CategoryBars items={categories.slice(0, 8)} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle hint="Net profit minus loan principal. Red months needed money from your own pocket.">Monthly cash flow after loan payment</CardTitle>
          <CashFlowChart data={months} />
        </Card>
        <Card>
          <CardTitle hint={<Link href="/properties" className="text-brand underline">Add or remove units</Link>}>Properties</CardTitle>
          <ul className="divide-y divide-border">
            {data.properties.map((p) => {
              const cf = sum(monthlySummary(data, [p.id]).map((x) => x.cashFlow));
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted">
                      {p.kind} · {MODE_LABEL[p.mode]} · {p.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`tabular text-sm font-semibold ${cf >= 0 ? "text-good" : "text-critical"}`}>{money.format(cf / 12)}</div>
                    <div className="text-xs text-muted">cash / month</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {shortStay && stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={`${shortStay.name} occupancy`} value={`${Math.round(stats.occupancy * 100)}%`} hint={`${stats.nights} nights · ${stats.bookings} bookings`} />
          <Stat label="Average nightly payout" value={money.format(stats.adr)} />
          <Stat label="Monthly loan payment" value={money.format(stats.loanPayment)} hint={stats.loanPayment ? "Interest + principal" : "No loan"} />
          <Stat
            label="Break-even nights"
            value={Number.isFinite(stats.breakEven) ? `${stats.breakEven} / month` : "—"}
            hint={`Costs per booked night: ${money.format(stats.variablePerNight)}`}
          />
        </div>
      )}
    </>
  );
}
