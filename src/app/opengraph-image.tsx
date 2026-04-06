import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  opengraphImageAlt,
  opengraphImageSize,
} from "@/lib/site-metadata";

export const runtime = "nodejs";

export const alt = opengraphImageAlt;
export const size = opengraphImageSize;
export const contentType = "image/png";

/** Brand palette (aligned with storefront accents). */
const colors = {
  accent: "#EB2027",
  accentDeep: "#A8171C",
  headline: "#821216",
  muted: "#5C0D10",
  cream: "#FEF9F9",
  blush: "#FDE4E5",
  rose: "#FBCECF",
} as const;

/** Legacy UA: Google serves WOFF (Satori does not accept WOFF2 here). */
const FONT_CSS_UA =
  "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)";

async function fetchMontserratFont(weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Montserrat:wght@${weight}&display=swap`,
    {
      headers: { "User-Agent": FONT_CSS_UA },
      next: { revalidate: 86_400 },
    },
  ).then((r) => r.text());

  const woff = css.match(/src: url\(([^)]+)\) format\('woff'\)/);
  const ttf = css.match(/src: url\(([^)]+)\) format\('truetype'\)/);
  const match = woff ?? ttf;
  if (!match) {
    throw new Error(`Montserrat wght ${weight}: no woff/ttf in CSS`);
  }
  const fontUrl = match[1].replaceAll("'", "");
  return fetch(fontUrl, { next: { revalidate: 86_400 } }).then((r) =>
    r.arrayBuffer(),
  );
}

async function loadMontserratFonts() {
  const weights = [500, 600, 700] as const;
  const buffers = await Promise.all(weights.map((w) => fetchMontserratFont(w)));
  return weights.map((weight, i) => ({
    name: "Montserrat",
    data: buffers[i],
    style: "normal" as const,
    weight,
  }));
}

export default async function Image() {
  const [logoBuffer, fonts] = await Promise.all([
    readFile(join(process.cwd(), "public", "gashi-logo.png")),
    loadMontserratFonts().catch(() => [] as Awaited<
      ReturnType<typeof loadMontserratFonts>
    >),
  ]);

  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: `linear-gradient(152deg, ${colors.cream} 0%, ${colors.blush} 38%, ${colors.rose} 72%, #f8b8ba 100%)`,
          padding: "56px 80px 52px 96px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 88% 12%, rgba(235, 32, 39, 0.08) 0%, transparent 42%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 16,
            background: colors.accent,
            boxShadow: "6px 0 32px rgba(235, 32, 39, 0.4)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 28,
            position: "relative",
          }}
        >
          <img
            src={logoSrc}
            alt=""
            height={88}
            width={260}
            style={{ objectFit: "contain", objectPosition: "left center" }}
          />
        </div>
        <div
          style={{
            fontFamily: "Montserrat",
            fontSize: 76,
            fontWeight: 700,
            color: colors.headline,
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            position: "relative",
          }}
        >
          G-Food
        </div>
        <div
          style={{
            fontFamily: "Montserrat",
            fontSize: 36,
            fontWeight: 600,
            color: colors.accentDeep,
            marginTop: 14,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            position: "relative",
            maxWidth: 980,
          }}
        >
          GASHI International Food
        </div>
        <div
          style={{
            fontFamily: "Montserrat",
            fontSize: 28,
            fontWeight: 500,
            color: colors.accentDeep,
            marginTop: 20,
            lineHeight: 1.35,
            opacity: 0.92,
            position: "relative",
          }}
        >
          Les saveurs d’ailleurs
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 96,
            right: 56,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Montserrat",
            fontSize: 18,
            fontWeight: 600,
            color: colors.muted,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: 0.88,
          }}
        >
          <span>Livraison en Suisse</span>
          <span
            style={{
              color: colors.accent,
              letterSpacing: "0.08em",
            }}
          >
            Commander
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  );
}
