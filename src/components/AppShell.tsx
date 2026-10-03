"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BedDouble, Building2, CalendarDays, DoorOpen, LayoutDashboard, ReceiptText, Scale, Calendar } from "lucide-react";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
import { TODAY } from "@/data/demo";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { Select } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", short: "Overview", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", short: "Units", icon: Building2 },
  { href: "/calendar", label: "Calendar", short: "Calendar", icon: CalendarDays },
  { href: "/tenants", label: "Tenants", short: "Tenants", icon: DoorOpen },
  { href: "/bedspace", label: "Bedspace", short: "Beds", icon: BedDouble },
  { href: "/expenses", label: "Expenses", short: "Expenses", icon: ReceiptText },
  { href: "/compare", label: "Compare", short: "Compare", icon: Scale },
];

const todayLabel = new Date(`${TODAY}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function CurrencySelect() {
  const { code, setCode } = useCurrency();
  return (
    <Select
      label="Currency"
      value={code}
      onChange={(c) => setCode(c as CurrencyCode)}
      options={Object.entries(CURRENCIES).map(([c, { label }]) => ({ value: c as CurrencyCode, label }))}
    />
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <header className="sticky top-0 z-20 px-4 pt-4 md:px-8">
        <div className="card-shadow mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-white/70 bg-surface/85 py-2 pr-2 pl-5 backdrop-blur">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-surface-soft p-1 lg:flex" aria-label="Main">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-full py-2 text-sm font-medium transition-colors ${
                    active ? "bg-brand px-4 text-white shadow-sm" : "px-3 text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon size={17} aria-hidden />
                  <span className={active ? "" : "sr-only"}>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-border px-3 py-2 text-xs text-muted xl:inline-flex">
              <Calendar size={14} aria-hidden /> {todayLabel}
            </span>
            <CurrencySelect />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-5 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
          Demo · fictional data · anything you add is saved in this browser only
        </div>
        {children}
      </main>

      <Footer />

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-7 border-t border-border bg-surface/95 backdrop-blur lg:hidden" aria-label="Main">
        {NAV.map(({ href, short, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 py-2 text-[10px] font-medium ${active ? "text-brand" : "text-muted"}`}>
              <span className={`grid h-7 w-10 place-items-center rounded-full ${active ? "bg-brand-soft" : ""}`}>
                <Icon size={18} aria-hidden />
              </span>
              {short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
