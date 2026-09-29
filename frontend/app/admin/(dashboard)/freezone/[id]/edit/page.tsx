import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { updateFreezoneApprovalAction } from "@/lib/admin-actions";
import FreezoneApprovalFieldsForm from "@/components/admin/FreezoneApprovalFieldsForm";

export default async function EditFreezoneApprovalPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const res = await adminFetch("/freezone-approvals/admin/all");
  if (res.status === 401) redirect("/admin/login");
  const approvals: any[] = res.ok ? await res.json() : [];
  const approval = approvals.find((a) => a.id === params.id);
  if (!approval) notFound();

  const action = updateFreezoneApprovalAction.bind(null, params.id, approval.imageUrl, approval.videoUrl);

  return (
    <div className="px-9 py-8">
      <div className="mb-1 flex items-center gap-2 text-[13px]">
        <Link href="/admin/freezone" className="text-slate-500 hover:text-ink">
          Freezone Approvals
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-ink font-medium">Edit</span>
      </div>
      <h1 className="text-2xl font-bold text-ink mb-1">Edit Approval</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">{approval.headline}</p>

      {searchParams.error ? (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 text-[13.5px] px-4 py-3 rounded-[var(--radius)] max-w-2xl">
          {searchParams.error}
        </div>
      ) : null}

      <div className="bg-white border border-line p-6 max-w-2xl">
        <form action={action} encType="multipart/form-data" className="flex flex-col gap-4">
          <FreezoneApprovalFieldsForm
            defaults={{
              badge: approval.badge,
              headline: approval.headline,
              body: approval.body,
              ctaLabel: approval.ctaLabel,
              ctaHref: approval.ctaHref,
              imageUrl: approval.imageUrl,
              imagePosition: approval.imagePosition,
              videoUrl: approval.videoUrl,
              mediaPosition: approval.mediaPosition,
            }}
          />
          <div className="flex gap-3 mt-2">
            <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)]">
              Save Changes
            </button>
            <Link
              href="/admin/freezone"
              className="border border-line text-ink font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
