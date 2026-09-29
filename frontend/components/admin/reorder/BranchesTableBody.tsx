"use client";

import Link from "next/link";
import { deleteBranchAction, toggleBranchActiveAction, moveBranchAction, reorderBranchesAction } from "@/lib/admin-actions";
import ReorderArrows from "@/components/admin/ReorderArrows";
import DragReorderList, { DragHandleGrip } from "@/components/admin/DragReorderList";

export default function BranchesTableBody({ branches }: { branches: any[] }) {
  return (
    <DragReorderList items={branches} getId={(b) => b.id} onReorder={reorderBranchesAction}>
      {(b, i, drag, isDragging) => (
        <tr key={b.id} className={`border-t border-slate-100 ${isDragging ? "bg-paper-2" : ""}`}>
          <td className="pl-4 py-3.5 w-8">
            <DragHandleGrip drag={drag} isDragging={isDragging} />
          </td>
          <td className="px-2 py-3.5">
            <ReorderArrows index={i} total={branches.length} id={b.id} moveAction={moveBranchAction} />
          </td>
          <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">{b.city}</td>
          <td className="px-6 py-3.5 text-[13.5px] text-muted">{b.country || "—"}</td>
          <td className="px-6 py-3.5 text-[13.5px] text-muted">{b.addressLine}</td>
          <td className="px-6 py-3.5 text-[13.5px] text-muted">{b.phone}</td>
          <td className="px-6 py-3.5">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                b.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
              }`}
            >
              {b.isActive ? "Active" : "Inactive"}
            </span>
          </td>
          <td className="px-6 py-3.5 text-right whitespace-nowrap">
            <Link href={`/admin/branches/${b.id}/edit`} className="text-[12.5px] font-semibold text-ink mr-4">
              Edit
            </Link>
            <form action={toggleBranchActiveAction.bind(null, b.id, b.isActive)} className="inline">
              <button type="submit" className="text-[12.5px] font-semibold text-ink mr-4">
                {b.isActive ? "Disable" : "Enable"}
              </button>
            </form>
            <form action={deleteBranchAction.bind(null, b.id)} className="inline">
              <button type="submit" className="text-[12.5px] font-semibold text-red-700">Delete</button>
            </form>
          </td>
        </tr>
      )}
    </DragReorderList>
  );
}
