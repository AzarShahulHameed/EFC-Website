// The one shared definition of "what is this visitor's analytics session
// id" — a single random id per browser tab's visit, kept in sessionStorage
// (never localStorage/a cookie) so it disappears when the tab closes. Used
// by both components/site/PageViewTracker.tsx (to tag each page view) and
// components/site/SessionIdField.tsx (to tag a lead submission with the
// same id), which is what lets Admin → Analytics join a converted lead back
// to the page-view trail that led to it — without any identifier that could
// track the same person across visits or browser tabs.
const SESSION_KEY = "sv_analytics_session";

export function getAnalyticsSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}
