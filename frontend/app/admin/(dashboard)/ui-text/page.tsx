import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateUiStringsAction } from "@/lib/admin-actions";
import { uiStrings as defaultUiStrings } from "@/lib/content";
import FieldLabel from "@/components/admin/FieldLabel";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";
const btnCls = "mt-2 bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)] self-start";
const cardCls = "bg-white border border-line p-6 max-w-3xl flex flex-col gap-4";

function Field({ name, label, hint, defaultValue }: { name: string; label: string; hint: string; defaultValue: string }) {
  return (
    <div>
      <FieldLabel htmlFor={name} hint={hint}>
        {label}
      </FieldLabel>
      <input id={name} name={name} type="text" defaultValue={defaultValue} maxLength={300} className={inputCls} />
    </div>
  );
}

function Lines({ name, label, hint, defaultValue }: { name: string; label: string; hint: string; defaultValue: string[] }) {
  return (
    <div>
      <FieldLabel htmlFor={name} hint={hint}>
        {label}
      </FieldLabel>
      <textarea
        id={name}
        name={name}
        rows={Math.max(2, defaultValue.length)}
        defaultValue={defaultValue.join("\n")}
        className={`${inputCls} font-mono text-[13px]`}
      />
      <p className="text-[11.5px] text-slate-400 mt-1">One reply per line — the bot picks one at random each time.</p>
    </div>
  );
}

export default async function AdminUiTextPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const res = await adminFetch("/content/global/en");
  if (res.status === 401) redirect("/admin/login");
  const content: any = res.ok ? await res.json() : {};
  const saved = content.uiStrings ?? {};
  const cf = { ...defaultUiStrings.contactForm, ...(saved.contactForm ?? {}) };
  const cb = { ...defaultUiStrings.chatbot, ...(saved.chatbot ?? {}) };
  const st = { ...defaultUiStrings.chatbot.smallTalk, ...(saved.chatbot?.smallTalk ?? {}) };

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">UI Text</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Interface wording that isn&rsquo;t page content — the Contact form&rsquo;s field labels and the chat widget&rsquo;s
        buttons, placeholders, and canned replies. Edit English here; run &ldquo;Translate Everything Now&rdquo; on the{" "}
        <a href="/admin/translate-settings" className="underline">
          Translate Settings
        </a>{" "}
        page to translate it into every other language.
      </p>

      {searchParams.saved ? (
        <div className="bg-paper-2 border border-line px-5 py-3 mb-6 max-w-3xl text-[13.5px] text-ink">Saved.</div>
      ) : null}

      <form action={updateUiStringsAction} className="flex flex-col gap-6">
        <div className={cardCls}>
          <h2 className="text-[15px] font-bold text-ink -mb-1">Contact Form</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field name="cf_fullNameLabel" label="Full Name — field label" hint="Label above the visitor's name field." defaultValue={cf.fullNameLabel} />
            <Field name="cf_companyLabel" label="Company — field label" hint="Label above the company field." defaultValue={cf.companyLabel} />
            <Field name="cf_emailLabel" label="Email — field label" hint="Label above the email field." defaultValue={cf.emailLabel} />
            <Field name="cf_phoneLabel" label="Phone — field label" hint="Label above the phone field." defaultValue={cf.phoneLabel} />
            <Field name="cf_optionalSuffix" label={'"(optional)" suffix'} hint="Shown next to Phone and Service, which aren't required." defaultValue={cf.optionalSuffix} />
            <Field name="cf_serviceLabel" label="Service of Interest — field label" hint="Label above the service dropdown." defaultValue={cf.serviceLabel} />
            <Field name="cf_servicePlaceholder" label="Service field placeholder" hint="Greyed-out hint text before the visitor types." defaultValue={cf.servicePlaceholder} />
            <Field name="cf_serviceOtherOption" label={'"Other" option'} hint="Fallback option in the service dropdown." defaultValue={cf.serviceOtherOption} />
            <Field name="cf_messageLabel" label="Message — field label" hint="Label above the message textarea." defaultValue={cf.messageLabel} />
            <Field name="cf_submitButton" label="Submit button" hint="Text on the form's submit button." defaultValue={cf.submitButton} />
            <Field name="cf_officesHeading" label={'"Our Offices" heading'} hint="Heading above the office list next to the form." defaultValue={cf.officesHeading} />
          </div>
          <button type="submit" className={btnCls}>
            Save UI Text
          </button>
        </div>

        <div className={cardCls}>
          <h2 className="text-[15px] font-bold text-ink -mb-1">Chat Widget</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field name="cb_headerTitle" label="Header title" hint="Title bar text when the chat window is open." defaultValue={cb.headerTitle} />
            <Field name="cb_closeAriaLabel" label="Close button (accessibility label)" hint="Read by screen readers for the close (×) control." defaultValue={cb.closeAriaLabel} />
            <Field name="cb_openAriaLabel" label="Open button (accessibility label)" hint="Read by screen readers for the launcher button when closed." defaultValue={cb.openAriaLabel} />
            <Field name="cb_greeting" label="Opening greeting" hint="Shown before the visitor's first message." defaultValue={cb.greeting} />
            <Field name="cb_talkToPersonLabel" label={'"Talk to a person" link'} hint="Link offered after the bot's first reply." defaultValue={cb.talkToPersonLabel} />
            <Field name="cb_handoffPrompt" label="Handoff form intro" hint="Shown above the name/email form when a visitor asks for a person." defaultValue={cb.handoffPrompt} />
            <Field name="cb_namePlaceholder" label="Name field placeholder" hint="Placeholder in the handoff form's name field." defaultValue={cb.namePlaceholder} />
            <Field name="cb_emailPlaceholder" label="Email field placeholder" hint="Placeholder in the handoff form's email field." defaultValue={cb.emailPlaceholder} />
            <Field name="cb_sendingLabel" label="Submitting label" hint="Button text while the handoff form is submitting." defaultValue={cb.sendingLabel} />
            <Field name="cb_sendToTeamButton" label="Handoff submit button" hint="Button text before submitting the handoff form." defaultValue={cb.sendToTeamButton} />
            <Field name="cb_handoffThanksMessage" label="Handoff success message" hint="Shown after the handoff form is submitted successfully." defaultValue={cb.handoffThanksMessage} />
            <Field name="cb_inputPlaceholder" label="Message input placeholder" hint="Placeholder in the main chat text box." defaultValue={cb.inputPlaceholder} />
            <Field name="cb_sendButton" label="Send button" hint="Button text next to the chat input." defaultValue={cb.sendButton} />
            <Field name="cb_nameRequiredError" label={'"Name required" error'} hint="Shown if the handoff form's name is left blank." defaultValue={cb.nameRequiredError} />
            <Field name="cb_emailInvalidError" label={'"Invalid email" error'} hint="Shown if the handoff form's email isn't valid." defaultValue={cb.emailInvalidError} />
            <Field name="cb_connectionErrorMessage" label="Connection error message" hint="Shown if the handoff form fails to send." defaultValue={cb.connectionErrorMessage} />
            <Field name="cb_learnMoreLinkLabel" label={'"Learn more" link label'} hint="Default link text under a bot reply that points to a page." defaultValue={cb.learnMoreLinkLabel} />
          </div>
          <Field name="cb_noAnswerFallback" label={"\"I don't know\" fallback reply"} hint="Shown when nothing on the site matches the visitor's question." defaultValue={cb.noAnswerFallback} />
          <button type="submit" className={btnCls}>
            Save UI Text
          </button>
        </div>

        <div className={cardCls}>
          <h2 className="text-[15px] font-bold text-ink -mb-1">Chat Widget — Small Talk Replies</h2>
          <p className="text-[12.5px] text-slate-400 -mt-2">
            Casual messages (a greeting, &ldquo;thanks&rdquo;, &ldquo;bye&rdquo;, rudeness) are answered from these lists
            instead of searching the site&rsquo;s content.
          </p>
          <Lines name="st_greeting" label="Greeting replies" hint="Used when a visitor opens with hi/hello/hey/etc." defaultValue={st.greeting} />
          <Lines name="st_thanks" label={'"Thanks" replies'} hint="Used when a visitor says thanks/thank you/cheers." defaultValue={st.thanks} />
          <Lines name="st_farewell" label="Farewell replies" hint="Used when a visitor says bye/goodbye/see you/etc." defaultValue={st.farewell} />
          <Lines name="st_howAreYou" label={'"How are you" replies'} hint="Used when a visitor asks how the bot is doing." defaultValue={st.howAreYou} />
          <Lines name="st_ack" label="Acknowledgement replies" hint="Used when a visitor says ok/cool/got it/etc." defaultValue={st.ack} />
          <Lines name="st_profanity" label="Rude/profane message replies" hint="A calm, professional redirect — never repeats what was said." defaultValue={st.profanity} />
          <button type="submit" className={btnCls}>
            Save UI Text
          </button>
        </div>
      </form>
    </div>
  );
}
