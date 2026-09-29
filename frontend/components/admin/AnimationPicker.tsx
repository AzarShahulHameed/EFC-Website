import FieldLabel from "./FieldLabel";

export const ANIMATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "fade-up", label: "Fade Up" },
  { value: "fade-in", label: "Fade In" },
  { value: "slide-left", label: "Slide From Left" },
  { value: "slide-right", label: "Slide From Right" },
  { value: "zoom-in", label: "Zoom In" },
  { value: "blur-in", label: "Blur In (advanced)" },
  { value: "clip-reveal", label: "Clip Reveal / Wipe (advanced)" },
  { value: "flip-3d", label: "3D Flip (advanced)" },
  { value: "elastic-pop", label: "Elastic Pop / Bounce (advanced)" },
  { value: "rotate-in", label: "Rotate In (advanced)" },
  { value: "swing-in", label: "Pendulum Swing (ultimate)" },
  { value: "roll-in", label: "Roll In (ultimate)" },
  { value: "skew-in", label: "Skew In (ultimate)" },
  { value: "bounce-in", label: "Bounce In (ultimate)" },
  { value: "tilt-3d", label: "3D Tilt (ultimate)" },
  { value: "glow-in", label: "Glow In (ultimate)" },
] as const;

export type AnimationVariant = (typeof ANIMATION_OPTIONS)[number]["value"];

// A plain <select> (not a client component) so it can drop into any
// server-rendered admin form without converting the whole form to a client
// component — the chosen value is just another form field, saved into the
// content block's `animation` property and read by components/site/Reveal.tsx
// on the public side.
export default function AnimationPicker({
  name,
  defaultValue = "fade-up",
  label = "Entrance Animation",
  hint = "How this section animates into view as visitors scroll to it.",
}: {
  name: string;
  defaultValue?: string;
  label?: string;
  hint?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={name} hint={hint}>{label}</FieldLabel>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white"
      >
        {ANIMATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
