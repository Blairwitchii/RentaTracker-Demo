// Fictional demo data. Every name, unit and number here is made up.
// Generated from a fixed seed so the server and browser always render the same data.

import { loanSplit, type Loan } from "@/lib/finance";

export type PropertyMode = "short-stay" | "long-term" | "bedspace";

export type Property = {
  id: string;
  name: string;
  location: string;
  mode: PropertyMode;
  loan?: Loan;
};

export type Channel = "Airbnb" | "Direct (Facebook)" | "Booking.com";

export type Booking = {
  id: string;
  propertyId: string;
  guest: string;
  checkIn: string; // YYYY-MM-DD
  nights: number;
  guests: number;
  channel: Channel;
  payout: number;
};

export type Income = { propertyId: string; month: string; amount: number; source: string };

export type Expense = {
  id: string;
  propertyId: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  amount: number;
  recurring: boolean;
};

export type PaymentStatus = "paid" | "due-soon" | "overdue";

export type Tenant = {
  name: string;
  since: string;
  dueDay: number;
  balance: number; // unpaid amount carried over (utang)
  status: PaymentStatus;
  lastPayment: string;
  method: "GCash" | "Maya" | "Cash" | "Bank transfer";
};

export type Bed = { id: string; label: string; rent: number; tenant?: Tenant };
export type Room = { id: string; name: string; aircon: boolean; beds: Bed[]; prevReading: number; currReading: number };

export const TODAY = "2026-10-03";

export const MONTHS = [
  "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
  "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
];

export const properties: Property[] = [
  {
    id: "sunset",
    name: "Sunset Bay Suites 12F",
    location: "Tagaytay",
    mode: "short-stay",
    loan: { principal: 2_600_000, annualRate: 0.07, years: 20, startMonth: "2024-01" },
  },
  { id: "azure", name: "Azure Residences 1BR", location: "Parañaque", mode: "long-term" },
  { id: "casaverde", name: "Casa Verde Dorm", location: "Sampaloc, Manila", mode: "bedspace" },
];

// ---- seeded random ----
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261003);
const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));

const FIRST = ["Andrea", "Miguel", "Camille", "Paolo", "Bea", "Carlo", "Trisha", "Josh", "Kim", "Leah", "Marco", "Nina", "Rafael", "Sofia", "Hannah", "Daniel", "Emma", "Liam", "Yuki", "Min-jun", "Olivia", "Noah", "Isabel", "Gabriel"];
const LAST = ["Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Mendoza", "Villanueva", "Ramos", "Torres", "Navarro", "Tan", "Lim", "Smith", "Park", "Tanaka", "Müller", "Dela Cruz", "Aquino"];
const guestName = () => `${pick(FIRST)} ${pick(LAST)}`;

// ---- date helpers (UTC, string based) ----
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
const dayOfWeek = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

// ---- short-stay bookings (Sunset Bay) ----
const PEAK: Record<string, number> = { "12": 0.7, "04": 0.62, "05": 0.6, "01": 0.45, "11": 0.42, "06": 0.3, "07": 0.18, "08": 0.16, "09": 0.2, "10": 0.35, "02": 0.38, "03": 0.45 };
const CHANNEL_FEE: Record<Channel, number> = { Airbnb: 0.03, "Direct (Facebook)": 0, "Booking.com": 0.15 };

function nightlyRate(date: string, month: string) {
  const weekend = [5, 6].includes(dayOfWeek(date));
  const peak = ["12", "04", "05"].includes(month.slice(5));
  return (weekend ? 3400 : 2600) + (peak ? 400 : 0);
}

export const bookings: Booking[] = [];
{
  let date = "2025-10-01";
  const end = "2026-09-30";
  let id = 1;
  while (date <= end) {
    const month = date.slice(0, 7);
    const target = PEAK[month.slice(5)];
    // Weekends book more easily than weekdays.
    const chance = [5, 6].includes(dayOfWeek(date)) ? Math.min(0.9, target + 0.2) : target * 0.6;
    if (rand() < chance) {
      const nights = Math.min(pick([1, 1, 2, 2, 2, 3, 3, 4, 5]), Math.max(1, Math.round((Date.parse(end) - Date.parse(date)) / 864e5) + 1));
      let gross = 0;
      for (let i = 0; i < nights; i++) gross += nightlyRate(addDays(date, i), month);
      const channel: Channel = rand() < 0.68 ? "Airbnb" : rand() < 0.7 ? "Direct (Facebook)" : "Booking.com";
      bookings.push({
        id: `B${String(id++).padStart(3, "0")}`,
        propertyId: "sunset",
        guest: guestName(),
        checkIn: date,
        nights,
        guests: between(2, 4),
        channel,
        payout: gross,
      });
      date = addDays(date, nights + (rand() < 0.5 ? 0 : between(1, 2)));
    } else {
      date = addDays(date, 1);
    }
  }
}

// ---- income ----
export const incomes: Income[] = [];
for (const month of MONTHS) {
  const sunset = bookings.filter((b) => b.checkIn.startsWith(month));
  incomes.push({ propertyId: "sunset", month, amount: sunset.reduce((s, b) => s + b.payout, 0), source: "Bookings" });
  incomes.push({ propertyId: "azure", month, amount: 18_000, source: "Monthly rent" });
}

// ---- bedspace (Casa Verde) ----
const BEDSPACE_NAMES = ["Jessa M.", "Rodel P.", "Kristine A.", "Mark Anthony L.", "Joy C.", "Ella V.", "Kevin S.", "Aira D.", "Bryan T.", "Lovely R.", "Jerome B.", "Princess G.", "Arvin F.", "Mae O."];

export const rooms: Room[] = [
  { id: "R1", name: "Room 1", aircon: true, prevReading: 4120, currReading: 4386 },
  { id: "R2", name: "Room 2", aircon: true, prevReading: 3877, currReading: 4119 },
  { id: "R3", name: "Room 3", aircon: false, prevReading: 2210, currReading: 2298 },
  { id: "R4", name: "Room 4", aircon: false, prevReading: 1984, currReading: 2069 },
].map((room) => ({ ...room, beds: [] as Bed[] }));
{
  const vacant = new Set(["R2-B4", "R4-B2", "R4-B4"]);
  const statuses: PaymentStatus[] = ["paid", "paid", "paid", "paid", "due-soon", "paid", "overdue", "paid", "due-soon", "paid", "paid", "overdue", "paid", "paid"];
  const methods: Tenant["method"][] = ["GCash", "GCash", "GCash", "Maya", "Cash", "GCash", "Bank transfer"];
  let t = 0;
  for (const room of rooms) {
    for (let b = 1; b <= 4; b++) {
      const id = `${room.id}-B${b}`;
      const rent = room.aircon ? 4200 : 3500;
      const bed: Bed = { id, label: `${b % 2 ? "Lower" : "Upper"} bunk ${Math.ceil(b / 2)}`, rent };
      if (!vacant.has(id) && t < BEDSPACE_NAMES.length) {
        const status = statuses[t];
        bed.tenant = {
          name: BEDSPACE_NAMES[t],
          since: `2025-${String(between(3, 12)).padStart(2, "0")}-01`,
          dueDay: pick([1, 5, 15]),
          balance: status === "overdue" ? rent + between(0, 1) * 1500 : status === "due-soon" ? 0 : pick([0, 0, 0, 500]),
          status,
          lastPayment: status === "overdue" ? "2026-08-05" : "2026-09-" + String(between(1, 28)).padStart(2, "0"),
          method: pick(methods),
        };
        t++;
      }
      room.beds.push(bed);
    }
  }
}

const bedCount = rooms.reduce((s, r) => s + r.beds.length, 0);
for (const [i, month] of MONTHS.entries()) {
  // Occupancy dips over summer break, fills up when classes start (June/August).
  const occupied = [14, 14, 12, 13, 14, 13, 10, 9, 12, 13, 14, 13][i];
  const avgRent = 3850;
  incomes.push({ propertyId: "casaverde", month, amount: Math.min(occupied, bedCount) * avgRent, source: "Bed rent" });
}

// ---- expenses ----
export const expenses: Expense[] = [];
{
  let id = 1;
  const add = (propertyId: string, date: string, description: string, category: string, amount: number, recurring = false) =>
    expenses.push({ id: `E${String(id++).padStart(4, "0")}`, propertyId, date, description, category, amount: Math.round(amount * 100) / 100, recurring });

  const sunset = properties[0];
  for (const month of MONTHS) {
    const monthBookings = bookings.filter((b) => b.checkIn.startsWith(month));
    const nights = monthBookings.reduce((s, b) => s + b.nights, 0);

    // Sunset Bay — short stay with a bank loan
    add("sunset", `${month}-05`, "Association dues", "Association dues", 3450, true);
    add("sunset", `${month}-08`, "Fiber internet", "Internet", 1299, true);
    add("sunset", `${month}-10`, "Streaming subscription", "Subscriptions", 549, true);
    add("sunset", `${month}-12`, "Electricity bill", "Electricity", 1200 + nights * 95);
    add("sunset", `${month}-14`, "Water bill", "Water", 250 + nights * 18);
    if (sunset.loan) {
      const split = loanSplit(sunset.loan, month);
      add("sunset", `${month}-15`, "Home loan interest", "Loan interest", split.interest, true);
    }
    add("sunset", `${month}-15`, "Mortgage redemption insurance", "Insurance", 1150, true);
    if (monthBookings.length) {
      add("sunset", `${month}-20`, `Cleaning (${monthBookings.length} turnovers)`, "Cleaning", monthBookings.length * 600);
      add("sunset", `${month}-21`, "Guest supplies & toiletries", "Supplies", monthBookings.length * 220);
      const fees = monthBookings.reduce((s, b) => s + b.payout * CHANNEL_FEE[b.channel], 0);
      if (fees) add("sunset", `${month}-28`, "Platform host fees", "Platform fees", fees);
    }
    if (rand() < 0.3) add("sunset", `${month}-${between(10, 25)}`, pick(["Aircon cleaning", "Shower head replacement", "Door lock battery", "Repaint touch-up"]), "Repairs", between(400, 2500));

    // Azure — long-term, fully paid, tenant pays utilities
    add("azure", `${month}-05`, "Association dues", "Association dues", 3100, true);
    if (month === "2026-01") add("azure", "2026-01-20", "Real property tax (annual)", "Taxes & permits", 6800);
    if (rand() < 0.2) add("azure", `${month}-18`, pick(["Plumbing repair", "Ref gasket replacement", "Water heater check"]), "Repairs", between(800, 3500));

    // Casa Verde — leased building run as a bedspace
    add("casaverde", `${month}-01`, "Building lease", "Lease", 28_000, true);
    add("casaverde", `${month}-10`, "Common area electricity", "Electricity", between(2600, 3400));
    add("casaverde", `${month}-12`, "Water bill", "Water", between(2200, 2900));
    add("casaverde", `${month}-08`, "Internet (shared Wi-Fi)", "Internet", 1699, true);
    add("casaverde", `${month}-30`, "Caretaker allowance", "Staff", 6000, true);
    if (rand() < 0.35) add("casaverde", `${month}-${between(10, 25)}`, pick(["Bunk bed repair", "Electric fan replacement", "Pest control", "Toilet repair"]), "Repairs", between(500, 3000));
  }
  add("sunset", "2026-01-22", "Business permit renewal", "Taxes & permits", 7500);
  add("casaverde", "2026-01-22", "Business permit renewal", "Taxes & permits", 5200);
  add("sunset", "2026-04-10", "Bookkeeping & BIR filing", "Accounting", 3000);
  expenses.sort((a, b) => a.date.localeCompare(b.date));
}

/** Loan payment split per month for properties with a loan. */
export function loanForMonth(propertyId: string, month: string) {
  const property = properties.find((p) => p.id === propertyId);
  if (!property?.loan) return { payment: 0, interest: 0, principal: 0, balance: 0 };
  return loanSplit(property.loan, month);
}
