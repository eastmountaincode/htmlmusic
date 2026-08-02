"use client";

import { useEffect, useRef, useState } from "react";

type RecordingShareProps = {
  path: string;
  title: string;
};

type ShareLabel = "share" | "done" | "error";

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export function RecordingShare({ path, title }: RecordingShareProps) {
  const [label, setLabel] = useState<ShareLabel>("share");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  function showTemporaryLabel(nextLabel: Exclude<ShareLabel, "share">) {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
    }

    setLabel(nextLabel);
    resetTimerRef.current = setTimeout(() => {
      setLabel("share");
      resetTimerRef.current = null;
    }, 2000);
  }

  async function shareRecording() {
    const url = new URL(path, window.location.origin).href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (isAbortError(error)) return;
      }
    }

    try {
      if (typeof navigator.clipboard?.writeText !== "function") {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(url);
      showTemporaryLabel("done");
    } catch {
      showTemporaryLabel("error");
    }
  }

  return (
    <button
      className="recording-share"
      type="button"
      onClick={() => void shareRecording()}
    >
      <span aria-live="polite">{label}</span>
    </button>
  );
}
