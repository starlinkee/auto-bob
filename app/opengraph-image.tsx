import { ImageResponse } from "next/og";
import { getSite } from "@/lib/site";

const site = getSite();

export const alt = `${site.name} – ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background: "#1F2933",
        color: "#FFFFFF",
      }}
    >
      <div style={{ width: 160, height: 24, background: "#F5B700", marginBottom: 48 }} />
      <div style={{ fontSize: 128, fontWeight: 700, lineHeight: 1.05 }}>{site.name}</div>
      <div style={{ fontSize: 48, marginTop: 24, color: "#D9DEE3" }}>{site.tagline}</div>
    </div>,
    size,
  );
}
