// Floating Call / WhatsApp popup, bottom-left of every public page — the
// ChatWidget bubble owns the bottom-right corner, so this lives on the
// opposite side rather than competing for the same spot. Renders nothing
// if the admin has turned it off, or if neither a phone nor a WhatsApp
// number is set (Admin → Site Settings → Floating Call / WhatsApp Popup).
export default function FloatingContactButtons({
  phone,
  whatsapp,
  enabled,
}: {
  phone?: string;
  whatsapp?: string;
  enabled: boolean;
}) {
  if (!enabled) return null;
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}` : null;
  if (!telHref && !waHref) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          title="Chat on WhatsApp"
          className="w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center text-white hover:brightness-105 transition"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.36a9.85 9.85 0 0 0 4.62 1.15h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.1c-.24.68-1.4 1.3-1.94 1.38-.49.08-1.11.11-1.79-.11a16.3 16.3 0 0 1-1.83-.68c-3.22-1.39-5.32-4.62-5.48-4.84-.16-.22-1.31-1.74-1.31-3.32s.83-2.35 1.13-2.67c.29-.32.63-.4.85-.4.21 0 .43 0 .61.01.2.01.46-.08.72.55.27.65.92 2.24.99 2.4.08.16.13.35.02.57-.1.22-.16.35-.31.54-.16.19-.33.42-.47.56-.16.16-.32.33-.14.65.19.32.84 1.38 1.8 2.24 1.24 1.1 2.28 1.45 2.6 1.61.32.16.51.14.7-.08.19-.22.81-.95 1.02-1.27.22-.32.43-.27.72-.16.29.11 1.85.87 2.16 1.03.32.16.52.24.6.37.08.14.08.79-.16 1.47Z" />
          </svg>
        </a>
      ) : null}
      {telHref ? (
        <a
          href={telHref}
          aria-label="Call us"
          title="Call us"
          className="w-14 h-14 rounded-full bg-navy shadow-lg flex items-center justify-center text-white hover:brightness-110 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
