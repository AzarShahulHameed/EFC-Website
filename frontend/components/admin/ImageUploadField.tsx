"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";

// Reusable image-upload control used by every admin form that uploads a
// photo through Cloudinary (see lib/cloudinary.ts's uploadToCloudinary(),
// called from the server action this field's <form> submits to).
//
// It standardizes a pattern that used to be hand-rolled per form:
//   - a thumbnail of the current photo (if any)
//   - a `<input type="file">` to upload a replacement
//   - a hidden `${existingUrlFieldName}` input carrying the current URL
//     through to the server action, so "no new file chosen" means "keep
//     the current photo" (see uploadToCloudinary's own doc comment)
//   - a "Remove" control, visible only once a photo is set (uploaded,
//     freshly chosen, or already saved), that clears the preview and
//     flips a hidden "remove" checkbox (named `removeX`, e.g. removeImage —
//     same convention as this project's other remove checkboxes, like
//     updateLocationGateAction's removeImage/removeLogo/removeVideo) to
//     "1" — the server action then blanks the URL instead of falling back
//     to the existing one (`removeX ? "" : uploaded ?? existingX ?? ""`).
//
// This is a plain <form action={serverAction}> field, not a controlled
// React input — the uploaded URL only exists after the server action runs
// and the page re-renders with the new `currentUrl`, which is how every
// admin form in this project already works.
export default function ImageUploadField({
  id,
  label,
  hint,
  fileFieldName,
  existingUrlFieldName,
  removeFieldName,
  currentUrl,
  accept = "image/*",
  previewClassName = "w-24 h-24 object-cover border border-line",
  previewStyle,
  fileInputClassName = "w-full text-[13.5px]",
  onFileChange,
  onRemoveChange,
}: {
  id: string;
  label?: string;
  hint?: string;
  /** Name of the <input type="file"> the server action reads with formData.get(...). */
  fileFieldName: string;
  /** Name of the hidden input carrying the current URL through to the action. Omit to skip rendering it (e.g. when a parent already renders its own). */
  existingUrlFieldName?: string;
  /** Name of the hidden "remove" checkbox the action checks (defaults to `${fileFieldName}Remove`). */
  removeFieldName?: string;
  /** The photo's current URL, if one is already saved. */
  currentUrl?: string | null;
  accept?: string;
  previewClassName?: string;
  previewStyle?: React.CSSProperties;
  fileInputClassName?: string;
  onFileChange?: (file: File | null) => void;
  onRemoveChange?: (removed: boolean) => void;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [removed, setRemoved] = useState(false);
  // Matches this project's existing checkbox-name convention (removeVideo,
  // removeImage, removeLogo, ...) rather than inventing a new one.
  const resolvedRemoveFieldName =
    removeFieldName ?? `remove${fileFieldName.charAt(0).toUpperCase()}${fileFieldName.slice(1)}`;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setRemoved(false);
      onRemoveChange?.(false);
      setPreview(URL.createObjectURL(file));
    }
    onFileChange?.(file);
  }

  function handleRemove() {
    setPreview(null);
    setRemoved(true);
    onRemoveChange?.(true);
  }

  return (
    <div>
      {label ? (
        hint ? (
          <FieldLabel htmlFor={id} hint={hint}>{label}</FieldLabel>
        ) : (
          <label htmlFor={id} className="block text-[13px] font-semibold text-ink mb-1.5">{label}</label>
        )
      ) : null}

      {existingUrlFieldName ? (
        <input type="hidden" name={existingUrlFieldName} value={currentUrl ?? ""} />
      ) : null}
      <input type="hidden" name={resolvedRemoveFieldName} value={removed ? "1" : ""} />

      {preview ? (
        <div className="flex items-center gap-3 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" style={previewStyle} className={previewClassName} />
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 text-[12.5px] font-semibold text-red-600 border border-red-200 px-2.5 py-1.5 rounded-[var(--radius)] hover:border-red-400"
            title="Remove photo"
            aria-label="Remove photo"
          >
            &times; Remove
          </button>
        </div>
      ) : null}

      <input id={id} name={fileFieldName} type="file" accept={accept} onChange={handleFileChange} className={fileInputClassName} />
      {removed ? <p className="text-[11.5px] text-slate-400 mt-1">Photo will be removed on save — choose a file above to replace it instead.</p> : null}
    </div>
  );
}
