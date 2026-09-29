// Safely serializes a JSON-LD (or any JSON) payload for embedding inside a
// `<script>` tag via `dangerouslySetInnerHTML`.
//
// `JSON.stringify` never escapes "<", so a string value anywhere in the
// payload containing a literal "</script>" (or "<!--", which some legacy
// HTML parsers also treat specially inside a script) would prematurely
// close the script tag and let whatever follows be parsed as raw HTML —
// a real stored-XSS vector wherever the JSON contains admin-authored text
// (schema titles/descriptions, a saved "Custom Schema.org JSON-LD" blob,
// etc.). Escaping "<" as its unicode escape keeps the JSON semantically
// identical (JSON parsers treat < exactly like a literal "<") while
// making it impossible for the serialized payload to ever contain a
// closing tag sequence.
export function safeJsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Convenience for `<script type="application/ld+json" {...safeJsonLd(data)} />`.
export function safeJsonLd(data: unknown): { __html: string } {
  return { __html: safeJsonLdString(data) };
}
