"use server";

import { redirect } from "next/navigation";
import { submitLead, subscribeNewsletter } from "./api";
import { lh, type Locale } from "./i18n";
import { uploadToCloudinary } from "./cloudinary";
import { EMAIL_PATTERN, PHONE_PATTERN } from "./validation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function submitContactLead(lang: Locale, formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || undefined;
  const message = formData.get("message")?.toString().trim() || undefined;

  if (!name || !email) {
    redirect(`${lh(lang, "/contact")}?error=missing_fields`);
  }
  if (
    name!.length < 2 ||
    name!.length > 120 ||
    !EMAIL_PATTERN.test(email!) ||
    email!.length > 254 ||
    (phone && !PHONE_PATTERN.test(phone)) ||
    (message && message.length > 4000)
  ) {
    redirect(`${lh(lang, "/contact")}?error=invalid`);
  }

  try {
    await submitLead({
      name: name!,
      email: email!,
      phone,
      company: formData.get("company")?.toString().trim() || undefined,
      serviceOfInterest: formData.get("service")?.toString() || undefined,
      message,
      source: "CONTACT_FORM",
      // Set by a small client-side script on the contact form (reads the
      // same sessionStorage key PageViewTracker writes) into a hidden
      // "sessionId" input — see app/[lang]/(marketing)/contact/page.tsx.
      sessionId: formData.get("sessionId")?.toString().trim() || undefined,
    });
  } catch (err: any) {
    if (err?.code === "DUPLICATE") redirect(`${lh(lang, "/contact")}?error=duplicate`);
    if (err?.code === "VALIDATION") redirect(`${lh(lang, "/contact")}?error=invalid`);
    throw err;
  }

  redirect(`${lh(lang, "/contact")}?success=1`);
}

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10MB — matches the message shown on upload failure
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function submitJobApplication(lang: Locale, jobId: string, formData: FormData) {
  const fullName = formData.get("fullName")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || undefined;
  const resumeFile = formData.get("resume") as File | null;

  if (!fullName || !email || !resumeFile || resumeFile.size === 0) {
    redirect(`${lh(lang, `/careers/${jobId}/apply`)}?error=missing_fields`);
  }
  if (
    fullName!.length < 2 ||
    fullName!.length > 120 ||
    !EMAIL_PATTERN.test(email!) ||
    email!.length > 254 ||
    (phone && !PHONE_PATTERN.test(phone)) ||
    resumeFile!.size > MAX_RESUME_BYTES ||
    (resumeFile!.type && !ALLOWED_RESUME_TYPES.includes(resumeFile!.type))
  ) {
    redirect(`${lh(lang, `/careers/${jobId}/apply`)}?error=invalid`);
  }

  let resumeUrl: string | null = null;
  try {
    resumeUrl = await uploadToCloudinary(resumeFile, "sterling-vance/resumes");
  } catch {
    redirect(`${lh(lang, `/careers/${jobId}/apply`)}?error=upload_failed`);
  }

  // Admin-configured custom fields (Application Form Builder) are submitted
  // as field_<id> inputs, plus a hidden __fieldDefs JSON telling us which
  // ids/labels were actually rendered — collect them into one `answers`
  // object keyed by label, which is what shows up in the admin applications
  // list/CSV export.
  let answers: Record<string, string> | undefined;
  const fieldDefsRaw = formData.get("__fieldDefs")?.toString();
  if (fieldDefsRaw) {
    try {
      const fieldDefs: { id: string; label: string }[] = JSON.parse(fieldDefsRaw);
      const collected: Record<string, string> = {};
      for (const def of fieldDefs) {
        const value = formData.get(`field_${def.id}`)?.toString().trim();
        if (value) collected[def.label] = value;
      }
      if (Object.keys(collected).length > 0) answers = collected;
    } catch {
      // Malformed/missing field defs — submit without custom answers rather than failing the whole application.
    }
  }

  const res = await fetch(`${API_URL}/careers/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId,
      fullName,
      email,
      phone,
      resumeUrl,
      coverLetter: formData.get("coverLetter")?.toString().trim() || undefined,
      answers,
    }),
  });

  if (!res.ok) {
    if (res.status === 409) redirect(`${lh(lang, `/careers/${jobId}/apply`)}?error=duplicate`);
    if (res.status === 400) redirect(`${lh(lang, `/careers/${jobId}/apply`)}?error=invalid`);
    redirect(`${lh(lang, `/careers/${jobId}/apply`)}?error=submit_failed`);
  }

  redirect(`${lh(lang, "/careers")}?applied=1`);
}
