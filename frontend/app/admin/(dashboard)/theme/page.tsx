import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateThemeAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import ColorField from "@/components/admin/ColorField";

export default async function AdminThemePage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const res = await adminFetch("/theme");
  if (res.status === 401) redirect("/admin/login");
  const tokens: any = res.ok
    ? await res.json()
    : {
        primaryColor: "#0A1B33",
        secondaryColor: "#B08D3F",
        accentColor: "#B08D3F",
        backgroundColor: "#FBFAF7",
        headerColor: "",
        footerColor: "",
        typography: { headingFont: "Spectral", bodyFont: "Public Sans", headingColor: "", bodyColor: "" },
        buttonStyle: "sharp",
        cardStyle: "bordered",
        borderRadius: "2px",
      };

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Theme Builder</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Every field below is live on the public site — colors, fonts, border radius, button style and card style all
        take effect immediately after you save, with no code changes or redeploy. Header/footer text automatically
        switches between light and dark so it stays readable, whatever color you pick.
      </p>


      <form action={updateThemeAction} className="bg-white border border-line p-6 max-w-2xl flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <FieldLabel htmlFor="primaryColor" hint="Click the swatch to pick visually, or type a hex code. Used for the header, footer and dark section backgrounds.">Primary Color</FieldLabel>
            <ColorField id="primaryColor" name="primaryColor" defaultValue={tokens.primaryColor} />
          </div>
          <div>
            <FieldLabel htmlFor="secondaryColor" hint="Click the swatch to pick visually, or type a hex code. Used for secondary UI elements alongside the accent color.">Secondary Color</FieldLabel>
            <ColorField id="secondaryColor" name="secondaryColor" defaultValue={tokens.secondaryColor} />
          </div>
          <div>
            <FieldLabel htmlFor="accentColor" hint="Click the swatch to pick visually, or type a hex code. Used for buttons, links, and highlighted numbers/stats.">Accent Color</FieldLabel>
            <ColorField id="accentColor" name="accentColor" defaultValue={tokens.accentColor} />
          </div>
          <div>
            <FieldLabel htmlFor="backgroundColor" hint="Click the swatch to pick visually, or type a hex code. The page's base background, behind all content.">Background Color</FieldLabel>
            <ColorField id="backgroundColor" name="backgroundColor" defaultValue={tokens.backgroundColor} />
          </div>
          <div>
            <FieldLabel htmlFor="headerColor" hint="Optional — leave blank to use Primary Color (the previous, single-color behavior). Set this to give the header a background color independent of the footer and the rest of the site.">Header Color</FieldLabel>
            <ColorField id="headerColor" name="headerColor" defaultValue={tokens.headerColor ?? ""} allowEmpty emptyPlaceholderColor={tokens.primaryColor || "#0A1B33"} />
          </div>
          <div>
            <FieldLabel htmlFor="footerColor" hint="Optional — leave blank to use Primary Color. Set this to give the footer a background color independent of the header.">Footer Color</FieldLabel>
            <ColorField id="footerColor" name="footerColor" defaultValue={tokens.footerColor ?? ""} allowEmpty emptyPlaceholderColor={tokens.primaryColor || "#0A1B33"} />
          </div>
          <div>
            <FieldLabel htmlFor="headingFont" hint="Google Fonts family name used for headings, e.g. 'Spectral'.">Heading Font</FieldLabel>
            <input id="headingFont" name="headingFont" defaultValue={tokens.typography?.headingFont} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="bodyFont" hint="Google Fonts family name used for paragraph text, e.g. 'Public Sans'.">Body Font</FieldLabel>
            <input id="bodyFont" name="bodyFont" defaultValue={tokens.typography?.bodyFont} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="headingColor" hint="Optional — leave blank to keep the built-in default heading color. Applies to every heading site-wide.">Heading Text Color</FieldLabel>
            <ColorField id="headingColor" name="headingColor" defaultValue={tokens.typography?.headingColor ?? ""} allowEmpty emptyPlaceholderColor="#10203A" />
          </div>
          <div>
            <FieldLabel htmlFor="bodyColor" hint="Optional — leave blank to keep the built-in default body text color. Applies to paragraph/muted text site-wide.">Body Text Color</FieldLabel>
            <ColorField id="bodyColor" name="bodyColor" defaultValue={tokens.typography?.bodyColor ?? ""} allowEmpty emptyPlaceholderColor="#5C6A7C" />
          </div>
          <div>
            <FieldLabel htmlFor="buttonStyle" hint="Corner style applied to buttons site-wide.">Button Style</FieldLabel>
            <select id="buttonStyle" name="buttonStyle" defaultValue={tokens.buttonStyle} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="sharp">Sharp</option>
              <option value="rounded">Rounded</option>
              <option value="pill">Pill</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="cardStyle" hint="Visual treatment applied to content cards site-wide.">Card Style</FieldLabel>
            <select id="cardStyle" name="cardStyle" defaultValue={tokens.cardStyle} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="bordered">Bordered</option>
              <option value="shadowed">Shadowed</option>
              <option value="flat">Flat</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="borderRadius" hint="How rounded corners look on general elements like input fields and panels site-wide.">Corner Roundness</FieldLabel>
            <select
              id="borderRadius"
              name="borderRadius"
              defaultValue={["0px", "2px", "6px", "12px", "20px"].includes(tokens.borderRadius) ? tokens.borderRadius : "2px"}
              className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white"
            >
              <option value="0px">Square</option>
              <option value="2px">Barely rounded</option>
              <option value="6px">Softly rounded</option>
              <option value="12px">Rounded</option>
              <option value="20px">Very rounded</option>
            </select>
          </div>
        </div>
        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
          Save Theme
        </button>
      </form>
    </div>
  );
}
