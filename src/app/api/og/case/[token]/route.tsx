import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { caseForDefendantToken } from "@/server/defendant";
import { Brand, OG, ogFonts, StampBox } from "@/server/og";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await caseForDefendantToken(token);
  const line1 = c ? `${c.plaintiff_nick}님이 ${c.defendant_nick}님 앞으로` : "내용증명이";
  const line2 = c ? "내용증명을 발송했습니다" : "도착했습니다";
  const caseNo = c?.case_no ?? "";
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#f4f1ea", fontFamily: "Serif", padding: 60, gap: 50 }}>
        {/* 우편함 일러스트 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 360 }}>
          <div style={{ display: "flex", position: "relative", width: 300, height: 220 }}>
            <div style={{ display: "flex", position: "absolute", left: 20, top: 0, width: 240, height: 200, background: "#2b2f36", borderRadius: "120px 120px 10px 10px" }} />
            <div style={{ display: "flex", position: "absolute", left: 230, top: 30, width: 44, height: 170, background: OG.seal, borderRadius: "22px 22px 6px 6px" }} />
            <div style={{ display: "flex", position: "absolute", left: 0, top: -40, width: 12, height: 130, background: "#d9d9d9" }} />
            <div style={{ display: "flex", position: "absolute", left: -40, top: -40, width: 52, height: 36, background: OG.seal }} />
            <div
              style={{
                display: "flex",
                position: "absolute",
                left: 60,
                top: 110,
                width: 220,
                height: 120,
                background: "#f5eedd",
                borderRadius: 8,
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                transform: "rotate(-6deg)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StampBox text="내용증명" size={30} />
            </div>
          </div>
          <div style={{ display: "flex", width: 26, height: 120, background: "#3b3b3b" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <Brand />
          <div style={{ display: "flex", marginTop: 36, fontSize: 30, color: OG.muted }}>{caseNo ? `사건번호 ${caseNo}` : ""}</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 52, fontWeight: 900, color: OG.ink, lineHeight: 1.3 }}>{line1}</div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 900, color: OG.seal, lineHeight: 1.3 }}>{line2}</div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 24, color: OG.muted }}>열람 시각이 기록됩니다.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts(line1 + line2 + caseNo + "사건번호열람 시각이 기록됩니다.내용증명"), headers: { "Cache-Control": "public, max-age=300" } },
  );
}
