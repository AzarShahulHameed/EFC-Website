"use client";

import { useState } from "react";

const ACTION_STYLES: Record<string, string> = {
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-amber-100 text-amber-800",
  PUT: "bg-amber-100 text-amber-800",
  DELETE: "bg-red-100 text-red-800",
};

// One audit-log row, expandable to show the "what" behind an entry — the
// request body that was saved (already redacted server-side of anything
// resembling a password/OTP/token before it was ever written to the
// database, see AuditLogInterceptor.safeMetadata). Collapsed by default so
// the table stays scannable; only a user actively investigating a change
// needs to see the raw payload.
export default function AuditLogRow({ log }: { log: any }) {
  const [open, setOpen] = useState(false);
  const hasMetadata = log.metadata && typeof log.metadata === "object" && Object.keys(log.metadata).length > 0;

  return (
    <>
      <tr className="border-t border-slate-100">
        <td className="px-6 py-3.5 text-[13px] text-slate-400 whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString()}
        </td>
        <td className="px-6 py-3.5 text-[13.5px] text-ink">
          <div className="font-medium">{log.user?.name ?? "—"}</div>
          {log.user?.email ? <div className="text-[12px] text-slate-400">{log.user.email}</div> : null}
        </td>
        <td className="px-6 py-3.5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ACTION_STYLES[log.action] ?? "bg-slate-200 text-slate-600"}`}>
            {log.action}
          </span>
        </td>
        <td className="px-6 py-3.5 text-[13.5px] text-muted">{log.entityType}</td>
        <td className="px-6 py-3.5 text-[12.5px] text-slate-400 font-mono truncate max-w-[160px]">{log.entityId}</td>
        <td className="px-6 py-3.5 text-right">
          {hasMetadata ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-[12px] font-semibold text-[#8A6D2E] hover:underline"
            >
              {open ? "Hide details" : "View details"}
            </button>
          ) : null}
        </td>
      </tr>
      {open && hasMetadata ? (
        <tr className="border-t border-slate-100 bg-slate-50">
          <td colSpan={6} className="px-6 py-3.5">
            <pre className="text-[12px] font-mono text-slate-600 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </td>
        </tr>
      ) : null}
    </>
  );
}
