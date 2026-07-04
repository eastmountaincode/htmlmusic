"use client";

import { useEffect } from "react";

const OUTLINE_CLASS = "dev-outlines-on";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, button, audio, video, [contenteditable="true"], [contenteditable=""]',
    ),
  );
}

export function DevOutlineToggle() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.toLowerCase() !== "b" ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      document.documentElement.classList.toggle(OUTLINE_CLASS);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.documentElement.classList.remove(OUTLINE_CLASS);
    };
  }, []);

  return null;
}
