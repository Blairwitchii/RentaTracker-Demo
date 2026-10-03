"use client";

import { useState, type FormEvent } from "react";
import { Plus, Repeat } from "lucide-react";
import { CALENDAR_MONTHS, MONTHS, TODAY } from "@/data/demo";
import { sum } from "@/lib/finance";
import { allExpenses, monthLabel } from "@/lib/reports";
import { actions, useDemoData } from "@/lib/store";
import { useMoney } from "@/lib/currency";
import { Card, PageHeader, Select, Stat } from "@/components/ui";
import { Field, inputClass } from "@/components/form";

const CATEGORIES = ["Association dues", "Cleaning", "Electricity", "Insurance", "Internet", "Lease", "Repairs", "Staff", "Subscriptions", "Supplies", "Taxes & permits", "Water", "Other"];

export default function ExpensesPage() {
  const money = useMoney();
  const data = useDemoData();
  const items = allExpenses(data);
  const properties = data.properties;
  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? "Removed property";
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [property, setProperty] = useState("all");
  const [month, setMonth] = useState(MONTHS[MONTHS.length - 1]);
  const [category, setCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = items
    .filter((e) => property === "all" || e.propertyId === property)
    .filter((e) => month === "all" || e.date.startsWith(month))
    .filter((e) => category === "all" || e.category === category)
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = sum(filtered.map((e) => e.amount));
  const recurring = sum(filtered.filter((e) => e.recurring).map((e) => e.amount));

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = money.toPhp(Number(form.get("amount")));
    if (!amount) return;
    const date = String(form.get("date"));
    const description = String(form.get("description")) || String(form.get("category"));
    actions.addExpense({
      propertyId: String(form.get("property")),
      date,
      description,
      category: String(form.get("category")),
      amount,
      recurring: form.get("recurring") === "on",
    });
    setJustAdded(description);
    setMonth(date.slice(0, 7));
    setShowForm(false);
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Recurring bills (dues, internet, loan interest) repeat every month, and each booking adds its own cleaning, supplies and platform fee. Log the rest as they happen."
        actions={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={16} aria-hidden /> Add expense
          </button>
        }
      />

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={addExpense} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Property">
              <select name="property" className={inputClass}>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input name="date" type="date" defaultValue={TODAY} min="2025-10-01" max="2026-12-31" required className={inputClass} />
            </Field>
            <Field label="Category">
              <select name="category" className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <input name="description" placeholder="e.g. Aircon cleaning" className={inputClass} />
            </Field>
            <Field label={`Amount (${money.code})`}>
              <input name="amount" type="number" min="1" step="0.01" required className={inputClass} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input name="recurring" type="checkbox" className="h-4 w-4 accent-[var(--brand)]" /> Repeats every month
            </label>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <button className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white">Save expense</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-border px-4 py-1.5 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Select label="Property" value={property} onChange={setProperty} options={[{ value: "all", label: "All properties" }, ...properties.map((p) => ({ value: p.id, label: p.name }))]} />
        <Select label="Month" value={month} onChange={setMonth} options={[{ value: "all", label: "All months" }, ...[...CALENDAR_MONTHS].reverse().map((m) => ({ value: m, label: monthLabel(m, "long") }))]} />
        <Select label="Category" value={category} onChange={setCategory} options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Total" value={money.format(total)} hint={`${filtered.length} entries`} />
        <Stat label="Recurring" value={money.format(recurring)} />
        <Stat label="One-off" value={money.format(total - recurring)} />
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Property</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id} className={justAdded === e.description && !e.auto && !e.recurring ? "bg-brand-soft" : undefined}>
                  <td className="tabular px-5 py-2.5 text-muted">{e.date}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      {e.description}
                      {e.recurring && <Repeat size={13} className="text-muted" aria-label="Recurring" />}
                      {e.auto && <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted">from booking</span>}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{e.category}</td>
                  <td className="px-3 py-2.5 text-muted">{propertyName(e.propertyId)}</td>
                  <td className="tabular px-5 py-2.5 text-right font-medium">{money.format(e.amount)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted">
                    No expenses match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
