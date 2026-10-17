import { ImageResponse } from "next/og";
import { Brand, OG, ogFonts } from "@/server/og";

export async function GET() {
  const line = "사소한 원한, 엄중한 형식";
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: OG.paper, alignItems: "center", justifyContent: "center", fontFamily: "Serif", gap: 30 }}>
        <Brand size={72} />
        <div style={{ display: "flex", fontSize: 40, color: OG.muted }}>{line}</div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts(line) },
  );
}
