import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, TrendingDown, TrendingUp } from "lucide-react";
import type { PaymentStatus } from "@/data/demo";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card-shadow rounded-3xl border border-white/70 bg-surface p-5 ${className}`}>{children}</section>;
}

export function CardTitle({ children, hint, action }: { children: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{children}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** Small round icon button used in card corners. */
export function IconBadge({ children }: { children: ReactNode }) {
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted">{children}</span>;
}

/** "+4.2%" pill. `goodWhenUp` flips the colors for costs, where going up is bad. */
export function Delta({ value, goodWhenUp = true, suffix }: { value: number; goodWhenUp?: boolean; suffix?: string }) {
  if (!Number.isFinite(value)) return null;
  const up = value >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${good ? "bg-green-50 text-good" : "bg-red-50 text-critical"}`}>
      <Icon size={11} aria-hidden />
      {up ? "+" : ""}
      {value.toFixed(1)}%{suffix && <span className="font-medium opacity-70"> {suffix}</span>}
    </span>
  );
}

export function Stat({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "default" | "good" | "critical" }) {
  const color = tone === "good" ? "text-good" : tone === "critical" ? "text-critical" : "text-foreground";
  return (
    <div className="card-shadow rounded-2xl border border-white/70 bg-surface p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`tabular mt-1 text-2xl font-semibold tracking-tight ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

const STATUS = {
  paid: { label: "Paid", icon: CheckCircle2, className: "bg-green-50 text-good" },
  "due-soon": { label: "Due soon", icon: Clock, className: "bg-amber-50 text-warning" },
  overdue: { label: "Overdue", icon: AlertTriangle, className: "bg-red-50 text-critical" },
} as const;

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon size={12} aria-hidden />
      {label}
    </span>
  );
}

/** Pill-shaped select, styled like the filter chips in the header. */
export function Select<T extends string>({ value, onChange, options, label, icon }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; icon?: ReactNode }) {
  return (
    <label className="relative inline-flex items-center rounded-full border border-border bg-surface text-sm text-foreground shadow-sm">
      <span className="sr-only">{label}</span>
      {icon && <span className="pointer-events-none absolute left-3 text-muted">{icon}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`appearance-none rounded-full bg-transparent py-2 pr-8 text-sm ${icon ? "pl-9" : "pl-4"}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 text-muted" aria-hidden />
    </label>
  );
}

export const primaryButton = "inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90";
export const secondaryButton = "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-sm hover:bg-surface-soft";
