import { Fragment } from "react";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { createFaqAction, deleteFaqAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";

export default async function AdminChatbotPage({
  searchParams,
}: {
  searchParams: { escalatedOnly?: string };
}) {
  const escalatedOnly = searchParams.escalatedOnly === "1";
  const [convRes, faqRes] = await Promise.all([
    adminFetch(`/chatbot/admin/conversations${escalatedOnly ? "?escalatedOnly=true" : ""}`),
    adminFetch("/chatbot/admin/faqs"),
  ]);
  if (convRes.status === 401) redirect("/admin/login");
  const conversations: any[] = convRes.ok ? await convRes.json() : [];
  const faqs: any[] = faqRes.ok ? await faqRes.json() : [];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Chatbot</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Every visitor conversation with the site's chat widget, and the FAQ knowledge base it answers from. When a
        visitor asks to talk to a person and leaves their name and email, that shows here with a Lead created in the
        CRM automatically.
      </p>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-ink">Conversations</h2>
        <div className="flex gap-4 text-[12.5px] font-semibold">
          <a href="/admin/chatbot" className={!escalatedOnly ? "text-ink underline" : "text-slate-400"}>
            All
          </a>
          <a href="/admin/chatbot?escalatedOnly=1" className={escalatedOnly ? "text-ink underline" : "text-slate-400"}>
            Asked for a person
          </a>
        </div>
      </div>

      <div className="bg-white border border-line overflow-x-auto mb-10">
        {conversations.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">
            No conversations yet — they'll appear here once a visitor uses the chat widget on the public site.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Who asked</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Started</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Messages</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <Fragment key={c.id}>
                  <tr className="border-t border-slate-100">
                    <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">
                      {c.lead ? (
                        <>
                          {c.lead.name}
                          <div className="text-[12px] text-slate-400 font-normal">{c.lead.email}</div>
                        </>
                      ) : (
                        <span className="text-slate-400 font-normal">Anonymous visitor</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-muted">{new Date(c.startedAt).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-[13px] text-muted">{c.messages?.length ?? 0}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          c.escalated ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {c.escalated ? "Asked for a person" : "Self-served"}
                      </span>
                    </td>
                  </tr>
                  {c.messages && c.messages.length > 0 ? (
                    <tr className="border-t border-slate-50">
                      <td colSpan={4} className="px-6 pb-4">
                        <details>
                          <summary className="text-[12.5px] font-semibold text-ink cursor-pointer">
                            View transcript
                          </summary>
                          <div className="mt-2.5 flex flex-col gap-1.5 max-w-xl">
                            {c.messages.map((m: any) => (
                              <div key={m.id} className="text-[12.5px] leading-relaxed">
                                <span className="font-semibold text-slate-500">
                                  {m.role === "USER" ? "Visitor" : m.role === "AGENT" ? "Agent" : "Bot"}:
                                </span>{" "}
                                <span className="text-ink">{m.content}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="text-[15px] font-bold text-ink mb-4">FAQ Knowledge Base</h2>
      <p className="text-[13px] text-slate-500 mb-4 max-w-2xl">
        The chatbot also answers from your Services, Insights and Team pages automatically — these FAQs are for
        questions that don't map neatly to a specific page (pricing approach, working hours, engagement process).
      </p>

      <div className="bg-white border border-line mb-8">
        {faqs.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">No FAQs yet — add the first one below.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Question</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Answer</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => {
                const en = f.translations?.find((t: any) => t.languageCode === "en") ?? f.translations?.[0];
                return (
                  <tr key={f.id} className="border-t border-slate-100">
                    <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium max-w-xs">{en?.question}</td>
                    <td className="px-6 py-3.5 text-[13px] text-muted max-w-sm truncate">{en?.answer}</td>
                    <td className="px-6 py-3.5 text-right">
                      <form action={deleteFaqAction.bind(null, f.id)}>
                        <button type="submit" className="text-[12px] font-semibold text-red-700">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-line p-6 max-w-xl">
        <h3 className="text-[13px] font-bold text-ink mb-3">Add an FAQ</h3>
        <form action={createFaqAction} className="flex flex-col gap-3.5">
          <div>
            <FieldLabel htmlFor="question" hint="What a visitor might type into the chat widget.">Question</FieldLabel>
            <input id="question" name="question" required maxLength={300} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="answer" hint="The chatbot's reply when it matches this question.">Answer</FieldLabel>
            <textarea id="answer" name="answer" required rows={3} maxLength={2000} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="category" hint="Optional — for your own organization only.">Category (optional)</FieldLabel>
            <input id="category" name="category" maxLength={80} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--btn-radius)] self-start">
            Add FAQ
          </button>
        </form>
      </div>
    </div>
  );
}
