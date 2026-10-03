import Link from "next/link";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/properties", label: "Properties" },
  { href: "/calendar", label: "Calendar" },
  { href: "/tenants", label: "Tenants" },
  { href: "/bedspace", label: "Bedspace" },
  { href: "/expenses", label: "Expenses" },
  { href: "/compare", label: "Compare" },
];

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pb-6 md:px-8">
      <div className="card-shadow rounded-3xl border border-white/70 bg-surface px-6 py-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-2 text-sm text-muted">Know your real rental profit: short stays, monthly rentals, apartments and bedspaces in one place.</p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-muted hover:text-brand">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 RentaTracker · Prototype with fictional data. Not financial or tax advice.</span>
          <span>
            Built by{" "}
            <a href="https://github.com/Blairwitchii" target="_blank" rel="noreferrer" className="font-medium text-foreground hover:text-brand">
              Blair Jereza
            </a>{" "}
            · Next.js · Tailwind CSS · Recharts
          </span>
        </div>
      </div>
    </footer>
  );
}
