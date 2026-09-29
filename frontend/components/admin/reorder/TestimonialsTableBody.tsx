"use client";

import Link from "next/link";
import { deleteTestimonialAction, toggleTestimonialActiveAction, moveTestimonialAction, reorderTestimonialsAction } from "@/lib/admin-actions";
import ReorderArrows from "@/components/admin/ReorderArrows";
import DragReorderList, { DragHandleGrip } from "@/components/admin/DragReorderList";

export default function TestimonialsTableBody({ testimonials }: { testimonials: any[] }) {
  return (
    <DragReorderList items={testimonials} getId={(t) => t.id} onReorder={reorderTestimonialsAction}>
      {(t, i, drag, isDragging) => {
        const en = t.translations?.find((tr: any) => tr.languageCode === "en");
        return (
          <tr key={t.id} className={`border-t border-slate-100 ${isDragging ? "bg-paper-2" : ""}`}>
            <td className="pl-4 py-3.5 w-8">
              <DragHandleGrip drag={drag} isDragging={isDragging} />
            </td>
            <td className="px-2 py-3.5">
              <ReorderArrows index={i} total={testimonials.length} id={t.id} moveAction={moveTestimonialAction} />
            </td>
            <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">
              {t.clientName}
              {t.clientTitle ? <div className="text-[12px] text-slate-400">{t.clientTitle}</div> : null}
            </td>
            <td className="px-6 py-3.5 text-[13px] text-muted max-w-sm truncate">{en?.quote}</td>
            <td className="px-6 py-3.5">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  t.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                {t.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-6 py-3.5 text-right whitespace-nowrap">
              <Link href={`/admin/testimonials/${t.id}/edit`} className="text-[12.5px] font-semibold text-ink mr-4">
                Edit
              </Link>
              <form action={toggleTestimonialActiveAction.bind(null, t.id, t.isActive)} className="inline">
                <button type="submit" className="text-[12.5px] font-semibold text-ink mr-4">
                  {t.isActive ? "Disable" : "Enable"}
                </button>
              </form>
              <form action={deleteTestimonialAction.bind(null, t.id)} className="inline">
                <button type="submit" className="text-[12.5px] font-semibold text-red-700">Delete</button>
              </form>
            </td>
          </tr>
        );
      }}
    </DragReorderList>
  );
}
