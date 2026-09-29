import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { createFreezoneApprovalAction, updateFreezoneDisplayAction } from "@/lib/admin-actions";
import FreezoneApprovalFieldsForm from "@/components/admin/FreezoneApprovalFieldsForm";
import FreezoneDisplayForm from "@/components/admin/FreezoneDisplayForm";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import FreezoneApprovalsList from "@/components/admin/reorder/FreezoneApprovalsList";

export default async function AdminFreezonePage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const [res, contentRes] = await Promise.all([
    adminFetch("/freezone-approvals/admin/all"),
    adminFetch("/content/home/en"),
  ]);
  if (res.status === 401) redirect("/admin/login");
  const approvals: any[] = res.ok ? await res.json() : [];
  const content: any = contentRes.ok ? await contentRes.json() : {};
  const display = {
    enabled: true,
    autoRotateSeconds: 7,
    pauseOnHover: true,
    ...(content.freezoneDisplay ?? {}),
  };
  const activeApprovals = approvals.filter((a) => a.isActive);

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Freezone Approvals</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        The &ldquo;Approved to operate within…&rdquo; / partnership banner on the homepage. Add as many approvals as
        apply — with more than one active, they rotate automatically.
      </p>

      {searchParams.error ? (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 text-[13.5px] px-4 py-3 rounded-[var(--radius)]">
          {searchParams.error}
        </div>
      ) : null}

      {approvals.length === 0 ? (
        <div className="px-6 py-8 text-[13.5px] text-slate-400 bg-white border border-line mb-8">
          No approvals yet — add the first one below.
        </div>
      ) : (
        <div className="mb-8">
          <FreezoneApprovalsList approvals={approvals} />
        </div>
      )}

      <EditorLayout label="Live Preview">
        <div className="bg-white border border-line p-6 max-w-2xl mb-8">
          <h2 className="text-[15px] font-bold text-ink mb-1">Display Settings</h2>
          <p className="text-[12.5px] text-slate-400 mb-4">Whether the banner shows, and how it rotates between approvals.</p>
          <form action={updateFreezoneDisplayAction} className="flex flex-col gap-4">
            <FreezoneDisplayForm
              approvals={activeApprovals}
              defaultEnabled={display.enabled}
              defaultAutoRotateSeconds={display.autoRotateSeconds}
              defaultPauseOnHover={display.pauseOnHover}
            />
            <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
              Save Display Settings
            </button>
          </form>
        </div>
      </EditorLayout>

      <EditorLayout>
        <div className="bg-white border border-line p-6 max-w-2xl">
          <h2 className="text-[15px] font-bold text-ink mb-4">Add an Approval</h2>
          <form action={createFreezoneApprovalAction} encType="multipart/form-data" className="flex flex-col gap-4">
            <FreezoneApprovalFieldsForm />
            <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
              Add Approval
            </button>
          </form>
        </div>
      </EditorLayout>
    </div>
  );
}
