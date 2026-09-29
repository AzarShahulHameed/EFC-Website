"use client";

import Link from "next/link";
import { deleteClientLogoAction, toggleClientLogoActiveAction, moveClientLogoAction, reorderClientLogosAction } from "@/lib/admin-actions";
import DragReorderList, { DragHandleGrip } from "@/components/admin/DragReorderList";

export default function ClientLogosGrid({ logos }: { logos: any[] }) {
  return (
    <DragReorderList
      items={logos}
      getId={(l) => l.id}
      onReorder={reorderClientLogosAction}
      as="div"
      className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-px bg-line border border-line"
    >
      {(l, i, drag, isDragging) => (
        <div key={l.id} className={`bg-white p-4 flex flex-col items-center gap-3 ${isDragging ? "opacity-40" : ""}`}>
          <div className="flex items-center gap-2 self-stretch justify-center">
            <DragHandleGrip drag={drag} isDragging={isDragging} />
            <form action={moveClientLogoAction.bind(null, l.id, "up")}>
              <button
                type="submit"
                disabled={i === 0}
                aria-label="Move earlier"
                className="text-slate-400 hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed text-[13px] leading-none"
              >
                &#8592;
              </button>
            </form>
            <span className="text-[10px] text-slate-300">order</span>
            <form action={moveClientLogoAction.bind(null, l.id, "down")}>
              <button
                type="submit"
                disabled={i === logos.length - 1}
                aria-label="Move later"
                className="text-slate-400 hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed text-[13px] leading-none"
              >
                &#8594;
              </button>
            </form>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.imageUrl} alt={l.name} className="h-10 object-contain" />
          <div className="text-[12px] text-ink text-center">{l.name}</div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              l.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
            }`}
          >
            {l.isActive ? "Active" : "Inactive"}
          </span>
          <div className="flex gap-3">
            <Link href={`/admin/client-logos/${l.id}/edit`} className="text-[11px] font-semibold text-ink">
              Edit
            </Link>
            <form action={toggleClientLogoActiveAction.bind(null, l.id, l.isActive)}>
              <button type="submit" className="text-[11px] font-semibold text-ink">
                {l.isActive ? "Disable" : "Enable"}
              </button>
            </form>
            <form action={deleteClientLogoAction.bind(null, l.id)}>
              <button type="submit" className="text-[11px] font-semibold text-red-700">Delete</button>
            </form>
          </div>
        </div>
      )}
    </DragReorderList>
  );
}
