// VisuCAN brand mark: a "V" formed by two PCB traces with 45° bends,
// terminated by via pads — echoing the circuit-board hero animation.

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 8.5V13l9 9M25 8.5V13l-9 9M16 22v3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="6" r="2.2" fill="currentColor" />
      <circle cx="25" cy="6" r="2.2" fill="currentColor" />
      <circle cx="16" cy="27.2" r="2.2" fill="currentColor" />
    </svg>
  );
}

interface LogoProps {
  /** Tailwind classes for the mark size, defaults to h-7 w-7 */
  markClassName?: string;
  /** Tailwind classes for the wordmark, defaults to landing nav size */
  textClassName?: string;
}

export function Logo({
  markClassName = 'h-7 w-7',
  textClassName = 'font-display text-2xl font-medium tracking-tight',
}: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className={`${markClassName} text-sky-400`} />
      <span className={textClassName}>VisuCAN</span>
    </span>
  );
}
