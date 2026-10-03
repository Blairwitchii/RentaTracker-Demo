"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { properties } from "@/data/demo";
import { sum } from "@/lib/finance";
import { expenseByCategory, monthlySummary, shortStayStats } from "@/lib/reports";
import { useMoney } from "@/lib/currency";
import { CashFlowChart, CategoryBars, RevenueExpenseChart } from "@/components/charts";
import { Card, CardTitle, PageHeader, Select, Stat } from "@/components/ui";

const MODE_LABEL = { "short-stay": "Short stay", "long-term": "Monthly rental", bedspace: "Bedspace" };

export default function DashboardPage() {
  const money = useMoney();
  const [scope, setScope] = useState("all");
  const ids = scope === "all" ? properties.map((p) => p.id) : [scope];

  const months = monthlySummary(ids);
  const categories = expenseByCategory(ids);
  const sunset = shortStayStats("sunset");

  const revenue = sum(months.map((m) => m.revenue));
  const cost = sum(months.map((m) => m.expenses));
  const profit = revenue - cost;
  const cashFlow = sum(months.map((m) => m.cashFlow));
  const loanShare = sunset.loanPayment / (sunset.revenue / 12);

  return (
    <>
      <PageHeader
        title="Profit dashboard"
        description="Last 12 months (Oct 2025 – Sep 2026). Loan interest counts as an expense; loan principal is equity you keep, so it's only subtracted for cash flow."
        actions={
          <Select
            label="Property"
            value={scope}
            onChange={setScope}
            options={[{ value: "all", label: "All properties" }, ...properties.map((p) => ({ value: p.id, label: p.name }))]}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={money.format(revenue)} hint={`${money.format(revenue / 12)} / month`} />
        <Stat label="Expenses" value={money.format(cost)} hint="Includes loan interest" />
        <Stat label="Net profit" value={money.format(profit)} tone={profit >= 0 ? "good" : "critical"} hint={`${Math.round((profit / revenue) * 100)}% margin`} />
        <Stat
          label="Cash flow after loan"
          value={money.format(cashFlow)}
          tone={cashFlow >= 0 ? "good" : "critical"}
          hint="What actually reached your pocket"
        />
      </div>

      {(scope === "all" || scope === "sunset") && (
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <Lightbulb size={20} className="mt-0.5 shrink-0 text-warning" aria-hidden />
          <p>
            <strong>Sunset Bay needs {sunset.breakEven} booked nights a month to break even</strong> after the full loan payment. It
            averaged {sunset.avgNightsPerMonth.toFixed(1)} nights. The loan payment alone takes {Math.round(loanShare * 100)}% of its
            booking revenue.
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
          <CardTitle>Properties</CardTitle>
          <ul className="divide-y divide-border">
            {properties.map((p) => {
              const m = monthlySummary([p.id]);
              const cf = sum(m.map((x) => x.cashFlow));
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted">
                      {MODE_LABEL[p.mode]} · {p.location}
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

      {(scope === "all" || scope === "sunset") && (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Sunset Bay occupancy" value={`${Math.round(sunset.occupancy * 100)}%`} hint={`${sunset.nights} nights · ${sunset.bookings} bookings`} />
          <Stat label="Average nightly payout" value={money.format(sunset.adr)} />
          <Stat label="Monthly loan payment" value={money.format(sunset.loanPayment)} hint="Interest + principal" />
          <Stat label="Break-even nights" value={`${sunset.breakEven} / month`} hint={`Costs per booked night: ${money.format(sunset.variablePerNight)}`} />
        </div>
      )}
    </>
  );
}
