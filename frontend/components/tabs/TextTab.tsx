"use client";

interface TextTabProps {
  value: string;
  onChange: (v: string) => void;
}

export default function TextTab({ value, onChange }: TextTabProps) {
  return (
    <textarea
      id="text-input"
      rows={6}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Paste article text or a headline here..."
      aria-label="Article text to analyse"
      className="w-full bg-transparent border-none outline-none text-ink placeholder:text-tertiary text-[15px] leading-relaxed font-inter resize-none"
    />
  );
}
