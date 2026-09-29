"use client";

import { useState } from "react";
import PageBlockForm from "@/components/admin/PageBlockForm";
import { createPageBlockAction } from "@/lib/admin-actions";

export default function AddPageBlockPanel({ page }: { page: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)] self-start"
      >
        + Add Block
      </button>
    );
  }

  return (
    <PageBlockForm
      action={createPageBlockAction}
      page={page}
      mode="create"
      onCancel={() => setOpen(false)}
    />
  );
}
