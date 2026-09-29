"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHash } from "crypto";
import { adminFetch, REFRESH_COOKIE, SESSION_COOKIE } from "./session";
import { uploadToCloudinary, uploadFrameZipToCloudinary } from "./cloudinary";
import { getScrollFrameHero, getScrollMotion } from "./api";
import {
  pageHeaders as pageHeaderDefaults,
  siteConfig as defaultSiteConfigContent,
  navLinks as defaultNavLinksContent,
  heroContent as defaultHeroContent,
  freezoneContent as defaultFreezoneContent,
  locationGateContent as defaultLocationGateContent,
  trustBadges as defaultTrustBadgesContent,
  stats as defaultStatsContent,
  whyChooseUs as defaultWhyChooseUsContent,
  industries as defaultIndustriesContent,
  aboutIntro as defaultAboutIntroContent,
  aboutValues as defaultAboutValuesContent,
  aboutTimeline as defaultAboutTimelineContent,
  aboutLeadership as defaultAboutLeadershipContent,
  aboutGallery as defaultAboutGalleryContent,
  careersIntro as defaultCareersIntroContent,
  legalPages as defaultLegalPagesContent,
  footerLinks as defaultFooterLinksContent,
  uiStrings as defaultUiStringsContent,
} from "./content";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ---------------------------------------------------------------------------
// Every write action below follows the same shape: call the API, and if it
// didn't succeed, send the admin back to the form with a readable error
// instead of silently redirecting to the list as if it worked. `apiWrite`
// centralizes that so each action doesn't have to repeat it.
//
// It also clears Next's page cache on every successful save. Public pages
// fetch content with `next: { revalidate: 60 }` (see lib/api.ts) so a save
// made from somewhere other than this admin dashboard — a direct API call,
// a cron job — still shows up within a minute even without this. But an
// edit made *here* should feel instant, not "wait up to a minute," so every
// successful write invalidates the whole public site's cache (everything
// under the root layout — a header/footer change or a language add can
// touch any page, not just the one being edited) right away.
// ---------------------------------------------------------------------------

async function apiWrite(path: string, init: RequestInit, onFailRedirectTo: string) {
  const res = await adminFetch(path, init);
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    redirect(`${onFailRedirectTo}${onFailRedirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/", "layout");
  return res;
}

// --- Auth ---

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const mfaCode = formData.get("mfaCode")?.toString() || undefined;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, mfaCode }),
  });

  if (!res.ok) {
    redirect(`/admin/login?error=1&email=${encodeURIComponent(email)}${mfaCode ? "&mfa=1" : ""}`);
  }

  const data = await res.json();

  if (data.mfaRequired) {
    redirect(`/admin/login?mfa=1&email=${encodeURIComponent(email)}`);
  }

  cookies().set(SESSION_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // matches the API's default JWT_EXPIRES_IN
  });
  cookies().set(REFRESH_COOKIE, data.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // matches the API's default JWT_REFRESH_EXPIRES_IN
  });

  redirect("/admin");
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  cookies().delete(REFRESH_COOKIE);
  redirect("/admin/login");
}

// --- Forgot password (logged-out) ---
//
// Both steps redirect to the same "check your email" / "sign in" outcomes
// regardless of whether the address has an account — the API's
// requestPasswordReset already returns an identical { sent: true } either
// way (see auth.service.ts), so there's nothing here to branch on.

export async function requestPasswordResetAction(formData: FormData) {
  const email = formData.get("email")?.toString() ?? "";
  await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).catch(() => null); // network hiccup: still show the generic "check your email" screen
  redirect(`/admin/forgot-password?sent=1&email=${encodeURIComponent(email)}`);
}

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get("email")?.toString() ?? "";
  const otp = formData.get("otp")?.toString() ?? "";
  const newPassword = formData.get("newPassword")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (newPassword !== confirmPassword) {
    redirect(`/admin/reset-password?error=${encodeURIComponent("Passwords don't match.")}&email=${encodeURIComponent(email)}`);
  }

  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });

  if (!res.ok) {
    let message = "That code is incorrect or has expired — request a new one.";
    try {
      const body = await res.json();
      message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? message;
    } catch {
      // keep generic message
    }
    redirect(`/admin/reset-password?error=${encodeURIComponent(message)}&email=${encodeURIComponent(email)}`);
  }

  redirect("/admin/login?reset=1");
}

// --- Services ---

// URL-safes whatever an admin types into a "slug" field — trims, lowercases,
// swaps runs of anything that isn't a letter/number for a single hyphen, and
// strips leading/trailing hyphens — so a slip like "SQM's " or a stray
// trailing comma can't produce a slug that 404s the public detail page.
function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createServiceAction(formData: FormData) {
  const languageCode = formData.get("languageCode")?.toString() || "en";
  const slug = slugify(formData.get("slug")?.toString() ?? "");
  const faqs = parseRows(formData, "faq", ["question", "answer"], 12);

  if (!slug) {
    redirect(`/admin/services?error=${encodeURIComponent("Slug can't be empty once URL-safe characters are stripped — use letters, numbers and hyphens.")}`);
  }

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/services");
  } catch (err) {
    redirect(`/admin/services?error=${encodeURIComponent((err as Error).message)}`);
  }

  await apiWrite(
    "/services/admin",
    {
      method: "POST",
      body: JSON.stringify({
        slug,
        imageUrl: imageUrl ?? undefined,
        imagePosition: formData.get("imagePosition")?.toString() || "center",
        responsiblePersonId: formData.get("responsiblePersonId")?.toString() || undefined,
        translations: [
          {
            languageCode,
            title: formData.get("title")?.toString() ?? "",
            summary: formData.get("summary")?.toString() ?? "",
            description: formData.get("description")?.toString() ?? "",
            whatIsIt: formData.get("whatIsIt")?.toString() || undefined,
            whoNeedsIt: formData.get("whoNeedsIt")?.toString() || undefined,
            costFactors: formData.get("costFactors")?.toString() || undefined,
            timeline: formData.get("timeline")?.toString() || undefined,
            benefits: parseLines(formData, "benefits").join("\n") || undefined,
            process: parseLines(formData, "process").join("\n") || undefined,
            faqs,
          },
        ],
      }),
    },
    "/admin/services",
  );
  redirect("/admin/services?saved=1");
}

export async function updateServiceAction(id: string, formData: FormData) {
  const languageCode = formData.get("languageCode")?.toString() || "en";
  const faqs = parseRows(formData, "faq", ["question", "answer"], 12);

  await apiWrite(
    `/services/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        // Always sent, even as "" (— None —), so choosing "None" actually
        // clears a previously-set Responsible Person rather than leaving it
        // untouched — apiWrite's JSON.stringify would drop an `undefined`
        // value entirely, which the backend reads as "no change."
        responsiblePersonId: formData.get("responsiblePersonId")?.toString() ?? "",
        translations: [
          {
            languageCode,
            title: formData.get("title")?.toString() ?? "",
            summary: formData.get("summary")?.toString() ?? "",
            description: formData.get("description")?.toString() ?? "",
            whatIsIt: formData.get("whatIsIt")?.toString() || undefined,
            whoNeedsIt: formData.get("whoNeedsIt")?.toString() || undefined,
            costFactors: formData.get("costFactors")?.toString() || undefined,
            timeline: formData.get("timeline")?.toString() || undefined,
            benefits: parseLines(formData, "benefits").join("\n") || undefined,
            process: parseLines(formData, "process").join("\n") || undefined,
            faqs,
          },
        ],
      }),
    },
    `/admin/services/${id}/edit?lang=${languageCode}`,
  );
  redirect(`/admin/services/${id}/edit?lang=${languageCode}&saved=1`);
}

// Service image — shown on the service's card and detail page. Kept as its
// own action/form (rather than folded into the per-language translation
// form above) because the image isn't tied to a language.
export async function updateServiceImageAction(id: string, formData: FormData) {
  // Not tied to a language itself, but the page it redirects back to has a
  // language tab switcher — without carrying the current tab through, this
  // redirect used to always bounce back to the default-language tab, which
  // (beyond just being disorienting) actively corrupts data when this runs
  // as part of the consolidated "Save All Changes" bar: the Translation
  // form's fields on this page are keyed to whatever `lang` the page is
  // currently rendered for, so silently switching it out from under an
  // in-progress edit on another language's tab would save that content
  // under the wrong language. See UnsavedChangesGuard.tsx.
  const currentLang = formData.get("currentLang")?.toString() || "en";
  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/services");
  } catch (err) {
    redirect(`/admin/services/${id}/edit?lang=${currentLang}&error=${encodeURIComponent((err as Error).message)}`);
  }
  const existingImageUrl = formData.get("existingImageUrl")?.toString() || undefined;
  const removeImage = formData.get("removeImage")?.toString() === "1";

  await apiWrite(
    `/services/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        imageUrl: removeImage ? "" : imageUrl ?? existingImageUrl,
        imagePosition: formData.get("imagePosition")?.toString() || "center",
      }),
    },
    `/admin/services/${id}/edit`,
  );
  redirect(`/admin/services/${id}/edit?lang=${currentLang}&saved=1`);
}

export async function toggleServiceActiveAction(id: string, isActive: boolean) {
  await apiWrite(`/services/admin/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) }, "/admin/services");
  redirect("/admin/services?saved=1");
}

export async function deleteServiceAction(id: string) {
  await apiWrite(`/services/admin/${id}`, { method: "DELETE" }, "/admin/services");
  redirect("/admin/services?saved=1");
}

// --- Sub-services ---
//
// Each sub-service now has a full page of its own (own URL, own header/
// typography/animation/background settings via the generic ContentBlock
// system — see subServicePageKey() in lib/api.ts), so it needs a real
// slug up front, not just a name. Auto-derived from the name when the
// admin leaves the slug field blank, the same way a Service's own slug
// isn't required to be hand-typed.

export async function createSubServiceAction(serviceId: string, formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || undefined;
  const order = Number(formData.get("order")) || 0;
  if (!name) redirect(`/admin/services/${serviceId}/edit?error=${encodeURIComponent("Sub-service name is required.")}`);
  const rawSlug = formData.get("slug")?.toString().trim();
  const slug = slugify(rawSlug || name || "");
  await apiWrite(
    `/services/admin/${serviceId}/sub-services`,
    { method: "POST", body: JSON.stringify({ name, slug: slug || undefined, description, order }) },
    `/admin/services/${serviceId}/edit`,
  );
  redirect(`/admin/services/${serviceId}/edit?saved=1`);
}

export async function deleteSubServiceAction(serviceId: string, subServiceId: string) {
  await apiWrite(`/services/admin/sub-services/${subServiceId}`, { method: "DELETE" }, `/admin/services/${serviceId}/edit`);
  redirect(`/admin/services/${serviceId}/edit?saved=1`);
}

// Basic fields on a sub-service's own edit page (name/slug/description/
// body/order/active) — separate from the image/video upload actions below
// so a text-only save never has to also re-submit a Cloudinary upload.
export async function updateSubServiceAction(serviceId: string, subServiceId: string, formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  if (!name) redirect(`/admin/services/${serviceId}/sub-services/${subServiceId}/edit?error=${encodeURIComponent("Name is required.")}`);
  const rawSlug = formData.get("slug")?.toString().trim();
  const slug = slugify(rawSlug || name || "");
  const faqs = parseRows(formData, "faq", ["question", "answer"], 12);
  const data = {
    name,
    slug: slug || undefined,
    description: formData.get("description")?.toString() || undefined,
    body: formData.get("body")?.toString() || undefined,
    order: Number(formData.get("order")) || 0,
    isActive: formData.get("isActive") === "on",
    // Same AEO detail fields a full Service has — see ServiceFieldsForm and
    // the matching comment on SubService in schema.prisma.
    metaTitle: formData.get("metaTitle")?.toString() || undefined,
    metaDescription: formData.get("metaDescription")?.toString() || undefined,
    whatIsIt: formData.get("whatIsIt")?.toString() || undefined,
    whoNeedsIt: formData.get("whoNeedsIt")?.toString() || undefined,
    costFactors: formData.get("costFactors")?.toString() || undefined,
    timeline: formData.get("timeline")?.toString() || undefined,
    benefits: parseLines(formData, "benefits").join("\n") || undefined,
    process: parseLines(formData, "process").join("\n") || undefined,
    faqs,
    // Always sent, even as "" (— None —) — see the matching comment on
    // updateServiceAction above for why this can't just be omitted.
    responsiblePersonId: formData.get("responsiblePersonId")?.toString() ?? "",
  };
  await apiWrite(
    `/services/admin/sub-services/${subServiceId}`,
    { method: "PATCH", body: JSON.stringify(data) },
    `/admin/services/${serviceId}/sub-services/${subServiceId}/edit`,
  );
  redirect(`/admin/services/${serviceId}/sub-services/${subServiceId}/edit?saved=1`);
}

export async function updateSubServiceImageAction(serviceId: string, subServiceId: string, formData: FormData) {
  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/sub-services");
  } catch (err) {
    redirect(`/admin/services/${serviceId}/sub-services/${subServiceId}/edit?error=${encodeURIComponent((err as Error).message)}`);
  }
  const existingImageUrl = formData.get("existingImageUrl")?.toString() || undefined;
  const removeImage = formData.get("removeImage")?.toString() === "1";
  await apiWrite(
    `/services/admin/sub-services/${subServiceId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        imageUrl: removeImage ? "" : imageUrl ?? existingImageUrl,
        imagePosition: formData.get("imagePosition")?.toString() || "center",
      }),
    },
    `/admin/services/${serviceId}/sub-services/${subServiceId}/edit`,
  );
  redirect(`/admin/services/${serviceId}/sub-services/${subServiceId}/edit?saved=1`);
}

// Cloudinary's /auto/upload endpoint (uploadToCloudinary) auto-detects
// video the same way the Hero Background Video field already does — no
// separate video-upload plumbing needed.
export async function updateSubServiceVideoAction(serviceId: string, subServiceId: string, formData: FormData) {
  let videoUrl: string | null = null;
  try {
    videoUrl = await uploadToCloudinary(formData.get("video") as File | null, "sterling-vance/sub-services");
  } catch (err) {
    redirect(`/admin/services/${serviceId}/sub-services/${subServiceId}/edit?error=${encodeURIComponent((err as Error).message)}`);
  }
  const existingVideoUrl = formData.get("existingVideoUrl")?.toString() || undefined;
  const remove = formData.get("removeVideo") === "on";
  await apiWrite(
    `/services/admin/sub-services/${subServiceId}`,
    { method: "PATCH", body: JSON.stringify({ videoUrl: remove ? "" : videoUrl ?? existingVideoUrl }) },
    `/admin/services/${serviceId}/sub-services/${subServiceId}/edit`,
  );
  redirect(`/admin/services/${serviceId}/sub-services/${subServiceId}/edit?saved=1`);
}

// Swaps this service's `order` with its neighbor in the current list —
// what decides which service shows first on the homepage and the Services
// page. Re-reads the list fresh (rather than trusting whatever order the
// page that called this was rendered with) so two admins reordering at
// the same time can't stomp on each other based on stale data.
export async function moveServiceAction(id: string, direction: "up" | "down") {
  const res = await adminFetch("/services/admin/all");
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) redirect("/admin/services?error=Could not load the current order.");
  const services: { id: string; order?: number }[] = await res.json();

  const index = services.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= services.length) {
    redirect("/admin/services?saved=1"); // already first/last — nothing to do
  }

  const a = services[index];
  const b = services[swapWith];
  // Services created before ordering existed all default to 0 — swapping
  // undefined/equal values still needs to produce a real, distinct order,
  // so fall back to each row's current position in the list.
  const aOrder = a.order ?? index;
  const bOrder = b.order ?? swapWith;

  await Promise.all([
    adminFetch(`/services/admin/${a.id}`, { method: "PATCH", body: JSON.stringify({ order: bOrder }) }),
    adminFetch(`/services/admin/${b.id}`, { method: "PATCH", body: JSON.stringify({ order: aOrder }) }),
  ]);
  revalidatePath("/", "layout");
  redirect("/admin/services?saved=1");
}

// Generic version of the same swap-with-neighbor reorder used by
// moveServiceAction above — takes the admin "list all" path to re-fetch
// current order from, and the admin PATCH path prefix to write the swapped
// orders back to, so each resource (Team, Testimonials, Client Logos,
// Branches, ...) doesn't need its own near-identical copy of this logic.
async function moveItem(listPath: string, patchPathPrefix: string, redirectTo: string, id: string, direction: "up" | "down") {
  const res = await adminFetch(listPath);
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) redirect(`${redirectTo}?error=${encodeURIComponent("Could not load the current order.")}`);
  const items: { id: string; order?: number }[] = await res.json();

  const index = items.findIndex((it) => it.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= items.length) {
    redirect(`${redirectTo}?saved=1`); // already first/last — nothing to do
  }

  const a = items[index];
  const b = items[swapWith];
  const aOrder = a.order ?? index;
  const bOrder = b.order ?? swapWith;

  await Promise.all([
    adminFetch(`${patchPathPrefix}/${a.id}`, { method: "PATCH", body: JSON.stringify({ order: bOrder }) }),
    adminFetch(`${patchPathPrefix}/${b.id}`, { method: "PATCH", body: JSON.stringify({ order: aOrder }) }),
  ]);
  revalidatePath("/", "layout");
  redirect(`${redirectTo}?saved=1`);
}

export async function moveTeamMemberAction(id: string, direction: "up" | "down") {
  await moveItem("/team/admin/all", "/team/admin", "/admin/team", id, direction);
}

export async function moveTestimonialAction(id: string, direction: "up" | "down") {
  await moveItem("/testimonials/admin/all", "/testimonials/admin", "/admin/testimonials", id, direction);
}

export async function moveClientLogoAction(id: string, direction: "up" | "down") {
  await moveItem("/client-logos/admin/all", "/client-logos/admin", "/admin/client-logos", id, direction);
}

export async function moveFreezoneApprovalAction(id: string, direction: "up" | "down") {
  await moveItem("/freezone-approvals/admin/all", "/freezone-approvals/admin", "/admin/freezone", id, direction);
}

export async function moveBranchAction(id: string, direction: "up" | "down") {
  await moveItem("/branches/admin/all", "/branches/admin", "/admin/branches", id, direction);
}

// --- Bulk drag-and-drop reorder ---
// Called directly from a client component (DragReorderList) after a drop,
// not bound to a <form> — so it doesn't redirect, it just writes the new
// order and revalidates. `ids` is the full list in its new order; the
// backend sets each row's `order` to its index in one transaction.
export async function reorderTeamAction(ids: string[]) {
  await apiWriteNoRedirect("/team/admin/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
}

export async function reorderTestimonialsAction(ids: string[]) {
  await apiWriteNoRedirect("/testimonials/admin/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
}

export async function reorderClientLogosAction(ids: string[]) {
  await apiWriteNoRedirect("/client-logos/admin/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
}

export async function reorderFreezoneApprovalsAction(ids: string[]) {
  await apiWriteNoRedirect("/freezone-approvals/admin/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
}

export async function reorderBranchesAction(ids: string[]) {
  await apiWriteNoRedirect("/branches/admin/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
}

export async function reorderServicesAction(ids: string[]) {
  await apiWriteNoRedirect("/services/admin/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
}

// --- Leads ---

export async function updateLeadStatusAction(id: string, formData: FormData) {
  const status = formData.get("status")?.toString() ?? "NEW";
  await apiWrite(`/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, "/admin/leads");
  redirect("/admin/leads?saved=1");
}

// --- Team ---

function parseLanguagesSpoken(formData: FormData) {
  return (
    formData
      .get("languagesSpoken")
      ?.toString()
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean) ?? []
  );
}

export async function createTeamMemberAction(formData: FormData) {
  const languageCode = formData.get("languageCode")?.toString() || "en";
  let photoUrl: string | null = null;
  try {
    photoUrl = await uploadToCloudinary(formData.get("photo") as File | null, "sterling-vance/team");
  } catch (err) {
    redirect(`/admin/team?error=${encodeURIComponent((err as Error).message)}`);
  }

  await apiWrite(
    "/team/admin",
    {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name")?.toString() ?? "",
        category: formData.get("category")?.toString() === "Partner" ? "Partner" : "Key Member",
        photoUrl: photoUrl ?? undefined,
        photoPosition: formData.get("photoPosition")?.toString() || undefined,
        // Real, user-editable content fields (not "leave unchanged if
        // blank" secrets like an API key) — an empty value here means the
        // admin actually cleared the field, so it must be sent through as
        // "" rather than dropped as undefined, or the backend will just
        // keep whatever was there before.
        qualification: formData.get("qualification")?.toString() ?? "",
        linkedinUrl: formData.get("linkedinUrl")?.toString() ?? "",
        email: formData.get("email")?.toString() ?? "",
        phone: formData.get("phone")?.toString() ?? "",
        branchId: formData.get("branchId")?.toString() || undefined,
        languagesSpoken: parseLanguagesSpoken(formData),
        translations: [
          {
            languageCode,
            position: formData.get("position")?.toString() ?? "",
            bio: formData.get("bio")?.toString() ?? "",
          },
        ],
      }),
    },
    "/admin/team",
  );
  redirect("/admin/team?saved=1");
}

export async function updateTeamMemberAction(id: string, formData: FormData) {
  const languageCode = formData.get("languageCode")?.toString() || "en";
  let photoUrl: string | null = null;
  try {
    photoUrl = await uploadToCloudinary(formData.get("photo") as File | null, "sterling-vance/team");
  } catch (err) {
    redirect(`/admin/team/${id}/edit?lang=${languageCode}&error=${encodeURIComponent((err as Error).message)}`);
  }
  const removePhoto = formData.get("removePhoto")?.toString() === "1";

  await apiWrite(
    `/team/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        name: formData.get("name")?.toString() ?? "",
        category: formData.get("category")?.toString() === "Partner" ? "Partner" : "Key Member",
        ...(removePhoto ? { photoUrl: "" } : photoUrl ? { photoUrl } : {}),
        photoPosition: formData.get("photoPosition")?.toString() || undefined,
        // See createTeamMemberAction above — these must round-trip a blank
        // value through as "" (an intentional clear), not undefined (which
        // Prisma/the backend would treat as "leave whatever was saved
        // before"). This was the actual bug behind "I deleted the mobile
        // number/qualification and it looks gone, but comes back after a
        // refresh".
        qualification: formData.get("qualification")?.toString() ?? "",
        linkedinUrl: formData.get("linkedinUrl")?.toString() ?? "",
        email: formData.get("email")?.toString() ?? "",
        phone: formData.get("phone")?.toString() ?? "",
        branchId: formData.get("branchId")?.toString() || undefined,
        languagesSpoken: parseLanguagesSpoken(formData),
        translations: [
          {
            languageCode,
            position: formData.get("position")?.toString() ?? "",
            bio: formData.get("bio")?.toString() ?? "",
          },
        ],
      }),
    },
    `/admin/team/${id}/edit?lang=${languageCode}`,
  );
  redirect(`/admin/team/${id}/edit?lang=${languageCode}&saved=1`);
}

export async function toggleTeamMemberActiveAction(id: string, isActive: boolean) {
  await apiWrite(`/team/admin/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) }, "/admin/team");
  redirect("/admin/team?saved=1");
}

export async function deleteTeamMemberAction(id: string) {
  await apiWrite(`/team/admin/${id}`, { method: "DELETE" }, "/admin/team");
  redirect("/admin/team?saved=1");
}

// --- Branches ---

export async function createBranchAction(formData: FormData) {
  const payload = {
    city: formData.get("city")?.toString() ?? "",
    country: formData.get("country")?.toString() || undefined,
    addressLine: formData.get("addressLine")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    workingHours: formData.get("workingHours")?.toString() ?? "",
    whatsapp: formData.get("whatsapp")?.toString() || undefined,
    googleMapsUrl: formData.get("googleMapsUrl")?.toString() || undefined,
    externalUrl: formData.get("externalUrl")?.toString() || undefined,
  };
  await apiWrite("/branches/admin", { method: "POST", body: JSON.stringify(payload) }, "/admin/branches");
  redirect("/admin/branches?saved=1");
}

export async function toggleBranchActiveAction(id: string, isActive: boolean) {
  await apiWrite(`/branches/admin/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) }, "/admin/branches");
  redirect("/admin/branches?saved=1");
}

export async function updateBranchAction(id: string, formData: FormData) {
  const payload = {
    city: formData.get("city")?.toString() ?? "",
    country: formData.get("country")?.toString() || undefined,
    addressLine: formData.get("addressLine")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    workingHours: formData.get("workingHours")?.toString() ?? "",
    whatsapp: formData.get("whatsapp")?.toString() || undefined,
    googleMapsUrl: formData.get("googleMapsUrl")?.toString() || undefined,
    externalUrl: formData.get("externalUrl")?.toString() || undefined,
  };
  await apiWrite(`/branches/admin/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, `/admin/branches/${id}/edit`);
  redirect("/admin/branches?saved=1");
}

export async function deleteBranchAction(id: string) {
  await apiWrite(`/branches/admin/${id}`, { method: "DELETE" }, "/admin/branches");
  redirect("/admin/branches?saved=1");
}

// --- Chatbot: FAQ knowledge base ---

export async function createFaqAction(formData: FormData) {
  const question = formData.get("question")?.toString().trim();
  const answer = formData.get("answer")?.toString().trim();
  const category = formData.get("category")?.toString().trim() || undefined;
  if (!question || !answer) {
    redirect(`/admin/chatbot?error=${encodeURIComponent("Both a question and an answer are required.")}`);
  }
  await apiWrite(
    "/chatbot/admin/faqs",
    { method: "POST", body: JSON.stringify({ category, translations: [{ languageCode: "en", question, answer }] }) },
    "/admin/chatbot",
  );
  redirect("/admin/chatbot?saved=1");
}

export async function deleteFaqAction(id: string) {
  await apiWrite(`/chatbot/admin/faqs/${id}`, { method: "DELETE" }, "/admin/chatbot");
  redirect("/admin/chatbot?saved=1");
}

// --- Insights / blog ---

export async function createInsightAction(formData: FormData) {
  const languageCode = formData.get("languageCode")?.toString() || "en";
  let coverImageUrl: string | null = null;
  let coverVideoUrl: string | null = null;
  try {
    coverImageUrl = await uploadToCloudinary(formData.get("coverImage") as File | null, "sterling-vance/insights");
    coverVideoUrl = await uploadToCloudinary(formData.get("coverVideo") as File | null, "sterling-vance/insights");
  } catch (err) {
    redirect(`/admin/insights?error=${encodeURIComponent((err as Error).message)}`);
  }

  const isPublished = formData.get("isPublished") === "on";
  await apiWrite(
    "/insights/admin",
    {
      method: "POST",
      body: JSON.stringify({
        slug: formData.get("slug")?.toString() ?? "",
        linkedinUrl: formData.get("linkedinUrl")?.toString().trim() || undefined,
        coverImageUrl: coverImageUrl ?? undefined,
        coverImagePosition: formData.get("coverImagePosition")?.toString() || undefined,
        coverVideoUrl: coverVideoUrl ?? undefined,
        isPublished,
        publishAt: isPublished ? new Date().toISOString() : undefined,
        translations: [
          {
            languageCode,
            title: formData.get("title")?.toString() ?? "",
            excerpt: formData.get("excerpt")?.toString() ?? "",
            body: formData.get("body")?.toString() ?? "",
          },
        ],
      }),
    },
    "/admin/insights",
  );
  redirect("/admin/insights?saved=1");
}

export async function updateInsightAction(id: string, formData: FormData) {
  const languageCode = formData.get("languageCode")?.toString() || "en";
  let coverImageUrl: string | null = null;
  let coverVideoUrl: string | null = null;
  try {
    coverImageUrl = await uploadToCloudinary(formData.get("coverImage") as File | null, "sterling-vance/insights");
    coverVideoUrl = await uploadToCloudinary(formData.get("coverVideo") as File | null, "sterling-vance/insights");
  } catch (err) {
    redirect(`/admin/insights/${id}/edit?lang=${languageCode}&error=${encodeURIComponent((err as Error).message)}`);
  }
  const removeCoverImage = formData.get("removeCoverImage")?.toString() === "1";
  const removeCoverVideo = formData.get("removeCoverVideo")?.toString() === "1";

  await apiWrite(
    `/insights/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ...(removeCoverImage ? { coverImageUrl: "" } : coverImageUrl ? { coverImageUrl } : {}),
        coverImagePosition: formData.get("coverImagePosition")?.toString() || undefined,
        ...(removeCoverVideo ? { coverVideoUrl: "" } : coverVideoUrl ? { coverVideoUrl } : {}),
        postType: formData.get("postType")?.toString() || undefined,
        // Always sent (even blank) — unlike the fields above, a blank
        // LinkedIn URL is a real, intentional state ("this post is not a
        // LinkedIn post"/"I removed the link"), not "leave whatever's
        // already saved alone", so it can't use `|| undefined` the way an
        // untouched field would.
        linkedinUrl: formData.get("linkedinUrl")?.toString().trim() || "",
        translations: [
          {
            languageCode,
            title: formData.get("title")?.toString() ?? "",
            excerpt: formData.get("excerpt")?.toString() ?? "",
            body: formData.get("body")?.toString() ?? "",
          },
        ],
      }),
    },
    `/admin/insights/${id}/edit?lang=${languageCode}`,
  );
  redirect(`/admin/insights/${id}/edit?lang=${languageCode}&saved=1`);
}

export async function togglePublishInsightAction(id: string, isPublished: boolean) {
  await apiWrite(
    `/insights/admin/${id}`,
    { method: "PATCH", body: JSON.stringify({ isPublished: !isPublished, publishAt: !isPublished ? new Date().toISOString() : undefined }) },
    "/admin/insights",
  );
  redirect("/admin/insights?saved=1");
}

export async function deleteInsightAction(id: string) {
  await apiWrite(`/insights/admin/${id}`, { method: "DELETE" }, "/admin/insights");
  redirect("/admin/insights?saved=1");
}

// --- Testimonials ---

export async function createTestimonialAction(formData: FormData) {
  const languageCode = formData.get("languageCode")?.toString() || "en";
  let clientPhotoUrl: string | null = null;
  try {
    clientPhotoUrl = await uploadToCloudinary(formData.get("clientPhoto") as File | null, "sterling-vance/testimonials");
  } catch (err) {
    redirect(`/admin/testimonials?error=${encodeURIComponent((err as Error).message)}`);
  }

  await apiWrite(
    "/testimonials/admin",
    {
      method: "POST",
      body: JSON.stringify({
        clientName: formData.get("clientName")?.toString() ?? "",
        clientTitle: formData.get("clientTitle")?.toString() || undefined,
        clientPhotoUrl: clientPhotoUrl ?? undefined,
        rating: Number(formData.get("rating") ?? 5),
        translations: [{ languageCode, quote: formData.get("quote")?.toString() ?? "" }],
      }),
    },
    "/admin/testimonials",
  );
  redirect("/admin/testimonials?saved=1");
}

export async function updateTestimonialAction(id: string, existingClientPhotoUrl: string | undefined, formData: FormData) {
  const languageCode = formData.get("languageCode")?.toString() || "en";
  let clientPhotoUrl: string | null = null;
  try {
    clientPhotoUrl = await uploadToCloudinary(formData.get("clientPhoto") as File | null, "sterling-vance/testimonials");
  } catch (err) {
    redirect(`/admin/testimonials/${id}/edit?lang=${languageCode}&error=${encodeURIComponent((err as Error).message)}`);
  }
  const removeClientPhoto = formData.get("removeClientPhoto")?.toString() === "1";

  await apiWrite(
    `/testimonials/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        clientName: formData.get("clientName")?.toString() ?? "",
        clientTitle: formData.get("clientTitle")?.toString() || undefined,
        clientPhotoUrl: removeClientPhoto ? "" : clientPhotoUrl ?? existingClientPhotoUrl,
        rating: Number(formData.get("rating") ?? 5),
        translations: [{ languageCode, quote: formData.get("quote")?.toString() ?? "" }],
      }),
    },
    `/admin/testimonials/${id}/edit?lang=${languageCode}`,
  );
  redirect(`/admin/testimonials/${id}/edit?lang=${languageCode}&saved=1`);
}

export async function toggleTestimonialActiveAction(id: string, isActive: boolean) {
  await apiWrite(`/testimonials/admin/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) }, "/admin/testimonials");
  redirect("/admin/testimonials?saved=1");
}

export async function deleteTestimonialAction(id: string) {
  await apiWrite(`/testimonials/admin/${id}`, { method: "DELETE" }, "/admin/testimonials");
  redirect("/admin/testimonials?saved=1");
}

// --- Client logos ---

export async function createClientLogoAction(formData: FormData) {
  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("logo") as File | null, "sterling-vance/client-logos");
  } catch (err) {
    redirect(`/admin/client-logos?error=${encodeURIComponent((err as Error).message)}`);
  }
  if (!imageUrl) {
    redirect("/admin/client-logos?error=Choose%20a%20logo%20image%20to%20upload.");
  }

  await apiWrite(
    "/client-logos/admin",
    { method: "POST", body: JSON.stringify({ name: formData.get("name")?.toString() ?? "", imageUrl }) },
    "/admin/client-logos",
  );
  redirect("/admin/client-logos?saved=1");
}

export async function toggleClientLogoActiveAction(id: string, isActive: boolean) {
  await apiWrite(`/client-logos/admin/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) }, "/admin/client-logos");
  redirect("/admin/client-logos?saved=1");
}

export async function updateClientLogoAction(id: string, existingImageUrl: string, formData: FormData) {
  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("logo") as File | null, "sterling-vance/client-logos");
  } catch (err) {
    redirect(`/admin/client-logos/${id}/edit?error=${encodeURIComponent((err as Error).message)}`);
  }
  const removeLogo = formData.get("removeLogo")?.toString() === "1";

  await apiWrite(
    `/client-logos/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        name: formData.get("name")?.toString() ?? "",
        imageUrl: removeLogo ? "" : imageUrl ?? existingImageUrl,
      }),
    },
    `/admin/client-logos/${id}/edit`,
  );
  redirect("/admin/client-logos?saved=1");
}

export async function deleteClientLogoAction(id: string) {
  await apiWrite(`/client-logos/admin/${id}`, { method: "DELETE" }, "/admin/client-logos");
  redirect("/admin/client-logos?saved=1");
}

// --- Freezone / partnership approvals (multi-entry, auto-rotating on the
// homepage when more than one is active — replaces the old single-entry
// `freezone` ContentBlock, which getFreezoneApprovals() still falls back to
// reading if this table is empty). ---

export async function createFreezoneApprovalAction(formData: FormData) {
  let imageUrl: string | null = null;
  let videoUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/freezone");
    videoUrl = await uploadToCloudinary(formData.get("video") as File | null, "sterling-vance/freezone");
  } catch (err) {
    redirect(`/admin/freezone?error=${encodeURIComponent((err as Error).message)}`);
  }

  await apiWrite(
    "/freezone-approvals/admin",
    {
      method: "POST",
      body: JSON.stringify({
        badge: formData.get("badge")?.toString() ?? "",
        headline: formData.get("headline")?.toString() ?? "",
        body: formData.get("body")?.toString() ?? "",
        ctaLabel: formData.get("ctaLabel")?.toString() ?? "",
        ctaHref: formData.get("ctaHref")?.toString() || "/about",
        imageUrl: imageUrl ?? undefined,
        imagePosition: formData.get("imagePosition")?.toString() || "center",
        videoUrl: videoUrl ?? undefined,
        mediaPosition: formData.get("mediaPosition")?.toString() === "left" ? "left" : "right",
      }),
    },
    "/admin/freezone",
  );
  redirect("/admin/freezone?saved=1");
}

export async function updateFreezoneApprovalAction(
  id: string,
  existingImageUrl: string | undefined,
  existingVideoUrl: string | undefined,
  formData: FormData,
) {
  let imageUrl: string | null = null;
  let videoUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/freezone");
    videoUrl = await uploadToCloudinary(formData.get("video") as File | null, "sterling-vance/freezone");
  } catch (err) {
    redirect(`/admin/freezone/${id}/edit?error=${encodeURIComponent((err as Error).message)}`);
  }
  const removeImage = formData.get("removeImage")?.toString() === "1";
  const removeVideo = formData.get("removeVideo")?.toString() === "1";

  await apiWrite(
    `/freezone-approvals/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        badge: formData.get("badge")?.toString() ?? "",
        headline: formData.get("headline")?.toString() ?? "",
        body: formData.get("body")?.toString() ?? "",
        ctaLabel: formData.get("ctaLabel")?.toString() ?? "",
        ctaHref: formData.get("ctaHref")?.toString() || "/about",
        imageUrl: removeImage ? null : imageUrl ?? existingImageUrl,
        imagePosition: formData.get("imagePosition")?.toString() || "center",
        videoUrl: removeVideo ? null : videoUrl ?? existingVideoUrl,
        mediaPosition: formData.get("mediaPosition")?.toString() === "left" ? "left" : "right",
      }),
    },
    `/admin/freezone/${id}/edit`,
  );
  redirect("/admin/freezone?saved=1");
}

export async function toggleFreezoneApprovalActiveAction(id: string, isActive: boolean) {
  await apiWrite(`/freezone-approvals/admin/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) }, "/admin/freezone");
  redirect("/admin/freezone?saved=1");
}

export async function deleteFreezoneApprovalAction(id: string) {
  await apiWrite(`/freezone-approvals/admin/${id}`, { method: "DELETE" }, "/admin/freezone");
  redirect("/admin/freezone?saved=1");
}

export async function updateFreezoneDisplayAction(formData: FormData) {
  const seconds = Number(formData.get("autoRotateSeconds"));
  const data = {
    enabled: formData.get("enabled")?.toString() === "1",
    autoRotateSeconds: Number.isFinite(seconds) && seconds > 0 ? seconds : 7,
    pauseOnHover: formData.get("pauseOnHover")?.toString() === "1",
  };
  await saveContentBlock("home", "freezoneDisplay", data, "/admin/freezone");
  redirect("/admin/freezone?saved=1");
}

// --- Legal pages (Privacy Policy / Terms of Service / Cookies & Data
// Protection) — the footer's Legal links (Admin → Header & Footer) point at
// /privacy, /terms and /cookies; these are what feed those three routes. ---

export async function updateLegalPageAction(page: "privacy" | "terms" | "cookies", formData: FormData) {
  const data = {
    title: formData.get("title")?.toString() ?? "",
    body: formData.get("body")?.toString() ?? "",
  };
  await saveContentBlock(`legal-${page}`, "content", data, "/admin/legal");
  redirect(`/admin/legal?saved=${page}`);
}

// --- Careers: page intro (flexible content block, feeds the paragraph
// above "Current Openings" on the public /careers page) ---

export async function updateCareersIntroAction(formData: FormData) {
  const data = { story: formData.get("story")?.toString() ?? "" };
  await saveContentBlock("careers", "intro", data, "/admin/careers");
  redirect("/admin/careers?saved=1");
}

// --- Careers: job openings + applications ---

export async function createJobAction(formData: FormData) {
  await apiWrite(
    "/careers/admin/jobs",
    {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title")?.toString() ?? "",
        department: formData.get("department")?.toString() ?? "",
        location: formData.get("location")?.toString() ?? "",
        employmentType: formData.get("employmentType")?.toString() ?? "Full-time",
        description: formData.get("description")?.toString() ?? "",
        responsibilities: parseLines(formData, "responsibilities").join("\n") || undefined,
        qualifications: parseLines(formData, "qualifications").join("\n") || undefined,
      }),
    },
    "/admin/careers",
  );
  redirect("/admin/careers?saved=1");
}

// Careers — Application Form Builder: the admin-configured list of extra
// fields collected on the public apply page, on top of the fixed Full Name /
// Email / Phone / Resume / Cover Letter fields. Stored as a global content
// block, same pattern as the location gate.
export async function updateApplicationFormFieldsAction(formData: FormData) {
  const max = 20;
  const fields: { id: string; label: string; type: string; required: boolean; options?: string }[] = [];
  for (let i = 0; i < max; i++) {
    const label = formData.get(`field_${i}_label`)?.toString().trim() ?? "";
    if (!label) continue;
    fields.push({
      id: formData.get(`field_${i}_id`)?.toString() || `field_${i}_${Date.now()}`,
      label,
      type: formData.get(`field_${i}_type`)?.toString() || "text",
      required: formData.get(`field_${i}_required`)?.toString() === "1",
      options: formData.get(`field_${i}_options`)?.toString().trim() || undefined,
    });
  }
  await saveContentBlock("global", "applicationFormFields", fields, "/admin/careers/form-builder");
  redirect("/admin/careers/form-builder?saved=1");
}

export async function closeJobAction(id: string) {
  await apiWrite(`/careers/admin/jobs/${id}/close`, { method: "PATCH" }, "/admin/careers");
  redirect("/admin/careers?saved=1");
}

export async function updateApplicationStatusAction(id: string, formData: FormData) {
  const status = formData.get("status")?.toString() ?? "RECEIVED";
  await apiWrite(`/careers/admin/applications/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, "/admin/careers/applications");
  redirect("/admin/careers/applications?saved=1");
}

// --- Languages ---

export async function toggleLanguageActiveAction(code: string, name: string, isActive: boolean) {
  await apiWrite("/admin/languages", { method: "POST", body: JSON.stringify({ code, name, isActive: !isActive }) }, "/admin/languages");
  redirect("/admin/languages?saved=1");
}

// Adds a new language (e.g. adding German) without touching any code — the
// language switcher, admin "Language" dropdowns and /[lang]/... routing
// still come from the hardcoded `locales` list in lib/i18n.ts (a Next.js
// static-export constraint: every locale needs to be known at build time),
// so a language added here shows up in Admin → Languages and can have
// content/translations entered for it immediately, but reaching it on the
// public site still needs that one-line code change too.
export async function createLanguageAction(formData: FormData) {
  const code = formData.get("code")?.toString().trim().toLowerCase() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  const isRTL = formData.get("isRTL") === "on";
  if (!code || !name) {
    redirect(`/admin/languages?error=${encodeURIComponent("Code and name are both required.")}`);
  }
  await apiWrite(
    "/admin/languages",
    { method: "POST", body: JSON.stringify({ code, name, isRTL, isActive: true, isDefault: false }) },
    "/admin/languages",
  );
  redirect("/admin/languages?saved=1");
}

// --- System Messages (success/error/warning text shown on the public site) ---

export async function updateSystemMessageAction(key: string, languageCode: string, formData: FormData) {
  const value = formData.get("value")?.toString() ?? "";
  await apiWrite(
    "/admin/translations",
    { method: "POST", body: JSON.stringify({ key, languageCode, value }) },
    `/admin/messages?lang=${languageCode}`,
  );
  redirect(`/admin/messages?lang=${languageCode}&saved=1`);
}

// --- Theme ---

export async function updateThemeAction(formData: FormData) {
  const tokens = {
    primaryColor: formData.get("primaryColor")?.toString(),
    secondaryColor: formData.get("secondaryColor")?.toString(),
    accentColor: formData.get("accentColor")?.toString(),
    backgroundColor: formData.get("backgroundColor")?.toString(),
    // Independent header/footer background color — blank means "use
    // Primary Color", exactly like before these fields existed (see
    // theme.service.ts's DEFAULT_TOKENS and app/layout.tsx's fallback
    // logic). This is what fixes "changing the header color also changes
    // the footer."
    headerColor: formData.get("headerColor")?.toString() ?? "",
    footerColor: formData.get("footerColor")?.toString() ?? "",
    typography: {
      headingFont: formData.get("headingFont")?.toString(),
      bodyFont: formData.get("bodyFont")?.toString(),
      // Site-wide heading/body text color — blank keeps the existing
      // default ink/muted colors (see tailwind.config.ts's `ink`/`muted`
      // and app/layout.tsx's derivation).
      headingColor: formData.get("headingColor")?.toString() ?? "",
      bodyColor: formData.get("bodyColor")?.toString() ?? "",
    },
    buttonStyle: formData.get("buttonStyle")?.toString(),
    cardStyle: formData.get("cardStyle")?.toString(),
    borderRadius: formData.get("borderRadius")?.toString(),
  };
  await apiWrite("/theme", { method: "PUT", body: JSON.stringify({ tokens }) }, "/admin/theme");
  redirect("/admin/theme?saved=1");
}

// --- SEO ---

export async function upsertSeoAction(formData: FormData) {
  // Custom Schema.org JSON-LD is optional and free-typed, so it's the one
  // field on this form that can actually be malformed — validate it here
  // (rather than letting a bad save silently 400 at the API, or worse,
  // silently drop) so the admin gets a clear error back on the same page.
  const schemaJsonRaw = formData.get("schemaJson")?.toString().trim() || "";
  let schemaJson: Record<string, unknown> | undefined;
  if (schemaJsonRaw) {
    try {
      const parsed = JSON.parse(schemaJsonRaw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Must be a single JSON object, e.g. { \"@context\": \"https://schema.org\", ... }");
      }
      schemaJson = parsed;
    } catch (err) {
      redirect(`/admin/seo?error=${encodeURIComponent(`Custom Schema JSON-LD: ${(err as Error).message}`)}`);
    }
  }

  const payload = {
    path: formData.get("path")?.toString() ?? "",
    languageCode: formData.get("languageCode")?.toString() || "en",
    metaTitle: formData.get("metaTitle")?.toString() ?? "",
    metaDescription: formData.get("metaDescription")?.toString() ?? "",
    keywords: formData.get("keywords")?.toString() || undefined,
    canonicalUrl: formData.get("canonicalUrl")?.toString() || undefined,
    ogImageUrl: formData.get("ogImageUrl")?.toString() || undefined,
    schemaType: formData.get("schemaType")?.toString() || undefined,
    schemaJson,
    noindex: formData.get("noindex") === "on",
  };
  await apiWrite("/seo/admin", { method: "POST", body: JSON.stringify(payload) }, "/admin/seo");
  redirect("/admin/seo?saved=1");
}

// --- Pages & Content: field-by-field, no JSON typing required ---

async function saveContentBlock(page: string, section: string, data: unknown, redirectTo: string) {
  await apiWrite(
    "/admin/content-blocks",
    { method: "POST", body: JSON.stringify({ page, section, languageCode: "en", data }) },
    redirectTo,
  );
}

// Reads `${prefix}_${i}_${field}` for i in [0, max) and returns only the
// rows where at least one field was filled in — so a form can pre-render
// a fixed number of blank rows and empty ones are just dropped on save.
function parseRows<F extends string>(formData: FormData, prefix: string, fields: F[], max: number) {
  const rows: Record<F, string>[] = [];
  for (let i = 0; i < max; i++) {
    const row = {} as Record<F, string>;
    let hasValue = false;
    for (const f of fields) {
      const v = formData.get(`${prefix}_${i}_${f}`)?.toString().trim() ?? "";
      row[f] = v;
      if (v) hasValue = true;
    }
    if (hasValue) rows.push(row);
  }
  return rows;
}

function parseLines(formData: FormData, field: string): string[] {
  return (formData.get(field)?.toString() ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// Home — Hero
export async function updateHeroAction(formData: FormData) {
  let imageUrl: string | null = null;
  let videoUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/hero");
    videoUrl = await uploadToCloudinary(formData.get("video") as File | null, "sterling-vance/hero");
  } catch (err) {
    redirect(`/admin/content?page=home&error=${encodeURIComponent((err as Error).message)}`);
  }
  const existingImageUrl = formData.get("existingImageUrl")?.toString() || undefined;
  const existingVideoUrl = formData.get("existingVideoUrl")?.toString() || undefined;
  const removeImage = formData.get("removeImage")?.toString() === "1";
  const removeVideo = formData.get("removeVideo")?.toString() === "1";

  const data = {
    eyebrow: formData.get("eyebrow")?.toString() ?? "",
    headline: formData.get("headline")?.toString() ?? "",
    body: formData.get("body")?.toString() ?? "",
    primaryCta: {
      label: formData.get("primaryCtaLabel")?.toString() ?? "",
      href: formData.get("primaryCtaHref")?.toString() ?? "/contact",
    },
    secondaryCta: {
      label: formData.get("secondaryCtaLabel")?.toString() ?? "",
      href: formData.get("secondaryCtaHref")?.toString() ?? "/services",
    },
    credentialLine: formData.get("credentialLine")?.toString() ?? "",
    imageUrl: removeImage ? undefined : imageUrl ?? existingImageUrl,
    imagePosition: formData.get("imagePosition")?.toString() || "center",
    videoUrl: removeVideo ? undefined : videoUrl ?? existingVideoUrl,
    animation: formData.get("animation")?.toString() || "fade-up",
    overlayOpacity: Number(formData.get("overlayOpacity")) || 0,
  };
  await saveContentBlock("home", "hero", data, "/admin/content?page=home");
  redirect("/admin/content?page=home&saved=Hero");
}

// Home — Location gate (pre-homepage location picker). The list of
// countries a visitor can pick from is not stored here — it's read live
// from Branches & Locations, so this action only controls whether the
// gate is shown and its copy.
export async function updateLocationGateAction(formData: FormData) {
  let imageUrl: string | null = null;
  let videoUrl: string | null = null;
  let logoUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/location-gate");
    videoUrl = await uploadToCloudinary(formData.get("video") as File | null, "sterling-vance/location-gate");
    logoUrl = await uploadToCloudinary(formData.get("logo") as File | null, "sterling-vance/location-gate");
  } catch (err) {
    redirect(`/admin/site-settings?error=${encodeURIComponent((err as Error).message)}`);
  }
  const existingImageUrl = formData.get("existingImageUrl")?.toString() || undefined;
  const existingVideoUrl = formData.get("existingVideoUrl")?.toString() || undefined;
  const existingLogoUrl = formData.get("existingLogoUrl")?.toString() || undefined;
  const removeImage = formData.get("removeImage")?.toString() === "1";
  const removeVideo = formData.get("removeVideo")?.toString() === "1";
  const removeLogo = formData.get("removeLogo")?.toString() === "1";

  const data = {
    enabled: formData.get("enabled")?.toString() === "1",
    headline: formData.get("headline")?.toString() ?? "",
    subtext: formData.get("subtext")?.toString() ?? "",
    ctaLabel: formData.get("ctaLabel")?.toString() ?? "",
    backgroundImageUrl: removeImage ? "" : imageUrl ?? existingImageUrl ?? "",
    backgroundVideoUrl: removeVideo ? "" : videoUrl ?? existingVideoUrl ?? "",
    overlayOpacity: Number(formData.get("overlayOpacity")) || 65,
    backgroundTint: formData.get("backgroundTint")?.toString() || "#070E1C",
    animation: formData.get("animation")?.toString() || "fade",
    textTransition: formData.get("textTransition")?.toString() || "fade",
    buttonStyle: formData.get("buttonStyle")?.toString() || "sharp",
    logoUrl: removeLogo ? "" : logoUrl ?? existingLogoUrl ?? "",
    logoText: formData.get("logoText")?.toString() || "EFC",
    trigger: formData.get("trigger")?.toString() || "once",
  };
  await saveContentBlock("global", "locationGate", data, "/admin/site-settings");
  redirect("/admin/site-settings?saved=1");
}

// Per-section scroll-reveal animation for a whole page (Admin → Content →
// [page] → Section Animations) — one AnimationPicker per Reveal-wrapped
// section, saved together as a single { [sectionKey]: variant } object.
// Saves both the per-section animation choice AND whether the section is
// shown at all, from one combined "Section Visibility & Animations" form —
// this is the admin-side control for "which visual/section shows on which
// page" across the whole site.
export async function updateSectionAnimationsAction(page: string, sectionKeys: string[], formData: FormData) {
  const animations: Record<string, string> = {};
  const visibility: Record<string, boolean> = {};
  const effects: Record<
    string,
    { speed: string; delay: string; hover: string; stagger: boolean; align: string; background: string; backgroundColor?: string; backgroundTextColor?: string }
  > = {};
  for (const key of sectionKeys) {
    animations[key] = formData.get(`anim_${key}`)?.toString() || "fade-up";
    visibility[key] = formData.get(`visible_${key}`)?.toString() === "on";
    effects[key] = {
      speed: formData.get(`speed_${key}`)?.toString() || "normal",
      delay: formData.get(`delay_${key}`)?.toString() || "none",
      hover: formData.get(`hover_${key}`)?.toString() || "default",
      stagger: formData.get(`stagger_${key}`)?.toString() === "on",
      align: formData.get(`align_${key}`)?.toString() || "left",
      background: formData.get(`background_${key}`)?.toString() || "none",
      backgroundColor: formData.get(`backgroundColor_${key}`)?.toString() || undefined,
      backgroundTextColor: formData.get(`backgroundTextColor_${key}`)?.toString() || undefined,
    };
  }
  await saveContentBlock(page, "sectionAnimations", animations, `/admin/content?page=${page}`);
  await saveContentBlock(page, "sectionVisibility", visibility, `/admin/content?page=${page}`);
  await saveContentBlock(page, "sectionEffects", effects, `/admin/content?page=${page}`);
  redirect(`/admin/content?page=${page}&saved=Section%20Settings`);
}

// Per-page heading/body text size (Admin → Pages & Content → [page] →
// Text Size) — applies to that page's main <h1> and lead paragraph.
export async function updateTypographyAction(page: string, formData: FormData) {
  const headingSize = formData.get("headingSize")?.toString();
  const bodySize = formData.get("bodySize")?.toString();
  const align = formData.get("align")?.toString();
  const fontFamily = formData.get("fontFamily")?.toString();
  const data = {
    headingSize: ["sm", "md", "lg"].includes(headingSize ?? "") ? headingSize : "md",
    bodySize: ["sm", "md", "lg"].includes(bodySize ?? "") ? bodySize : "md",
    align: ["left", "center"].includes(align ?? "") ? align : "left",
    fontFamily: ["serif", "sans"].includes(fontFamily ?? "") ? fontFamily : "serif",
  };
  await saveContentBlock(page, "typography", data, `/admin/content?page=${page}`);
  redirect(`/admin/content?page=${page}&saved=Text%20Size`);
}

// Client logo strip — display settings (alignment/size/grayscale), shown
// on the homepage's "Trusted By" section. Separate from the individual
// logo uploads above.
export async function updateClientLogosDisplayAction(formData: FormData) {
  const alignmentRaw = formData.get("alignment")?.toString();
  const speedRaw = formData.get("speed")?.toString();
  const data = {
    alignment: alignmentRaw === "left" || alignmentRaw === "spread" ? alignmentRaw : "center",
    size: (formData.get("size")?.toString() as "sm" | "md" | "lg") || "md",
    grayscale: formData.get("grayscale")?.toString() === "1",
    motion: formData.get("motion")?.toString() === "static" ? "static" : "scroll",
    speed: speedRaw === "slow" || speedRaw === "fast" ? speedRaw : "normal",
    pauseOnHover: formData.get("pauseOnHover")?.toString() === "1",
    showOnServicesPage: formData.get("showOnServicesPage")?.toString() === "1",
    showOnServiceDetailPage: formData.get("showOnServiceDetailPage")?.toString() === "1",
    showOnSubServicePage: formData.get("showOnSubServicePage")?.toString() === "1",
    bandColor: formData.get("bandColor")?.toString() || "",
  };
  await saveContentBlock("global", "clientLogosDisplay", data, "/admin/client-logos");
  redirect("/admin/client-logos?saved=1");
}

export async function updateHeaderUtilityBarAction(formData: FormData) {
  const styleRaw = formData.get("utilityBarStyle")?.toString();
  const style = styleRaw === "minimal" || styleRaw === "pill" ? styleRaw : "bar";
  await saveContentBlock("global", "headerUtilityBar", { style }, "/admin/header-footer");
  redirect("/admin/header-footer?saved=1");
}

export async function updateTestimonialsDisplayAction(formData: FormData) {
  const speedRaw = formData.get("autoAdvanceSpeed")?.toString();
  const layoutRaw = formData.get("layout")?.toString();
  const data = {
    layout: layoutRaw === "carousel" || layoutRaw === "single" ? layoutRaw : "grid",
    cardSize: (formData.get("cardSize")?.toString() as "sm" | "md" | "lg") || "md",
    autoAdvanceSpeed: speedRaw === "slow" || speedRaw === "fast" ? speedRaw : "normal",
    pauseOnHover: formData.get("pauseOnHover")?.toString() === "1",
    showOnServicesPage: formData.get("showOnServicesPage")?.toString() === "1",
    showOnServiceDetailPage: formData.get("showOnServiceDetailPage")?.toString() === "1",
    showOnSubServicePage: formData.get("showOnSubServicePage")?.toString() === "1",
    googleReviewUrl: formData.get("googleReviewUrl")?.toString() || undefined,
    googleRating: formData.get("googleRating")?.toString() ? Number(formData.get("googleRating")) : undefined,
    googleReviewCount: formData.get("googleReviewCount")?.toString() ? Number(formData.get("googleReviewCount")) : undefined,
    showGoogleBadge: formData.get("showGoogleBadge")?.toString() === "1",
    showOnContactPage: formData.get("showOnContactPage")?.toString() === "1",
    sectionBackgroundColor: formData.get("sectionBackgroundColor")?.toString() || "",
  };
  await saveContentBlock("global", "testimonialsDisplay", data, "/admin/testimonials");
  redirect("/admin/testimonials?saved=1");
}

// --- Landing Animation: scroll-driven frame-sequence hero (Admin →
// Landing Animation). Three separate actions rather than one form, because
// the zip upload can take a while (dozens of Cloudinary uploads) and
// shouldn't be re-run just because an admin tweaked the popup headline —
// each fetches the current saved settings first and merges its own change
// in, since saveContentBlock replaces the whole "scrollFrameHero" section
// rather than patching individual fields. ---

export async function uploadScrollFrameHeroZipAction(formData: FormData) {
  const current = await getScrollFrameHero();
  const zipFile = formData.get("framesZip") as File | null;
  if (!zipFile || zipFile.size === 0) {
    redirect("/admin/landing-animation?error=" + encodeURIComponent("Choose a .zip file of frame images first."));
  }
  let frames: string[];
  try {
    frames = await uploadFrameZipToCloudinary(zipFile, "sterling-vance/landing-frames", 28);
  } catch (err) {
    redirect(`/admin/landing-animation?error=${encodeURIComponent((err as Error).message)}`);
  }
  await saveContentBlock("global", "scrollFrameHero", { ...current, frames }, "/admin/landing-animation");
  redirect("/admin/landing-animation?saved=Frames+uploaded");
}

export async function updateScrollFrameHeroSettingsAction(formData: FormData) {
  const current = await getScrollFrameHero();
  const scrollLengthRaw = formData.get("scrollLength")?.toString();
  const data = {
    ...current,
    enabled: formData.get("enabled")?.toString() === "1",
    scrollLength: scrollLengthRaw === "short" || scrollLengthRaw === "long" ? scrollLengthRaw : "medium",
    popupHeadline: formData.get("popupHeadline")?.toString() || "Choose your location",
    popupSubtext: formData.get("popupSubtext")?.toString() ?? "",
    popupCtaLabel: formData.get("popupCtaLabel")?.toString() || "Continue",
  };
  await saveContentBlock("global", "scrollFrameHero", data, "/admin/landing-animation");
  redirect("/admin/landing-animation?saved=1");
}

export async function clearScrollFrameHeroFramesAction() {
  const current = await getScrollFrameHero();
  await saveContentBlock(
    "global",
    "scrollFrameHero",
    { ...current, frames: [], enabled: false },
    "/admin/landing-animation",
  );
  redirect("/admin/landing-animation?saved=Removed");
}

export async function updateScrollMotionAction(formData: FormData) {
  const current = await getScrollMotion();
  const intensityRaw = formData.get("intensity")?.toString();
  const data = {
    ...current,
    enabled: formData.get("enabled")?.toString() === "1",
    intensity: intensityRaw === "subtle" || intensityRaw === "strong" ? intensityRaw : "normal",
    parallaxHero: formData.get("parallaxHero")?.toString() === "1",
    cursorGlow: formData.get("cursorGlow")?.toString() === "1",
  };
  await saveContentBlock("global", "scrollMotion", data, "/admin/scroll-motion");
  redirect("/admin/scroll-motion?saved=1");
}

// Home — Stats (up to 6 value/label pairs)
export async function updateStatsAction(formData: FormData) {
  const data = parseRows(formData, "stat", ["value", "label"], 6);
  await saveContentBlock("home", "stats", data, "/admin/content?page=home");
  redirect("/admin/content?page=home&saved=Stats");
}

// Home — Trust strip (up to 8 rows: label + optional logo image)
export async function updateTrustBadgesAction(formData: FormData) {
  const max = 8;
  const rows: { label: string; logoUrl?: string }[] = [];
  try {
    for (let i = 0; i < max; i++) {
      const label = formData.get(`trustBadges_${i}_label`)?.toString().trim() ?? "";
      const existingLogoUrl = formData.get(`trustBadges_${i}_existingLogoUrl`)?.toString() || undefined;
      const removeLogo = formData.get(`trustBadges_${i}_logoRemove`)?.toString() === "1";
      const file = formData.get(`trustBadges_${i}_logo`) as File | null;
      if (!label) continue;
      const uploaded = await uploadToCloudinary(file, "sterling-vance/trust-badges");
      rows.push({ label, logoUrl: removeLogo ? undefined : uploaded ?? existingLogoUrl });
    }
  } catch (err) {
    redirect(`/admin/content?page=home&error=${encodeURIComponent((err as Error).message)}`);
  }
  await saveContentBlock("home", "trustBadges", rows, "/admin/content?page=home");
  redirect("/admin/content?page=home&saved=Trust%20Strip");
}

// Home — Why Choose Us (up to 6 rows: title/description + optional icon image)
export async function updateWhyChooseUsAction(formData: FormData) {
  const max = 6;
  const rows: { title: string; description: string; iconUrl?: string }[] = [];
  try {
    for (let i = 0; i < max; i++) {
      const title = formData.get(`why_${i}_title`)?.toString().trim() ?? "";
      const description = formData.get(`why_${i}_description`)?.toString().trim() ?? "";
      const existingIconUrl = formData.get(`why_${i}_existingIconUrl`)?.toString() || undefined;
      const removeIcon = formData.get(`why_${i}_iconRemove`)?.toString() === "1";
      const file = formData.get(`why_${i}_icon`) as File | null;
      if (!title && !description) continue;
      const uploaded = await uploadToCloudinary(file, "sterling-vance/why-choose-us");
      rows.push({ title, description, iconUrl: removeIcon ? undefined : uploaded ?? existingIconUrl });
    }
  } catch (err) {
    redirect(`/admin/content?page=home&error=${encodeURIComponent((err as Error).message)}`);
  }
  await saveContentBlock("home", "whyChooseUs", rows, "/admin/content?page=home");
  redirect("/admin/content?page=home&saved=Why%20Choose%20Us");
}

// Home — Industries (up to 10 rows: name + optional icon image)
export async function updateIndustriesAction(formData: FormData) {
  const max = 10;
  const rows: { name: string; iconUrl?: string }[] = [];
  try {
    for (let i = 0; i < max; i++) {
      const name = formData.get(`industries_${i}_name`)?.toString().trim() ?? "";
      const existingIconUrl = formData.get(`industries_${i}_existingIconUrl`)?.toString() || undefined;
      const removeIcon = formData.get(`industries_${i}_iconRemove`)?.toString() === "1";
      const file = formData.get(`industries_${i}_icon`) as File | null;
      if (!name) continue;
      const uploaded = await uploadToCloudinary(file, "sterling-vance/industries");
      rows.push({ name, iconUrl: removeIcon ? undefined : uploaded ?? existingIconUrl });
    }
  } catch (err) {
    redirect(`/admin/content?page=home&error=${encodeURIComponent((err as Error).message)}`);
  }
  await saveContentBlock("home", "industries", rows, "/admin/content?page=home");
  redirect("/admin/content?page=home&saved=Industries");
}

// About — Intro (story / mission / vision)
export async function updateAboutIntroAction(formData: FormData) {
  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/about");
  } catch (err) {
    redirect(`/admin/content?page=about&error=${encodeURIComponent((err as Error).message)}`);
  }
  const existingImageUrl = formData.get("existingImageUrl")?.toString() || undefined;
  const removeImage = formData.get("removeImage")?.toString() === "1";

  const data = {
    story: formData.get("story")?.toString() ?? "",
    mission: formData.get("mission")?.toString() ?? "",
    vision: formData.get("vision")?.toString() ?? "",
    imageUrl: removeImage ? "" : imageUrl ?? existingImageUrl,
    imagePosition: formData.get("imagePosition")?.toString() || "center",
  };
  await saveContentBlock("about", "intro", data, "/admin/content?page=about");
  redirect("/admin/content?page=about&saved=Intro");
}

// About — Values (up to 6 title/description pairs)
export async function updateAboutValuesAction(formData: FormData) {
  const data = parseRows(formData, "value", ["title", "description"], 6);
  await saveContentBlock("about", "values", data, "/admin/content?page=about");
  redirect("/admin/content?page=about&saved=Values");
}

// About — Timeline (up to 8 year/event pairs)
export async function updateAboutTimelineAction(formData: FormData) {
  const data = parseRows(formData, "timeline", ["year", "event"], 8);
  await saveContentBlock("about", "timeline", data, "/admin/content?page=about");
  redirect("/admin/content?page=about&saved=Timeline");
}

// About — Leadership message
export async function updateAboutLeadershipAction(formData: FormData) {
  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/leadership");
  } catch (err) {
    redirect(`/admin/content?page=about&error=${encodeURIComponent((err as Error).message)}`);
  }
  const existingImageUrl = formData.get("existingImageUrl")?.toString() || undefined;
  const removeImage = formData.get("removeImage")?.toString() === "1";

  const data = {
    message: formData.get("message")?.toString() ?? "",
    name: formData.get("name")?.toString() ?? "",
    imageUrl: removeImage ? "" : imageUrl ?? existingImageUrl,
    imagePosition: formData.get("imagePosition")?.toString() || "center",
  };
  await saveContentBlock("about", "leadership", data, "/admin/content?page=about");
  redirect("/admin/content?page=about&saved=Leadership");
}

// Generic page header (eyebrow / <h1> / lead paragraph) — used by every
// marketing page except Home (which has its own Hero section). Stored as a
// ContentBlock: page=<page>, section="pageHeader". `lead` can use "{name}"
// as a placeholder for the site's company name (see getPageHeader).
export async function updatePageHeaderAction(page: string, formData: FormData) {
  const data = {
    eyebrow: formData.get("eyebrow")?.toString() ?? "",
    headline: formData.get("headline")?.toString() ?? "",
    lead: formData.get("lead")?.toString() ?? "",
  };
  await saveContentBlock(page, "pageHeader", data, `/admin/content?page=${page}`);
  redirect(`/admin/content?page=${page}&saved=Page+Header`);
}

// About — Photo Gallery (up to 8 team/office photos that crossfade into one
// another on the public page). Leave a slot's file input empty to keep its
// existing photo, or clear "existingUrl" won't happen from the UI — instead
// there's a per-slot "Remove" checkbox.
export async function updateAboutGalleryAction(formData: FormData) {
  const max = 8;
  const rows: { url: string; caption?: string }[] = [];
  try {
    for (let i = 0; i < max; i++) {
      // "imageRemove" is ImageUploadField's Remove button (DraggableImageRowsField
      // wires it up for this slot's image); "remove" is kept for backwards
      // compatibility with the plain checkbox this slot used to render.
      // Either one drops the whole slot — a gallery photo with no image
      // would just be an empty caption, so unlike a single-image field
      // there's nothing to "remove the photo but keep the row."
      const remove =
        formData.get(`photo_${i}_imageRemove`)?.toString() === "1" ||
        ["1", "on"].includes(formData.get(`photo_${i}_remove`)?.toString() ?? "");
      if (remove) continue;
      const caption = formData.get(`photo_${i}_caption`)?.toString().trim() || undefined;
      const existingUrl = formData.get(`photo_${i}_existingUrl`)?.toString() || undefined;
      const file = formData.get(`photo_${i}_image`) as File | null;
      const uploaded = await uploadToCloudinary(file, "sterling-vance/about-gallery");
      const url = uploaded ?? existingUrl;
      if (!url) continue;
      rows.push({ url, caption });
    }
  } catch (err) {
    redirect(`/admin/content?page=about&error=${encodeURIComponent((err as Error).message)}`);
  }
  await saveContentBlock("about", "gallery", { photos: rows }, "/admin/content?page=about");
  redirect("/admin/content?page=about&saved=Gallery");
}

// About — Milestones Animation. Every part of the walking character on the
// public Milestones section is editable here: the three sprite frames
// (idle stance, two walking poses — swapped in place to fake the stride),
// how slowly it walks, how big it renders, and whether a milestone's card
// stays hidden until the character actually arrives there. Leaving an
// image slot untouched (and not checked "Remove") keeps its current photo
// — including the three defaults this ships with — so an admin only needs
// to touch the frame(s) they actually want to replace.
export async function updateAboutMilestoneAnimationAction(formData: FormData) {
  let idleUrl: string | null = null;
  let walk1Url: string | null = null;
  let walk2Url: string | null = null;
  try {
    idleUrl = await uploadToCloudinary(formData.get("idle") as File | null, "sterling-vance/milestone-character");
    walk1Url = await uploadToCloudinary(formData.get("walk1") as File | null, "sterling-vance/milestone-character");
    walk2Url = await uploadToCloudinary(formData.get("walk2") as File | null, "sterling-vance/milestone-character");
  } catch (err) {
    redirect(`/admin/content?page=about&error=${encodeURIComponent((err as Error).message)}`);
  }
  const existingIdleUrl = formData.get("existingIdleUrl")?.toString() || undefined;
  const existingWalk1Url = formData.get("existingWalk1Url")?.toString() || undefined;
  const existingWalk2Url = formData.get("existingWalk2Url")?.toString() || undefined;
  const removeIdle = formData.get("idleRemove")?.toString() === "1";
  const removeWalk1 = formData.get("walk1Remove")?.toString() === "1";
  const removeWalk2 = formData.get("walk2Remove")?.toString() === "1";

  const speed = formData.get("speed")?.toString();
  const size = formData.get("size")?.toString();

  const data = {
    // "Remove" clears back to this component's bundled default image
    // rather than leaving the slot empty — a walking character with a
    // missing frame would just be broken, unlike an optional photo
    // elsewhere on the site.
    idleImageUrl: removeIdle ? undefined : idleUrl ?? existingIdleUrl,
    walk1ImageUrl: removeWalk1 ? undefined : walk1Url ?? existingWalk1Url,
    walk2ImageUrl: removeWalk2 ? undefined : walk2Url ?? existingWalk2Url,
    speed: (["slow", "medium", "fast"].includes(speed ?? "") ? speed : "slow") as "slow" | "medium" | "fast",
    size: (["small", "medium", "large"].includes(size ?? "") ? size : "small") as "small" | "medium" | "large",
    revealOnArrival: formData.get("revealOnArrival")?.toString() === "on",
  };
  // Drop any undefined field so a "Remove" falls back to the component's
  // own bundled default (merged in by getAboutContent) instead of saving
  // an empty string that would break the <img> tag.
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  await saveContentBlock("about", "milestoneAnimation", clean, "/admin/content?page=about");
  redirect("/admin/content?page=about&saved=Milestones+Animation");
}

// --- Site Settings (company name, contact info, social, logo) ---
// Stored as a ContentBlock: page="global", section="siteConfig".

export async function updateSiteSettingsAction(formData: FormData) {
  let logoUrl: string | null = null;
  let logoUrlDark: string | null = null;
  try {
    logoUrl = await uploadToCloudinary(formData.get("logo") as File | null, "sterling-vance/site");
    // Second, optional logo variant for the dark header/footer bands — see
    // the comment on SiteConfig.logoUrlDark (lib/api.ts) for why this
    // exists. Same upload/remove/keep-existing pattern as the main logo.
    logoUrlDark = await uploadToCloudinary(formData.get("logoDark") as File | null, "sterling-vance/site");
  } catch (err) {
    redirect(`/admin/site-settings?error=${encodeURIComponent((err as Error).message)}`);
  }

  const existingLogoUrl = formData.get("existingLogoUrl")?.toString() || undefined;
  const removeLogo = formData.get("removeLogo")?.toString() === "1";
  const existingLogoUrlDark = formData.get("existingLogoUrlDark")?.toString() || undefined;
  const removeLogoDark = formData.get("removeLogoDark")?.toString() === "1";

  const data = {
    name: formData.get("name")?.toString() ?? "",
    tagline: formData.get("tagline")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    address: formData.get("address")?.toString() ?? "",
    whatsapp: formData.get("whatsapp")?.toString() ?? "",
    floatingContactEnabled: formData.get("floatingContactEnabled") === "on",
    logoUrl: removeLogo ? "" : logoUrl ?? existingLogoUrl,
    logoUrlDark: removeLogoDark ? "" : logoUrlDark ?? existingLogoUrlDark,
    social: {
      linkedin: formData.get("linkedin")?.toString() || undefined,
      instagram: formData.get("instagram")?.toString() || undefined,
      twitter: formData.get("twitter")?.toString() || undefined,
    },
    googleVerification: formData.get("googleVerification")?.toString() ?? "",
    bingVerification: formData.get("bingVerification")?.toString() ?? "",
    defaultOgImageUrl: formData.get("defaultOgImageUrl")?.toString() ?? "",
    robotsExtraDisallow: formData.get("robotsExtraDisallow")?.toString() ?? "",
    sitewideNoindex: formData.get("sitewideNoindex") === "on",
    imageProtection: {
      disableRightClick: formData.get("disableRightClick") === "on",
      watermarkEnabled: formData.get("watermarkEnabled") === "on",
      watermarkText: formData.get("watermarkText")?.toString() ?? "",
    },
    logoSizing: {
      headerHeight: Number(formData.get("headerHeight")) || 48,
      footerHeight: Number(formData.get("footerHeight")) || 48,
      adminSidebarHeight: Number(formData.get("adminSidebarHeight")) || 32,
      loginHeight: Number(formData.get("loginHeight")) || 56,
    },
  };

  await saveContentBlock("global", "siteConfig", data, "/admin/site-settings");
  redirect("/admin/site-settings?saved=1");
}

// --- Header & Footer navigation — field-by-field, no JSON typing required ---
// Stored as ContentBlocks: page="global", section="navLinks" | "footerLinks".

export async function updateNavLinksAction(formData: FormData) {
  const data = parseRows(formData, "nav", ["label", "href"], 10);
  await saveContentBlock("global", "navLinks", data, "/admin/header-footer");
  redirect("/admin/header-footer?saved=nav");
}

export async function updateFooterLinksAction(formData: FormData) {
  const data = {
    services: parseRows(formData, "footer_services", ["label", "href"], 6),
    company: parseRows(formData, "footer_company", ["label", "href"], 6),
    legal: parseRows(formData, "footer_legal", ["label", "href"], 4),
  };
  await saveContentBlock("global", "footerLinks", data, "/admin/header-footer");
  redirect("/admin/header-footer?saved=footer");
}

// --- UI Text — Contact form field labels and the chat widget's interface
// chrome (see `uiStrings` in content.ts for why this exists as its own
// ContentBlock section instead of being hardcoded JSX text). A blank field
// falls back to the English default rather than saving as an empty label —
// same "cleared means unset" behavior as withoutBlanks() in lib/api.ts.
function textOr(formData: FormData, field: string, fallback: string): string {
  const v = formData.get(field)?.toString().trim();
  return v ? v : fallback;
}

export async function updateUiStringsAction(formData: FormData) {
  const cf = defaultUiStringsContent.contactForm;
  const cb = defaultUiStringsContent.chatbot;
  const st = defaultUiStringsContent.chatbot.smallTalk;
  const linesOr = (field: string, fallback: string[]) => {
    const lines = parseLines(formData, field);
    return lines.length > 0 ? lines : fallback;
  };
  const data = {
    contactForm: {
      fullNameLabel: textOr(formData, "cf_fullNameLabel", cf.fullNameLabel),
      companyLabel: textOr(formData, "cf_companyLabel", cf.companyLabel),
      emailLabel: textOr(formData, "cf_emailLabel", cf.emailLabel),
      phoneLabel: textOr(formData, "cf_phoneLabel", cf.phoneLabel),
      optionalSuffix: textOr(formData, "cf_optionalSuffix", cf.optionalSuffix),
      serviceLabel: textOr(formData, "cf_serviceLabel", cf.serviceLabel),
      servicePlaceholder: textOr(formData, "cf_servicePlaceholder", cf.servicePlaceholder),
      serviceOtherOption: textOr(formData, "cf_serviceOtherOption", cf.serviceOtherOption),
      messageLabel: textOr(formData, "cf_messageLabel", cf.messageLabel),
      submitButton: textOr(formData, "cf_submitButton", cf.submitButton),
      officesHeading: textOr(formData, "cf_officesHeading", cf.officesHeading),
    },
    chatbot: {
      headerTitle: textOr(formData, "cb_headerTitle", cb.headerTitle),
      closeAriaLabel: textOr(formData, "cb_closeAriaLabel", cb.closeAriaLabel),
      openAriaLabel: textOr(formData, "cb_openAriaLabel", cb.openAriaLabel),
      greeting: textOr(formData, "cb_greeting", cb.greeting),
      talkToPersonLabel: textOr(formData, "cb_talkToPersonLabel", cb.talkToPersonLabel),
      handoffPrompt: textOr(formData, "cb_handoffPrompt", cb.handoffPrompt),
      namePlaceholder: textOr(formData, "cb_namePlaceholder", cb.namePlaceholder),
      emailPlaceholder: textOr(formData, "cb_emailPlaceholder", cb.emailPlaceholder),
      sendingLabel: textOr(formData, "cb_sendingLabel", cb.sendingLabel),
      sendToTeamButton: textOr(formData, "cb_sendToTeamButton", cb.sendToTeamButton),
      handoffThanksMessage: textOr(formData, "cb_handoffThanksMessage", cb.handoffThanksMessage),
      inputPlaceholder: textOr(formData, "cb_inputPlaceholder", cb.inputPlaceholder),
      sendButton: textOr(formData, "cb_sendButton", cb.sendButton),
      nameRequiredError: textOr(formData, "cb_nameRequiredError", cb.nameRequiredError),
      emailInvalidError: textOr(formData, "cb_emailInvalidError", cb.emailInvalidError),
      connectionErrorMessage: textOr(formData, "cb_connectionErrorMessage", cb.connectionErrorMessage),
      learnMoreLinkLabel: textOr(formData, "cb_learnMoreLinkLabel", cb.learnMoreLinkLabel),
      noAnswerFallback: textOr(formData, "cb_noAnswerFallback", cb.noAnswerFallback),
      smallTalk: {
        greeting: linesOr("st_greeting", st.greeting),
        thanks: linesOr("st_thanks", st.thanks),
        farewell: linesOr("st_farewell", st.farewell),
        howAreYou: linesOr("st_howAreYou", st.howAreYou),
        ack: linesOr("st_ack", st.ack),
        profanity: linesOr("st_profanity", st.profanity),
      },
    },
  };
  await saveContentBlock("global", "uiStrings", data, "/admin/ui-text");
  redirect("/admin/ui-text?saved=1");
}

// --- MFA enrollment ---

export async function setupMfaAction() {
  const res = await adminFetch("/auth/mfa/setup", { method: "POST" });
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) redirect("/admin/security?error=setup_failed");
  const { otpauthUrl, secret } = await res.json();
  redirect(`/admin/security?otpauthUrl=${encodeURIComponent(otpauthUrl)}&secret=${encodeURIComponent(secret)}`);
}

export async function confirmMfaAction(formData: FormData) {
  const code = formData.get("code")?.toString() ?? "";
  const res = await adminFetch("/auth/mfa/confirm", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) redirect("/admin/security?error=Invalid%20code%20%E2%80%94%20try%20again.");
  redirect("/admin/security?enabled=1");
}

export async function disableMfaAction() {
  const res = await adminFetch("/auth/mfa/disable", { method: "POST" });
  if (res.status === 401) redirect("/admin/login");
  redirect("/admin/security?disabled=1");
}

// --- Change Password (OTP-verified) ---

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function requestPasswordOtpAction() {
  const res = await adminFetch("/auth/change-password/request-otp", { method: "POST" });
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) {
    redirect(`/admin/security?pwError=${encodeURIComponent(await readError(res, "Could not send the code — try again."))}`);
  }
  redirect("/admin/security?pwOtpSent=1");
}

export async function confirmPasswordChangeAction(formData: FormData) {
  const otp = formData.get("otp")?.toString().trim() ?? "";
  const newPassword = formData.get("newPassword")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (newPassword !== confirmPassword) {
    redirect(`/admin/security?pwError=${encodeURIComponent("Passwords don't match.")}&pwOtpSent=1`);
  }

  const res = await adminFetch("/auth/change-password/confirm", {
    method: "POST",
    body: JSON.stringify({ otp, newPassword }),
  });
  if (res.status === 401) {
    // Could be an expired session OR "incorrect code" — both come back as
    // 401 from the API. Only bounce to login if there's no session cookie
    // left to explain it; otherwise treat it as a wrong-code error so the
    // admin isn't confusingly logged out mid-flow.
    const body = await res.json().catch(() => null);
    redirect(`/admin/security?pwError=${encodeURIComponent(body?.message ?? "Incorrect code — try again.")}&pwOtpSent=1`);
  }
  if (!res.ok) {
    redirect(
      `/admin/security?pwError=${encodeURIComponent(await readError(res, "Could not change your password — try again."))}&pwOtpSent=1`,
    );
  }
  redirect("/admin/security?pwChanged=1");
}

// --- Change Email (OTP-verified) ---

export async function requestEmailOtpAction(formData: FormData) {
  const newEmail = formData.get("newEmail")?.toString().trim() ?? "";
  const res = await adminFetch("/auth/change-email/request-otp", {
    method: "POST",
    body: JSON.stringify({ newEmail }),
  });
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) {
    redirect(`/admin/security?emError=${encodeURIComponent(await readError(res, "Could not send the code — try again."))}`);
  }
  redirect(`/admin/security?emOtpSent=1&emNewEmail=${encodeURIComponent(newEmail)}`);
}

export async function confirmEmailChangeAction(formData: FormData) {
  const otp = formData.get("otp")?.toString().trim() ?? "";
  const res = await adminFetch("/auth/change-email/confirm", {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
  if (res.status === 401) {
    const body = await res.json().catch(() => null);
    redirect(`/admin/security?emError=${encodeURIComponent(body?.message ?? "Incorrect code — try again.")}&emOtpSent=1`);
  }
  if (!res.ok) {
    redirect(`/admin/security?emError=${encodeURIComponent(await readError(res, "Could not change your email — try again."))}&emOtpSent=1`);
  }
  redirect("/admin/security?emChanged=1");
}

// --- Users & Roles (RBAC, Super Admin only) ---

export async function updateUserRoleAction(id: string, role: "SUPER_ADMIN" | "ADMIN" | "EDITOR") {
  const res = await adminFetch(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) redirect(`/admin/users?error=${encodeURIComponent(await readError(res, "Could not update role."))}`);
  revalidatePath("/admin/users");
}

export async function setUserActiveAction(id: string, isActive: boolean) {
  const res = await adminFetch(`/users/${id}/active`, { method: "PATCH", body: JSON.stringify({ isActive }) });
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) redirect(`/admin/users?error=${encodeURIComponent(await readError(res, "Could not update status."))}`);
  revalidatePath("/admin/users");
}

export async function createUserAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const role = formData.get("role")?.toString() ?? "EDITOR";

  await apiWrite("/auth/register", { method: "POST", body: JSON.stringify({ email, name, password, role }) }, "/admin/users");
  redirect("/admin/users?created=1");
}

// ---------------------------------------------------------------------------
// Auto-translate — one click on an edit screen translates the saved English
// content into every other active language (Google Cloud Translation API,
// server-side, via POST /admin/translate on the API) and saves each result
// as that language's translation, the same way saving that language's tab
// by hand would. Nothing is shown to the visitor until an admin reviews it —
// switch to the AR/DE tab to see and, if needed, edit what came back before
// it's live. Called directly from a client component (AutoTranslateButton),
// not from a <form>, so each function takes plain arguments and returns a
// small result object instead of redirecting.
// ---------------------------------------------------------------------------

type TranslateResult = { ok: true } | { ok: false; message: string };

// Unlike apiWrite (used by <form> actions), this never calls redirect() on
// failure — these auto-translate actions are called directly from a client
// component's onClick, not a form submit, and need to hand a plain
// success/failure result back to the button rather than navigate away.
async function apiWriteNoRedirect(path: string, init: RequestInit): Promise<void> {
  const res = await adminFetch(path, init);
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? message;
    } catch {
      // not JSON — keep the generic message
    }
    throw new Error(message);
  }
  revalidatePath("/", "layout");
}

async function translateFields(
  texts: Record<string, string>,
  targetLanguage: string,
  htmlKeys: string[] = [],
  source = "manual",
): Promise<Record<string, string>> {
  const res = await adminFetch("/admin/translate", {
    method: "POST",
    body: JSON.stringify({ texts, targetLanguage, htmlKeys, source }),
  });
  if (!res.ok) {
    let message = `Translation failed (${res.status}).`;
    try {
      const body = await res.json();
      message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? message;
    } catch {
      // not JSON — keep the generic message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function autoTranslateInsightAction(id: string, targetLanguages: string[]): Promise<TranslateResult> {
  try {
    const res = await adminFetch(`/insights/admin/${id}`);
    if (!res.ok) throw new Error("Could not load the article to translate it.");
    const article: any = await res.json();
    const en = article.translations?.find((t: any) => t.languageCode === "en");
    if (!en) throw new Error("Save the English version first — there's nothing to translate yet.");

    for (const lang of targetLanguages) {
      const translated = await translateFields(
        { title: en.title ?? "", excerpt: en.excerpt ?? "", body: en.body ?? "" },
        lang,
        ["body"],
        "insights",
      );
      await apiWriteNoRedirect(`/insights/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          translations: [{ languageCode: lang, title: translated.title, excerpt: translated.excerpt, body: translated.body }],
        }),
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function autoTranslateServiceAction(id: string, targetLanguages: string[]): Promise<TranslateResult> {
  try {
    const res = await adminFetch(`/services/admin/${id}`);
    if (!res.ok) throw new Error("Could not load the service to translate it.");
    const service: any = await res.json();
    const en = service.translations?.find((t: any) => t.languageCode === "en");
    if (!en) throw new Error("Save the English version first — there's nothing to translate yet.");

    for (const lang of targetLanguages) {
      const translated = await translateFields(
        {
          title: en.title ?? "",
          summary: en.summary ?? "",
          description: en.description ?? "",
          whatIsIt: en.whatIsIt ?? "",
          whoNeedsIt: en.whoNeedsIt ?? "",
          costFactors: en.costFactors ?? "",
          timeline: en.timeline ?? "",
          benefits: en.benefits ?? "",
          process: en.process ?? "",
        },
        lang,
        ["description", "whatIsIt", "whoNeedsIt"],
        "services",
      );
      await apiWriteNoRedirect(`/services/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          translations: [{ languageCode: lang, ...translated }],
        }),
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function autoTranslateTeamMemberAction(id: string, targetLanguages: string[]): Promise<TranslateResult> {
  try {
    const res = await adminFetch(`/team/admin/${id}`);
    if (!res.ok) throw new Error("Could not load the team member to translate them.");
    const member: any = await res.json();
    const en = member.translations?.find((t: any) => t.languageCode === "en");
    if (!en) throw new Error("Save the English version first — there's nothing to translate yet.");

    for (const lang of targetLanguages) {
      const translated = await translateFields(
        { position: en.position ?? "", bio: en.bio ?? "" },
        lang,
        ["bio"],
        "team",
      );
      await apiWriteNoRedirect(`/team/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          translations: [{ languageCode: lang, position: translated.position, bio: translated.bio }],
        }),
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function autoTranslateTestimonialAction(id: string, targetLanguages: string[]): Promise<TranslateResult> {
  try {
    const res = await adminFetch("/testimonials/admin/all");
    if (!res.ok) throw new Error("Could not load the testimonial to translate it.");
    const all: any[] = await res.json();
    const testimonial = all.find((t) => t.id === id);
    if (!testimonial) throw new Error("Could not find that testimonial.");
    const en = testimonial.translations?.find((t: any) => t.languageCode === "en");
    if (!en) throw new Error("Save the English version first — there's nothing to translate yet.");

    for (const lang of targetLanguages) {
      const translated = await translateFields({ quote: en.quote ?? "" }, lang, ["quote"], "testimonials");
      await apiWriteNoRedirect(`/testimonials/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          translations: [{ languageCode: lang, quote: translated.quote }],
        }),
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

// Freezone Approvals and sub-services previously had NO per-language
// storage at all — badge/headline/body/ctaLabel (and a sub-service's
// name/description/body/AEO fields) were plain columns on the English row
// itself, so "Translate Everything Now" could only skip them, and the
// public site showed the same English text to every visitor regardless of
// language. FreezoneApprovalTranslation/SubServiceTranslation (see
// schema.prisma) now hold other-language overrides on top of that same
// English row, in exactly the shape ServiceTranslation/etc. already use —
// so these two follow the identical PATCH-with-`translations[]` pattern as
// every auto-translate action above.
export async function autoTranslateFreezoneApprovalAction(id: string, targetLanguages: string[]): Promise<TranslateResult> {
  try {
    const res = await adminFetch("/freezone-approvals/admin/all");
    if (!res.ok) throw new Error("Could not load the freezone approval to translate it.");
    const all: any[] = await res.json();
    const approval = all.find((a) => a.id === id);
    if (!approval) throw new Error("Could not find that freezone approval.");

    for (const lang of targetLanguages) {
      const translated = await translateFields(
        {
          badge: approval.badge ?? "",
          headline: approval.headline ?? "",
          body: approval.body ?? "",
          ctaLabel: approval.ctaLabel ?? "",
        },
        lang,
        [],
        "freezone-approvals",
      );
      await apiWriteNoRedirect(`/freezone-approvals/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ translations: [{ languageCode: lang, ...translated }] }),
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function autoTranslateSubServiceAction(
  serviceId: string,
  subService: { id: string; name?: string; description?: string; body?: string; whatIsIt?: string; whoNeedsIt?: string; benefits?: string; process?: string; costFactors?: string; timeline?: string },
  targetLanguages: string[],
): Promise<TranslateResult> {
  try {
    for (const lang of targetLanguages) {
      const translated = await translateFlatFields(
        subService,
        ["name", "description", "body", "whatIsIt", "whoNeedsIt", "benefits", "process", "costFactors", "timeline"],
        ["body", "whatIsIt", "whoNeedsIt"],
        lang,
        "sub-services",
      );
      if (Object.keys(translated).length === 0) continue;
      await apiWriteNoRedirect(`/services/admin/sub-services/${subService.id}`, {
        method: "PATCH",
        body: JSON.stringify({ translations: [{ languageCode: lang, ...translated }] }),
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Translate Entire Site (Admin → Translate Settings → "Translate Everything
// Now") — the one-click version of every "Auto-translate" button above,
// covering every place real visitor-facing text lives on the site instead
// of one record at a time:
//
//   - The four record types above (Insights, Services, Team, Testimonials),
//     looped over every existing row.
//   - Every ContentBlock page section that's actually read *per language*
//     on the public site — see each `lang = "en"` parameter in lib/api.ts.
//     A section read WITHOUT a lang argument (Section Animations, Scroll &
//     Motion, Testimonials Display, the Landing Animation's frames, …) is
//     an admin *setting* — a layout choice, a speed, an enum like
//     "medium" — never visitor-facing copy, and is deliberately left out:
//     translating "medium" into another language's word for it would
//     silently break the code that reads it back as one of three fixed
//     English strings.
//
// Two content types can't be included yet because they have no translation
// storage at the database level at all — Freezone Approvals (its own
// Prisma model, no `translations` relation) and Sub-services' own fields
// (flat on the model, "instead of in a translation table" per that DTO's
// own comment). Both stay English-only on every locale regardless of this
// action, until a schema change adds real translation storage for them —
// the summary this returns says so rather than silently pretending they
// were covered.
//
// `overwrite=false` ("fill in the gaps", the default and the safe choice
// for re-runs) never touches a page section or record that already has
// *any* saved content for that language — so a translation an admin has
// already reviewed and hand-edited is never silently replaced. Pass
// `overwrite=true` to force a fresh translation everywhere regardless.
//
// After a successful run, a hash of the English text actually translated
// is stored per page-section/record + language (Admin → global ContentBlock
// "translationTracking", English-only, never rendered on the public site).
// getTranslationStaleness() below re-hashes the *current* English content
// and compares — if it no longer matches, that item's translation is
// stale, which is what powers the "English content changed — translations
// may be out of date" banner in the admin dashboard shell.
// ---------------------------------------------------------------------------

async function saveContentBlockForLang(page: string, section: string, languageCode: string, data: unknown) {
  await apiWriteNoRedirect("/admin/content-blocks", {
    method: "POST",
    body: JSON.stringify({ page, section, languageCode, data }),
  });
}

// Everywhere else on the site, page content is read through lib/api.ts's
// getPageContent(), which is deliberately cached for 60 seconds (see its
// comment in lib/api.ts) so ordinary page traffic doesn't hammer the API.
// That's the wrong tool here: this bulk-translate feature reads "the
// current English content" as its SOURCE OF TRUTH to translate from and to
// decide what's stale — if it reads a cached snapshot from just before an
// admin's edit, it silently translates (or compares against) the OLD text,
// which is exactly what made an edited footer keep showing up untranslated
// even after a fresh "Translate Everything Now" run. adminFetch() always
// sends `cache: "no-store"` (lib/session.ts), so every read below goes
// straight to the database.
async function getPageContentFresh(page: string, lang: string): Promise<Record<string, any>> {
  try {
    const res = await adminFetch(`/content/${page}/${lang}`);
    if (!res.ok) return {};
    const data = await res.json();
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function hashOf(value: unknown): string {
  return createHash("sha1").update(JSON.stringify(value ?? null)).digest("hex").slice(0, 20);
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

// Google Translate can mangle a literal placeholder token like the "{name}"
// used in Page Header "lead" text (see getPageHeader in lib/api.ts) — it's
// not real English prose, it's a marker this codebase substitutes after
// translation, and asking Google to translate the word inside the braces
// risks it coming back as a different token (or with the braces dropped
// entirely), silently breaking that substitution. Every string handed to
// Google below is first passed through this: any `{word}` token is swapped
// for a placeholder Google reliably leaves untouched, then restored
// afterward — invisible when there's no such token in the text at all.
function protectPlaceholders(text: string): { text: string; restore: (translated: string) => string } {
  const found: string[] = [];
  const guarded = text.replace(/\{[a-zA-Z0-9_]+\}/g, (m) => {
    found.push(m);
    return `[[P${found.length - 1}]]`;
  });
  if (found.length === 0) return { text, restore: (t) => t };
  return {
    text: guarded,
    restore: (translated) => found.reduce((acc, token, i) => acc.split(`[[P${i}]]`).join(token), translated),
  };
}

// Translates the listed top-level string fields of a flat object in one
// batched call and returns just the translated fields — the rest of the
// object is left for the caller to merge back in, so a section with fields
// this function doesn't know about (an image URL, a color) is never
// touched.
async function translateFlatFields(
  en: Record<string, any>,
  fields: string[],
  htmlFields: string[],
  lang: string,
  source: string,
): Promise<Record<string, string>> {
  const texts: Record<string, string> = {};
  const restores: Record<string, (t: string) => string> = {};
  for (const f of fields) {
    const v = en?.[f];
    if (typeof v === "string" && v.trim()) {
      const guarded = protectPlaceholders(v);
      texts[f] = guarded.text;
      restores[f] = guarded.restore;
    }
  }
  if (Object.keys(texts).length === 0) return {};
  const translated = await translateFields(texts, lang, htmlFields, source);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(translated)) out[k] = restores[k] ? restores[k](v) : v;
  return out;
}

// Same idea for an array of like-shaped objects (stats rows, value cards,
// timeline entries, footer link rows, gallery captions, …) — every item's
// fields are sent to Google as one batched request instead of one request
// per row, keeping a page with a dozen rows to a single API call.
async function translateArrayItems(
  items: any[],
  fields: string[],
  htmlFields: string[],
  lang: string,
  source: string,
): Promise<any[]> {
  if (!Array.isArray(items) || items.length === 0) return items;
  const texts: Record<string, string> = {};
  const restores: Record<string, (t: string) => string> = {};
  const htmlKeys: string[] = [];
  items.forEach((item, i) => {
    for (const f of fields) {
      const v = item?.[f];
      if (typeof v === "string" && v.trim()) {
        const key = `${i}::${f}`;
        const guarded = protectPlaceholders(v);
        texts[key] = guarded.text;
        restores[key] = guarded.restore;
        if (htmlFields.includes(f)) htmlKeys.push(key);
      }
    }
  });
  if (Object.keys(texts).length === 0) return items;
  const translated = await translateFields(texts, lang, htmlKeys, source);
  return items.map((item, i) => {
    const out = { ...item };
    for (const f of fields) {
      const key = `${i}::${f}`;
      if (translated[key] !== undefined) out[f] = restores[key] ? restores[key](translated[key]) : translated[key];
    }
    return out;
  });
}

type TranslateAllStats = { translated: number; skipped: number; failed: number; notes: string[] };
type PageTracking = Record<string, Record<string, string>>; // `${page}:${section}` -> { [lang]: hash }
type RecordTracking = Record<string, Record<string, Record<string, string>>>; // kind -> id -> { [lang]: hash }

function bump(stats: TranslateAllStats, key: "translated" | "skipped" | "failed") {
  stats[key]++;
}

// The single source of truth for "what does this ContentBlock section
// effectively show in English right now, even if an admin has never opened
// that screen and clicked Save" — the exact same default object the
// matching getter in lib/api.ts falls back to (getHomeContent, getAboutContent,
// getFooterLinksContent, etc.). Used both when translating (so a never-
// customized section, which the public site is already showing in English
// to every visitor regardless of language, still gets translated) and when
// checking staleness (getTranslationStaleness) — sharing one function means
// the two can never disagree about what "the current English content" is.
function getSectionFallback(page: string, section: string): any {
  if (section === "pageHeader") return pageHeaderDefaults[page];
  if (page === "global" && section === "siteConfig") return defaultSiteConfigContent;
  if (page === "global" && section === "locationGate") return defaultLocationGateContent;
  if (page === "global" && section === "navLinks") return defaultNavLinksContent;
  if (page === "global" && section === "footerLinks") return defaultFooterLinksContent;
  if (page === "global" && section === "uiStrings") return defaultUiStringsContent;
  if (page === "home" && section === "hero") return defaultHeroContent;
  if (page === "home" && section === "freezone") return defaultFreezoneContent;
  if (page === "home" && section === "stats") return defaultStatsContent;
  if (page === "home" && section === "trustBadges") return defaultTrustBadgesContent;
  if (page === "home" && section === "whyChooseUs") return defaultWhyChooseUsContent;
  if (page === "home" && section === "industries") return defaultIndustriesContent;
  if (page === "about" && section === "intro") return defaultAboutIntroContent;
  if (page === "about" && section === "values") return defaultAboutValuesContent;
  if (page === "about" && section === "timeline") return defaultAboutTimelineContent;
  if (page === "about" && section === "leadership") return defaultAboutLeadershipContent;
  if (page === "careers" && section === "intro") return defaultCareersIntroContent;
  if (page.startsWith("legal-") && section === "content") {
    const key = page.slice("legal-".length) as keyof typeof defaultLegalPagesContent;
    return defaultLegalPagesContent[key];
  }
  return undefined;
}

// Decides whether a target-language section can be safely left alone: a
// translation only counts as "already done" when it (a) exists AND (b) was
// produced from the exact English content that exists right now. `Overwrite
// existing translations` bypasses this entirely (always retranslate); with
// it off, this is what makes an edited English section get picked back up
// automatically instead of silently staying stale forever — a translation
// with no recorded hash (written before this tracking existed, or typed in
// directly on the language tab) is treated as a deliberate admin edit and
// left alone, same as before.
async function isUpToDate(page: string, section: string, lang: string, en: unknown, prevTracking: PageTracking): Promise<boolean> {
  const existing = await getPageContentFresh(page, lang);
  const value = section === "hero" ? existing.hero : section === "footerLinks" ? existing.footerLinks : existing[section];
  if (!isFilled(value)) return false;
  const trackedHash = prevTracking[`${page}:${section}`]?.[lang];
  if (trackedHash === undefined) return true; // untracked = manual edit, don't clobber it
  return trackedHash === hashOf(en);
}

// One ContentBlock section holding a flat object (hero excluded — its
// nested primaryCta/secondaryCta need their own function below).
//
// `fallback`, when given, is the exact same default object the matching
// getter in lib/api.ts falls back to when nothing's been saved yet (e.g.
// `content.heroContent` for Home → Hero) — the public site is ALREADY
// showing that English text to every visitor regardless of language the
// moment an admin hasn't touched that section, so it's translated too,
// rather than silently skipped just because no one ever clicked Save on
// that particular screen. A section an admin HAS customized in English
// always wins over the fallback.
async function translateFlatSection(
  page: string,
  section: string,
  fields: string[],
  htmlFields: string[],
  lang: string,
  overwrite: boolean,
  stats: TranslateAllStats,
  tracking: PageTracking,
  prevTracking: PageTracking,
) {
  const trackKey = `${page}:${section}`;
  try {
    const enContent = await getPageContentFresh(page, "en");
    const en = isFilled(enContent[section]) ? enContent[section] : getSectionFallback(page, section);
    if (!isFilled(en)) return; // nothing saved in English yet, and no fallback either
    if (!overwrite && (await isUpToDate(page, section, lang, en, prevTracking))) {
      bump(stats, "skipped");
      return;
    }
    const translatedFields = await translateFlatFields(en, fields, htmlFields, lang, "bulk-translate-all");
    if (Object.keys(translatedFields).length === 0) return;
    await saveContentBlockForLang(page, section, lang, { ...en, ...translatedFields });
    tracking[trackKey] = { ...(tracking[trackKey] ?? {}), [lang]: hashOf(en) };
    bump(stats, "translated");
  } catch (err) {
    bump(stats, "failed");
    stats.notes.push(`${page}/${section} (${lang}): ${(err as Error).message}`);
  }
}

// One ContentBlock section that IS itself an array (stats, trustBadges,
// whyChooseUs, industries, values, timeline) — see translateFlatSection's
// comment on `fallback` just above, same reasoning applies here.
async function translateArraySection(
  page: string,
  section: string,
  fields: string[],
  htmlFields: string[],
  lang: string,
  overwrite: boolean,
  stats: TranslateAllStats,
  tracking: PageTracking,
  prevTracking: PageTracking,
) {
  const trackKey = `${page}:${section}`;
  try {
    const enContent = await getPageContentFresh(page, "en");
    const en = isFilled(enContent[section]) ? enContent[section] : getSectionFallback(page, section);
    if (!isFilled(en)) return;
    if (!overwrite && (await isUpToDate(page, section, lang, en, prevTracking))) {
      bump(stats, "skipped");
      return;
    }
    const translated = await translateArrayItems(en, fields, htmlFields, lang, "bulk-translate-all");
    await saveContentBlockForLang(page, section, lang, translated);
    tracking[trackKey] = { ...(tracking[trackKey] ?? {}), [lang]: hashOf(en) };
    bump(stats, "translated");
  } catch (err) {
    bump(stats, "failed");
    stats.notes.push(`${page}/${section} (${lang}): ${(err as Error).message}`);
  }
}

// Home → Hero — needs its own function purely because primaryCta/
// secondaryCta's `label` is one level deep (the `href` beside it is
// deliberately left alone, same as everywhere else in this file).
async function translateHeroSection(lang: string, overwrite: boolean, stats: TranslateAllStats, tracking: PageTracking, prevTracking: PageTracking) {
  try {
    const enContent = await getPageContentFresh("home", "en");
    const en = isFilled(enContent.hero) ? enContent.hero : getSectionFallback("home", "hero");
    if (!isFilled(en)) return;
    if (!overwrite && (await isUpToDate("home", "hero", lang, en, prevTracking))) {
      bump(stats, "skipped");
      return;
    }
    const flat = {
      eyebrow: en.eyebrow,
      headline: en.headline,
      body: en.body,
      credentialLine: en.credentialLine,
      primaryCtaLabel: en.primaryCta?.label,
      secondaryCtaLabel: en.secondaryCta?.label,
    };
    const translated = await translateFlatFields(flat, Object.keys(flat), ["body"], lang, "bulk-translate-all");
    if (Object.keys(translated).length === 0) return;
    const merged = {
      ...en,
      ...(translated.eyebrow !== undefined ? { eyebrow: translated.eyebrow } : {}),
      ...(translated.headline !== undefined ? { headline: translated.headline } : {}),
      ...(translated.body !== undefined ? { body: translated.body } : {}),
      ...(translated.credentialLine !== undefined ? { credentialLine: translated.credentialLine } : {}),
      primaryCta: { ...en.primaryCta, ...(translated.primaryCtaLabel !== undefined ? { label: translated.primaryCtaLabel } : {}) },
      secondaryCta: { ...en.secondaryCta, ...(translated.secondaryCtaLabel !== undefined ? { label: translated.secondaryCtaLabel } : {}) },
    };
    await saveContentBlockForLang("home", "hero", lang, merged);
    tracking["home:hero"] = { ...(tracking["home:hero"] ?? {}), [lang]: hashOf(en) };
    bump(stats, "translated");
  } catch (err) {
    bump(stats, "failed");
    stats.notes.push(`home/hero (${lang}): ${(err as Error).message}`);
  }
}

// Global → UI Text — Contact form labels + chat widget chrome (see
// `uiStrings` in content.ts). Two levels of nesting (contactForm.*,
// chatbot.*, and chatbot.smallTalk.<category>[] — a variable-length list of
// reply variants per category), so this flattens everything to one batch of
// `section::field` / `smallTalk::category::index` keys for a single Google
// Translate call, then rebuilds the nested shape from the result.
async function translateUiStringsSection(lang: string, overwrite: boolean, stats: TranslateAllStats, tracking: PageTracking, prevTracking: PageTracking) {
  const page = "global";
  const section = "uiStrings";
  try {
    const enContent = await getPageContentFresh(page, "en");
    const en = isFilled(enContent.uiStrings) ? enContent.uiStrings : getSectionFallback(page, section);
    if (!isFilled(en)) return;
    if (!overwrite && (await isUpToDate(page, section, lang, en, prevTracking))) {
      bump(stats, "skipped");
      return;
    }

    const flatEn: Record<string, string> = {};
    for (const [k, v] of Object.entries(en.contactForm ?? {})) {
      if (typeof v === "string") flatEn[`contactForm::${k}`] = v;
    }
    for (const [k, v] of Object.entries(en.chatbot ?? {})) {
      if (typeof v === "string") flatEn[`chatbot::${k}`] = v;
    }
    const smallTalk: Record<string, string[]> = en.chatbot?.smallTalk ?? {};
    for (const [category, lines] of Object.entries(smallTalk)) {
      (Array.isArray(lines) ? lines : []).forEach((line, i) => {
        if (typeof line === "string" && line.trim()) flatEn[`smallTalk::${category}::${i}`] = line;
      });
    }
    if (Object.keys(flatEn).length === 0) return;

    const translatedFlat = await translateFlatFields(flatEn, Object.keys(flatEn), [], lang, "bulk-translate-all");
    if (Object.keys(translatedFlat).length === 0) return;

    const contactForm: Record<string, string> = { ...en.contactForm };
    const chatbot: Record<string, any> = { ...en.chatbot };
    const newSmallTalk: Record<string, string[]> = {};
    for (const [category, lines] of Object.entries(smallTalk)) {
      newSmallTalk[category] = (Array.isArray(lines) ? lines : []).map(
        (line, i) => translatedFlat[`smallTalk::${category}::${i}`] ?? line,
      );
    }
    for (const [key, value] of Object.entries(translatedFlat)) {
      if (key.startsWith("contactForm::")) contactForm[key.slice("contactForm::".length)] = value;
      else if (key.startsWith("chatbot::")) chatbot[key.slice("chatbot::".length)] = value;
    }
    chatbot.smallTalk = { ...smallTalk, ...newSmallTalk };

    await saveContentBlockForLang(page, section, lang, { contactForm, chatbot });
    tracking[`${page}:${section}`] = { ...(tracking[`${page}:${section}`] ?? {}), [lang]: hashOf(en) };
    bump(stats, "translated");
  } catch (err) {
    bump(stats, "failed");
    stats.notes.push(`${page}/${section} (${lang}): ${(err as Error).message}`);
  }
}

// Global → Footer Links — three named arrays (services/company/legal),
// each row's `label` translated (its `href` left alone), all three groups
// batched into one Google Translate call.
async function translateFooterLinksSection(lang: string, overwrite: boolean, stats: TranslateAllStats, tracking: PageTracking, prevTracking: PageTracking) {
  try {
    const enContent = await getPageContentFresh("global", "en");
    const en = isFilled(enContent.footerLinks) ? enContent.footerLinks : getSectionFallback("global", "footerLinks");
    if (!isFilled(en)) return;
    if (!overwrite && (await isUpToDate("global", "footerLinks", lang, en, prevTracking))) {
      bump(stats, "skipped");
      return;
    }
    const groups = ["services", "company", "legal"] as const;
    const texts: Record<string, string> = {};
    const restores: Record<string, (t: string) => string> = {};
    for (const g of groups) {
      const rows: any[] = Array.isArray(en[g]) ? en[g] : [];
      rows.forEach((row, i) => {
        if (typeof row?.label === "string" && row.label.trim()) {
          const key = `${g}::${i}`;
          const guarded = protectPlaceholders(row.label);
          texts[key] = guarded.text;
          restores[key] = guarded.restore;
        }
      });
    }
    if (Object.keys(texts).length === 0) return;
    const translated = await translateFields(texts, lang, [], "bulk-translate-all");
    const merged: Record<string, any[]> = {};
    for (const g of groups) {
      const rows: any[] = Array.isArray(en[g]) ? en[g] : [];
      merged[g] = rows.map((row, i) => {
        const key = `${g}::${i}`;
        if (translated[key] === undefined) return row;
        return { ...row, label: restores[key] ? restores[key](translated[key]) : translated[key] };
      });
    }
    await saveContentBlockForLang("global", "footerLinks", lang, merged);
    tracking["global:footerLinks"] = { ...(tracking["global:footerLinks"] ?? {}), [lang]: hashOf(en) };
    bump(stats, "translated");
  } catch (err) {
    bump(stats, "failed");
    stats.notes.push(`global/footerLinks (${lang}): ${(err as Error).message}`);
  }
}

// About → Gallery — only the optional per-photo `caption` is real text;
// `url` is left alone.
async function translateGallerySection(lang: string, overwrite: boolean, stats: TranslateAllStats, tracking: PageTracking, prevTracking: PageTracking) {
  try {
    const enContent = await getPageContentFresh("about", "en");
    const en = enContent.gallery;
    if (!isFilled(en) || !Array.isArray(en.photos) || en.photos.length === 0) return;
    if (!overwrite && (await isUpToDate("about", "gallery", lang, en, prevTracking))) {
      bump(stats, "skipped");
      return;
    }
    const translatedPhotos = await translateArrayItems(en.photos, ["caption"], [], lang, "bulk-translate-all");
    await saveContentBlockForLang("about", "gallery", lang, { ...en, photos: translatedPhotos });
    tracking["about:gallery"] = { ...(tracking["about:gallery"] ?? {}), [lang]: hashOf(en) };
    bump(stats, "translated");
  } catch (err) {
    bump(stats, "failed");
    stats.notes.push(`about/gallery (${lang}): ${(err as Error).message}`);
  }
}

async function translateRecordIfNeeded(
  kind: "insight" | "service" | "team" | "testimonial",
  record: any,
  lang: string,
  overwrite: boolean,
  stats: TranslateAllStats,
  tracking: RecordTracking,
  prevTracking: RecordTracking,
) {
  const en = record.translations?.find((t: any) => t.languageCode === "en");
  if (!en) return; // never saved in English — nothing to translate from
  if (!overwrite) {
    const existing = record.translations?.find((t: any) => t.languageCode === lang);
    const existingFilled =
      existing && Object.entries(existing).some(([k, v]) => k !== "languageCode" && typeof v === "string" && v.trim());
    // Same "is this actually up to date" reasoning as isUpToDate() above:
    // an edit to the English record (title, body, …) after it was already
    // translated must not sit there stale until someone remembers to tick
    // "Overwrite" — a hash mismatch against the recorded translation-time
    // hash means it's re-translated automatically. A translation with no
    // recorded hash (typed in directly on the record's language tab) is
    // left alone, same as before.
    if (existingFilled) {
      const trackedHash = prevTracking[kind]?.[record.id]?.[lang];
      if (trackedHash === undefined || trackedHash === hashOf(en)) {
        bump(stats, "skipped");
        return;
      }
    }
  }
  try {
    const result: TranslateResult =
      kind === "insight"
        ? await autoTranslateInsightAction(record.id, [lang])
        : kind === "service"
          ? await autoTranslateServiceAction(record.id, [lang])
          : kind === "team"
            ? await autoTranslateTeamMemberAction(record.id, [lang])
            : await autoTranslateTestimonialAction(record.id, [lang]);
    if (result.ok) {
      tracking[kind] = tracking[kind] ?? {};
      tracking[kind][record.id] = { ...(tracking[kind][record.id] ?? {}), [lang]: hashOf(en) };
      bump(stats, "translated");
    } else {
      bump(stats, "failed");
      stats.notes.push(`${kind} "${en.title ?? en.name ?? en.position ?? record.id}" (${lang}): ${result.message}`);
    }
  } catch (err) {
    bump(stats, "failed");
    stats.notes.push(`${kind} ${record.id} (${lang}): ${(err as Error).message}`);
  }
}

// Freezone Approvals and sub-services don't keep a real "en" row in their
// `translations` array the way Insights/Services/Team/Testimonials do —
// their English text is the base record's own columns (approval.headline,
// subService.name, …), with FreezoneApprovalTranslation/SubServiceTranslation
// holding only OTHER languages on top (see schema.prisma). So unlike
// translateRecordIfNeeded above, "en" here comes from the record itself, not
// from `record.translations`.
async function translateFreezoneApprovalIfNeeded(
  approval: any,
  lang: string,
  overwrite: boolean,
  stats: TranslateAllStats,
  tracking: RecordTracking,
  prevTracking: RecordTracking,
) {
  const en = { badge: approval.badge, headline: approval.headline, body: approval.body, ctaLabel: approval.ctaLabel };
  if (!isFilled(en.headline) && !isFilled(en.body)) return;
  if (!overwrite) {
    const existing = approval.translations?.find((t: any) => t.languageCode === lang);
    const existingFilled = existing && (isFilled(existing.headline) || isFilled(existing.body));
    if (existingFilled) {
      const trackedHash = prevTracking.freezone?.[approval.id]?.[lang];
      if (trackedHash === undefined || trackedHash === hashOf(en)) {
        bump(stats, "skipped");
        return;
      }
    }
  }
  try {
    const result = await autoTranslateFreezoneApprovalAction(approval.id, [lang]);
    if (result.ok) {
      tracking.freezone = tracking.freezone ?? {};
      tracking.freezone[approval.id] = { ...(tracking.freezone[approval.id] ?? {}), [lang]: hashOf(en) };
      bump(stats, "translated");
    } else {
      bump(stats, "failed");
      stats.notes.push(`freezone approval "${en.headline ?? approval.id}" (${lang}): ${result.message}`);
    }
  } catch (err) {
    bump(stats, "failed");
    stats.notes.push(`freezone approval ${approval.id} (${lang}): ${(err as Error).message}`);
  }
}

async function translateSubServiceIfNeeded(
  serviceId: string,
  subService: any,
  lang: string,
  overwrite: boolean,
  stats: TranslateAllStats,
  tracking: RecordTracking,
  prevTracking: RecordTracking,
) {
  const en = {
    name: subService.name,
    description: subService.description,
    body: subService.body,
    whatIsIt: subService.whatIsIt,
    whoNeedsIt: subService.whoNeedsIt,
    benefits: subService.benefits,
    process: subService.process,
    costFactors: subService.costFactors,
    timeline: subService.timeline,
  };
  if (!isFilled(en.name)) return; // no name at all — nothing worth translating
  if (!overwrite) {
    const existing = subService.translations?.find((t: any) => t.languageCode === lang);
    const existingFilled = existing && isFilled(existing.name);
    if (existingFilled) {
      const trackedHash = prevTracking.subService?.[subService.id]?.[lang];
      if (trackedHash === undefined || trackedHash === hashOf(en)) {
        bump(stats, "skipped");
        return;
      }
    }
  }
  try {
    const result = await autoTranslateSubServiceAction(serviceId, { id: subService.id, ...en }, [lang]);
    if (result.ok) {
      tracking.subService = tracking.subService ?? {};
      tracking.subService[subService.id] = { ...(tracking.subService[subService.id] ?? {}), [lang]: hashOf(en) };
      bump(stats, "translated");
    } else {
      bump(stats, "failed");
      stats.notes.push(`sub-service "${en.name ?? subService.id}" (${lang}): ${result.message}`);
    }
  } catch (err) {
    bump(stats, "failed");
    stats.notes.push(`sub-service ${subService.id} (${lang}): ${(err as Error).message}`);
  }
}

export type TranslateAllResult = { ok: boolean; summary?: string; message?: string };

// The button in Admin → Translate Settings → "Translate Everything Now".
export async function translateEntireSiteAction(targetLanguages: string[], overwrite: boolean): Promise<TranslateAllResult> {
  try {
    if (targetLanguages.length === 0) return { ok: false, message: "Choose at least one language." };

    const stats: TranslateAllStats = { translated: 0, skipped: 0, failed: 0, notes: [] };
    const pageTracking: PageTracking = {};
    const recordTracking: RecordTracking = {};

    // Loaded once, up front, fresh from the database — this is what lets
    // every section/record below tell "already translated" apart from
    // "translated, but English has since changed" (see isUpToDate() and
    // translateRecordIfNeeded()) instead of the old all-or-nothing
    // isFilled() check that left an edited section stale forever unless
    // "Overwrite" was ticked.
    const startingContent = await getPageContentFresh("global", "en");
    const startingTracking = (startingContent.translationTracking ?? {}) as { pages?: PageTracking; records?: RecordTracking };
    const prevPageTracking: PageTracking = startingTracking.pages ?? {};
    const prevRecordTracking: RecordTracking = startingTracking.records ?? {};

    const [insightsRes, servicesRes, teamRes, testimonialsRes, freezoneRes] = await Promise.all([
      adminFetch("/insights/admin/all"),
      adminFetch("/services/admin/all"),
      adminFetch("/team/admin/all"),
      adminFetch("/testimonials/admin/all"),
      adminFetch("/freezone-approvals/admin/all"),
    ]);
    const insightsList: any[] = insightsRes.ok ? await insightsRes.json() : [];
    const servicesList: any[] = servicesRes.ok ? await servicesRes.json() : [];
    const teamList: any[] = teamRes.ok ? await teamRes.json() : [];
    const testimonialsList: any[] = testimonialsRes.ok ? await testimonialsRes.json() : [];
    const freezoneList: any[] = freezoneRes.ok ? await freezoneRes.json() : [];
    // Every sub-service of every service — findAllAdmin() on the API side
    // now includes each service's subServices (with their own
    // translations), so this needs no extra request per service.
    const subServices: { serviceId: string; subService: any }[] = servicesList.flatMap((s) =>
      (s.subServices ?? []).map((ss: any) => ({ serviceId: s.id, subService: ss })),
    );

    for (const lang of targetLanguages) {
      await translateFlatSection("global", "siteConfig", ["tagline"], [], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateFlatSection("global", "locationGate", ["headline", "subtext", "ctaLabel", "logoText"], [], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateArraySection("global", "navLinks", ["label"], [], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateFooterLinksSection(lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateUiStringsSection(lang, overwrite, stats, pageTracking, prevPageTracking);

      for (const page of Object.keys(pageHeaderDefaults)) {
        await translateFlatSection(page, "pageHeader", ["eyebrow", "headline", "lead"], [], lang, overwrite, stats, pageTracking, prevPageTracking);
      }

      await translateHeroSection(lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateFlatSection("home", "freezone", ["badge", "headline", "body", "ctaLabel"], ["body"], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateArraySection("home", "stats", ["label"], [], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateArraySection("home", "trustBadges", ["label"], [], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateArraySection("home", "whyChooseUs", ["title", "description"], [], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateArraySection("home", "industries", ["name"], [], lang, overwrite, stats, pageTracking, prevPageTracking);

      await translateFlatSection("about", "intro", ["story", "mission", "vision"], ["story"], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateArraySection("about", "values", ["title", "description"], [], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateArraySection("about", "timeline", ["event"], [], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateFlatSection("about", "leadership", ["message", "name"], ["message"], lang, overwrite, stats, pageTracking, prevPageTracking);
      await translateGallerySection(lang, overwrite, stats, pageTracking, prevPageTracking);

      await translateFlatSection("careers", "intro", ["story"], ["story"], lang, overwrite, stats, pageTracking, prevPageTracking);

      for (const legalPage of ["privacy", "terms", "cookies"] as const) {
        await translateFlatSection(`legal-${legalPage}`, "content", ["title", "body"], ["body"], lang, overwrite, stats, pageTracking, prevPageTracking);
      }

      for (const rec of insightsList) await translateRecordIfNeeded("insight", rec, lang, overwrite, stats, recordTracking, prevRecordTracking);
      for (const rec of servicesList) await translateRecordIfNeeded("service", rec, lang, overwrite, stats, recordTracking, prevRecordTracking);
      for (const rec of teamList) await translateRecordIfNeeded("team", rec, lang, overwrite, stats, recordTracking, prevRecordTracking);
      for (const rec of testimonialsList) await translateRecordIfNeeded("testimonial", rec, lang, overwrite, stats, recordTracking, prevRecordTracking);
      for (const rec of freezoneList) await translateFreezoneApprovalIfNeeded(rec, lang, overwrite, stats, recordTracking, prevRecordTracking);
      for (const { serviceId, subService } of subServices) {
        await translateSubServiceIfNeeded(serviceId, subService, lang, overwrite, stats, recordTracking, prevRecordTracking);
      }
    }

    // Merge onto whatever tracking is stored now (re-read fresh rather than
    // reusing `startingTracking`, in case something else wrote to it while
    // this run was in flight), so a partial re-run (e.g. only German this
    // time) doesn't erase Arabic's recorded hashes.
    const globalContent = await getPageContentFresh("global", "en");
    const prevTracking = (globalContent.translationTracking ?? {}) as { pages?: PageTracking; records?: RecordTracking };
    const mergedPages: PageTracking = { ...(prevTracking.pages ?? {}) };
    for (const [k, v] of Object.entries(pageTracking)) mergedPages[k] = { ...(mergedPages[k] ?? {}), ...v };
    const mergedRecords: RecordTracking = { ...(prevTracking.records ?? {}) };
    for (const [kind, byId] of Object.entries(recordTracking)) {
      mergedRecords[kind] = { ...(mergedRecords[kind] ?? {}) };
      for (const [id, byLang] of Object.entries(byId)) {
        mergedRecords[kind][id] = { ...(mergedRecords[kind][id] ?? {}), ...byLang };
      }
    }
    await saveContentBlockForLang("global", "translationTracking", "en", { pages: mergedPages, records: mergedRecords });

    const parts: string[] = [`Translated ${stats.translated} item${stats.translated === 1 ? "" : "s"}`];
    if (stats.skipped) parts.push(`skipped ${stats.skipped} already-translated item${stats.skipped === 1 ? "" : "s"}`);
    if (stats.failed) parts.push(`${stats.failed} failed`);
    let summary = parts.join(", ") + ". Review the new language tabs before this goes live.";
    if (stats.notes.length) summary += ` First issue: ${stats.notes[0]}`;

    return { ok: true, summary };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

// Admin dashboard shell banner ("English content changed — translations may
// be out of date"), see app/admin/(dashboard)/layout.tsx. Re-hashes today's
// English content/record fields and compares against the hash recorded at
// the moment of the last successful translation for that same item —
// anything that no longer matches is stale. Never treats "nothing recorded
// yet" (a site that has never run Translate All) as stale — there's nothing
// to have drifted from.
export async function getTranslationStaleness(): Promise<{ stale: boolean; count: number }> {
  try {
    const globalContent = await getPageContentFresh("global", "en");
    const tracking = (globalContent.translationTracking ?? {}) as { pages?: PageTracking; records?: RecordTracking };
    const targetLangs = ["ar", "de"];
    let staleCount = 0;

    for (const [key, byLang] of Object.entries(tracking.pages ?? {})) {
      const sep = key.indexOf(":");
      const page = key.slice(0, sep);
      const section = key.slice(sep + 1);
      const enContent = await getPageContentFresh(page, "en");
      const currentValue = isFilled(enContent[section]) ? enContent[section] : getSectionFallback(page, section);
      const currentHash = hashOf(currentValue);
      for (const lang of targetLangs) {
        if (byLang[lang] && byLang[lang] !== currentHash) staleCount++;
      }
    }

    const listPaths: Record<string, string> = {
      insight: "/insights/admin/all",
      service: "/services/admin/all",
      team: "/team/admin/all",
      testimonial: "/testimonials/admin/all",
      freezone: "/freezone-approvals/admin/all",
    };
    // Freezone Approvals and sub-services keep their English text as base
    // columns on the record itself, not as a "en" row inside `translations`
    // — see translateFreezoneApprovalIfNeeded()/translateSubServiceIfNeeded()
    // above for why, so "current English content" is read differently for
    // these two kinds than for Insights/Services/Team/Testimonials.
    const baseEnglishOf: Record<string, (r: any) => any> = {
      freezone: (r) => ({ badge: r.badge, headline: r.headline, body: r.body, ctaLabel: r.ctaLabel }),
      subService: (r) => ({
        name: r.name,
        description: r.description,
        body: r.body,
        whatIsIt: r.whatIsIt,
        whoNeedsIt: r.whoNeedsIt,
        benefits: r.benefits,
        process: r.process,
        costFactors: r.costFactors,
        timeline: r.timeline,
      }),
    };
    for (const [kind, byId] of Object.entries(tracking.records ?? {})) {
      if (Object.keys(byId).length === 0) continue;
      let byIdMap: Map<string, any>;
      if (kind === "subService") {
        const res = await adminFetch(listPaths.service);
        const services: any[] = res.ok ? await res.json() : [];
        byIdMap = new Map(services.flatMap((s) => (s.subServices ?? []).map((ss: any) => [ss.id, ss])));
      } else {
        const res = await adminFetch(listPaths[kind]);
        const list: any[] = res.ok ? await res.json() : [];
        byIdMap = new Map(list.map((r) => [r.id, r]));
      }
      for (const [id, byLang] of Object.entries(byId)) {
        const record = byIdMap.get(id);
        if (!record) continue;
        const en = baseEnglishOf[kind] ? baseEnglishOf[kind](record) : record.translations?.find((t: any) => t.languageCode === "en");
        if (!en) continue;
        const currentHash = hashOf(en);
        for (const lang of targetLangs) {
          if (byLang[lang] && byLang[lang] !== currentHash) staleCount++;
        }
      }
    }

    return { stale: staleCount > 0, count: staleCount };
  } catch {
    return { stale: false, count: 0 };
  }
}

// ---------------------------------------------------------------------------
// Page Builder (Admin → Page Builder) — lets an admin add freeform content
// blocks to any page themselves (photo, video, rich text, image+text,
// CTA banner, quote, gallery, spacer) without a developer adding a new
// hardcoded section first. See components/site/PageBlocks.tsx for how
// each `type` renders, and prisma's `PageBlock` model on the API side.
// ---------------------------------------------------------------------------

async function buildPageBlockContent(type: string, formData: FormData): Promise<Record<string, unknown>> {
  switch (type) {
    case "richText":
      return { html: formData.get("html")?.toString() || "" };

    case "image": {
      const url = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/page-blocks");
      const existing = formData.get("existingUrl")?.toString();
      const removeImage = formData.get("removeImage")?.toString() === "1";
      return {
        url: removeImage ? "" : url ?? existing ?? "",
        position: formData.get("position")?.toString() || "center",
        caption: formData.get("caption")?.toString() || "",
        link: formData.get("link")?.toString() || "",
      };
    }

    case "video": {
      const url = await uploadToCloudinary(formData.get("video") as File | null, "sterling-vance/page-blocks");
      const existing = formData.get("existingUrl")?.toString();
      const poster = await uploadToCloudinary(formData.get("poster") as File | null, "sterling-vance/page-blocks");
      const existingPoster = formData.get("existingPosterUrl")?.toString();
      const removePoster = formData.get("removePoster")?.toString() === "1";
      return { url: url ?? existing ?? "", posterUrl: removePoster ? "" : poster ?? existingPoster ?? "" };
    }

    case "imageText": {
      const imageUrl = await uploadToCloudinary(formData.get("image") as File | null, "sterling-vance/page-blocks");
      const videoUrl = await uploadToCloudinary(formData.get("video") as File | null, "sterling-vance/page-blocks");
      const existingImage = formData.get("existingImageUrl")?.toString();
      const existingVideo = formData.get("existingVideoUrl")?.toString();
      const removeImage = formData.get("removeImage")?.toString() === "1";
      return {
        eyebrow: formData.get("eyebrow")?.toString() || "",
        headline: formData.get("headline")?.toString() || "",
        body: formData.get("body")?.toString() || "",
        linkLabel: formData.get("linkLabel")?.toString() || "",
        link: formData.get("link")?.toString() || "",
        imageUrl: removeImage ? "" : imageUrl ?? existingImage ?? "",
        videoUrl: videoUrl ?? existingVideo ?? "",
        mediaPosition: formData.get("mediaPosition")?.toString() === "left" ? "left" : "right",
      };
    }

    case "cta":
      return {
        headline: formData.get("headline")?.toString() || "",
        body: formData.get("body")?.toString() || "",
        ctaLabel: formData.get("ctaLabel")?.toString() || "",
        link: formData.get("link")?.toString() || "",
      };

    case "quote":
      return {
        quote: formData.get("quote")?.toString() || "",
        attribution: formData.get("attribution")?.toString() || "",
      };

    case "gallery": {
      const images: { url: string; caption?: string }[] = [];
      for (let i = 0; i < 8; i++) {
        const remove = formData.get(`gallery_${i}_imageRemove`)?.toString() === "1";
        if (remove) continue;
        const file = formData.get(`gallery_${i}_image`) as File | null;
        const existing = formData.get(`gallery_${i}_existingUrl`)?.toString();
        let url: string | null = null;
        try {
          url = await uploadToCloudinary(file, "sterling-vance/page-blocks");
        } catch {
          // Skip a failed individual slot rather than failing the whole
          // gallery over one bad upload — the rest still save.
        }
        const finalUrl = url ?? existing;
        if (finalUrl) images.push({ url: finalUrl, caption: formData.get(`gallery_${i}_caption`)?.toString() || undefined });
      }
      return { images };
    }

    case "spacer":
      return { height: Number(formData.get("height")) || 48 };

    case "faq": {
      const count = Number(formData.get("faqCount")) || 0;
      const items: { question: string; answer: string }[] = [];
      for (let i = 0; i < count; i++) {
        const question = formData.get(`faq_question_${i}`)?.toString().trim() || "";
        const answer = formData.get(`faq_answer_${i}`)?.toString().trim() || "";
        if (question && answer) items.push({ question, answer });
      }
      return { headline: formData.get("headline")?.toString() || "", items };
    }

    default:
      return {};
  }
}

export async function createPageBlockAction(formData: FormData) {
  const page = formData.get("page")?.toString() || "home";
  const type = formData.get("type")?.toString() || "richText";
  let content: Record<string, unknown>;
  try {
    content = await buildPageBlockContent(type, formData);
  } catch (err) {
    redirect(`/admin/builder?page=${page}&error=${encodeURIComponent((err as Error).message)}`);
  }
  await apiWrite(
    "/page-blocks/admin",
    { method: "POST", body: JSON.stringify({ page, type, content, animation: formData.get("animation")?.toString() || "fade-up" }) },
    `/admin/builder?page=${page}`,
  );
  redirect(`/admin/builder?page=${page}&saved=1`);
}

export async function updatePageBlockAction(id: string, formData: FormData) {
  const page = formData.get("page")?.toString() || "home";
  const type = formData.get("type")?.toString() || "richText";
  let content: Record<string, unknown>;
  try {
    content = await buildPageBlockContent(type, formData);
  } catch (err) {
    redirect(`/admin/builder?page=${page}&error=${encodeURIComponent((err as Error).message)}`);
  }
  await apiWrite(
    `/page-blocks/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        content,
        animation: formData.get("animation")?.toString() || "fade-up",
        isActive: formData.get("isActive") === "1",
      }),
    },
    `/admin/builder?page=${page}`,
  );
  redirect(`/admin/builder?page=${page}&saved=1`);
}

export async function deletePageBlockAction(id: string, page: string) {
  await apiWrite(`/page-blocks/admin/${id}`, { method: "DELETE" }, `/admin/builder?page=${page}`);
  redirect(`/admin/builder?page=${page}&saved=1`);
}

export async function reorderPageBlocksAction(page: string, ids: string[]) {
  await apiWriteNoRedirect(`/page-blocks/admin/reorder/${encodeURIComponent(page)}`, {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}

// --- Email Settings (Admin → Email Settings) ---
export async function updateEmailSettingsAction(formData: FormData) {
  const provider = formData.get("provider")?.toString() === "resend" ? "resend" : "smtp";
  await apiWrite(
    "/settings/email",
    {
      method: "PATCH",
      body: JSON.stringify({
        provider,
        fromName: formData.get("fromName")?.toString() || undefined,
        fromEmail: formData.get("fromEmail")?.toString() || undefined,
        smtpHost: formData.get("smtpHost")?.toString() || undefined,
        smtpPort: formData.get("smtpPort") ? Number(formData.get("smtpPort")) : undefined,
        smtpSecure: formData.get("smtpSecure") === "1",
        smtpUser: formData.get("smtpUser")?.toString() || undefined,
        smtpPass: formData.get("smtpPass")?.toString() || undefined,
        resendApiKey: formData.get("resendApiKey")?.toString() || undefined,
      }),
    },
    "/admin/email-settings",
  );
  redirect("/admin/email-settings?saved=1");
}

export async function sendTestEmailAction() {
  const res = await adminFetch("/settings/email/test", { method: "POST" });
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) {
    let message = "Could not send the test email.";
    try {
      const body = await res.json();
      message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    redirect(`/admin/email-settings?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/email-settings?testSent=1");
}

// --- Cloudinary Settings (Admin → Cloudinary Settings) ---
export async function updateCloudinarySettingsAction(formData: FormData) {
  await apiWrite(
    "/settings/cloudinary",
    {
      method: "PATCH",
      body: JSON.stringify({
        cloudName: formData.get("cloudName")?.toString() || undefined,
        apiKey: formData.get("apiKey")?.toString() || undefined,
        apiSecret: formData.get("apiSecret")?.toString() || undefined,
      }),
    },
    "/admin/cloudinary-settings",
  );
  redirect("/admin/cloudinary-settings?saved=1");
}

export async function updateTranslateSettingsAction(formData: FormData) {
  await apiWrite(
    "/settings/translate",
    {
      method: "PATCH",
      body: JSON.stringify({
        apiKey: formData.get("apiKey")?.toString() || undefined,
      }),
    },
    "/admin/translate-settings",
  );
  redirect("/admin/translate-settings?saved=1");
}

// --- My Profile (Admin → My Profile) ---
// Self-service display info only — name/phone/bio/photo. Email, password
// and role each have their own dedicated, more carefully guarded flow
// (Security page / Users & Roles), so this action deliberately can't touch
// any of those.
export async function updateProfileAction(formData: FormData) {
  let photoUrl: string | undefined;
  try {
    photoUrl = (await uploadToCloudinary(formData.get("photo") as File | null, "sterling-vance/profile")) ?? undefined;
  } catch (err) {
    redirect(`/admin/profile?error=${encodeURIComponent((err as Error).message)}`);
  }
  const removePhoto = formData.get("removePhoto")?.toString() === "1";

  await apiWrite(
    "/auth/profile",
    {
      method: "PATCH",
      body: JSON.stringify({
        name: formData.get("name")?.toString() || undefined,
        phone: formData.get("phone")?.toString() || undefined,
        bio: formData.get("bio")?.toString() || undefined,
        photoUrl: removePhoto ? "" : photoUrl,
      }),
    },
    "/admin/profile",
  );
  redirect("/admin/profile?saved=1");
}
