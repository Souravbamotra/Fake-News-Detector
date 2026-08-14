"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

interface ScreenshotTabProps {
  file: File | null;
  onFile: (f: File | null) => void;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/tiff"];
const MAX_MB = 10;

export default function ScreenshotTab({ file, onFile }: ScreenshotTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError(`Unsupported file type "${f.type}". Please upload PNG, JPEG, WebP, or TIFF.`);
      onFile(null);
      setPreview(null);
      return;
    }
    const mb = f.size / (1024 * 1024);
    if (mb > MAX_MB) {
      setError(`File is ${mb.toFixed(1)} MB — maximum is ${MAX_MB} MB.`);
      onFile(null);
      setPreview(null);
      return;
    }
    onFile(f);
    setPreview(URL.createObjectURL(f));
  }, [onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (chosen) handleFile(chosen);
  }, [handleFile]);

  const clearFile = () => {
    onFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (preview && file) {
    return (
      <div className="flex items-start gap-4">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-hairline flex-shrink-0">
          <Image src={preview} alt="Screenshot preview" fill style={{ objectFit: "cover" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted mt-0.5">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
          <button
            onClick={clearFile}
            className="mt-2 text-xs text-muted underline hover:text-ink transition-colors"
            aria-label="Remove image"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop zone for screenshot upload"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
          dragOver
            ? "border-ink bg-ink/5"
            : "border-hairline hover:border-muted"
        }`}
      >
        <svg
          width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeLinejoin="round" className="text-muted"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <p className="text-sm text-muted text-center leading-snug">
          Drop a screenshot here, or{" "}
          <span className="text-ink font-medium underline">browse files</span>
        </p>
        <p className="text-xs text-tertiary">PNG, JPEG, WebP, TIFF · max 10 MB</p>
      </div>

      <input
        ref={inputRef}
        id="screenshot-file-input"
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={onInputChange}
        className="sr-only"
        aria-label="Upload screenshot image"
        tabIndex={-1}
      />

      {error && (
        <p className="text-fake text-xs font-mono leading-relaxed" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
