"use client";

import { memo, useRef } from "react";
import FieldLabel from "./FieldLabel";

type Props = {
  name: string;
  label: string;
  hint?: string;
  defaultValueHtml?: string;
  rows?: number;
  onHtmlChange?: (html: string) => void;
};

// A minimal rich-text field: bold/italic/underline, font size and text
// color, built on contentEditable + document.execCommand rather than a
// third-party editor library, so it has no new dependency to install.
// Output is stored as an HTML string (in the same JSON content-block field
// the plain textarea used to fill), rendered on the public site with
// dangerouslySetInnerHTML through the sanitizer in lib/rich-text.ts.
//
// IMPORTANT: the contentEditable div is fully uncontrolled. Its content is
// set once, from the initial value, and never touched by React again —
// every read/write after that happens directly against the DOM via refs
// (hidden input's `.value`, and an optional callback), never through React
// state. Wrapped in memo() so a parent re-render (e.g. from the live
// preview panel's state) can never re-invoke this component with a fresh
// `dangerouslySetInnerHTML` object and reset the caret to the start —
// that was the previous version's bug: state-driven re-renders were
// wiping out whatever the user had just typed.
function RichTextField({ name, label, hint, defaultValueHtml, rows = 3, onHtmlChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  function sync() {
    const next = ref.current?.innerHTML ?? "";
    if (hiddenRef.current) hiddenRef.current.value = next;
    onHtmlChange?.(next);
  }

  function exec(cmd: string, value?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    sync();
  }

  // Turns the current text selection into a link — this is what lets an
  // admin place a "redirect link" inside a Service/Insight/Team body
  // rather than needing a whole separate field for it. Accepts a full URL
  // (https://...), a same-site path (/services/external-audit), an
  // in-page anchor (#pricing), or a mailto:. `sanitizeRichText` (see
  // lib/rich-text.ts) is the actual security boundary — it re-validates
  // and re-normalizes whatever's typed here before it's ever rendered on
  // the public site, so this prompt only has to be a convenience, not a
  // trust boundary.
  function insertLink() {
    if (!ref.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === "") {
      window.alert("Select some text first, then click Link to turn it into a link.");
      return;
    }
    const url = window.prompt(
      "Link to (full URL like https://..., a path like /services/vat-services, or #section):",
      "https://",
    );
    if (!url) return;
    exec("createLink", url);
  }

  const btnCls =
    "w-7 h-7 flex items-center justify-center text-[13px] text-ink border border-transparent hover:border-line rounded-sm";

  return (
    <div>
      <FieldLabel htmlFor={`${name}-editor`} hint={hint ?? ""}>{label}</FieldLabel>
      <div className="border border-line">
        <div className="flex items-center gap-1 border-b border-line bg-slate-50 px-2 py-1.5">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className={`${btnCls} font-bold`} title="Bold">
            B
          </button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className={`${btnCls} italic`} title="Italic">
            I
          </button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className={`${btnCls} underline`} title="Underline">
            U
          </button>
          <div className="w-px h-5 bg-line mx-1" />
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertLink} className={`${btnCls} underline decoration-2`} title="Link — select text first">
            🔗
          </button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("unlink")} className={btnCls} title="Remove link">
            <span className="line-through">🔗</span>
          </button>
          <div className="w-px h-5 bg-line mx-1" />
          <select
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => exec("fontSize", e.target.value)}
            defaultValue="3"
            className="text-[12px] border border-line px-1.5 py-1 bg-white"
            title="Font size"
          >
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="4">Large</option>
            <option value="5">X-Large</option>
            <option value="6">XX-Large</option>
          </select>
          <label className="flex items-center gap-1 ml-2 cursor-pointer" title="Text color">
            <span className="text-[11px] text-slate-500">Color</span>
            <input
              type="color"
              defaultValue="#10203a"
              onChange={(e) => exec("foreColor", e.target.value)}
              className="w-6 h-6 cursor-pointer border border-line p-0"
            />
          </label>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("removeFormat")}
            className="text-[11px] text-slate-500 ml-2 underline"
            title="Clear formatting"
          >
            Clear
          </button>
        </div>
        <div
          id={`${name}-editor`}
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          dangerouslySetInnerHTML={{ __html: defaultValueHtml ?? "" }}
          className="px-3.5 py-2.5 text-[14px] focus:outline-none"
          style={{ minHeight: `${Math.max(rows, 2) * 24}px` }}
        />
      </div>
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValueHtml ?? ""} />
    </div>
  );
}

export default memo(RichTextField);
