"use client";

import { useId, useState } from "react";

// A color field for non-technical admins: a click-to-pick swatch backed by
// the browser's native color picker, plus the hex code kept in view (and
// still editable by hand for anyone who does have an exact brand hex).
// Both inputs stay in sync and only the hidden/text input's value is what
// actually submits with the form — the <input type="color"> is just the
// picker UI.
export default function ColorField({
  id,
  name,
  defaultValue,
  allowEmpty = false,
  emptyPlaceholderColor = "#000000",
}: {
  id: string;
  name: string;
  defaultValue: string;
  // When true, a blank `defaultValue` stays blank (instead of being coerced
  // to black) and a "Use default" button lets the admin clear it back to
  // blank — for fields like Header Color/Footer Color/Heading Text Color/
  // Body Text Color where blank has a real, distinct meaning ("inherit
  // from Primary Color" / "use the built-in default") rather than being an
  // unset accident. Fields with no such fallback (Primary Color, etc.)
  // leave this off, matching the original always-a-color behavior.
  allowEmpty?: boolean;
  // The swatch color shown while the field is blank and allowEmpty is on —
  // purely cosmetic, doesn't get submitted.
  emptyPlaceholderColor?: string;
}) {
  const [value, setValue] = useState(defaultValue || (allowEmpty ? "" : "#000000"));
  const textId = useId();

  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <div className="flex items-center gap-2.5">
      <input
        type="color"
        aria-label="Pick a color"
        value={isValidHex ? value : emptyPlaceholderColor}
        onChange={(e) => setValue(e.target.value)}
        className="w-11 h-11 flex-shrink-0 border border-line rounded cursor-pointer p-0.5 bg-white"
      />
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={textId}
        placeholder={allowEmpty ? "Not set — using default" : "#0A1B33"}
        className="w-full border border-line px-3.5 py-2.5 text-[14px] font-mono"
      />
      {allowEmpty && value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 whitespace-nowrap"
          title="Clear back to the default"
        >
          Use default
        </button>
      ) : null}
      <span id={textId} className="sr-only">
        Hex color code — click the swatch on the left to pick one visually instead of typing it.
      </span>
    </div>
  );
}
