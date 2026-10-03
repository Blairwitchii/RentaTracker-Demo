/** `inverted` is the version for dark backgrounds. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className={`flex items-center gap-2 text-lg font-semibold tracking-tight ${inverted ? "text-white" : "text-foreground"}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--brand)" />
        <path d="M8 16.5 16 10l8 6.5V24a1 1 0 0 1-1 1h-4.5v-5h-5v5H9a1 1 0 0 1-1-1z" fill="#fff" />
      </svg>
      Renta<span className={inverted ? "text-[#a9c0ff]" : "text-brand"}>Tracker</span>
    </span>
  );
}
