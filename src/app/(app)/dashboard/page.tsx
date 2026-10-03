"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarRange, Lightbulb, MapPin } from "lucide-react";
import { CHANNELS, MONTHS } from "@/data/demo";
import { sum } from "@/lib/finance";
import { MODE_LABEL, expenseByCategory, monthLabel, monthlyOccupancy, monthlySummary, pctChange, shortStayStats } from "@/lib/reports";
import { useDemoData } from "@/lib/store";
import { useMoney } from "@/lib/currency";
import { CashFlowLine, CategoryBars, ChannelDots, CollectionBlocks, Legend, OccupancyBars, RevenueExpenseChart } from "@/components/charts";
import { Card, CardTitle, Delta, IconBadge, PageHeader, Select } from "@/components/ui";

const CHANNEL_COLOR = { Airbnb: "var(--series-1)", "Direct (Facebook)": "var(--series-2)", "Booking.com": "var(--series-3)" } as const;

export default function DashboardPage() {
  const money = useMoney();
  const data = useDemoData();
  const [scope, setScope] = useState("all");

  if (data.properties.length === 0) {
    return (
      <>
        <PageHeader title="Overview" />
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

  const inScope = scope === "all" ? data.properties : data.properties.filter((p) => p.id === scope);
  const ids = inScope.map((p) => p.id);
  const months = monthlySummary(data, ids);
  const [prev, last] = months.slice(-2);
  const total = (key: "revenue" | "expenses" | "netProfit" | "cashFlow") => sum(months.map((m) => m[key]));

  const shortStay = inScope.find((p) => p.mode === "short-stay");
  const stats = shortStay ? shortStayStats(data, shortStay.id) : null;
  const occupancy = shortStay ? monthlyOccupancy(data, shortStay.id) : [];
  const avgOccupancy = occupancy.length ? sum(occupancy.map((o) => o.occupancy)) / occupancy.length : 0;

  const stays = data.bookings.filter((b) => ids.includes(b.propertyId) && MONTHS.includes(b.checkIn.slice(0, 7)));
  const channels = CHANNELS.map((c) => ({ label: c, count: stays.filter((b) => b.channel === c).length, color: CHANNEL_COLOR[c] }));

  const tenants = [
    ...data.doors.filter((d) => ids.includes(d.propertyId)),
    ...data.rooms.filter((r) => ids.includes(r.propertyId)).flatMap((r) => r.beds),
  ].flatMap((space) => (space.tenant ? [space.tenant] : []));
  const statusCount = (s: string) => tenants.filter((t) => t.status === s).length;
  const owed = sum(tenants.map((t) => t.balance));

  const kpis = [
    { label: "Revenue", value: total("revenue"), delta: pctChange(last.revenue, prev.revenue), goodWhenUp: true },
    { label: "Expenses", value: total("expenses"), delta: pctChange(last.expenses, prev.expenses), goodWhenUp: false },
    { label: "Net profit", value: total("netProfit"), delta: pctChange(last.netProfit, prev.netProfit), goodWhenUp: true },
    { label: "Cash after loan", value: total("cashFlow"), delta: pctChange(last.cashFlow, prev.cashFlow), goodWhenUp: true },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        actions={
          <>
            <Select
              label="Property"
              icon={<MapPin size={15} />}
              value={inScope.length === 1 ? scope : "all"}
              onChange={setScope}
              options={[{ value: "all", label: "All properties" }, ...data.properties.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-sm">
              <CalendarRange size={15} className="text-muted" aria-hidden /> Oct 2025 – Sep 2026
            </span>
          </>
        }
      />

      {/* KPI strip */}
      <Card className="grid grid-cols-2 gap-y-5 p-0 py-5 lg:grid-cols-4 lg:divide-x lg:divide-border">
        {kpis.map((k) => (
          <div key={k.label} className="px-5">
            <div className="text-sm text-muted">{k.label}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`tabular text-2xl font-semibold tracking-tight ${k.value < 0 ? "text-critical" : ""}`}>{money.format(k.value)}</span>
              <Delta value={k.delta} goodWhenUp={k.goodWhenUp} suffix={`vs ${monthLabel(prev.month).slice(0, 3)}`} />
            </div>
          </div>
        ))}
      </Card>

      {stats && stats.loanPayment > 0 && Number.isFinite(stats.breakEven) && (
        <div className="mt-4 flex gap-3 rounded-3xl bg-brand px-5 py-4 text-sm text-white">
          <Lightbulb size={20} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            <strong>
              {shortStay!.name} needs {stats.breakEven} booked nights a month to break even
            </strong>{" "}
            after the full loan payment. It averaged {stats.avgNightsPerMonth.toFixed(1)}.
            {stats.revenue > 0 && ` The loan alone takes ${Math.round((stats.loanPayment / (stats.revenue / 12)) * 100)}% of its booking revenue.`}
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle
            hint="Monthly, hover for details"
            action={
              <Legend
                items={[
                  { label: "Revenue", color: "var(--series-1)", hatched: true },
                  { label: "Expenses incl. interest", color: "var(--series-2)" },
                ]}
              />
            }
          >
            Reports
          </CardTitle>
          <RevenueExpenseChart data={months} />
        </Card>

        <Card>
          <CardTitle
            hint="Bookings by channel, last 12 months"
            action={
              <Link href="/calendar" aria-label="Open calendar">
                <IconBadge>
                  <ArrowUpRight size={16} />
                </IconBadge>
              </Link>
            }
          >
            Booking channels
          </CardTitle>
          {stays.length ? <ChannelDots items={channels} /> : <p className="text-sm text-muted">No short-stay bookings in this selection.</p>}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardTitle hint="Monthly, apartment and bedspace tenants">Rent collection</CardTitle>
          {tenants.length ? (
            <>
              <Link href="/tenants" className="mb-3 flex items-center justify-between rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white">
                Tenants: {tenants.length}
                <ArrowUpRight size={16} aria-hidden />
              </Link>
              <CollectionBlocks counts={{ paid: statusCount("paid"), "due-soon": statusCount("due-soon"), overdue: statusCount("overdue") }} owed={owed} />
            </>
          ) : (
            <p className="text-sm text-muted">No tenants in this selection.</p>
          )}
        </Card>

        <Card>
          <CardTitle hint={shortStay ? shortStay.name : undefined}>Occupancy</CardTitle>
          {shortStay ? (
            <>
              <div className="text-xs text-muted">Average</div>
              <div className="tabular text-2xl font-semibold">{Math.round(avgOccupancy * 100)}%</div>
              <OccupancyBars data={occupancy} />
            </>
          ) : (
            <p className="text-sm text-muted">No short-stay unit in this selection.</p>
          )}
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardTitle hint="Net profit minus loan principal">Cash flow</CardTitle>
          <div className="flex items-center gap-2">
            <span className={`tabular text-2xl font-semibold ${total("cashFlow") < 0 ? "text-critical" : ""}`}>{money.format(total("cashFlow") / 12)}</span>
            <span className="text-xs text-muted">avg / month</span>
          </div>
          <CashFlowLine data={months} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle
            action={
              <Link href="/properties" className="text-xs font-medium text-brand">
                Manage units →
              </Link>
            }
          >
            Properties
          </CardTitle>
          <ul className="divide-y divide-border">
            {data.properties.map((p) => {
              const ms = monthlySummary(data, [p.id]);
              const cf = sum(ms.map((x) => x.cashFlow));
              const rev = sum(ms.map((x) => x.revenue));
              return (
                <li key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto_auto]">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted">
                      {p.kind} · {MODE_LABEL[p.mode]} · {p.location}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="tabular text-sm">{money.format(rev / 12)}</div>
                    <div className="text-xs text-muted">revenue / mo</div>
                  </div>
                  <div className="w-28 text-right">
                    <div className={`tabular text-sm font-semibold ${cf >= 0 ? "text-good" : "text-critical"}`}>{money.format(cf / 12)}</div>
                    <div className="text-xs text-muted">cash / mo</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardTitle hint="12-month total">Where the money goes</CardTitle>
          <CategoryBars items={expenseByCategory(data, ids).slice(0, 7)} />
        </Card>
      </div>
    </>
  );
}
