// ITU-T E.164 international calling (dial) codes per ISO 3166-1 alpha-2
// country, keyed the same lowercase way as `lib/countries.ts`'s COUNTRIES
// list (which already backs the header's location/language pickers via
// FlagIcon + the `flag-icons` package). This is reference data — the same
// kind of fixed, non-editable list every production site ships for a phone
// country-code selector (like a country list) — not admin-owned content,
// so it lives here as a static table rather than going through the CMS.
//
// Only covers countries that actually have a calling code (a handful of
// COUNTRIES entries — Antarctica, Bouvet Island, etc. — are uninhabited/
// have none and are simply left out here); the phone country picker below
// filters COUNTRIES down to whatever has an entry in this map.
import { COUNTRIES } from "./countries";

export const DIAL_CODES: Record<string, string> = {
  af: "+93", ax: "+358", al: "+355", dz: "+213", as: "+1684", ad: "+376",
  ao: "+244", ai: "+1264", ag: "+1268", ar: "+54", am: "+374", aw: "+297",
  au: "+61", at: "+43", az: "+994", bs: "+1242", bh: "+973", bd: "+880",
  bb: "+1246", by: "+375", be: "+32", bz: "+501", bj: "+229", bm: "+1441",
  bt: "+975", bo: "+591", bq: "+599", ba: "+387", bw: "+267", br: "+55",
  io: "+246", bn: "+673", bg: "+359", bf: "+226", bi: "+257", cv: "+238",
  kh: "+855", cm: "+237", ca: "+1", ky: "+1345", cf: "+236", td: "+235",
  cl: "+56", cn: "+86", cx: "+61", cc: "+61", co: "+57", km: "+269",
  ck: "+682", cr: "+506", hr: "+385", cu: "+53", cw: "+599", cy: "+357",
  cz: "+420", ci: "+225", cd: "+243", dk: "+45", dj: "+253", dm: "+1767",
  do: "+1809", ec: "+593", eg: "+20", sv: "+503", gq: "+240", er: "+291",
  ee: "+372", sz: "+268", et: "+251", fk: "+500", fo: "+298", fm: "+691",
  fj: "+679", fi: "+358", fr: "+33", gf: "+594", pf: "+689", ga: "+241",
  gm: "+220", ge: "+995", de: "+49", gh: "+233", gi: "+350", gr: "+30",
  gl: "+299", gd: "+1473", gp: "+590", gu: "+1671", gt: "+502", gg: "+44",
  gn: "+224", gw: "+245", gy: "+592", ht: "+509", va: "+379", hn: "+504",
  hk: "+852", hu: "+36", is: "+354", in: "+91", id: "+62", ir: "+98",
  iq: "+964", ie: "+353", im: "+44", il: "+972", it: "+39", jm: "+1876",
  jp: "+81", je: "+44", jo: "+962", kz: "+7", ke: "+254", ki: "+686",
  kw: "+965", kg: "+996", la: "+856", lv: "+371", lb: "+961", ls: "+266",
  lr: "+231", ly: "+218", li: "+423", lt: "+370", lu: "+352", mo: "+853",
  mg: "+261", mw: "+265", my: "+60", mv: "+960", ml: "+223", mt: "+356",
  mh: "+692", mq: "+596", mr: "+222", mu: "+230", yt: "+262", mx: "+52",
  md: "+373", mc: "+377", mn: "+976", me: "+382", ms: "+1664", ma: "+212",
  mz: "+258", mm: "+95", na: "+264", nr: "+674", np: "+977", nl: "+31",
  nc: "+687", nz: "+64", ni: "+505", ne: "+227", ng: "+234", nu: "+683",
  nf: "+672", kp: "+850", mk: "+389", mp: "+1670", no: "+47", om: "+968",
  pk: "+92", pw: "+680", pa: "+507", pg: "+675", py: "+595", pe: "+51",
  ph: "+63", pn: "+64", pl: "+48", pt: "+351", pr: "+1787", qa: "+974",
  cg: "+242", ro: "+40", ru: "+7", rw: "+250", re: "+262", bl: "+590",
  sh: "+290", kn: "+1869", lc: "+1758", mf: "+590", pm: "+508",
  vc: "+1784", ws: "+685", sm: "+378", st: "+239", sa: "+966", sn: "+221",
  rs: "+381", sc: "+248", sl: "+232", sg: "+65", sx: "+1721", sk: "+421",
  si: "+386", sb: "+677", so: "+252", za: "+27", kr: "+82", ss: "+211",
  es: "+34", lk: "+94", ps: "+970", sd: "+249", sr: "+597", se: "+46",
  ch: "+41", sy: "+963", tw: "+886", tj: "+992", tz: "+255", th: "+66",
  tl: "+670", tg: "+228", tk: "+690", to: "+676", tt: "+1868", tn: "+216",
  tm: "+993", tc: "+1649", tv: "+688", tr: "+90", ug: "+256", ua: "+380",
  ae: "+971", gb: "+44", us: "+1", uy: "+598", uz: "+998", vu: "+678",
  ve: "+58", vn: "+84", vg: "+1284", vi: "+1340", wf: "+681", ye: "+967",
  zm: "+260", zw: "+263",
};

export type DialCodeOption = {
  code: string; // lowercase ISO 3166-1 alpha-2, matches FlagIcon/`fi fi-<code>`
  name: string;
  dial: string; // e.g. "+971"
};

// COUNTRIES (lib/countries.ts) filtered down to the ones with a real
// calling code, sorted the same way that source list already is
// (alphabetically by name) — the order a visitor expects when they start
// typing to search.
export const DIAL_CODE_OPTIONS: DialCodeOption[] = COUNTRIES.filter((c) => DIAL_CODES[c.code]).map((c) => ({
  code: c.code,
  name: c.name,
  dial: DIAL_CODES[c.code],
}));
