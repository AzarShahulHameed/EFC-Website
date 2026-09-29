"use client";

import Link from "next/link";
import {
  deleteFreezoneApprovalAction,
  toggleFreezoneApprovalActiveAction,
  moveFreezoneApprovalAction,
  reorderFreezoneApprovalsAction,
} from "@/lib/admin-actions";
import DragReorderList, { DragHandleGrip } from "@/components/admin/DragReorderList";

export default function FreezoneApprovalsList({ approvals }: { approvals: any[] }) {
  return (
    <DragReorderList
      items={approvals}
      getId={(a) => a.id}
      onReorder={reorderFreezoneApprovalsAction}
      as="div"
      className="flex flex-col gap-px bg-line border border-line"
    >
      {(a, i, drag, isDragging) => (
        <div key={a.id} className={`bg-white p-4 flex items-center gap-4 ${isDragging ? "opacity-40" : ""}`}>
          <div className="flex items-center gap-2">
            <DragHandleGrip drag={drag} isDragging={isDragging} />
            <form action={moveFreezoneApprovalAction.bind(null, a.id, "up")}>
              <button
                type="submit"
                disabled={i === 0}
                aria-label="Move earlier"
                className="text-slate-400 hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed text-[13px] leading-none"
              >
                &#8593;
              </button>
            </form>
            <form action={moveFreezoneApprovalAction.bind(null, a.id, "down")}>
              <button
                type="submit"
                disabled={i === approvals.length - 1}
                aria-label="Move later"
                className="text-slate-400 hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed text-[13px] leading-none"
              >
                &#8595;
              </button>
            </form>
          </div>

          <div className="w-14 h-10 rounded-[var(--radius)] overflow-hidden bg-navy flex-shrink-0">
            {a.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold tracking-[0.1em] text-[#8A6D2E] uppercase truncate">{a.badge || "—"}</div>
            <div className="text-[13.5px] font-semibold text-ink truncate">{a.headline}</div>
          </div>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
              a.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
            }`}
          >
            {a.isActive ? "Active" : "Inactive"}
          </span>

          <div className="flex gap-3 flex-shrink-0">
            <Link href={`/admin/freezone/${a.id}/edit`} className="text-[11px] font-semibold text-ink">
              Edit
            </Link>
            <form action={toggleFreezoneApprovalActiveAction.bind(null, a.id, a.isActive)}>
              <button type="submit" className="text-[11px] font-semibold text-ink">
                {a.isActive ? "Disable" : "Enable"}
              </button>
            </form>
            <form action={deleteFreezoneApprovalAction.bind(null, a.id)}>
              <button type="submit" className="text-[11px] font-semibold text-red-700">Delete</button>
            </form>
          </div>
        </div>
      )}
    </DragReorderList>
  );
}
