import { MONTHS, bookings, daysInMonth, expenses, incomes, loanForMonth, properties } from "@/data/demo";
import { breakEvenNights, sum } from "@/lib/finance";

export type MonthSummary = {
  month: string;
  revenue: number;
  expenses: number; // operating costs + loan interest
  netProfit: number;
  principal: number; // loan principal paid (equity, not an expense)
  cashFlow: number; // what's left after the full loan payment
};

const inScope = (propertyIds: string[]) => (item: { propertyId: string }) => propertyIds.includes(item.propertyId);

export function monthlySummary(propertyIds: string[]): MonthSummary[] {
  const has = inScope(propertyIds);
  return MONTHS.map((month) => {
    const revenue = sum(incomes.filter(has).filter((i) => i.month === month).map((i) => i.amount));
    const cost = sum(expenses.filter(has).filter((e) => e.date.startsWith(month)).map((e) => e.amount));
    const principal = sum(propertyIds.map((id) => loanForMonth(id, month).principal));
    const netProfit = revenue - cost;
    return { month, revenue, expenses: cost, netProfit, principal, cashFlow: netProfit - principal };
  });
}

export function expenseByCategory(propertyIds: string[]) {
  const totals = new Map<string, number>();
  for (const e of expenses.filter(inScope(propertyIds))) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  return [...totals.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

const VARIABLE = new Set(["Cleaning", "Supplies", "Platform fees", "Electricity", "Water"]);

/** Short-stay stats for one property over the 12 demo months. */
export function shortStayStats(propertyId: string) {
  const stays = bookings.filter((b) => b.propertyId === propertyId);
  const nights = sum(stays.map((b) => b.nights));
  const revenue = sum(stays.map((b) => b.payout));
  const availableNights = sum(MONTHS.map(daysInMonth));
  const own = expenses.filter((e) => e.propertyId === propertyId);
  const variable = sum(own.filter((e) => VARIABLE.has(e.category)).map((e) => e.amount));
  const otherFixed = sum(own.filter((e) => !VARIABLE.has(e.category) && e.category !== "Loan interest").map((e) => e.amount)) / MONTHS.length;
  const loanPayment = loanForMonth(propertyId, MONTHS[MONTHS.length - 1]).payment;
  const adr = nights ? revenue / nights : 0;
  const variablePerNight = nights ? variable / nights : 0;
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

export function propertyName(id: string) {
  return properties.find((p) => p.id === id)?.name ?? id;
}

export function monthLabel(month: string, style: "short" | "long" = "short") {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: style, year: style === "long" ? "numeric" : "2-digit", timeZone: "UTC" });
}
