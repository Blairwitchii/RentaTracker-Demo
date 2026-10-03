// Fictional demo data. Every name, unit and number here is made up.
// Generated from a fixed seed so the server and browser always start from the same data.

import { loanSplit, type Loan } from "@/lib/finance";

export type PropertyMode = "short-stay" | "long-term" | "multi-door" | "bedspace";
export type PropertyKind = "Condo unit" | "House" | "Apartment" | "Dorm building";

export type Property = {
  id: string;
  name: string;
  kind: PropertyKind;
  location: string;
  mode: PropertyMode;
  loan?: Loan;
  /** long-term: rent the tenant pays each month */
  monthlyRent?: number;
  /** short-stay: what you pay per turnover */
  cleaningFee?: number;
  suppliesPerStay?: number;
  /** bedspace / multi-door: past monthly rent collected, by month (demo history) */
  incomeHistory?: Record<string, number>;
};

export type Channel = "Airbnb" | "Direct (Facebook)" | "Booking.com";
export const CHANNELS: Channel[] = ["Airbnb", "Direct (Facebook)", "Booking.com"];
export const CHANNEL_FEE: Record<Channel, number> = { Airbnb: 0.03, "Direct (Facebook)": 0, "Booking.com": 0.15 };

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

export type Expense = {
  id: string;
  propertyId: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  amount: number;
  recurring: boolean;
  /** true when calculated from bookings (cleaning, supplies, platform fees) */
  auto?: boolean;
};

export type PaymentStatus = "paid" | "due-soon" | "overdue";
export type PaymentMethod = "GCash" | "Maya" | "Cash" | "Bank transfer";

export type Tenant = {
  name: string;
  since: string;
  dueDay: number;
  balance: number; // unpaid amount carried over (utang)
  status: PaymentStatus;
  lastPayment: string;
  method: PaymentMethod;
};

export type Bed = { id: string; label: string; rent: number; tenant?: Tenant };
export type Room = {
  id: string;
  propertyId: string;
  name: string;
  aircon: boolean;
  beds: Bed[];
  prevReading: number;
  currReading: number;
};

/** One door (unit) in a multi-door apartment building. Tenants pay their own sub-metered utilities. */
export type Door = {
  id: string;
  propertyId: string;
  name: string;
  rent: number;
  tenant?: Tenant;
  elecPrev: number;
  elecCurr: number;
  waterPrev: number;
  waterCurr: number;
};

export type DemoData = { version: number; properties: Property[]; bookings: Booking[]; expenses: Expense[]; rooms: Room[]; doors: Door[] };

export const DATA_VERSION = 3;
export const TODAY = "2026-10-03";

/** The 12 months the dashboard reports on. */
export const MONTHS = [
  "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
  "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
];
/** The calendar also shows upcoming months. */
export const CALENDAR_MONTHS = [...MONTHS, "2026-10", "2026-11", "2026-12"];

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

export function loanForMonth(property: Property | undefined, month: string) {
  if (!property?.loan) return { payment: 0, interest: 0, principal: 0, balance: 0 };
  return loanSplit(property.loan, month);
}

/** Monthly bills and loan interest for a property, one entry per month. */
export function recurringExpenses(property: Property, bills: { description: string; category: string; amount: number; day: number }[], idPrefix: string): Expense[] {
  const out: Expense[] = [];
  for (const month of MONTHS) {
    for (const bill of bills) {
      out.push({
        id: `${idPrefix}-${month}-${bill.category}`,
        propertyId: property.id,
        date: `${month}-${String(bill.day).padStart(2, "0")}`,
        description: bill.description,
        category: bill.category,
        amount: bill.amount,
        recurring: true,
      });
    }
    if (property.loan) {
      out.push({
        id: `${idPrefix}-${month}-interest`,
        propertyId: property.id,
        date: `${month}-15`,
        description: "Home loan interest",
        category: "Loan interest",
        amount: Math.round(loanForMonth(property, month).interest * 100) / 100,
        recurring: true,
      });
    }
  }
  return out;
}

/** Builds empty rooms and beds for a bedspace property. */
export function makeRooms(propertyId: string, count: number, bedsPerRoom: number, rent: number, aircon: boolean): Room[] {
  return Array.from({ length: count }, (_, r) => ({
    id: `${propertyId}-R${r + 1}`,
    propertyId,
    name: `Room ${r + 1}`,
    aircon,
    prevReading: 0,
    currReading: 0,
    beds: Array.from({ length: bedsPerRoom }, (_, b) => ({
      id: `${propertyId}-R${r + 1}-B${b + 1}`,
      label: `${b % 2 ? "Upper" : "Lower"} bunk ${Math.ceil((b + 1) / 2)}`,
      rent,
    })),
  }));
}

/** Builds empty doors for a multi-door apartment. */
export function makeDoors(propertyId: string, count: number, rent: number): Door[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${propertyId}-D${i + 1}`,
    propertyId,
    name: `Door ${i + 1}`,
    rent,
    elecPrev: 0,
    elecCurr: 0,
    waterPrev: 0,
    waterCurr: 0,
  }));
}

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

const FIRST = ["Andrea", "Miguel", "Camille", "Paolo", "Bea", "Carlo", "Trisha", "Josh", "Kim", "Leah", "Marco", "Nina", "Rafael", "Sofia", "Hannah", "Daniel", "Emma", "Liam", "Yuki", "Min-jun", "Olivia", "Noah", "Isabel", "Gabriel"];
const LAST = ["Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Mendoza", "Villanueva", "Ramos", "Torres", "Navarro", "Tan", "Lim", "Smith", "Park", "Tanaka", "Müller", "Dela Cruz", "Aquino"];
const BEDSPACE_NAMES = ["Jessa M.", "Rodel P.", "Kristine A.", "Mark Anthony L.", "Joy C.", "Ella V.", "Kevin S.", "Aira D.", "Bryan T.", "Lovely R.", "Jerome B.", "Princess G.", "Arvin F.", "Mae O."];

// Share of nights booked by month (Tagaytay seasonality).
const PEAK: Record<string, number> = { "12": 0.7, "04": 0.62, "05": 0.6, "01": 0.45, "11": 0.42, "06": 0.3, "07": 0.18, "08": 0.16, "09": 0.2, "10": 0.35, "02": 0.38, "03": 0.45 };

function nightlyRate(date: string) {
  const weekend = [5, 6].includes(dayOfWeek(date));
  const peak = ["12", "04", "05"].includes(date.slice(5, 7));
  return (weekend ? 3400 : 2600) + (peak ? 400 : 0);
}

export function createDemoData(): DemoData {
  const rand = mulberry32(20261003);
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
  const between = (min: number, max: number) => Math.round(min + rand() * (max - min));

  const sunset: Property = {
    id: "sunset",
    name: "Sunset Bay Suites — Unit 12F",
    kind: "Condo unit",
    location: "Tagaytay",
    mode: "short-stay",
    loan: { principal: 2_600_000, annualRate: 0.07, years: 20, startMonth: "2024-01" },
    cleaningFee: 600,
    suppliesPerStay: 220,
  };
  const azure: Property = { id: "azure", name: "Azure Residences 1BR", kind: "Condo unit", location: "Parañaque", mode: "long-term", monthlyRent: 18_000 };
  const occupiedByMonth = [14, 14, 12, 13, 14, 13, 10, 9, 12, 13, 14, 13];
  const casaverde: Property = {
    id: "casaverde",
    name: "Casa Verde Dorm",
    kind: "Dorm building",
    location: "Sampaloc, Manila",
    mode: "bedspace",
    incomeHistory: Object.fromEntries(MONTHS.map((m, i) => [m, occupiedByMonth[i] * 3850])),
  };
  const villaDoors = [6, 6, 5, 6, 6, 6, 5, 5, 6, 6, 5, 5];
  const villarosa: Property = {
    id: "villarosa",
    name: "Villa Rosa Apartments (6-door)",
    kind: "Apartment",
    location: "Marikina",
    mode: "multi-door",
    loan: { principal: 1_800_000, annualRate: 0.0625, years: 15, startMonth: "2023-06" },
    incomeHistory: Object.fromEntries(MONTHS.map((m, i) => [m, villaDoors[i] * 8500])),
  };
  const properties = [sunset, azure, villarosa, casaverde];

  // ---- short-stay bookings, including a few upcoming ones ----
  const bookings: Booking[] = [];
  {
    let date = "2025-10-01";
    const end = "2026-11-30";
    let id = 1;
    while (date <= end) {
      const target = PEAK[date.slice(5, 7)];
      // Weekends book more easily than weekdays; future months are only partly booked so far.
      const future = date > TODAY ? 0.5 : 1;
      const chance = ([5, 6].includes(dayOfWeek(date)) ? Math.min(0.9, target + 0.2) : target * 0.6) * future;
      if (rand() < chance) {
        const nights = pick([1, 1, 2, 2, 2, 3, 3, 4, 5]);
        let payout = 0;
        for (let i = 0; i < nights; i++) payout += nightlyRate(addDays(date, i));
        const channel: Channel = rand() < 0.68 ? "Airbnb" : rand() < 0.7 ? "Direct (Facebook)" : "Booking.com";
        bookings.push({ id: `B${String(id++).padStart(3, "0")}`, propertyId: "sunset", guest: `${pick(FIRST)} ${pick(LAST)}`, checkIn: date, nights, guests: between(2, 4), channel, payout });
        date = addDays(date, nights + (rand() < 0.5 ? 0 : between(1, 2)));
      } else {
        date = addDays(date, 1);
      }
    }
  }

  // ---- bedspace rooms ----
  const readings = [
    [4120, 4386],
    [3877, 4119],
    [2210, 2298],
    [1984, 2069],
  ];
  const rooms = readings.map(([prev, curr], i) => {
    const aircon = i < 2;
    const [room] = makeRooms("casaverde", 1, 4, aircon ? 4200 : 3500, aircon);
    return { ...room, id: `casaverde-R${i + 1}`, name: `Room ${i + 1}`, prevReading: prev, currReading: curr, beds: room.beds.map((b) => ({ ...b, id: b.id.replace("R1", `R${i + 1}`) })) };
  });
  {
    const vacant = new Set(["casaverde-R2-B4", "casaverde-R4-B2", "casaverde-R4-B4"]);
    const statuses: PaymentStatus[] = ["paid", "paid", "paid", "paid", "due-soon", "paid", "overdue", "paid", "due-soon", "paid", "paid", "overdue", "paid", "paid"];
    const methods: PaymentMethod[] = ["GCash", "GCash", "GCash", "Maya", "Cash", "GCash", "Bank transfer"];
    let t = 0;
    for (const bed of rooms.flatMap((r) => r.beds)) {
      if (vacant.has(bed.id) || t >= BEDSPACE_NAMES.length) continue;
      const status = statuses[t];
      bed.tenant = {
        name: BEDSPACE_NAMES[t],
        since: `2025-${String(between(3, 12)).padStart(2, "0")}-01`,
        dueDay: pick([1, 5, 15]),
        balance: status === "overdue" ? bed.rent + between(0, 1) * 1500 : status === "due-soon" ? 0 : pick([0, 0, 0, 500]),
        status,
        lastPayment: status === "overdue" ? "2026-08-05" : "2026-09-" + String(between(1, 28)).padStart(2, "0"),
        method: pick(methods),
      };
      t++;
    }
  }

  // ---- multi-door apartment ----
  const doors = makeDoors("villarosa", 6, 8500).map((door, i) => ({
    ...door,
    rent: i < 2 ? 9500 : 8500, // ground-floor doors with a small yard
    elecPrev: [2310, 1984, 2675, 1420, 3011, 0][i],
    elecCurr: [2498, 2131, 2860, 1544, 3207, 0][i],
    waterPrev: [412, 388, 501, 266, 455, 0][i],
    waterCurr: [431, 404, 523, 279, 476, 0][i],
  }));
  {
    const families = ["Dela Cruz family", "Mr. & Mrs. Ocampo", "Rhea S.", "Bautista family", "Jun & Liza P."];
    const statuses: PaymentStatus[] = ["paid", "paid", "overdue", "due-soon", "paid"];
    families.forEach((name, i) => {
      doors[i].tenant = {
        name,
        since: `202${i % 2 ? 4 : 5}-0${i + 2}-01`,
        dueDay: [1, 15, 5, 10, 1][i],
        balance: statuses[i] === "overdue" ? doors[i].rent : 0,
        status: statuses[i],
        lastPayment: statuses[i] === "overdue" ? "2026-08-05" : "2026-09-0" + (i + 1),
        method: (["GCash", "Bank transfer", "Cash", "GCash", "Maya"] as PaymentMethod[])[i],
      };
    });
  }

  // ---- expenses (booking-driven costs are calculated in reports, not stored) ----
  let id = 1;
  const expenses: Expense[] = [
    ...recurringExpenses(sunset, [
      { description: "Association dues", category: "Association dues", amount: 3450, day: 5 },
      { description: "Fiber internet", category: "Internet", amount: 1299, day: 8 },
      { description: "Streaming subscription", category: "Subscriptions", amount: 549, day: 10 },
      { description: "Mortgage redemption insurance", category: "Insurance", amount: 1150, day: 15 },
    ], "sunset"),
    ...recurringExpenses(azure, [{ description: "Association dues", category: "Association dues", amount: 3100, day: 5 }], "azure"),
    ...recurringExpenses(villarosa, [
      { description: "Common area lights & water pump", category: "Electricity", amount: 650, day: 12 },
      { description: "Garbage collection", category: "Other", amount: 300, day: 20 },
    ], "villarosa"),
    ...recurringExpenses(casaverde, [
      { description: "Building lease", category: "Lease", amount: 28_000, day: 1 },
      { description: "Internet (shared Wi-Fi)", category: "Internet", amount: 1699, day: 8 },
      { description: "Caretaker allowance", category: "Staff", amount: 6000, day: 28 },
    ], "casaverde"),
  ];
  const add = (propertyId: string, date: string, description: string, category: string, amount: number) =>
    expenses.push({ id: `E${String(id++).padStart(4, "0")}`, propertyId, date, description, category, amount, recurring: false });

  for (const month of MONTHS) {
    const nights = bookings.filter((b) => b.checkIn.startsWith(month)).reduce((s, b) => s + b.nights, 0);
    add("sunset", `${month}-12`, "Electricity bill", "Electricity", 1200 + nights * 95);
    add("sunset", `${month}-14`, "Water bill", "Water", 250 + nights * 18);
    if (rand() < 0.3) add("sunset", `${month}-${between(10, 25)}`, pick(["Aircon cleaning", "Shower head replacement", "Door lock battery", "Repaint touch-up"]), "Repairs", between(400, 2500));
    if (rand() < 0.35) add("villarosa", `${month}-${between(8, 26)}`, pick(["Leaking faucet, Door 3", "Gate lock replacement", "Septic declogging", "Roof gutter cleaning", "Repaint, Door 6"]), "Repairs", between(600, 4500));
    if (rand() < 0.2) add("azure", `${month}-18`, pick(["Plumbing repair", "Ref gasket replacement", "Water heater check"]), "Repairs", between(800, 3500));
    add("casaverde", `${month}-10`, "Common area electricity", "Electricity", between(2600, 3400));
    add("casaverde", `${month}-12`, "Water bill", "Water", between(2200, 2900));
    if (rand() < 0.35) add("casaverde", `${month}-${between(10, 25)}`, pick(["Bunk bed repair", "Electric fan replacement", "Pest control", "Toilet repair"]), "Repairs", between(500, 3000));
  }
  add("azure", "2026-01-20", "Real property tax (annual)", "Taxes & permits", 6800);
  add("villarosa", "2026-01-20", "Real property tax (annual)", "Taxes & permits", 14_500);
  add("sunset", "2026-01-22", "Business permit renewal", "Taxes & permits", 7500);
  add("casaverde", "2026-01-22", "Business permit renewal", "Taxes & permits", 5200);
  add("sunset", "2026-04-10", "Bookkeeping & BIR filing", "Accounting", 3000);

  return { version: DATA_VERSION, properties, bookings, expenses, rooms, doors };
}
