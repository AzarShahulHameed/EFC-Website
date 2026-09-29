import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateApplicationFormFieldsAction } from "@/lib/admin-actions";
import ApplicationFormBuilder, { type BuilderField } from "@/components/admin/ApplicationFormBuilder";

export default async function ApplicationFormBuilderPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const res = await adminFetch("/content/global/en");
  if (res.status === 401) redirect("/admin/login");
  const content = res.ok ? await res.json() : {};
  const fields: BuilderField[] = Array.isArray(content.applicationFormFields) ? content.applicationFormFields : [];

  return (
    <div className="px-9 py-8">
      <Link href="/admin/careers" className="text-[12.5px] text-slate-500 hover:text-ink">
        &larr; Careers
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-2 mb-1">Application Form Builder</h1>
      <p className="text-[13.5px] text-slate-500 mb-7 max-w-2xl">
        Every job&rsquo;s apply page always collects Full Name, Email, Phone, Resume and Cover Letter. Add fields
        here to collect anything else &mdash; nationality, current location, expected salary, notice period, and so
        on &mdash; and they&rsquo;ll appear on every job&rsquo;s apply page, in the order you set below.
      </p>

      <div className="bg-white border border-line p-6 max-w-3xl">
        <ApplicationFormBuilder action={updateApplicationFormFieldsAction} initialFields={fields} />
      </div>
    </div>
  );
}
