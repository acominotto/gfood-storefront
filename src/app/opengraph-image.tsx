import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export const alt = "GASHI International Food — Les saveurs d’ailleurs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public", "gashi-logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #FEF9F9 0%, #FDE4E5 42%, #FBCECF 100%)",
          padding: "64px 72px 56px 88px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 14,
            background: "#EB2027",
            boxShadow: "4px 0 24px rgba(235, 32, 39, 0.35)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders to PNG */}
          <img
            src={logoSrc}
            alt=""
            height={96}
            width={280}
            style={{ objectFit: "contain", objectPosition: "left center" }}
          />
        </div>
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            color: "#821216",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            maxWidth: 920,
          }}
        >
          GASHI International Food
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: "#A8171C",
            marginTop: 18,
            lineHeight: 1.25,
          }}
        >
          Les saveurs d’ailleurs
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 44,
            left: 88,
            fontSize: 20,
            fontWeight: 600,
            color: "#5C0D10",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          Commander en ligne
        </div>
      </div>
    ),
    { ...size },
  );
}
