import Link from "next/link";
import { ArrowRight, BedDouble, CalendarDays, Calculator, Landmark, ReceiptText, Scale } from "lucide-react";
import { Logo } from "@/components/Logo";

const FEATURES = [
  { icon: Landmark, title: "Profit after the mortgage", text: "Loan interest is an expense, principal is equity. See what each unit really earns, and what reaches your pocket." },
  { icon: Calculator, title: "Break-even nights", text: "Know exactly how many booked nights a month cover your amortization, dues and bills." },
  { icon: CalendarDays, title: "Booking calendar", text: "Airbnb, Booking.com and direct Facebook bookings in one calendar, with payouts per channel." },
  { icon: BedDouble, title: "Apartments & bedspace", text: "Multi-door apartments and bedspaces: rent due dates, GCash payments, unpaid balances and sub-metered electricity and water per door or room." },
  { icon: ReceiptText, title: "Recurring expenses", text: "Dues, internet and loan payments log themselves every month. Add the rest from your phone." },
  { icon: Scale, title: "Short stay vs. monthly", text: "Compare Airbnb against a long-term tenant for the same unit, using your own numbers." },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <Link href="/dashboard" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Open demo
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-8">
        <section className="py-14 text-center md:py-24">
          <p className="mb-4 inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            For Airbnb hosts, apartment landlords and bedspace owners
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Know your <span className="text-brand">real</span> rental profit.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted md:text-lg">
            Many condo investors are quietly losing money once the bank loan is counted. RentaTracker puts your short stays, monthly
            tenants and bedspaces in one place, and shows the number that matters.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-white hover:opacity-90">
              Explore the live demo <ArrowRight size={18} aria-hidden />
            </Link>
            <span className="text-sm text-muted">No sign-up · sample data</span>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card-shadow rounded-3xl border border-white/70 bg-surface p-6">
              <Icon size={22} className="text-brand" aria-hidden />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        RentaTracker prototype · Built with Next.js, TypeScript, Tailwind CSS and Recharts · All properties, guests and figures are fictional.
      </footer>
    </div>
  );
}
