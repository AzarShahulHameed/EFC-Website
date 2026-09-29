"use client";

import Link from "next/link";
import { deleteTeamMemberAction, toggleTeamMemberActiveAction, moveTeamMemberAction, reorderTeamAction } from "@/lib/admin-actions";
import ReorderArrows from "@/components/admin/ReorderArrows";
import DragReorderList, { DragHandleGrip } from "@/components/admin/DragReorderList";

export default function TeamTableBody({ team }: { team: any[] }) {
  return (
    <DragReorderList items={team} getId={(m) => m.id} onReorder={reorderTeamAction}>
      {(m, i, drag, isDragging) => {
        const en = m.translations?.find((t: any) => t.languageCode === "en");
        return (
          <tr key={m.id} className={`border-t border-slate-100 ${isDragging ? "bg-paper-2" : ""}`}>
            <td className="pl-4 py-3.5 w-8">
              <DragHandleGrip drag={drag} isDragging={isDragging} />
            </td>
            <td className="px-2 py-3.5">
              <ReorderArrows index={i} total={team.length} id={m.id} moveAction={moveTeamMemberAction} />
            </td>
            <td className="pl-2 py-3">
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photoUrl} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-line" />
              )}
            </td>
            <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">{m.name}</td>
            <td className="px-6 py-3.5 text-[13.5px] text-muted">{m.category === "Partner" ? "Partner" : "Key Member"}</td>
            <td className="px-6 py-3.5 text-[13.5px] text-muted">{en?.position}</td>
            <td className="px-6 py-3.5 text-[13.5px] text-muted">{m.branch?.city ?? "—"}</td>
            <td className="px-6 py-3.5">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  m.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                {m.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-6 py-3.5 text-right whitespace-nowrap">
              <Link href={`/admin/team/${m.id}/edit`} className="text-[12.5px] font-semibold text-ink mr-4">
                Edit
              </Link>
              <form action={toggleTeamMemberActiveAction.bind(null, m.id, m.isActive)} className="inline">
                <button type="submit" className="text-[12.5px] font-semibold text-ink mr-4">
                  {m.isActive ? "Disable" : "Enable"}
                </button>
              </form>
              <form action={deleteTeamMemberAction.bind(null, m.id)} className="inline">
                <button type="submit" className="text-[12.5px] font-semibold text-red-700">
                  Delete
                </button>
              </form>
            </td>
          </tr>
        );
      }}
    </DragReorderList>
  );
}
