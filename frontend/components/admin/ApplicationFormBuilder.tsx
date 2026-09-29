"use client";

import { useState } from "react";

export type BuilderField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
};

const TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
];

// Add / remove / reorder custom applicant fields, entirely client-side, then
// submit through the given server action. Rows are re-indexed on every
// render (field_{i}_*), so add/remove/reorder just works — the server
// action (updateApplicationFormFieldsAction) reads field_0.. sequentially
// and stops at the first blank label.
export default function ApplicationFormBuilder({
  action,
  initialFields,
}: {
  action: (formData: FormData) => void;
  initialFields: BuilderField[];
}) {
  const [fields, setFields] = useState<BuilderField[]>(initialFields);

  function addField() {
    setFields((f) => [...f, { id: `field_${Date.now()}`, label: "", type: "text", required: false }]);
  }
  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setFields((f) => {
      const next = [...f];
      const j = i + dir;
      if (j < 0 || j >= next.length) return f;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function update(i: number, patch: Partial<BuilderField>) {
    setFields((f) => f.map((field, idx) => (idx === i ? { ...field, ...patch } : field)));
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {fields.length === 0 ? (
        <p className="text-[13.5px] text-slate-400">
          No custom fields yet — every apply form currently only asks for Full Name, Email, Phone, Resume and Cover
          Letter. Add a field below to collect more.
        </p>
      ) : null}
      <div className="flex flex-col gap-3">
        {fields.map((field, i) => (
          <div key={field.id} className="border border-line p-4 bg-white">
            <input type="hidden" name={`field_${i}_id`} value={field.id} />
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-3 sm:items-end">
              <div>
                <label className="block text-[12px] font-semibold text-ink mb-1">Field Label</label>
                <input
                  name={`field_${i}_label`}
                  value={field.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="e.g. Current Salary"
                  className="w-full border border-line px-3 py-2 text-[13.5px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-ink mb-1">Field Type</label>
                <select
                  name={`field_${i}_type`}
                  value={field.type}
                  onChange={(e) => update(i, { type: e.target.value })}
                  className="w-full border border-line px-2 py-2 text-[13.5px] bg-white"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
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
                  disabled={i === fields.length - 1}
                  className="w-7 h-7 border border-line text-[12px] disabled:opacity-30"
                  title="Move down"
                >
                  &darr;
                </button>
                <button
                  type="button"
                  onClick={() => removeField(i)}
                  className="text-[12px] font-semibold text-red-700 ml-1"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mt-3">
              <label className="flex items-center gap-2 text-[13px] text-ink flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  name={`field_${i}_required`}
                  value="1"
                  checked={field.required}
                  onChange={(e) => update(i, { required: e.target.checked })}
                />
                Required
              </label>
              {field.type === "select" ? (
                <div className="flex-1">
                  <label className="block text-[12px] font-semibold text-ink mb-1">Options (one per line)</label>
                  <textarea
                    name={`field_${i}_options`}
                    value={field.options ?? ""}
                    onChange={(e) => update(i, { options: e.target.value })}
                    rows={2}
                    placeholder={"0-3 months\n1 month\n2 months"}
                    className="w-full border border-line px-3 py-2 text-[13px]"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={addField}
          className="border border-ink text-ink text-[13px] font-semibold px-4 py-2.5 self-start"
        >
          + Add Field
        </button>
        <button
          type="submit"
          className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius)] self-start"
        >
          Save Form Fields
        </button>
      </div>
    </form>
  );
}
