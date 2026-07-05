import type { ReactNode } from "react";

/**
 * Shared inline SVG icons for v3 modules (toolbar, info, …). One visual
 * language: 24-unit grid, 2px round stroke, `currentColor` — icons inherit the
 * button ink and flip with theme tokens automatically. All decorative:
 * `aria-hidden`, never focusable; the OWNING control carries the aria-label.
 */

function Icon({
  children,
  size = 14,
  flipRtl = false,
}: {
  children: ReactNode;
  size?: number;
  /** Mirror horizontally under `dir="rtl"` — for direction-bearing glyphs
      (the horizontal chevrons), handled by a cal-base rule in layers.css. */
  flipRtl?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-flip-rtl={flipRtl ? "" : undefined}
    >
      {children}
    </svg>
  );
}

export function ChevronLeftIcon({ size }: { size?: number }) {
  return (
    <Icon size={size} flipRtl>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function ChevronRightIcon({ size }: { size?: number }) {
  return (
    <Icon size={size} flipRtl>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function ChevronDownIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function ChevronUpIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="m6 15 6-6 6 6" />
    </Icon>
  );
}

export function HomeIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </Icon>
  );
}

export function ClearIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}

export function CheckIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

/** Clock face — the compact time trigger. */
export function ClockIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

/** Contrast/half-moon — the light/dark scheme toggle. */
export function ThemeToggleIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none" />
    </Icon>
  );
}
