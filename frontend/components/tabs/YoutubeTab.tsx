"use client";

interface YoutubeTabProps {
  value: string;
  onChange: (v: string) => void;
}

function isYoutubeUrl(s: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/.test(s);
}

export { isYoutubeUrl };

export default function YoutubeTab({ value, onChange }: YoutubeTabProps) {
  const invalid = value.length > 0 && !isYoutubeUrl(value);

  return (
    <div className="flex flex-col gap-1.5">
      <input
        id="youtube-url-input"
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://youtube.com/watch?v=..."
        aria-label="YouTube video URL"
        aria-invalid={invalid}
        className={`w-full bg-transparent border-none outline-none text-ink placeholder:text-tertiary text-[15px] font-inter ${
          invalid ? "text-fake" : ""
        }`}
      />
      {invalid && (
        <p className="text-fake text-xs font-mono" role="alert">
          Must be a youtube.com or youtu.be URL
        </p>
      )}
      <p className="text-tertiary text-xs leading-relaxed">
        Note: only videos with existing captions can be analysed.
      </p>
    </div>
  );
}
