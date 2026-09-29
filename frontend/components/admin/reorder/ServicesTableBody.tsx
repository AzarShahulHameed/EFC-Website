"use client";

import Link from "next/link";
import { deleteServiceAction, toggleServiceActiveAction, moveServiceAction, reorderServicesAction } from "@/lib/admin-actions";
import ReorderArrows from "@/components/admin/ReorderArrows";
import DragReorderList, { DragHandleGrip } from "@/components/admin/DragReorderList";

export default function ServicesTableBody({ services }: { services: any[] }) {
  return (
    <DragReorderList items={services} getId={(s) => s.id} onReorder={reorderServicesAction}>
      {(s, i, drag, isDragging) => {
        const en = s.translations?.find((t: any) => t.languageCode === "en");
        return (
          <tr key={s.id} className={`border-t border-slate-100 ${isDragging ? "bg-paper-2" : ""}`}>
            <td className="pl-4 py-3.5 w-8">
              <DragHandleGrip drag={drag} isDragging={isDragging} />
            </td>
            <td className="px-2 py-3.5">
              <ReorderArrows index={i} total={services.length} id={s.id} moveAction={moveServiceAction} />
            </td>
            <td className="px-6 py-3.5">
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imageUrl} alt="" className="w-12 h-9 object-cover border border-line" />
              ) : (
                <div className="w-12 h-9 bg-slate-100 border border-line" />
              )}
            </td>
            <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">{en?.title ?? s.slug}</td>
            <td className="px-6 py-3.5 text-[13.5px] text-muted">{s.slug}</td>
            <td className="px-6 py-3.5">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  s.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                {s.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-6 py-3.5 text-right whitespace-nowrap">
              <Link href={`/admin/services/${s.id}/edit`} className="text-[12.5px] font-semibold text-ink mr-4">
                Edit
              </Link>
              <form action={toggleServiceActiveAction.bind(null, s.id, s.isActive)} className="inline">
                <button type="submit" className="text-[12.5px] font-semibold text-ink mr-4">
                  {s.isActive ? "Disable" : "Enable"}
                </button>
              </form>
              <form action={deleteServiceAction.bind(null, s.id)} className="inline">
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
