"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isValidEmail } from "@/lib/validation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Faq = { id: string; category?: string | null; question?: string; answer?: string };
type ChatEntry = { role: "USER" | "BOT" | "AGENT"; content: string; href?: string; hrefLabel?: string };

// One searchable "document" the bot can answer from — an FAQ's Q&A, a
// service's title+summary, an insight article's title+excerpt, or a team
// member's name+position. Unifying these into one shape lets a single
// matching pass search across all of them instead of only the curated FAQ
// list, so "do you handle payroll" or "who's your VAT partner" can be
// answered even when nobody wrote an FAQ for it.
type Doc = {
  // The doc's short identifying text — an FAQ's question, a service/insight
  // title, a team member's name, a branch's city. Kept separate from
  // `keywords` (the full flattened title+body bag) so bestMatch() can weigh
  // a query word landing here far more than one merely buried in a long
  // summary — see bestMatch()'s comment.
  title: string;
  keywords: string;
  reply: string;
  href?: string;
  hrefLabel?: string;
  // FAQs are the one doc type admins deliberately curate for this chatbot
  // (see /admin/chatbot's own copy) — everything else is repurposed site
  // content the bot searches as a fallback, so a close/tied score should
  // still prefer the FAQ.
  isFaq?: boolean;
};

// A single random session id, kept for the lifetime of the tab — this is
// the only "identity" a visitor has here (see the API's ChatConversation
// model: sessionId is the key, nothing personally identifying is required
// to chat). Generated once on mount, not persisted across reloads.
function newSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Common filler words that survive the old ">2 chars" filter (e.g. "you",
// "the", "and", "for", "are") but carry no topic meaning — left in, they
// inflated every document's score roughly equally, which both let weak,
// off-topic matches slip past the "score > 0" bar and diluted how much a
// genuinely on-topic word (e.g. "audit", "vat", "deadline") counted for.
const STOPWORDS = new Set([
  "the", "and", "for", "are", "you", "your", "our", "with", "have", "has",
  "had", "can", "could", "would", "should", "will", "shall", "does", "did",
  "about", "what", "when", "where", "which", "who", "how", "why", "this",
  "that", "these", "those", "from", "into", "than", "then", "them", "they",
  "not", "but", "all", "any", "some", "just", "like", "also", "get", "got",
  "please", "thanks", "thank", "hello", "hey", "hi", "want", "need", "know",
  "tell", "give", "let", "out", "there", "here",
]);

// A handful of common synonym/phrasing clusters an audit/tax/advisory firm's
// visitors actually type, mapped to the one term the site's own content
// (FAQs, service names) is written in — so "how much do you charge" still
// matches a document whose text says "fees"/"pricing", instead of scoring
// zero just because the visitor's word choice differed from the admin's.
const SYNONYMS: Record<string, string> = {
  cost: "fee", costs: "fee", price: "fee", pricing: "fee", charge: "fee", charges: "fee",
  fees: "fee",
  phone: "contact", call: "contact", email: "contact", reach: "contact", speak: "contact",
  talk: "contact",
  hours: "timing", timing: "timing", open: "timing", schedule: "timing",
  located: "location", address: "location", office: "location", branch: "location",
  branches: "location", locations: "location",
  register: "setup", registration: "setup", incorporate: "setup", incorporation: "setup",
  setup: "setup", establish: "setup", formation: "setup",
  deadline: "deadline", deadlines: "deadline", due: "deadline",
};

function normalizeWord(word: string): string {
  const base = word.length > 4 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
  return SYNONYMS[base] ?? base;
}

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map(normalizeWord);
}

// Small keyword-match "bot": scores each document by how many significant
// words it shares with the visitor's message, and answers with the best
// match above a minimum bar. This is intentionally simple, not an LLM —
// the backend only stores/logs messages and content (see
// chatbot.controller.ts, services.controller.ts, etc.), it doesn't
// generate replies — so the matching has to happen here, client-side,
// across whatever site content was fetched in. Anything it can't match
// falls back to offering a human handoff.
// Plain greetings ("hi", "hello", "hey there", "good morning"...) are all
// short — every significant word in them is 2 letters or fewer ("hi", "hey")
// or is filtered out entirely — so `bestMatch` below always returned no
// match for one, and the bot fell straight through to its generic
// "I couldn't find anything... talk to a member of our team instead?"
// fallback. That read exactly like the reported bug: say "Hi" and the bot
// skips straight past any greeting to pushing a human handoff / lead-detail
// capture, instead of acting like an assistant that just said hello back.
// Recognizing greetings as their own case fixes that without needing a real
// LLM — a warm, natural opener, then let the visitor say what they need.
const GREETING_PATTERN =
  /^\s*(hi+|hello+|hey+|yo|sup|howdy|good\s*(morning|afternoon|evening)|greetings|salaam|assalamu\s*alaikum)[\s!.,?]*$/i;

function isGreeting(message: string): boolean {
  return GREETING_PATTERN.test(message.trim());
}

// A bare `score > 0` used to accept a single, possibly-coincidental shared
// word as a confident answer (e.g. one throwaway word in common with a
// totally unrelated FAQ) — which is exactly what made replies feel like
// random keyword soup instead of an assistant that understands the
// question. Requiring the match to cover a real share of the visitor's own
// words (not just an absolute count) means a short, precise question still
// matches easily, while a long message only picks a document that's
// actually about most of what was asked, not just one word of it.
const MIN_MATCH_SCORE = 1;
const MIN_MATCH_RATIO = 0.34;

// Standard Levenshtein edit distance (insert/delete/substitute), used to
// tolerate typos ("servises", "acounting", "detuctible") without needing an
// exact-word match — previously ANY misspelling of the one word that
// actually mattered in a message meant zero score, since matching was
// plain string equality. Early-exits once the running minimum in a row
// already exceeds the max we'd accept, which keeps this cheap even though
// it runs for every word pair being compared.
function levenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = i;
    const curr = new Array(b.length + 1);
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

// How many typo'd characters a word of a given length still counts as a
// match for — short words get zero tolerance (too easy to accidentally
// collide with a different real word, e.g. "tax" vs "tag"), longer words
// get a little more room since a word that long having a coincidental
// near-miss to a totally different word is much less likely.
function typoBudget(length: number): number {
  if (length <= 4) return 0;
  if (length <= 7) return 1;
  return 2;
}

// True if `word` matches anything in `docWords` exactly, OR is within its
// typo budget of one of them — checked in that order so the common case
// (exact match) never pays for the distance computation.
function fuzzyIncludes(word: string, docWords: string[]): boolean {
  const budget = typoBudget(word.length);
  for (const dw of docWords) {
    if (dw === word) return true;
  }
  if (budget === 0) return false;
  for (const dw of docWords) {
    if (levenshtein(word, dw, budget) <= budget) return true;
  }
  return false;
}

// A query word landing in a doc's *title* (the service name, the FAQ
// question, the team member's name...) means the doc is actually about that
// word — a word only found somewhere in a long summary/body might just be
// mentioned in passing (e.g. a VAT service's summary that happens to say
// "...handle FTA audit requirements..."). Weighting title hits well above
// body hits is what lets "Audit Services" (title match) beat that VAT doc
// (body-only match) for the query "audit".
const TITLE_MATCH_WEIGHT = 3;
const BODY_MATCH_WEIGHT = 1;

// Admin-curated FAQs are the one doc type deliberately written to be matched
// by this bot (per /admin/chatbot's own copy) — when a Service/Insight/Team/
// Branch doc only edges out an FAQ by a sliver, prefer the FAQ.
const FAQ_SCORE_BOOST = 1.2;

function bestMatch(message: string, docs: Doc[]): Doc | null {
  const words = significantWords(message);
  if (words.length === 0) return null;

  let best: { doc: Doc; score: number; matchCount: number } | null = null;
  for (const doc of docs) {
    const titleWords = significantWords(doc.title);
    const bodyWords = significantWords(doc.keywords);

    let matchCount = 0;
    let weightedScore = 0;
    for (const w of words) {
      if (fuzzyIncludes(w, titleWords)) {
        matchCount++;
        weightedScore += TITLE_MATCH_WEIGHT;
      } else if (fuzzyIncludes(w, bodyWords)) {
        matchCount++;
        weightedScore += BODY_MATCH_WEIGHT;
      }
    }
    if (matchCount === 0) continue;

    // Normalize by the size of the doc's keyword bag: a word hit inside a
    // short, on-topic doc counts for more than the same hit inside a long,
    // generic one that just happens to mention it once. Square root (rather
    // than a straight divide) keeps this a gentle penalty, not one that lets
    // a huge doc's raw weighted score collapse to near zero.
    const specificity = weightedScore / Math.sqrt(Math.max(bodyWords.length, 1));
    const score = doc.isFaq ? specificity * FAQ_SCORE_BOOST : specificity;

    if (!best || score > best.score) best = { doc, score, matchCount };
  }
  if (!best) return null;
  // The multi-word coverage bar stays based on the plain (unweighted) count
  // of query words that matched anywhere in the doc — same semantics as
  // before — so the weighting above only ever affects *which* doc wins, not
  // whether a match is accepted at all.
  const ratio = best.matchCount / words.length;
  if (best.matchCount < MIN_MATCH_SCORE || ratio < MIN_MATCH_RATIO) return null;
  return best.doc;
}

// --- Small talk & tone: greetings, thanks, farewells, "how are you", and a
// calm, professional redirect for rude/profane input — all handled before
// falling through to document matching, so the bot always feels like it's
// actually listening rather than only ever doing an FAQ lookup. Kept as
// plain pattern checks (no LLM in this deployment), but covering the full
// shape of a normal short conversation, not just the opening "hi". ---

// These match on the message's *opening words*, not the whole string, so
// "thanks a lot!", "ok cool, one more question", or "bye for now" are still
// recognized — the earlier versions required the entire trimmed message to
// be nothing but the phrase itself, which missed almost any small-talk
// message with even one extra word tacked on.
const THANKS_PATTERN = /^\s*(thanks?( you)?|thank you( very much| so much)?|cheers|appreciate it|ty)\b/i;
const FAREWELL_PATTERN = /^\s*(bye|goodbye|see ya|see you( later)?|good\s*night|take care)\b/i;
const HOW_ARE_YOU_PATTERN = /how('?s| is| are)?\s*(you|it going|things)/i;
const ACK_PATTERN = /^\s*(ok(ay)?|k|cool|great|got it|sure|alright|fine|nice|sounds good|perfect)[\s!.,?]*$/i;

// Deliberately a short, unambiguous list — the goal is to catch outright
// abuse/rudeness directed at the bot, not to police borderline words
// elsewhere in a message, since a false positive here (treating an
// ordinary message as profanity) would be far more annoying than the rare
// miss. Bare insults like "stupid"/"useless"/"dumb" are included despite
// being mild in general text, because in a chat widget aimed at the bot
// itself, that's almost always what they mean here. The bot never repeats
// or quotes back whatever triggered this, in either its reasoning or reply.
const PROFANITY_PATTERN = /\b(fuck|shit|bastard|asshole|bitch|bullshit|idiot|stupid|dumb|useless|garbage|crap|pathetic|worthless)\b/i;

function classifySmallTalk(message: string): "greeting" | "thanks" | "farewell" | "how-are-you" | "ack" | "profanity" | null {
  const trimmed = message.trim();
  if (PROFANITY_PATTERN.test(trimmed)) return "profanity";
  if (isGreeting(trimmed)) return "greeting";
  if (THANKS_PATTERN.test(trimmed)) return "thanks";
  if (FAREWELL_PATTERN.test(trimmed)) return "farewell";
  if (HOW_ARE_YOU_PATTERN.test(trimmed)) return "how-are-you";
  if (ACK_PATTERN.test(trimmed)) return "ack";
  return null;
}

// Maps classifySmallTalk()'s kebab-style kind to the matching key in
// `ui.smallTalk` / `DEFAULT_UI_STRINGS.smallTalk` (camelCase, since it's a
// JSON object field name, not a TS union member).
function smallTalkReplies(kind: Exclude<ReturnType<typeof classifySmallTalk>, null>, smallTalk: ChatUiStrings["smallTalk"]): string[] {
  switch (kind) {
    case "greeting":
      return smallTalk.greeting;
    case "thanks":
      return smallTalk.thanks;
    case "farewell":
      return smallTalk.farewell;
    case "how-are-you":
      return smallTalk.howAreYou;
    case "ack":
      return smallTalk.ack;
    case "profanity":
      return smallTalk.profanity;
  }
}

function pickReply(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

// The chat widget's own interface chrome (header, placeholders, buttons,
// small-talk replies) used to be plain English string literals baked
// straight into this file, so it stayed English in every locale even though
// the FAQs/services/etc. it displays were already localized — see
// `uiStrings` in lib/content.ts and `getUiStrings()` in lib/api.ts, the same
// ContentBlock (page="global", section="uiStrings") the Contact form now
// reads server-side. This is a client component, so it fetches the public
// `/content/global/:lang` endpoint directly (same pattern already used
// below for FAQs/services/etc.) rather than importing the server-only
// getUiStrings() helper, and falls back to the English defaults field-by-
// field until that fetch resolves or if a language was never (re)translated.
const DEFAULT_UI_STRINGS = {
  headerTitle: "Chat with us",
  closeAriaLabel: "Close chat",
  openAriaLabel: "Open chat",
  greeting: "Hi! Ask a question about our services, or tap a topic below to get started.",
  talkToPersonLabel: "Talk to a person instead",
  handoffPrompt: "Leave your name and email and a team member will follow up shortly.",
  namePlaceholder: "Your name",
  emailPlaceholder: "Your email",
  sendingLabel: "Sending…",
  sendToTeamButton: "Send to our team",
  handoffThanksMessage: "Thanks — we've got your details and someone will be in touch soon.",
  inputPlaceholder: "Type a message…",
  sendButton: "Send",
  nameRequiredError: "Enter your name.",
  emailInvalidError: "Enter a valid email address.",
  connectionErrorMessage: "Couldn't send that just now — check your connection and try again.",
  learnMoreLinkLabel: "Learn more",
  noAnswerFallback:
    "I don't have specific information on that yet, but I don't want to guess — a member of our team can give you a proper answer. Would you like me to connect you?",
  smallTalk: {
    greeting: [
      "Hello! How can I help you today? Feel free to ask about our services, fees, locations, or anything else about EFC.",
      "Hi there! What can I help you with — a service, our team, or something else?",
    ],
    thanks: [
      "You're very welcome! Is there anything else I can help you with?",
      "Happy to help! Let me know if there's anything else you'd like to know.",
    ],
    farewell: [
      "Thanks for stopping by — feel free to come back anytime you have a question. Have a great day!",
      "Take care! We're here whenever you need us.",
    ],
    howAreYou: ["I'm doing well, thank you for asking! How can I help you today?"],
    ack: [
      "Great — is there anything else I can help you with?",
      "Understood. Let me know if there's anything else on your mind.",
    ],
    profanity: [
      "I'm here to help, and I'd like to keep our conversation professional and respectful. Could you let me know what you're looking for, or I can connect you with a member of our team?",
    ],
  },
};
type ChatUiStrings = typeof DEFAULT_UI_STRINGS;

export default function ChatWidget({ lang }: { lang: string }) {
  const [open, setOpen] = useState(false);
  const [ui, setUi] = useState<ChatUiStrings>(DEFAULT_UI_STRINGS);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const sessionId = useMemo(newSessionId, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || docs.length > 0) return;

    // Pull from every content type a visitor might actually ask about —
    // not just the manually curated FAQ list — so the bot can answer
    // "what services do you offer" or "who's your Dubai audit partner"
    // even when no admin ever wrote a matching FAQ entry.
    Promise.all([
      fetch(`${API_URL}/chatbot/faqs?lang=${lang}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/services?lang=${lang}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/insights?lang=${lang}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/team?lang=${lang}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/branches`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([faqData, servicesData, insightsData, teamData, branchesData]) => {
        const faqList: Faq[] = Array.isArray(faqData) ? faqData : [];
        setFaqs(faqList);

        const faqDocs: Doc[] = faqList
          .filter((f) => f.question && f.answer)
          .map((f) => ({ title: f.question!, keywords: f.question!, reply: f.answer!, isFaq: true }));

        const serviceDocs: Doc[] = (Array.isArray(servicesData) ? servicesData : []).map((s: any) => ({
          title: s.title,
          keywords: `${s.title} ${s.summary ?? ""}`,
          reply: s.summary || s.title,
          href: `/${lang}/services/${s.slug}`,
          hrefLabel: `More on ${s.title}`,
        }));

        const insightDocs: Doc[] = (Array.isArray(insightsData) ? insightsData : []).map((a: any) => ({
          title: a.title,
          keywords: `${a.title} ${a.excerpt ?? ""}`,
          reply: a.excerpt || a.title,
          href: `/${lang}/insights/${a.slug}`,
          hrefLabel: "Read the full article",
        }));

        const teamDocs: Doc[] = (Array.isArray(teamData) ? teamData : []).map((m: any) => ({
          title: m.name,
          keywords: `${m.name} ${m.position ?? ""}`,
          reply: `${m.name} — ${m.position ?? "our team"}. You can reach out via the Contact page and we'll connect you.`,
          href: `/${lang}/team`,
          hrefLabel: "See our team",
        }));

        // Real branch data (address, phone, working hours) so "where are
        // you located", "what are your office hours", or "phone number for
        // Dubai" can be answered directly instead of always falling to a
        // human handoff — these are exactly the kind of practical questions
        // a visitor asks a chat widget first.
        const branchDocs: Doc[] = (Array.isArray(branchesData) ? branchesData : []).map((b: any) => ({
          title: b.city,
          keywords: `${b.city} location address office branch contact phone hours timing ${b.addressLine ?? ""}`,
          reply: `Our ${b.city} office is at ${b.addressLine}. Phone: ${b.phone}${b.email ? ` · Email: ${b.email}` : ""}${
            b.workingHours ? ` · Hours: ${b.workingHours}` : ""
          }`,
          href: `/${lang}/contact`,
          hrefLabel: "See all our locations",
        }));

        setDocs([...faqDocs, ...serviceDocs, ...insightDocs, ...teamDocs, ...branchDocs]);
      })
      .catch(() => {
        setFaqs([]);
        setDocs([]);
      });
  }, [open, lang, docs.length]);

  useEffect(() => {
    // Reads the same ContentBlock the Contact form reads server-side
    // (page="global", section="uiStrings") — see lib/content.ts's
    // `uiStrings` and lib/api.ts's `getUiStrings()`. Runs on every language
    // switch, independent of `open`, so the widget's chrome is already
    // correct the first time it's opened rather than flashing English first.
    fetch(`${API_URL}/content/global/${lang}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const saved = data?.uiStrings?.chatbot;
        if (!saved) return;
        setUi({
          ...DEFAULT_UI_STRINGS,
          ...saved,
          smallTalk: { ...DEFAULT_UI_STRINGS.smallTalk, ...(saved.smallTalk ?? {}) },
        });
      })
      .catch(() => {
        // Keep whatever's already showing (English defaults) — a failed
        // fetch here shouldn't block the widget from working.
      });
  }, [lang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, escalated, leadSent]);

  function logMessage(role: ChatEntry["role"], content: string) {
    fetch(`${API_URL}/chatbot/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, role, content }),
    }).catch(() => {
      // Best-effort logging — never block the conversation on this.
    });
  }

  function send() {
    const message = input.trim();
    if (!message) return;
    setInput("");
    setHistory((h) => [...h, { role: "USER", content: message }]);
    logMessage("USER", message);

    // Small talk (a greeting, "thanks", "bye", profanity, etc.) is handled
    // as its own case before ever attempting a document match — see
    // classifySmallTalk()'s comment. Only once none of those apply does the
    // bot try to actually answer the question from real site content.
    const smallTalk = classifySmallTalk(message);
    const match = smallTalk ? null : bestMatch(message, docs);
    const reply = smallTalk
      ? pickReply(smallTalkReplies(smallTalk, ui.smallTalk))
      : match?.reply
      ? match.reply
      : ui.noAnswerFallback;
    // A short, deliberate delay so the reply doesn't feel like it was
    // already sitting there — this is a scripted content lookup, not a
    // live typing indicator, but an instant reply reads as obviously canned.
    setTimeout(() => {
      setHistory((h) => [...h, { role: "BOT", content: reply, href: match?.href, hrefLabel: match?.hrefLabel }]);
      logMessage("BOT", reply);
    }, 350);
  }

  function requestHuman() {
    setEscalated(true);
  }

  async function submitLeadDetails(e: React.FormEvent) {
    e.preventDefault();
    setLeadError(null);
    if (!leadName.trim() || leadName.trim().length < 2) {
      setLeadError(ui.nameRequiredError);
      return;
    }
    // Previously only checked for a non-empty string, so "asdf" or a typo
    // with no "@" would silently "succeed" (and then, on a fetch failure,
    // the catch block below used to mark it sent anyway) — the exact
    // "not validated, and doesn't say success or failure" bug reported.
    // Now uses the same EMAIL_PATTERN every other form on the site checks
    // against (lib/validation.ts).
    if (!isValidEmail(leadEmail)) {
      setLeadError(ui.emailInvalidError);
      return;
    }
    setLeadSubmitting(true);
    try {
      // A single call: the backend both records who's asking on this
      // conversation (so Admin -> Chatbot -> Conversations shows a name
      // and email, not just "escalated") and creates the matching Lead in
      // the CRM — see chatbot.service.ts's escalate().
      const res = await fetch(`${API_URL}/chatbot/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name: leadName.trim(), email: leadEmail.trim() }),
      });
      if (!res.ok) throw new Error("escalate failed");
      setLeadSent(true);
    } catch {
      // Honest failure now, not a fake "sent" — a visitor who never
      // actually reached the team deserves to know so they can retry or
      // use the contact form/phone number instead.
      setLeadError(ui.connectionErrorMessage);
    } finally {
      setLeadSubmitting(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[340px] max-w-[calc(100vw-2.5rem)] h-[480px] max-h-[70vh] bg-white border border-line rounded-[var(--radius)] shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-navy px-4 py-3.5 flex items-center justify-between flex-shrink-0">
            <div className="text-[13.5px] font-semibold text-[#F2E9D2]">{ui.headerTitle}</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={ui.closeAriaLabel}
              className="text-slate-400 hover:text-white text-[18px] leading-none"
            >
              &times;
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-slate-50">
            {history.length === 0 ? (
              <div className="text-[13px] text-slate-500 leading-relaxed">
                {ui.greeting}
                {faqs.length > 0 ? (
                  <div className="flex flex-col gap-1.5 mt-3">
                    {faqs.slice(0, 4).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setInput(f.question ?? "");
                        }}
                        className="text-left text-[12.5px] bg-white border border-line px-3 py-2 rounded-[var(--radius)] hover:border-ink"
                      >
                        {f.question}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {history.map((entry, i) => (
              <div key={i} className={`flex ${entry.role === "USER" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] text-[13px] leading-relaxed px-3.5 py-2.5 rounded-[var(--radius)] ${
                    entry.role === "USER" ? "bg-gold text-[#1A1204]" : "bg-white border border-line text-ink"
                  }`}
                >
                  {entry.content}
                  {entry.href ? (
                    <a href={entry.href} className="block mt-2 text-[12px] font-semibold underline underline-offset-2">
                      {entry.hrefLabel ?? ui.learnMoreLinkLabel} &rarr;
                    </a>
                  ) : null}
                </div>
              </div>
            ))}

            {history.some((h) => h.role === "BOT") && !escalated && !leadSent ? (
              <button
                type="button"
                onClick={requestHuman}
                className="self-start text-[12px] font-semibold text-ink underline underline-offset-2"
              >
                {ui.talkToPersonLabel}
              </button>
            ) : null}

            {escalated && !leadSent ? (
              <div className="bg-white border border-line rounded-[var(--radius)] p-3.5">
                <div className="text-[12.5px] text-ink mb-2.5">
                  {ui.handoffPrompt}
                </div>
                <form onSubmit={submitLeadDetails} className="flex flex-col gap-2">
                  <input
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder={ui.namePlaceholder}
                    required
                    minLength={2}
                    maxLength={120}
                    className="border border-line px-3 py-2 text-[13px]"
                  />
                  <input
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    type="email"
                    placeholder={ui.emailPlaceholder}
                    required
                    maxLength={254}
                    className="border border-line px-3 py-2 text-[13px]"
                  />
                  {leadError ? (
                    <div className="text-[12px] text-red-600" role="alert">
                      {leadError}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="bg-gold text-[#1A1204] font-semibold text-[12.5px] px-3.5 py-2.5 rounded-[var(--radius)] disabled:opacity-60"
                  >
                    {leadSubmitting ? ui.sendingLabel : ui.sendToTeamButton}
                  </button>
                </form>
              </div>
            ) : null}

            {leadSent ? (
              <div className="text-[12.5px] text-ink bg-white border border-line rounded-[var(--radius)] p-3.5">
                {ui.handoffThanksMessage}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-line px-3 py-3 flex-shrink-0 bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder={ui.inputPlaceholder}
              className="flex-1 border border-line px-3 py-2.5 text-[13.5px] focus:outline-none focus:border-ink"
            />
            <button
              type="submit"
              className="bg-gold text-[#1A1204] font-semibold text-[12.5px] px-4 py-2.5 rounded-[var(--radius)] flex-shrink-0"
            >
              {ui.sendButton}
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? ui.closeAriaLabel : ui.openAriaLabel}
        className="w-14 h-14 rounded-full bg-gold text-[#1A1204] shadow-lg flex items-center justify-center hover:bg-gold-light transition-colors"
      >
        {open ? (
          <span className="text-2xl leading-none">&times;</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12C4 7.58 7.58 4 12 4s8 3.58 8 8-3.58 8-8 8c-1.15 0-2.24-.24-3.23-.68L4 20l1.02-4.31A7.96 7.96 0 0 1 4 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
