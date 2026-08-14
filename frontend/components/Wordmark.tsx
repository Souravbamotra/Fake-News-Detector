"use client";

export default function Wordmark() {
  return (
    <div className="fixed top-5 left-6 z-50 flex items-center gap-2 select-none" aria-label="Verus — AI verification tool">
      {/* Geometric mark: circle with a notch check */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="8" stroke="#1C1B19" strokeWidth="1.25" />
        <polyline
          points="5.5,9 7.8,11.5 12.5,6.5"
          stroke="#1C1B19"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Name */}
      <span
        className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink font-medium"
        style={{ letterSpacing: "0.2em" }}
      >
        Verus
      </span>
    </div>
  );
}
