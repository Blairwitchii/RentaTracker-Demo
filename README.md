# RentaTracker — Demo

**Know your real rental profit.** One dashboard for Airbnb units, monthly rentals and bedspaces that shows what each property actually earns once the bank loan is counted.

This repository is a clickable prototype with fictional sample data. It has no backend and no sign-up; everything runs in the browser.

## What's inside

| Screen | What it shows |
|---|---|
| **Dashboard** | Revenue, expenses, net profit and cash flow after the loan, per property or combined. Break-even nights for the short-stay unit. |
| **Calendar** | Bookings by channel (Airbnb, Booking.com, direct Facebook), occupancy and payouts per month. |
| **Expenses** | Recurring and one-off costs with filters. Add an expense to see it appear. |
| **Bedspace** | Rooms, beds and tenants, rent status, unpaid balances (utang), payment recording, and sub-meter electricity splitting. |
| **Compare** | Short stay vs. a monthly tenant for the same unit, with adjustable rates and occupancy. |

A currency switcher (PHP, USD, IDR, THB) converts every amount using fixed demo rates.

## How the numbers work

- **Loan interest** is an expense. **Loan principal** is equity, so it's left out of net profit and only subtracted for cash flow.
- **Break-even nights** = fixed monthly costs (including the full loan payment) ÷ (average nightly payout − costs per booked night).
- The finance logic lives in [`src/lib/finance.ts`](src/lib/finance.ts) and has no UI dependencies.

## Run it locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Tech

Next.js (App Router) · TypeScript · Tailwind CSS · Recharts · lucide-react. Deployable to Vercel as a static site.

## Data

All properties, guests, tenants and figures are fictional and generated from a fixed seed in [`src/data/demo.ts`](src/data/demo.ts).
