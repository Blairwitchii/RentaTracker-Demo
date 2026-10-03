import { CHANNEL_FEE, MONTHS, daysInMonth, loanForMonth, type DemoData, type Expense, type Property } from "@/data/demo";
import { breakEvenNights, sum } from "@/lib/finance";

export type MonthSummary = {
  month: string;
  revenue: number;
  expenses: number; // operating costs + loan interest
  netProfit: number;
  principal: number; // loan principal paid (equity, not an expense)
  cashFlow: number; // what's left after the full loan payment
};

/** Income for one property in one month. */
export function incomeFor(data: DemoData, property: Property, month: string): number {
  switch (property.mode) {
    case "short-stay":
      return sum(data.bookings.filter((b) => b.propertyId === property.id && b.checkIn.startsWith(month)).map((b) => b.payout));
    case "long-term":
      return property.monthlyRent ?? 0;
    case "bedspace": {
      if (property.incomeHistory?.[month] !== undefined) return property.incomeHistory[month];
      const beds = data.rooms.filter((r) => r.propertyId === property.id).flatMap((r) => r.beds);
      return sum(beds.filter((b) => b.tenant).map((b) => b.rent));
    }
  }
}

/** Stored expenses plus the costs each booking creates (cleaning, supplies, platform fees). */
export function allExpenses(data: DemoData): Expense[] {
  const auto: Expense[] = [];
  for (const b of data.bookings) {
    const property = data.properties.find((p) => p.id === b.propertyId);
    if (!property) continue;
    const base = { propertyId: b.propertyId, date: b.checkIn, recurring: false, auto: true };
    if (property.cleaningFee) auto.push({ ...base, id: `${b.id}-clean`, description: `Cleaning · ${b.guest}`, category: "Cleaning", amount: property.cleaningFee });
    if (property.suppliesPerStay) auto.push({ ...base, id: `${b.id}-supplies`, description: `Guest supplies · ${b.guest}`, category: "Supplies", amount: property.suppliesPerStay });
    const fee = b.payout * CHANNEL_FEE[b.channel];
    if (fee) auto.push({ ...base, id: `${b.id}-fee`, description: `${b.channel} host fee · ${b.guest}`, category: "Platform fees", amount: Math.round(fee * 100) / 100 });
  }
  return [...data.expenses, ...auto];
}

export function monthlySummary(data: DemoData, propertyIds: string[]): MonthSummary[] {
  const scoped = data.properties.filter((p) => propertyIds.includes(p.id));
  const costs = allExpenses(data).filter((e) => propertyIds.includes(e.propertyId));
  return MONTHS.map((month) => {
    const revenue = sum(scoped.map((p) => incomeFor(data, p, month)));
    const cost = sum(costs.filter((e) => e.date.startsWith(month)).map((e) => e.amount));
    const principal = sum(scoped.map((p) => loanForMonth(p, month).principal));
    const netProfit = revenue - cost;
    return { month, revenue, expenses: cost, netProfit, principal, cashFlow: netProfit - principal };
  });
}

export function expenseByCategory(data: DemoData, propertyIds: string[]) {
  const totals = new Map<string, number>();
  const inRange = (e: Expense) => MONTHS.includes(e.date.slice(0, 7));
  for (const e of allExpenses(data).filter((e) => propertyIds.includes(e.propertyId) && inRange(e))) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  return [...totals.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

const VARIABLE = new Set(["Cleaning", "Supplies", "Platform fees", "Electricity", "Water"]);

/** Short-stay stats for one property over the 12 report months. */
export function shortStayStats(data: DemoData, propertyId: string) {
  const property = data.properties.find((p) => p.id === propertyId);
  const inRange = (date: string) => MONTHS.includes(date.slice(0, 7));
  const stays = data.bookings.filter((b) => b.propertyId === propertyId && inRange(b.checkIn));
  const nights = sum(stays.map((b) => b.nights));
  const revenue = sum(stays.map((b) => b.payout));
  const availableNights = sum(MONTHS.map(daysInMonth));
  const own = allExpenses(data).filter((e) => e.propertyId === propertyId && inRange(e.date));
  const variable = sum(own.filter((e) => VARIABLE.has(e.category)).map((e) => e.amount));
  const otherFixed = sum(own.filter((e) => !VARIABLE.has(e.category) && e.category !== "Loan interest").map((e) => e.amount)) / MONTHS.length;
  const loanPayment = loanForMonth(property, MONTHS[MONTHS.length - 1]).payment;
  const adr = nights ? revenue / nights : 0;
  // Before any bookings exist, estimate per-night costs from the property's settings.
  const variablePerNight = nights ? variable / nights : ((property?.cleaningFee ?? 0) + (property?.suppliesPerStay ?? 0)) / 2;
  const fixedMonthly = otherFixed + loanPayment;
  return {
    nights,
    bookings: stays.length,
    revenue,
    occupancy: nights / availableNights,
    adr,
    variablePerNight,
    otherFixed,
    loanPayment,
    fixedMonthly,
    breakEven: breakEvenNights(fixedMonthly, adr - variablePerNight),
    avgNightsPerMonth: nights / MONTHS.length,
  };
}

export function monthLabel(month: string, style: "short" | "long" = "short") {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: style, year: style === "long" ? "numeric" : "2-digit", timeZone: "UTC" });
}

export const MODE_LABEL = { "short-stay": "Short stay", "long-term": "Monthly rental", bedspace: "Bedspace" } as const;
