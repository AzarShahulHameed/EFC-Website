"use client";

import { useState } from "react";

type LinkRow = { label: string; href: string };

// Add / remove / reorder rows of {label, href}, client-side, rendering
// inputs named `${prefix}_{i}_label` / `${prefix}_{i}_href` — the exact
// shape `parseRows()` (lib/admin-actions.ts) reads sequentially and stops
// at the first blank label. Re-indexing on every render means add/remove/
// reorder just works with zero server-side changes.
export default function ReorderableLinkRows({
  prefix,
  initialRows,
  max,
}: {
  prefix: string;
  initialRows: LinkRow[];
  max: number;
}) {
  const [rows, setRows] = useState<LinkRow[]>(initialRows.length ? initialRows : [{ label: "", href: "" }]);

  function addRow() {
    if (rows.length >= max) return;
    setRows((r) => [...r, { label: "", href: "" }]);
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setRows((r) => {
      const next = [...r];
      const j = i + dir;
      if (j < 0 || j >= next.length) return r;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function update(i: number, patch: Partial<LinkRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide px-0.5">
        <span>Label</span>
        <span>Link (e.g. /services)</span>
        <span></span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
          <input
            name={`${prefix}_${i}_label`}
            placeholder="Label"
            value={row.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink"
          />
          <input
            name={`${prefix}_${i}_href`}
            placeholder="/path"
            value={row.href}
            onChange={(e) => update(i, { href: e.target.value })}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink"
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="w-7 h-7 border border-line text-[12px] disabled:opacity-30"
              title="Move up"
            >
              &uarr;
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === rows.length - 1}
              className="w-7 h-7 border border-line text-[12px] disabled:opacity-30"
              title="Move down"
            >
              &darr;
            </button>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="text-[11.5px] font-semibold text-red-700 ml-1"
              title="Remove"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
      {rows.length < max ? (
        <button
          type="button"
          onClick={addRow}
          className="border border-ink text-ink text-[12.5px] font-semibold px-3.5 py-2 self-start"
        >
          + Add Link
        </button>
      ) : null}
    </div>
  );
}
