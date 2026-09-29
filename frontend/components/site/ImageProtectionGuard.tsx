"use client";

import { useEffect } from "react";

// Blocks the right-click "Save Image As…"/"Save Video As…" context menu and
// drag-to-desktop on every image and video across the public site, when
// enabled (Admin → Site Settings → Image Protection). One document-level
// listener pair covers every current and future <img>/<video> on the page —
// nothing else in the site needs to change per-image. This is a real
// deterrent against casual copying, not a guarantee: anyone using their
// browser's dev tools can still get to the underlying file, which no
// website can prevent (the browser has to download the image to show it).
export default function ImageProtectionGuard({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const isProtectedTarget = (target: EventTarget | null) =>
      target instanceof HTMLElement && (target.tagName === "IMG" || target.tagName === "VIDEO");

    const onContextMenu = (e: MouseEvent) => {
      if (isProtectedTarget(e.target)) e.preventDefault();
    };
    const onDragStart = (e: DragEvent) => {
      if (isProtectedTarget(e.target)) e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, [enabled]);

  return null;
}
