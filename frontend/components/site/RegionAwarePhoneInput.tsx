"use client";

import { useEffect, useState } from "react";
import { guessCountryFromTimezone } from "@/lib/timezone-country";
import { phonePlaceholderFor } from "@/lib/validation";

// The contact form's phone field, with an example placeholder that matches
// the visitor's own region ("+971 50 123 4567" for someone in the UAE,
// "+91 98765 43210" for India, etc.) instead of one fixed example that
// looks foreign to most visitors of a firm with offices in several
// countries. Uses the same browser-timezone guess Admin → Analytics
// already relies on for its Countries breakdown — no geolocation prompt,
// nothing sent anywhere. The actual validation stays the loose
// international pattern below (never tightened to match the placeholder's
// country), since a visitor's own number not matching the *guessed*
// region's format is completely normal and shouldn't block submission.
export default function RegionAwarePhoneInput() {
  const [placeholder, setPlaceholder] = useState("+1 234 567 8900");

  useEffect(() => {
    setPlaceholder(phonePlaceholderFor(guessCountryFromTimezone()));
  }, []);

  return (
    <input
      id="phone"
      name="phone"
      type="tel"
      pattern="[0-9+\-\s()]{7,20}"
      title="Enter a valid phone number"
      maxLength={20}
      placeholder={placeholder}
      className="w-full border border-line px-4 py-3 text-[14.5px] focus:outline-none focus:border-ink placeholder:text-slate-400"
    />
  );
}
