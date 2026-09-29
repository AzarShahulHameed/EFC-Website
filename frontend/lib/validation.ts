// The one shared definition of "is this a plausible email/phone" for the
// whole public site — the contact form, the careers apply form, the
// chatbot's lead-capture step, and the newsletter signup all import these
// instead of each keeping (and risking drifting from) their own copy. The
// API's own DTOs use the equivalent pattern server-side (see
// sterling-vance-api's CreateLeadDto/CreateSubscriberDto) so a value that
// passes here won't turn around and get bounced by the API with a less
// friendly error.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits, spaces, and + ( ) - only, 7-30 characters. Loose on purpose: this
// covers a plain national number as well as a dial-code-prefixed one built
// by PhoneNumberField ("+971 50 123 4567"), where a long dial code (e.g.
// Jamaica's "+1876") plus a formatted national number can run past 20
// characters — was previously capped at 20, which is exactly the class of
// "too US/short-number-centric" length assumption this pattern otherwise
// avoids. Kept in sync with the equivalent PHONE_PATTERN in the API's
// CreateLeadDto/CreateJobApplicationDto/UpdateTeamMemberDto.
export const PHONE_PATTERN = /^[0-9+\-\s()]{7,30}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim()) && value.trim().length <= 254;
}

// A rough "what does a local phone number look like" example per region,
// used only as an input placeholder (never validated against — the real
// check stays the loose international PHONE_PATTERN above, since a firm
// with offices in several countries shouldn't reject a visitor's own
// country's format). Keyed by the same country guess
// lib/timezone-country.ts already produces for analytics, so this needs no
// separate geolocation of its own. Deliberately small and generic — not
// admin content, the same way the validation patterns above aren't: this
// is an input-format hint, not business copy.
const PHONE_PLACEHOLDER_BY_COUNTRY: Record<string, string> = {
  AE: "+971 50 123 4567",
  IN: "+91 98765 43210",
  SA: "+966 50 123 4567",
  GB: "+44 7911 123456",
  US: "+1 (555) 123-4567",
  DE: "+49 151 12345678",
  FR: "+33 6 12 34 56 78",
  SG: "+65 8123 4567",
  AU: "+61 4 1234 5678",
  CA: "+1 (555) 123-4567",
  EG: "+20 100 123 4567",
  PK: "+92 300 1234567",
};
const DEFAULT_PHONE_PLACEHOLDER = "+1 234 567 8900";

export function phonePlaceholderFor(countryCode: string | undefined): string {
  if (!countryCode) return DEFAULT_PHONE_PLACEHOLDER;
  return PHONE_PLACEHOLDER_BY_COUNTRY[countryCode.toUpperCase()] ?? DEFAULT_PHONE_PLACEHOLDER;
}
