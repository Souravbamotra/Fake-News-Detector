"use client";

const STEPS = [
  {
    id: "language",
    label: "Language analysis",
    body: "Checks writing patterns against known real and fake news using a fine-tuned AI classifier.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <line x1="9" y1="10" x2="15" y2="10"/>
        <line x1="9" y1="14" x2="13" y2="14"/>
      </svg>
    ),
  },
  {
    id: "factcheck",
    label: "Fact-check lookup",
    body: "Cross-references claims with professional fact-checking organisations via Google's database.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
  },
  {
    id: "credibility",
    label: "Source credibility",
    body: "Rates the publisher against a curated reliability list of hundreds of domains.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="mt-2">
      <p
        id="how-it-works-heading"
        className="font-mono text-[9px] uppercase tracking-[0.18em] text-tertiary text-center mb-6"
      >
        How it works
      </p>

      <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-0">
        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`flex flex-col items-center text-center px-5 py-1 ${
              idx < STEPS.length - 1
                ? "max-sm:border-b max-sm:border-hairline max-sm:pb-5 max-sm:mb-5 sm:border-r sm:border-hairline"
                : ""
            }`}
          >
            <div className="text-muted mb-3">{step.icon}</div>
            <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink mb-1.5">
              {step.label}
            </p>
            <p className="text-tertiary text-xs leading-relaxed">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
