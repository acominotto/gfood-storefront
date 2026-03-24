import type { SVGProps } from "react";

export type ProductPlaceholderProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Caption below the graphic (e.g. localized “Image coming soon”). */
  text: string;
};

/** Product image placeholder: same artwork as the former public SVG, with configurable label. */
export function ProductPlaceholder({ text, "aria-hidden": ariaHidden, ...rest }: ProductPlaceholderProps) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden={ariaHidden ?? true}
      {...rest}
    >
      <rect width="800" height="800" fill="#F4F4F5" />
      <rect x="120" y="160" width="560" height="400" rx="24" fill="#E4E4E7" />
      <path d="M190 510L310 390L420 500L510 420L610 510V560H190V510Z" fill="#D4D4D8" />
      <circle cx="300" cy="290" r="44" fill="#D4D4D8" />
      <text
        x="400"
        y="650"
        textAnchor="middle"
        fill="#71717A"
        style={{ fontFamily: "var(--font-heading)", fontWeight: "bold", fontSize: "40px" }}
      >
        {text}
      </text>
    </svg>
  );
}
