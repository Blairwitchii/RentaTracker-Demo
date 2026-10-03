import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";

/** Slim footer inside the app (dashboard and other pages). */
export function AppFooter() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pb-6 md:px-8">
      <div className="flex flex-col gap-2 rounded-full border border-white/70 bg-surface/70 px-6 py-3 text-xs text-muted backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 RentaTracker · Demo with fictional data</span>
        <span>Figures are estimates, not financial or tax advice.</span>
      </div>
    </footer>
  );
}

const PRODUCT = [
  { href: "/dashboard", label: "Live demo" },
  { href: "/properties", label: "Properties" },
  { href: "/tenants", label: "Tenants" },
  { href: "/compare", label: "Short stay vs. monthly" },
];
const AUDIENCE = ["Airbnb & staycation hosts", "Apartment landlords", "Bedspace & dorm owners", "OFWs managing units back home"];

/** Larger marketing footer for the landing page. */
export function SiteFooter() {
  return (
    <footer className="mt-8 bg-[#0f1b3d] text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <div className="flex flex-col gap-6 rounded-3xl bg-brand px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 className="text-2xl font-semibold">See your real profit in two minutes.</h2>
            <p className="mt-1 text-sm text-white/80">Explore the demo with sample properties. No sign-up needed.</p>
          </div>
          <Link href="/dashboard" className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand hover:opacity-90 md:self-auto">
            Open the live demo <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo inverted />
            <p className="mt-3 max-w-sm text-sm text-white/70">
              One place for short stays, monthly rentals, apartments and bedspaces, with profit shown after the bank loan.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {PRODUCT.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Made for</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {AUDIENCE.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:justify-between">
          <span>© 2026 RentaTracker. All properties, guests and figures in the demo are fictional.</span>
          <span>Built with Next.js, Tailwind CSS and Recharts</span>
        </div>
      </div>
    </footer>
  );
}
