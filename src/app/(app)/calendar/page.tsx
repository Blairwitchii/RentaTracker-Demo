"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, UserPlus } from "lucide-react";
import { CALENDAR_MONTHS, CHANNELS, TODAY, addDays, daysInMonth, type Booking, type Channel } from "@/data/demo";
import { sum } from "@/lib/finance";
import { monthLabel } from "@/lib/reports";
import { actions, useDemoData } from "@/lib/store";
import { useMoney } from "@/lib/currency";
import { Card, CardTitle, PageHeader, Select, Stat } from "@/components/ui";
import { Field, inputClass } from "@/components/form";

const CHANNEL_COLOR: Record<Channel, string> = {
  Airbnb: "var(--series-1)",
  "Direct (Facebook)": "var(--series-2)",
  "Booking.com": "var(--series-3)",
};
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const shortDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default function CalendarPage() {
  const money = useMoney();
  const data = useDemoData();
  const units = data.properties.filter((p) => p.mode === "short-stay");
  const [propertyId, setPropertyId] = useState(units[0]?.id ?? "");
  const [index, setIndex] = useState(CALENDAR_MONTHS.indexOf(TODAY.slice(0, 7)));
  const [formDate, setFormDate] = useState<string | null>(null);

  const property = units.find((p) => p.id === propertyId) ?? units[0];
  if (!property) {
    return (
      <>
        <PageHeader title="Booking calendar" />
        <Card className="text-sm text-muted">
          You have no short-stay units.{" "}
          <Link href="/properties" className="font-medium text-brand underline">
            Add one on the Properties page
          </Link>
          .
        </Card>
      </>
    );
  }

  const month = CALENDAR_MONTHS[index];
  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = daysInMonth(month);
  const unitBookings = data.bookings.filter((b) => b.propertyId === property.id);

  // Which booking occupies each night.
  const nightOf = new Map<string, Booking>();
  for (const b of unitBookings) for (let i = 0; i < b.nights; i++) nightOf.set(addDays(b.checkIn, i), b);

  const monthBookings = unitBookings.filter((b) => b.checkIn.startsWith(month));
  const dates = Array.from({ length: days }, (_, d) => `${month}-${String(d + 1).padStart(2, "0")}`);
  const bookedNights = dates.filter((d) => nightOf.has(d)).length;

  function openForm(date: string) {
    setFormDate(date);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <PageHeader
        title="Booking calendar"
        description="Add guests as they book. In the full version, Airbnb and Booking.com bookings sync in automatically."
        actions={
          <>
            {units.length > 1 && (
              <Select label="Unit" value={property.id} onChange={setPropertyId} options={units.map((u) => ({ value: u.id, label: u.name }))} />
            )}
            <button onClick={() => openForm(TODAY)} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
              <Plus size={16} aria-hidden /> Add booking
            </button>
          </>
        }
      />

      {formDate && (
        <AddBookingForm
          key={formDate}
          propertyId={property.id}
          defaultDate={formDate}
          isTaken={(date, nights) => Array.from({ length: nights }, (_, i) => addDays(date, i)).some((d) => nightOf.has(d))}
          onDone={(checkIn) => {
            setFormDate(null);
            if (checkIn) {
              const i = CALENDAR_MONTHS.indexOf(checkIn.slice(0, 7));
              if (i >= 0) setIndex(i);
            }
          }}
        />
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="truncate text-sm font-semibold">
          {property.name} <span className="font-normal text-muted">· {property.location}</span>
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="rounded-md border border-border bg-surface p-1.5 disabled:opacity-40" aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <span className="w-32 text-center text-sm font-medium">{monthLabel(month, "long")}</span>
          <button
            onClick={() => setIndex((i) => Math.min(CALENDAR_MONTHS.length - 1, i + 1))}
            disabled={index === CALENDAR_MONTHS.length - 1}
            className="rounded-md border border-border bg-surface p-1.5 disabled:opacity-40"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Booked nights" value={`${bookedNights} / ${days}`} />
        <Stat label="Occupancy" value={`${Math.round((bookedNights / days) * 100)}%`} />
        <Stat label="Booking payouts" value={money.format(sum(monthBookings.map((b) => b.payout)))} hint={`${monthBookings.length} check-ins`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <div className="flex flex-wrap gap-4">
              {CHANNELS.map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHANNEL_COLOR[c] }} aria-hidden />
                  {c}
                </span>
              ))}
            </div>
            <span>Tap an empty day to add a booking</span>
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
            {dates.map((date, d) => {
              const booking = nightOf.get(date);
              const isToday = date === TODAY;
              if (!booking) {
                return (
                  <button
                    key={date}
                    onClick={() => openForm(date)}
                    className={`group flex min-h-16 flex-col rounded-md border bg-background p-1.5 text-left hover:border-brand ${isToday ? "border-brand" : "border-border"}`}
                    aria-label={`Add booking on ${shortDate(date)}`}
                  >
                    <span className="text-xs font-medium text-foreground">{d + 1}</span>
                    <UserPlus size={14} className="mt-auto text-brand opacity-0 group-hover:opacity-100" aria-hidden />
                  </button>
                );
              }
              return (
                <div
                  key={date}
                  title={`${booking.guest} · ${booking.channel} · ${booking.nights} night(s)`}
                  className={`flex min-h-16 flex-col rounded-md border p-1.5 ${isToday ? "border-brand" : "border-transparent"}`}
                  style={{ background: `color-mix(in srgb, ${CHANNEL_COLOR[booking.channel]} 16%, white)` }}
                >
                  <span className="text-xs font-medium text-foreground">{d + 1}</span>
                  {booking.checkIn === date && (
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
          <CardTitle hint="Check-ins this month">Guests</CardTitle>
          {monthBookings.length === 0 ? (
            <p className="text-sm text-muted">No check-ins this month.</p>
          ) : (
            <ul className="divide-y divide-border">
              {monthBookings.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{b.guest}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: CHANNEL_COLOR[b.channel] }} aria-hidden />
                      {shortDate(b.checkIn)} – {shortDate(addDays(b.checkIn, b.nights))} · {b.guests} pax
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="tabular text-sm font-medium">{money.format(b.payout)}</span>
                    <button
                      onClick={() => window.confirm(`Remove ${b.guest}'s booking?`) && actions.removeBooking(b.id)}
                      className="rounded p-1 text-muted hover:bg-red-50 hover:text-critical"
                      aria-label={`Remove ${b.guest}'s booking`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function AddBookingForm({
  propertyId,
  defaultDate,
  isTaken,
  onDone,
}: {
  propertyId: string;
  defaultDate: string;
  isTaken: (date: string, nights: number) => boolean;
  onDone: (checkIn?: string) => void;
}) {
  const money = useMoney();
  const [checkIn, setCheckIn] = useState(defaultDate);
  const [nights, setNights] = useState(2);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTaken(checkIn, nights)) {
      setError("Those dates overlap an existing booking.");
      return;
    }
    const f = new FormData(event.currentTarget);
    actions.addBooking({
      propertyId,
      guest: String(f.get("guest")).trim(),
      checkIn,
      nights,
      guests: Number(f.get("guests")),
      channel: f.get("channel") as Channel,
      payout: money.toPhp(Number(f.get("payout"))),
    });
    onDone(checkIn);
  }

  return (
    <Card className="mb-6">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Guest name">
          <input name="guest" required autoFocus placeholder="e.g. Maria Santos" className={inputClass} />
        </Field>
        <Field label="Check-in">
          <input type="date" value={checkIn} min="2025-10-01" max="2026-12-31" required onChange={(e) => (setCheckIn(e.target.value), setError(""))} className={inputClass} />
        </Field>
        <Field label={`Nights · check-out ${shortDate(addDays(checkIn, nights))}`}>
          <input type="number" min="1" max="60" value={nights} required onChange={(e) => (setNights(Number(e.target.value) || 1), setError(""))} className={inputClass} />
        </Field>
        <Field label="Number of guests">
          <input name="guests" type="number" min="1" max="20" defaultValue={2} required className={inputClass} />
        </Field>
        <Field label="Booked through">
          <select name="channel" className={inputClass}>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label={`Total payout (${money.code})`}>
          <input name="payout" type="number" min="0" step="any" required defaultValue={money.fromPhp(2900 * nights).toFixed(0)} key={nights} className={inputClass} />
        </Field>
        {error && <p className="text-sm text-critical sm:col-span-2 lg:col-span-3">{error}</p>}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <button className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white">Save booking</button>
          <button type="button" onClick={() => onDone()} className="rounded-md border border-border px-4 py-1.5 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
