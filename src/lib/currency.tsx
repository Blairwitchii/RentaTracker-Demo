"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

// Demo conversion rates from PHP. Fixed values for the prototype, not live rates.
export const CURRENCIES = {
  PHP: { label: "₱ PHP", rate: 1, locale: "en-PH" },
  USD: { label: "$ USD", rate: 1 / 57, locale: "en-US" },
  IDR: { label: "Rp IDR", rate: 280, locale: "id-ID" },
  THB: { label: "฿ THB", rate: 0.57, locale: "th-TH" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

const CurrencyContext = createContext<{ code: CurrencyCode; setCode: (c: CurrencyCode) => void }>({
  code: "PHP",
  setCode: () => {},
});

// The chosen currency lives in localStorage so it survives page reloads.
const STORAGE_KEY = "rt-currency";
const listeners = new Set<() => void>();
let current: CurrencyCode = "PHP"; // fallback when storage is blocked

function readSaved(): CurrencyCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in CURRENCIES) current = saved as CurrencyCode;
  } catch {}
  return current;
}

function save(code: CurrencyCode) {
  current = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const code = useSyncExternalStore(subscribe, readSaved, () => "PHP" as CurrencyCode);
  return <CurrencyContext.Provider value={{ code, setCode: save }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

/** Returns a formatter that converts a PHP amount into the selected currency. */
export function useMoney() {
  const { code } = useCurrency();
  const { rate, locale } = CURRENCIES[code];
  const full = new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: 0 });
  const compact = new Intl.NumberFormat(locale, { style: "currency", currency: code, notation: "compact", maximumFractionDigits: 1 });
  return {
    code,
    format: (php: number) => full.format(php * rate),
    compact: (php: number) => compact.format(php * rate),
    /** Converts a value typed in the selected currency back to PHP. */
    toPhp: (value: number) => value / rate,
    fromPhp: (php: number) => php * rate,
  };
}
