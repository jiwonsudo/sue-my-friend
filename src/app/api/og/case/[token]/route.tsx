import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { caseForDefendantToken } from "@/server/defendant";
import { Brand, OG, ogFonts, sheetShadow, StampBox, woodBg } from "@/server/og";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await caseForDefendantToken(token);
  const to = c?.defendant_nick ?? "";
  const from = c?.plaintiff_nick ?? "";
  const caseNo = c?.case_no ?? "";
  const line1 = c ? `${from}님이 ${to}님 앞으로` : "통고서가";
  const line2 = c ? "통고서를 발송함" : "도착함";
  const foot = "열람 시각이 기록됨. 회신 기한 12시간.";
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", ...woodBg, fontFamily: "Serif", position: "relative" }}>
        {/* 봉투 */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 70,
            top: 150,
            width: 470,
            height: 300,
            background: "#f1e8d4",
            transform: "rotate(-5deg)",
            boxShadow: sheetShadow,
          }}
        >
          <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: 470, height: 150, background: "#e6dbc3", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
          <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 36, bottom: 34, fontSize: 26, color: OG.ink, gap: 6 }}>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ fontFamily: "Type", fontSize: 20, color: OG.muted }}>수 신</span>
              {to} 귀하
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ fontFamily: "Type", fontSize: 20, color: OG.muted }}>발 신</span>
              {from}
            </div>
          </div>
          <div style={{ display: "flex", position: "absolute", right: 30, bottom: 36 }}>
            <StampBox text="통고서 재중" size={24} rotate={-6} />
          </div>
        </div>
        {/* 안내 쪽지 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            left: 590,
            top: 90,
            width: 540,
            height: 440,
            background: OG.paper,
            padding: "30px 40px",
            transform: "rotate(1.5deg)",
            boxShadow: sheetShadow,
          }}
        >
          <Brand size={22} />
          <div style={{ display: "flex", marginTop: 34, fontFamily: "Type", fontSize: 24, color: OG.muted }}>{caseNo ? `사건번호 ${caseNo}` : ""}</div>
          <div style={{ display: "flex", marginTop: 12, fontSize: 44, fontWeight: 900, color: OG.ink, lineHeight: 1.3 }}>{line1}</div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 900, color: OG.seal, lineHeight: 1.3 }}>{line2}</div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", fontFamily: "Type", fontSize: 20, color: OG.muted }}>{foot}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: await ogFonts(line1 + line2 + caseNo + foot + "사건번호수신발신귀하통고서재중"),
      headers: { "Cache-Control": "public, max-age=300" },
    },
  );
}
