import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { submitJobApplication } from "@/lib/actions";
import { getSystemMessage, getJobOpening, getApplicationFormFields } from "@/lib/api";
import { sanitizeRichText } from "@/lib/rich-text";
import PhoneNumberField from "@/components/site/PhoneNumberField";

// Bullet list helper — same newline-separated-string convention used for
// Service.benefits/process, kept as raw strings end-to-end and only split
// into list items at render time.
function toBullets(text?: string): string[] {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: { lang: string; jobId: string };
  searchParams: { error?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const [job, customFields] = await Promise.all([
    getJobOpening(params.jobId),
    getApplicationFormFields(),
  ]);
  if (!job) notFound();

  // Wording for each of these comes from /admin/messages — see
  // lib/api.ts's SYSTEM_MESSAGE_KEYS for the fallback text used until an
  // admin overrides it.
  const errorMessage =
    searchParams.error === "missing_fields"
      ? await getSystemMessage("message.career.missing_fields", lang)
      : searchParams.error === "upload_failed"
      ? await getSystemMessage("message.career.upload_failed", lang)
      : searchParams.error === "invalid"
      ? await getSystemMessage("message.career.invalid", lang)
      : searchParams.error === "duplicate"
      ? await getSystemMessage("message.career.duplicate", lang)
      : searchParams.error === "submit_failed"
      ? await getSystemMessage("message.career.submit_failed", lang)
      : null;

  const responsibilities = toBullets(job.responsibilities);
  const qualifications = toBullets(job.qualifications);

  return (
    <div className="container-page py-24 max-w-3xl">
      <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">
        {job.department} &middot; {job.location} &middot; {job.type}
      </div>
      <h1 className="font-serif text-4xl text-ink leading-tight mb-6">{job.title}</h1>

      {job.description ? (
        <div
          className="text-[16px] text-muted leading-relaxed max-w-2xl [&_p]:mb-4 [&_p:last-child]:mb-0 [&_div]:mb-2.5 [&_div:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(job.description) }}
        />
      ) : null}

      {responsibilities.length > 0 ? (
        <div className="mt-12">
          <h2 className="text-[17px] font-bold text-[#C1443C] mb-4">Key Responsibilities</h2>
          <ul className="flex flex-col gap-2.5 text-[15px] text-ink leading-relaxed list-disc list-inside max-w-2xl">
            {responsibilities.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {qualifications.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-[17px] font-bold text-[#C1443C] mb-4">Preferred Qualifications</h2>
          <ul className="flex flex-col gap-2.5 text-[15px] text-ink leading-relaxed list-disc list-inside max-w-2xl">
            {qualifications.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-20 text-center">
        <h2 className="font-serif text-3xl text-ink mb-2">Apply Now</h2>
        <p className="text-[15px] text-muted max-w-md mx-auto">
          Fill in your details below and we&rsquo;ll be in touch once your application has been reviewed.
        </p>
      </div>

      {errorMessage ? (
        <div className="bg-red-50 border border-red-200 px-5 py-3 mt-8 text-[13.5px] text-red-800 max-w-2xl mx-auto">
          {errorMessage}
        </div>
      ) : null}

      <form
        action={submitJobApplication.bind(null, lang, params.jobId)}
        encType="multipart/form-data"
        className="mt-10"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label htmlFor="fullName" className="block text-[13px] font-semibold text-ink mb-2">
              First &amp; Last Name
            </label>
            <input id="fullName" name="fullName" required minLength={2} maxLength={120} className="w-full border border-line px-4 py-3 text-[14.5px]" />
          </div>
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold text-ink mb-2">
              Email
            </label>
            <input id="email" name="email" type="email" required maxLength={254} className="w-full border border-line px-4 py-3 text-[14.5px]" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-[13px] font-semibold text-ink mb-2">
              Contact Number
            </label>
            <PhoneNumberField id="phone" name="phone" className="w-full border border-line px-4 py-3 text-[14.5px]" />
          </div>

          {customFields.map((field) => {
            const fieldName = `field_${field.id}`;
            const options = toBullets(field.options);
            return (
              <div key={field.id} className={field.type === "textarea" ? "sm:col-span-3" : undefined}>
                <label htmlFor={fieldName} className="block text-[13px] font-semibold text-ink mb-2">
                  {field.label}
                  {field.required ? <span className="text-red-600"> *</span> : null}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={fieldName}
                    name={fieldName}
                    required={field.required}
                    rows={4}
                    className="w-full border border-line px-4 py-3 text-[14.5px]"
                  />
                ) : field.type === "select" ? (
                  <select
                    id={fieldName}
                    name={fieldName}
                    required={field.required}
                    defaultValue=""
                    className="w-full border border-line px-4 py-3 text-[14.5px] bg-white"
                  >
                    <option value="" disabled>
                      Select {field.label}
                    </option>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "tel" ? (
                  // An admin-added custom field (Admin → Careers → Form
                  // Builder) of type "Phone" gets the same country-code
                  // picker as the fixed Contact Number field above, so a
                  // custom field like "WhatsApp Number" isn't stuck with a
                  // bare, region-blind text box.
                  <PhoneNumberField
                    id={fieldName}
                    name={fieldName}
                    required={field.required}
                    className="w-full border border-line px-4 py-3 text-[14.5px]"
                  />
                ) : (
                  <input
                    id={fieldName}
                    name={fieldName}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
                    required={field.required}
                    className="w-full border border-line px-4 py-3 text-[14.5px]"
                  />
                )}
              </div>
            );
          })}

          <div className="sm:col-span-3">
            <label htmlFor="resume" className="block text-[13px] font-semibold text-ink mb-2">
              Resume / CV
            </label>
            <input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx" required className="w-full text-[14px]" />
            <p className="text-[12px] text-slate-400 mt-1.5">PDF or Word document, up to 10MB.</p>
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="coverLetter" className="block text-[13px] font-semibold text-ink mb-2">
              Cover Letter (optional)
            </label>
            <textarea id="coverLetter" name="coverLetter" rows={5} maxLength={6000} className="w-full border border-line px-4 py-3 text-[14.5px]" />
          </div>
        </div>

        {/* Tells the server action which custom field ids/labels/types were rendered,
            so it can assemble the `answers` JSON payload without guessing. */}
        <input type="hidden" name="__fieldDefs" value={JSON.stringify(customFields.map((f) => ({ id: f.id, label: f.label })))} />

        <div className="mt-10 text-center">
          <button
            type="submit"
            className="bg-gold text-[#1A1204] font-semibold text-[15px] px-10 py-3.5 rounded-[var(--btn-radius)]"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
}
