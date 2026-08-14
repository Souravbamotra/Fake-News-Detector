"use client";

interface ArticleTabProps {
  value: string;
  onChange: (v: string) => void;
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export { isValidUrl as isValidArticleUrl };

export default function ArticleTab({ value, onChange }: ArticleTabProps) {
  const invalid = value.length > 0 && !isValidUrl(value);

  return (
    <div className="flex flex-col gap-1.5">
      <input
        id="article-url-input"
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/article"
        aria-label="Article URL"
        aria-invalid={invalid}
        className={`w-full bg-transparent border-none outline-none text-ink placeholder:text-tertiary text-[15px] font-inter ${
          invalid ? "text-fake" : ""
        }`}
      />
      {invalid && (
        <p className="text-fake text-xs font-mono" role="alert">
          Please enter a valid URL starting with http:// or https://
        </p>
      )}
    </div>
  );
}
