"use client";

import { useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

const POLL_MS = 30_000;

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// The Topbar bell — previously a static icon with a permanently-on red dot
// and no click handler at all. Polls the API every 30s for the unread
// count (cheap: a single COUNT query) so the badge stays current without a
// websocket, and fetches the actual list only when the dropdown is opened.
export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function refreshCount() {
    try {
      const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(typeof data === "number" ? data : data?.count ?? 0);
    } catch {
      // Silent — a failed poll just means the badge stays at its last
      // known value until the next tick.
    }
  }

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function openDropdown() {
    setOpen((v) => !v);
    if (!loaded) {
      try {
        const res = await fetch("/api/notifications?limit=20", { cache: "no-store" });
        if (res.ok) setItems(await res.json());
      } catch {
        // Leave the list empty — the dropdown shows its own empty state.
      }
      setLoaded(true);
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
    } catch {
      // Optimistic update stands even if the write races; next poll
      // reconciles the real count.
    }
  }

  async function onNotificationClick(n: Notification) {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(c - 1, 0));
      fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => null);
    }
    setOpen(false);
    if (n.link) window.location.href = n.link;
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label="Notifications" onClick={openDropdown} className="relative">
        <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M5 8C5 5.2 7.2 3 10 3C12.8 3 15 5.2 15 8V11.5L16.5 14H3.5L5 11.5V8Z"
            stroke="#3A4557"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8 16.5C8.3 17.3 9.1 18 10 18C10.9 18 11.7 17.3 12 16.5" stroke="#3A4557" strokeWidth="1.4" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-[3px] flex items-center justify-center bg-red-600 text-white text-[9px] font-bold rounded-full border border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-line rounded-[var(--radius)] shadow-xl z-50 max-h-[420px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line flex-shrink-0">
            <span className="text-[13.5px] font-bold text-ink">Notifications</span>
            {items.some((n) => !n.isRead) ? (
              <button type="button" onClick={markAllRead} className="text-[12px] font-semibold text-[#8A6D2E] hover:underline">
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-slate-400">
                {loaded ? "No notifications yet." : "Loading…"}
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex gap-2.5 ${!n.isRead ? "bg-amber-50/40" : ""}`}
                >
                  {!n.isRead ? <span className="w-1.5 h-1.5 rounded-full bg-[#B08D3F] mt-1.5 flex-shrink-0" /> : <span className="w-1.5 h-1.5 flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink leading-snug">{n.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
