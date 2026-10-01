"use client";

import { useEffect, useState } from "react";
import FieldLabel from "./FieldLabel";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// <input type="datetime-local"> has no time zone of its own — it shows and
// edits plain local wall-clock digits with no offset attached. To save an
// unambiguous instant, the browser's UTC offset has to travel to the server
// action alongside the typed value (see updateLaunchGateAction in
// lib/admin-actions.ts for the matching conversion math).
//
// This used to be a plain server-rendered <script> tag that wrote the
// offset/ISO value into two hidden fields on "change". That only runs on an
// actual full-page HTML parse — React never executes a <script> it renders
// via dangerouslySetInnerHTML on an ordinary client-side navigation (e.g.
// clicking the "Launch Countdown" link in the sidebar instead of a hard
// refresh), so the hidden fields silently stayed empty and every save
// landed as "no date set" regardless of what the visible picker showed.
// A real client component has none of that gap — React wires its event
// handlers the same way on every navigation.
export default function LaunchDateTimeField({ savedLaunchAt }: { savedLaunchAt: string }) {
  const [localValue, setLocalValue] = useState("");
  // Starts at 0 (matches server-rendered markup, avoiding a hydration
  // mismatch) and is corrected the instant this mounts in the browser —
  // computed in an effect rather than inline during render for the same
  // reason: render has to produce the same output on the server and on the
  // client's first pass, and the server has no time zone of its own to
  // honor here anyway.
  const [offsetMinutes, setOffsetMinutes] = useState(0);

  // Pre-fills the picker from the saved UTC value, converted into the
  // admin's OWN browser's local time — has to happen client-side, since the
  // server has no idea which time zone the admin viewing this page is in.
  useEffect(() => {
    setOffsetMinutes(new Date().getTimezoneOffset());
    if (!savedLaunchAt) return;
    const d = new Date(savedLaunchAt);
    if (Number.isNaN(d.getTime())) return;
    setLocalValue(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    );
  }, [savedLaunchAt]);

  return (
    <div>
      <FieldLabel
        htmlFor="launchAtLocal"
        hint="The countdown ticks down to this moment and the real site automatically takes over right after it passes. Leave blank to show the countdown indefinitely with no ticking clock, controlled only by the switch above."
      >
        Launch Date &amp; Time (your local time)
      </FieldLabel>
      <input
        id="launchAtLocal"
        type="datetime-local"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full border border-line px-3.5 py-2.5 text-[14px] max-w-xs"
      />
      <input type="hidden" name="launchAt" value={localValue} />
      <input type="hidden" name="launchAtOffsetMinutes" value={offsetMinutes} />
    </div>
  );
}
