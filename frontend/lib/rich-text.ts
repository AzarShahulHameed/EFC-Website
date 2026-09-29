// Minimal allowlist sanitizer for admin-authored rich text (see
// components/admin/RichTextField.tsx). The admin dashboard is behind auth,
// so this isn't defending against a hostile editor — it's a safety net so
// a stray paste from Word/a webpage can't smuggle a <script> tag or an
// onclick handler onto the public site. Strips everything except a small
// set of formatting tags/attributes; everything else is unwrapped, not
// deleted, so the text itself is never lost.
const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "span", "font", "br", "div", "p", "a"]);
const ALLOWED_ATTRS = new Set(["style", "color", "size", "face"]);

// A visitor clicking admin-authored content into somewhere they didn't
// expect (an executable script, a `data:` payload) is exactly what this
// sanitizer exists to prevent — so `href` gets its own value check rather
// than just an allowlisted-attribute-name pass like the others below.
// Only a real link destination is allowed through: an absolute http(s)
// URL, a same-site relative path, an in-page anchor, or a mailto:.
function sanitizeHref(rawHref: string): string | null {
  const href = rawHref.trim();
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:/i.test(href)) return href;
  if (href.startsWith("/") || href.startsWith("#")) return href;
  return null;
}

export function sanitizeRichText(html: string | undefined | null): string {
  if (!html) return "";
  // Strip script/style blocks outright (content and all).
  let out = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Strip every tag that isn't on the allowlist, keeping its text content.
  out = out.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tag: string, attrs: string) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return "";
    const isClosing = match.startsWith("</");
    if (isClosing) return `</${lower}>`;

    if (lower === "a") {
      // `createLink`/pasted markup sometimes carries a `href` with no
      // quotes normalized the same way other attrs are, so this is parsed
      // separately rather than reusing the generic quoted-attr regex below.
      const hrefMatch = attrs.match(/href\s*=\s*"([^"]*)"/i);
      const safeHref = hrefMatch ? sanitizeHref(hrefMatch[1]) : null;
      if (!safeHref) return ""; // no valid destination — unwrap to plain text, not a dead/dangerous link
      // Every external link opens in a new tab with `noopener noreferrer`
      // (the visitor never loses this site's own tab, and the opened page
      // can't reach back into it via `window.opener`); an internal path or
      // in-page anchor stays in the same tab like any normal site link.
      const isExternal = /^https?:\/\//i.test(safeHref);
      const extra = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
      return `<a href="${safeHref.replace(/"/g, "&quot;")}"${extra}>`;
    }

    // Strip any attribute not on the allowlist (this also removes all
    // on*="..." event handler attributes, since none of those are listed).
    const cleanAttrs = (attrs.match(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g) ?? [])
      .filter((pair) => {
        const attrName = pair.split("=")[0].trim().toLowerCase();
        return ALLOWED_ATTRS.has(attrName) && !attrName.startsWith("on");
      })
      .join(" ");
    return cleanAttrs ? `<${lower} ${cleanAttrs}>` : `<${lower}>`;
  });
  return out;
}

// Plain-text version of admin-authored rich text, for places that show a
// short excerpt (a card, a listing) rather than the full formatted block —
// showing raw HTML tags there would look broken, and formatting like a
// large font-size doesn't make sense in a one-line preview anyway.
export function richTextToPlainText(html: string | undefined | null): string {
  if (!html) return "";
  return sanitizeRichText(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
