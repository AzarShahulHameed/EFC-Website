import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateProfileAction } from "@/lib/admin-actions";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default async function AdminProfilePage() {
  const res = await adminFetch("/auth/me");
  if (res.status === 401) redirect("/admin/login");
  const me: any = res.ok ? await res.json() : null;

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">My Profile</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        How you appear across the dashboard — this doesn&apos;t affect your login email, password, or role.
      </p>

      <form action={updateProfileAction} encType="multipart/form-data" className="bg-white border border-line p-6 max-w-xl flex flex-col gap-5">
        <ImageUploadField
          id="photo"
          label="Profile photo"
          fileFieldName="photo"
          currentUrl={me?.photoUrl}
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          previewClassName="w-16 h-16 rounded-full object-cover ring-1 ring-line"
          fileInputClassName="text-[13px] text-slate-500 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:rounded-[var(--radius)] file:text-[12.5px] file:font-semibold file:text-ink"
        />
        <p className="text-[11.5px] text-slate-400 -mt-3">JPG, PNG, WEBP, GIF or AVIF. Up to 10MB.</p>

        <div>
          <label htmlFor="name" className="block text-[13px] font-semibold text-ink mb-1.5">
            Display name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={me?.name ?? ""}
            required
            minLength={2}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
          />
          <p className="text-[11.5px] text-slate-400 mt-1">Shown in the sidebar, the dashboard greeting, and the audit log.</p>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Email</label>
          <div className="w-full border border-line bg-slate-50 px-3.5 py-2.5 text-[14px] text-slate-500 rounded-[var(--radius)]">
            {me?.email}
          </div>
          <p className="text-[11.5px] text-slate-400 mt-1">
            Change your email from the <a href="/admin/security" className="underline hover:text-ink">Security</a> page.
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-[13px] font-semibold text-ink mb-1.5">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={me?.phone ?? ""}
            maxLength={30}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-[13px] font-semibold text-ink mb-1.5">
            Short bio <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={me?.bio ?? ""}
            maxLength={600}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink resize-y"
          />
        </div>

        <button
          type="submit"
          className="bg-gold hover:bg-gold-light text-[#1A1204] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--btn-radius)] self-start transition-colors"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
