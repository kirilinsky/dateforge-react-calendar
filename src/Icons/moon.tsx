// 24x24 moon-phase icons. Each icon paints an outline circle plus an
// illuminated path (currentColor). Designed to render legibly at 16-24 px.

type IconProps = { className?: string };

const Frame = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeOpacity="0.35"
      strokeWidth="1.4"
    />
    {children}
  </svg>
);

export const MoonNew = ({ className }: IconProps = {}) => (
  <Frame className={className}>{null}</Frame>
);

// Full disc.
export const MoonFull = ({ className }: IconProps = {}) => (
  <Frame className={className}>
    <circle cx="12" cy="12" r="9" fill="currentColor" />
  </Frame>
);

// Right half lit.
export const MoonFirstQuarter = ({ className }: IconProps = {}) => (
  <Frame className={className}>
    <path d="M12 3 A9 9 0 0 1 12 21 Z" fill="currentColor" />
  </Frame>
);

// Left half lit.
export const MoonLastQuarter = ({ className }: IconProps = {}) => (
  <Frame className={className}>
    <path d="M12 3 A9 9 0 0 0 12 21 Z" fill="currentColor" />
  </Frame>
);

// Right side, narrow (lit < half).
export const MoonWaxingCrescent = ({ className }: IconProps = {}) => (
  <Frame className={className}>
    <path d="M12 3 A9 9 0 0 1 12 21 A4.5 9 0 0 0 12 3 Z" fill="currentColor" />
  </Frame>
);

// Left side, narrow.
export const MoonWaningCrescent = ({ className }: IconProps = {}) => (
  <Frame className={className}>
    <path d="M12 3 A9 9 0 0 0 12 21 A4.5 9 0 0 1 12 3 Z" fill="currentColor" />
  </Frame>
);

// Right side, wide (lit > half).
export const MoonWaxingGibbous = ({ className }: IconProps = {}) => (
  <Frame className={className}>
    <path d="M12 3 A9 9 0 0 1 12 21 A4.5 9 0 0 1 12 3 Z" fill="currentColor" />
  </Frame>
);

// Left side, wide.
export const MoonWaningGibbous = ({ className }: IconProps = {}) => (
  <Frame className={className}>
    <path d="M12 3 A9 9 0 0 0 12 21 A4.5 9 0 0 0 12 3 Z" fill="currentColor" />
  </Frame>
);
