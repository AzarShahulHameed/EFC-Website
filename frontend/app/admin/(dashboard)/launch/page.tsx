import { adminFetch } from "@/lib/session";
import { redirect } from "next/navigation";
import { updateLaunchGateAction } from "@/lib/admin-actions";
import { launchGateContent as defaultLaunchGate } from "@/lib/content";
import FieldLabel from "@/components/admin/FieldLabel";
import ColorField from "@/components/admin/ColorField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import LaunchDateTimeField from "@/components/admin/LaunchDateTimeField";

export default async function AdminLaunchPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const res = await adminFetch("/content/global/en");
  if (res.status === 401) redirect("/admin/login");
  const content: any = res.ok ? await res.json() : {};
  const launch = { ...defaultLaunchGate, ...(content.launchGate ?? {}) };

  // <input type="datetime-local"> has no time zone of its own — it shows
  // and edits whatever's typed as plain local wall-clock time with no
  // offset attached. To pre-fill it with the saved UTC `launchAt`
  // correctly IN THE ADMIN'S OWN BROWSER's time zone (not the server's),
  // the conversion has to happen client-side — see the inline script
  // below, which also writes the browser's UTC offset into a hidden field
  // so the server action can convert back to an unambiguous instant.
  const petalColors = launch.petalColors.length > 0 ? launch.petalColors : defaultLaunchGate.petalColors;

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Launch Countdown</h1>
      <p className="text-[13.5px] text-slate-500 mb-7 max-w-2xl">
        While turned on, every visitor sees only this countdown screen — no header, footer or page content —
        until the launch time below passes. It then switches to the real site on its own; nothing to remember to
        turn off at the exact moment. Always preview the current look before turning it on for everyone.
      </p>

      {searchParams.saved ? (
        <div className="bg-slate-50 border border-line px-5 py-3 mb-6 text-[13.5px] text-ink max-w-2xl">
          Saved.
        </div>
      ) : null}
      {searchParams.error ? (
        <div className="bg-red-50 border border-red-200 px-5 py-3 mb-6 text-[13.5px] text-red-700 max-w-2xl">
          {searchParams.error}
        </div>
      ) : null}

      <div className="flex items-center gap-3 mb-6">
        <a
          href="/admin/launch-preview"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-navy text-white font-semibold text-[13.5px] px-5 py-3 rounded-[var(--radius)]"
        >
          Preview current look &rarr;
        </a>
        <span className="text-[12.5px] text-slate-500">
          Opens in a new tab. Shows the countdown exactly as configured below, whether or not it's turned on yet.
        </span>
      </div>

      <form
        action={updateLaunchGateAction}
        encType="multipart/form-data"
        className="bg-white border border-line p-6 max-w-2xl flex flex-col gap-5"
        id="launch-form"
      >
        <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
          <input type="checkbox" name="enabled" value="1" defaultChecked={launch.enabled} className="w-4 h-4" />
          Show the countdown to every visitor (master switch)
        </label>

        <LaunchDateTimeField savedLaunchAt={launch.launchAt} />

        <div className="grid grid-cols-2 gap-4">
          <ImageUploadField
            id="lg2-logo"
            label="Logo"
            hint="Optional — replaces the default lettermark circle. Uploaded to Cloudinary."
            fileFieldName="logo"
            existingUrlFieldName="existingLogoUrl"
            currentUrl={launch.logoUrl}
          />
          <div>
            <FieldLabel htmlFor="crestLetter" hint="Shown inside the circular lettermark when no logo is uploaded.">
              Lettermark (Fallback)
            </FieldLabel>
            <input
              id="crestLetter"
              name="crestLetter"
              maxLength={3}
              defaultValue={launch.crestLetter}
              className="w-full border border-line px-3.5 py-2.5 text-[14px] max-w-[120px]"
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="headline" hint="Main line shown above the countdown.">Headline</FieldLabel>
          <input id="headline" name="headline" defaultValue={launch.headline} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <div>
          <FieldLabel htmlFor="subtext" hint="Smaller supporting line under the countdown.">Subtext</FieldLabel>
          <input id="subtext" name="subtext" defaultValue={launch.subtext} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="backgroundColor" hint="Full-screen background color behind the countdown.">Background Color</FieldLabel>
            <ColorField id="backgroundColor" name="backgroundColor" defaultValue={launch.backgroundColor} />
          </div>
          <div>
            <FieldLabel htmlFor="accentColor" hint="Color of the numbers, lettermark border and clock digits.">Accent Color</FieldLabel>
            <ColorField id="accentColor" name="accentColor" defaultValue={launch.accentColor} />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink mb-3">
            <input type="checkbox" name="enableBlossom" value="1" defaultChecked={launch.enableBlossom} className="w-4 h-4" />
            Play a "blossom blast" burst the moment the countdown reaches zero
          </label>
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <FieldLabel htmlFor={`petalColor${i}`} hint="One of the colors used for the burst.">
                  {`Petal Color ${i + 1}`}
                </FieldLabel>
                <ColorField id={`petalColor${i}`} name={`petalColor${i}`} defaultValue={petalColors[i] ?? defaultLaunchGate.petalColors[i]} />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
          Save Launch Countdown
        </button>
      </form>
    </div>
  );
}
