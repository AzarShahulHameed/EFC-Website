"use client";

import { useState, useTransition, type ReactNode } from "react";

// Generic native-HTML5 drag-and-drop reorder wrapper. A page passes its
// already-fetched items plus a render function for one row/card; this
// component owns the drag state and, on drop, reorders locally
// (optimistic — no page reload needed) and fires the server action with
// the full new ID order. Works for both `<tbody>` rows (`as="tbody"`, the
// default) and card-grid `<div>`s (`as="div"`) so it can wrap a `<table>`
// or a plain grid without changing markup semantics.
export default function DragReorderList<T>({
  items,
  getId,
  onReorder,
  children,
  as = "tbody",
  className,
}: {
  items: T[];
  getId: (item: T) => string;
  onReorder: (ids: string[]) => Promise<void>;
  children: (item: T, index: number, drag: DragHandleProps, isDragging: boolean) => ReactNode;
  as?: "tbody" | "div";
  className?: string;
}) {
  const [order, setOrder] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const from = order.findIndex((it) => getId(it) === draggingId);
    const to = order.findIndex((it) => getId(it) === targetId);
    if (from === -1 || to === -1) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
    setDraggingId(null);
    startTransition(() => {
      onReorder(next.map(getId));
    });
  }

  const rows = order.map((item, index) => {
    const id = getId(item);
    const drag: DragHandleProps = {
      draggable: true,
      onDragStart: () => setDraggingId(id),
      onDragOver: (e) => e.preventDefault(),
      onDrop: () => handleDrop(id),
      onDragEnd: () => setDraggingId(null),
    };
    return children(item, index, drag, draggingId === id);
  });

  if (as === "div") return <div className={className}>{rows}</div>;
  return <tbody className={className}>{rows}</tbody>;
}

export type DragHandleProps = {
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

// A small ⠿ grip icon, draggable, to put at the start of each row — makes
// "you can drag this" discoverable instead of relying on the whole row
// being draggable (which fights with clicking Edit/Delete links inside it).
export function DragHandleGrip({ drag, isDragging }: { drag: DragHandleProps; isDragging: boolean }) {
  return (
    <span
      {...drag}
      className={`inline-flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-ink hover:bg-paper-2 cursor-grab active:cursor-grabbing select-none ${
        isDragging ? "opacity-40" : ""
      }`}
      title="Drag to reorder"
      aria-label="Drag to reorder"
    >
      ⠿
    </span>
  );
}
