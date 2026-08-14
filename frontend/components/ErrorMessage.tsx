"use client";

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mt-4 px-4 py-3 rounded-xl bg-fake/5 border border-fake/20 text-fake text-sm leading-relaxed"
    >
      {message}
    </div>
  );
}
