"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS, addDays, bookings, daysInMonth, type Booking, type Channel } from "@/data/demo";
import { sum } from "@/lib/finance";
import { monthLabel } from "@/lib/reports";
import { useMoney } from "@/lib/currency";
import { Card, CardTitle, PageHeader, Stat } from "@/components/ui";

const CHANNEL_COLOR: Record<Channel, string> = {
  Airbnb: "var(--series-1)",
  "Direct (Facebook)": "var(--series-2)",
  "Booking.com": "var(--series-3)",
};
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const money = useMoney();
  const [index, setIndex] = useState(MONTHS.length - 1);
  const month = MONTHS[index];
  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = daysInMonth(month);

  // Which booking occupies each night of the month.
  const nightOf = new Map<string, Booking>();
  for (const b of bookings) for (let i = 0; i < b.nights; i++) nightOf.set(addDays(b.checkIn, i), b);

  const monthBookings = bookings.filter((b) => b.checkIn.startsWith(month));
  const bookedNights = Array.from({ length: days }, (_, d) => `${month}-${String(d + 1).padStart(2, "0")}`).filter((d) => nightOf.has(d)).length;
  const payout = sum(monthBookings.map((b) => b.payout));

  return (
    <>
      <PageHeader
        title="Booking calendar"
        description="Sunset Bay Suites 12F · Tagaytay. In the full version this fills itself from your Airbnb and Booking.com calendars."
        actions={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="rounded-md border border-border bg-surface p-1.5 disabled:opacity-40"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="w-36 text-center text-sm font-medium">{monthLabel(month, "long")}</span>
            <button
              onClick={() => setIndex((i) => Math.min(MONTHS.length - 1, i + 1))}
              disabled={index === MONTHS.length - 1}
              className="rounded-md border border-border bg-surface p-1.5 disabled:opacity-40"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Booked nights" value={`${bookedNights} / ${days}`} />
        <Stat label="Occupancy" value={`${Math.round((bookedNights / days) * 100)}%`} />
        <Stat label="Booking payouts" value={money.format(payout)} hint={`${monthBookings.length} check-ins`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
            {Object.entries(CHANNEL_COLOR).map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} aria-hidden />
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }, (_, i) => (
              <div key={`pad${i}`} />
            ))}
            {Array.from({ length: days }, (_, d) => {
              const date = `${month}-${String(d + 1).padStart(2, "0")}`;
              const booking = nightOf.get(date);
              const isCheckIn = booking?.checkIn === date;
              return (
                <div
                  key={date}
                  title={booking ? `${booking.guest} · ${booking.channel} · ${booking.nights} night(s)` : "Available"}
                  className={`flex min-h-16 flex-col rounded-md border p-1.5 text-left ${booking ? "border-transparent" : "border-border bg-background"}`}
                  style={booking ? { background: `color-mix(in srgb, ${CHANNEL_COLOR[booking.channel]} 16%, white)` } : undefined}
                >
                  <span className="text-xs font-medium text-foreground">{d + 1}</span>
                  {isCheckIn && (
                    <span className="mt-auto truncate rounded px-1 py-0.5 text-[10px] font-medium text-white" style={{ background: CHANNEL_COLOR[booking.channel] }}>
                      {booking.guest.split(" ")[0]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardTitle hint="Check-ins this month">Bookings</CardTitle>
          {monthBookings.length === 0 ? (
            <p className="text-sm text-muted">No check-ins this month.</p>
          ) : (
            <ul className="divide-y divide-border">
              {monthBookings.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{b.guest}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="h-2 w-2 rounded-sm" style={{ background: CHANNEL_COLOR[b.channel] }} aria-hidden />
                      {b.channel} · {new Date(`${b.checkIn}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} · {b.nights}{" "}
                      {b.nights === 1 ? "night" : "nights"}
                    </div>
                  </div>
                  <span className="tabular text-sm font-medium">{money.format(b.payout)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
