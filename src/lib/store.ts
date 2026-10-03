"use client";

// Demo data store. Starts from the seeded sample data and saves every change
// to this browser's localStorage, so added units, guests and tenants survive reloads.

import { useSyncExternalStore } from "react";
import {
  DATA_VERSION,
  TODAY,
  createDemoData,
  makeDoors,
  makeRooms,
  recurringExpenses,
  type Booking,
  type DemoData,
  type Door,
  type Expense,
  type PaymentMethod,
  type Property,
  type Tenant,
} from "@/data/demo";

const KEY = "rt-demo-data";
const DEFAULTS = createDemoData();
const listeners = new Set<() => void>();
let state: DemoData | null = null;

function load(): DemoData {
  if (state) return state;
  state = DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as DemoData) : null;
    if (saved?.version === DATA_VERSION) state = saved;
  } catch {}
  return state;
}

function update(change: (data: DemoData) => DemoData) {
  state = change(load());
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDemoData(): DemoData {
  return useSyncExternalStore(subscribe, load, () => DEFAULTS);
}

const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type NewProperty = Omit<Property, "id"> & {
  monthlyCosts: number; // dues and other fixed bills
  rooms?: number;
  bedsPerRoom?: number;
  bedRent?: number;
  aircon?: boolean;
  doors?: number;
  doorRent?: number;
};

export const actions = {
  addProperty(input: NewProperty) {
    const { monthlyCosts, rooms, bedsPerRoom, bedRent, aircon, doors, doorRent, ...rest } = input;
    const property: Property = { ...rest, id: newId("P") };
    const bills = monthlyCosts > 0 ? [{ description: "Monthly dues & fixed bills", category: "Association dues", amount: monthlyCosts, day: 5 }] : [];
    update((d) => ({
      ...d,
      properties: [...d.properties, property],
      expenses: [...d.expenses, ...recurringExpenses(property, bills, property.id)],
      rooms: property.mode === "bedspace" ? [...d.rooms, ...makeRooms(property.id, rooms ?? 1, bedsPerRoom ?? 4, bedRent ?? 3500, aircon ?? false)] : d.rooms,
      doors: property.mode === "multi-door" ? [...d.doors, ...makeDoors(property.id, doors ?? 4, doorRent ?? 8000)] : d.doors,
    }));
    return property.id;
  },

  removeProperty(id: string) {
    update((d) => ({
      ...d,
      properties: d.properties.filter((p) => p.id !== id),
      bookings: d.bookings.filter((b) => b.propertyId !== id),
      expenses: d.expenses.filter((e) => e.propertyId !== id),
      rooms: d.rooms.filter((r) => r.propertyId !== id),
      doors: d.doors.filter((x) => x.propertyId !== id),
    }));
  },

  addBooking(booking: Omit<Booking, "id">) {
    update((d) => ({ ...d, bookings: [...d.bookings, { ...booking, id: newId("B") }].sort((a, b) => a.checkIn.localeCompare(b.checkIn)) }));
  },

  removeBooking(id: string) {
    update((d) => ({ ...d, bookings: d.bookings.filter((b) => b.id !== id) }));
  },

  addExpense(expense: Omit<Expense, "id">) {
    update((d) => ({ ...d, expenses: [...d.expenses, { ...expense, id: newId("E") }] }));
  },

  // Tenant actions work on any bed or door id.
  addTenant(spaceId: string, tenant: { name: string; dueDay: number; method: PaymentMethod }) {
    updateTenant(spaceId, () => ({ ...tenant, since: TODAY, balance: 0, status: "paid", lastPayment: TODAY }));
  },

  removeTenant(spaceId: string) {
    updateTenant(spaceId, () => undefined);
  },

  recordPayment(spaceId: string) {
    updateTenant(spaceId, (t) => t && { ...t, balance: 0, status: "paid", lastPayment: TODAY });
  },

  setDoorReading(doorId: string, field: "elecPrev" | "elecCurr" | "waterPrev" | "waterCurr", value: number) {
    update((d) => ({ ...d, doors: d.doors.map((x: Door) => (x.id === doorId ? { ...x, [field]: value } : x)) }));
  },

  setReading(roomId: string, field: "prevReading" | "currReading", value: number) {
    update((d) => ({ ...d, rooms: d.rooms.map((r) => (r.id === roomId ? { ...r, [field]: value } : r)) }));
  },

  reset() {
    update(() => createDemoData());
  },
};

function updateTenant(spaceId: string, change: (tenant: Tenant | undefined) => Tenant | undefined) {
  update((d) => ({
    ...d,
    rooms: d.rooms.map((room) => ({ ...room, beds: room.beds.map((bed) => (bed.id === spaceId ? { ...bed, tenant: change(bed.tenant) } : bed)) })),
    doors: d.doors.map((door) => (door.id === spaceId ? { ...door, tenant: change(door.tenant) } : door)),
  }));
}
