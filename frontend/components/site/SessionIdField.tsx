"use client";

import { useEffect, useState } from "react";
import { getAnalyticsSessionId } from "@/lib/analytics-session";

// Drop this inside any lead-capturing <form> (contact, consultation, etc.)
// as a hidden field. It fills in with the same sessionStorage id
// PageViewTracker.tsx has already been tagging this visitor's page views
// with, so once the form's server action reads formData.get("sessionId")
// and passes it through to submitLead(), Admin → Analytics can join this
// lead back to the exact pages the visitor looked at beforehand — the
// "email id they used to view our [site]" journey. Renders nothing until
// the id is available (client-only; a static hidden input would just ship
// an empty string on the very first paint).
export default function SessionIdField() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSessionId(getAnalyticsSessionId());
  }, []);

  if (!sessionId) return null;
  return <input type="hidden" name="sessionId" value={sessionId} />;
}
