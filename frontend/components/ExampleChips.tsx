"use client";

interface ExampleChipsProps {
  onSelect: (text: string) => void;
}

const EXAMPLES = [
  {
    label: "A viral health claim",
    text: `Doctors confirm that drinking hot lemon water every morning permanently destroys cancer cells in the body. A Harvard study reportedly found a 98% success rate in early trials, but mainstream media refuses to report it. Share before they take this down.`,
  },
  {
    label: "A political headline",
    text: `Senator calls for emergency session after leaked documents reveal federal budget shortfall of $400 billion — sources say the White House was aware of the deficit six months before public disclosure but delayed the announcement until after the midterm elections.`,
  },
  {
    label: "A local news story",
    text: `City council approved a $12 million infrastructure plan Tuesday to repair aging water mains across four districts. The vote was 7–2 in favor, with two members citing concerns about contractor oversight. Work is expected to begin next spring and conclude within 18 months.`,
  },
];

export default function ExampleChips({ onSelect }: ExampleChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mt-3" aria-label="Example inputs">
      <span className="text-xs text-tertiary whitespace-nowrap">Try an example:</span>
      {EXAMPLES.map((ex) => (
        <button
          key={ex.label}
          onClick={() => onSelect(ex.text)}
          className="text-xs text-muted border border-hairline rounded-full px-3 py-1 hover:border-muted hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-ink"
          aria-label={`Fill example: ${ex.label}`}
        >
          {ex.label}
        </button>
      ))}
    </div>
  );
}
