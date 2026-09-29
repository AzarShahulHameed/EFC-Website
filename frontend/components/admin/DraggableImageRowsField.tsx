"use client";

import { useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { DragHandleGrip, type DragHandleProps } from "@/components/admin/DragReorderList";

// A form-only (no server round-trip) sibling of DragReorderList, for the
// content-block arrays that aren't their own database table — Trust Strip,
// Industries, Why Choose Us, About Gallery. Those are saved as one big
// array in a single server action (see e.g. updateTrustBadgesAction in
// lib/admin-actions.ts), so unlike a Team member or Testimonial there's no
// row `id` and no separate reorder action to call: dragging a row just
// reorders this component's local state, and on submit each row's inputs
// are named `${prefix}_${i}_...` using ITS CURRENT position `i` — so the
// server action (which already just reads `${prefix}_${i}_...` up to a max
// and drops empty rows) sees the new order and any deleted row for free,
// with no backend changes needed.
// The non-image inputs for one row can be supplied two ways:
//   - `fields`: a plain, serializable list of { key, placeholder } pairs —
//     this component renders a plain <input> for each one itself. This is
//     the ONLY option usable from a Server Component caller (e.g. a plain
//     admin page.tsx with no "use client"), because a function — unlike
//     plain data — cannot be passed from a Server Component into a Client
//     Component; React throws "Functions cannot be passed directly to
//     Client Components" the moment it tries to serialize the props
//     (surfaces at runtime in `next start`, not always in `next dev`).
//   - `renderFields`: a full render-prop function for bespoke row layouts —
//     only safe when the CALLER is itself a Client Component (function
//     values passed client-to-client are fine).
type RowField = { key: string; placeholder: string; className?: string };

const defaultFieldInputCls =
  "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";

export default function DraggableImageRowsField<T extends Record<string, any>>({
  prefix,
  max,
  initialRows,
  emptyRow,
  imageField,
  imageFileFieldSuffix,
  imageFolder: _imageFolder,
  imageLabel = "Photo",
  fields,
  renderFields,
  addLabel = "Add another",
}: {
  prefix: string;
  max: number;
  initialRows: T[];
  emptyRow: T;
  /** Key in each row holding the image URL, e.g. "logoUrl" or "iconUrl". */
  imageField: keyof T & string;
  /** The `<input type="file">`'s own name suffix, e.g. "logo" for `${prefix}_${i}_logo` — defaults to `imageField` with a trailing "Url" stripped. */
  imageFileFieldSuffix?: string;
  imageFolder?: string;
  imageLabel?: string;
  /** Server-Component-safe: a declarative list of plain-text inputs rendered for each row. Prefer this from a page.tsx with no "use client". */
  fields?: RowField[];
  /** Client-Component-only: renders the non-image inputs for one row with full JSX control. Only pass this from a caller that itself has "use client" — see note above. */
  renderFields?: (row: T, name: (field: string) => string) => React.ReactNode;
  addLabel?: string;
}) {
  const [rows, setRows] = useState<{ key: number; data: T }[]>(() =>
    (initialRows.length > 0 ? initialRows : [emptyRow]).map((data, i) => ({ key: i, data })),
  );
  const [nextKey, setNextKey] = useState(rows.length);
  const [draggingKey, setDraggingKey] = useState<number | null>(null);

  function addRow() {
    if (rows.length >= max) return;
    setRows((r) => [...r, { key: nextKey, data: emptyRow }]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setRows((r) => r.filter((row) => row.key !== key));
  }

  function handleDrop(targetKey: number) {
    if (draggingKey === null || draggingKey === targetKey) return;
    setRows((r) => {
      const from = r.findIndex((row) => row.key === draggingKey);
      const to = r.findIndex((row) => row.key === targetKey);
      if (from === -1 || to === -1) return r;
      const next = [...r];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggingKey(null);
  }

  const fileSuffix = imageFileFieldSuffix ?? imageField.replace(/Url$/, "");

  return (
    <div className="flex flex-col gap-4">
      {rows.map(({ key, data }, i) => {
        const name = (field: string) => `${prefix}_${i}_${field}`;
        const drag: DragHandleProps = {
          draggable: true,
          onDragStart: () => setDraggingKey(key),
          onDragOver: (e) => e.preventDefault(),
          onDrop: () => handleDrop(key),
          onDragEnd: () => setDraggingKey(null),
        };
        return (
          <div
            key={key}
            className={`flex items-start gap-3 border-b border-line pb-4 last:border-0 last:pb-0 ${
              draggingKey === key ? "opacity-40" : ""
            }`}
          >
            <div className="pt-1.5">
              <DragHandleGrip drag={drag} isDragging={draggingKey === key} />
            </div>
            <div className="flex-1">
              <ImageUploadField
                id={name(imageField)}
                label={imageLabel}
                fileFieldName={name(fileSuffix)}
                existingUrlFieldName={name(`existing${imageField.charAt(0).toUpperCase()}${imageField.slice(1)}`)}
                removeFieldName={name(`${fileSuffix}Remove`)}
                currentUrl={data[imageField]}
                previewClassName="w-10 h-10 object-contain border border-line bg-white"
              />
            </div>
            <div className="flex-[2]">
              {fields ? (
                <div className={fields.length > 1 ? "grid grid-cols-1 gap-2" : undefined}>
                  {fields.map((f) => (
                    <input
                      key={f.key}
                      name={name(f.key)}
                      placeholder={f.placeholder}
                      defaultValue={(data as Record<string, any>)[f.key] ?? ""}
                      className={f.className ?? defaultFieldInputCls}
                    />
                  ))}
                </div>
              ) : renderFields ? (
                renderFields(data, name)
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => removeRow(key)}
              className="text-[12px] font-semibold text-red-600 border border-red-200 px-2.5 py-1.5 rounded-[var(--radius)] hover:border-red-400 mt-1.5 flex-shrink-0"
              title="Remove this row"
              aria-label="Remove this row"
            >
              &times;
            </button>
          </div>
        );
      })}

      {rows.length < max ? (
        <button
          type="button"
          onClick={addRow}
          className="self-start text-[12.5px] font-semibold text-ink border border-line px-3 py-1.5 rounded-[var(--radius)] hover:border-ink"
        >
          + {addLabel}
        </button>
      ) : null}
    </div>
  );
}
