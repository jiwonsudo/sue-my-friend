import { ImageResponse } from "next/og";
import { Brand, FormLine, OG, ogFonts, sheetShadow, woodBg } from "@/server/og";

export async function GET() {
  const lines = ["1. 친구 간 사소한 원한(내기, 읽씹, 노쇼, 빌린 돈 등)에 한하여 접수함.", "2. 접수된 사건은 통고서로 작성하여 상대방에게 송달함.", "3. 상대방이 다투는 경우 3회 공방을 거쳐 판결함."];
  const note = "원한 크기 무관 상시 접수";
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", ...woodBg, fontFamily: "Serif", position: "relative" }}>
        <div style={{ display: "flex", position: "absolute", left: 60, top: 54 }}>
          <Brand size={30} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            left: 330,
            top: 70,
            width: 640,
            height: 620,
            background: OG.paper,
            padding: "24px 44px",
            transform: "rotate(-2deg)",
            boxShadow: sheetShadow,
          }}
        >
          <FormLine no="친고 서식 제1호" side="(앞쪽)" />
          <div style={{ display: "flex", fontSize: 56, fontWeight: 900, letterSpacing: 10, marginTop: 22 }}>사건접수서</div>
          <div style={{ display: "flex", width: 320, height: 8, borderTop: `2px solid ${OG.ink}`, borderBottom: `2px solid ${OG.ink}`, marginTop: 10 }} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, gap: 8, fontSize: 21, color: "rgba(0,0,0,0.7)" }}>
            {lines.map((l) => (
              <div key={l} style={{ display: "flex" }}>
                {l}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, border: `3px solid ${OG.ink}` }}>
            {["원 고", "피 고", "청 구"].map((h, i) => (
              <div key={h} style={{ display: "flex", borderTop: i ? `1.5px solid ${OG.ink}` : "none", height: 52 }}>
                <div style={{ display: "flex", width: 120, alignItems: "center", paddingLeft: 16, fontSize: 22, background: "rgba(0,0,0,0.04)", borderRight: `1.5px solid ${OG.ink}` }}>{h}</div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 860,
            top: 300,
            width: 230,
            padding: "18px 20px",
            background: OG.postit,
            transform: "rotate(5deg)",
            fontFamily: "Hand",
            fontSize: 44,
            lineHeight: 1.1,
            color: OG.ink,
            boxShadow: "4px 12px 16px rgba(0,0,0,0.45)",
          }}
        >
          {note}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts(lines.join("") + note + "사건접수서원고피고청구앞쪽") },
  );
}
