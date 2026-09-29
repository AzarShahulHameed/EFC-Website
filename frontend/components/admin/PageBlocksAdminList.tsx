"use client";

import { useState } from "react";
import DragReorderList, { DragHandleGrip } from "@/components/admin/DragReorderList";
import PageBlockForm, { BLOCK_TYPES } from "@/components/admin/PageBlockForm";
import { updatePageBlockAction, deletePageBlockAction, reorderPageBlocksAction } from "@/lib/admin-actions";

type Block = {
  id: string;
  page: string;
  type: string;
  content: Record<string, any>;
  animation?: string;
  isActive?: boolean;
};

function summarize(block: Block): string {
  const c = block.content || {};
  switch (block.type) {
    case "richText":
      return (c.html || "").replace(/<[^>]+>/g, "").slice(0, 70) || "(empty)";
    case "image":
      return c.caption || c.url || "(no photo yet)";
    case "video":
      return c.url || "(no video yet)";
    case "imageText":
      return c.headline || "(untitled)";
    case "cta":
      return c.headline || c.ctaLabel || "(untitled)";
    case "quote":
      return c.quote?.slice(0, 70) || "(empty)";
    case "gallery":
      return `${(c.images || []).length} photo(s)`;
    case "spacer":
      return `${c.height || 48}px gap`;
    default:
      return "";
  }
}

export default function PageBlocksAdminList({ page, blocks }: { page: string; blocks: Block[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <DragReorderList
      items={blocks}
      getId={(b) => b.id}
      onReorder={reorderPageBlocksAction.bind(null, page)}
      as="div"
      className="flex flex-col gap-3"
    >
      {(block, _i, drag, isDragging) => {
        const typeLabel = BLOCK_TYPES.find((t) => t.value === block.type)?.label || block.type;
        const editing = editingId === block.id;
        return (
          <div key={block.id} className={`border border-line bg-white ${isDragging ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <DragHandleGrip drag={drag} isDragging={isDragging} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-[0.08em] text-[#8A6D2E] uppercase">{typeLabel}</span>
                  {block.isActive === false ? (
                    <span className="text-[10.5px] font-semibold text-slate-400 border border-line px-1.5 py-0.5 rounded">Hidden</span>
                  ) : null}
                </div>
                <div className="text-[13.5px] text-ink truncate mt-0.5">{summarize(block)}</div>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(editing ? null : block.id)}
                className="text-[12.5px] font-semibold text-ink border border-line px-3 py-1.5 rounded-[var(--radius)] hover:border-ink"
              >
                {editing ? "Close" : "Edit"}
              </button>
              <form action={deletePageBlockAction.bind(null, block.id, page)}>
                <button type="submit" className="text-[12.5px] font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-[var(--radius)] hover:border-red-400">
                  Delete
                </button>
              </form>
            </div>
            {editing ? (
              <div className="border-t border-line p-4">
                <PageBlockForm
                  action={updatePageBlockAction.bind(null, block.id)}
                  page={page}
                  block={block}
                  mode="edit"
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : null}
          </div>
        );
      }}
    </DragReorderList>
  );
}
