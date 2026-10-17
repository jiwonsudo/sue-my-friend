import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { resolveToken } from "@/server/auth";
import { loadCase } from "@/server/cases";
import { Brand, OG, ogFonts } from "@/server/og";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await resolveToken(token);
  const c = found?.role === "jury" ? await loadCase(found.caseId) : null;
  const title = c?.draft.title ?? "사건";
  const vs = c ? `원고 ${c.plaintiff_nick}  대  피고 ${c.defendant_nick}` : "";
  const head = "배심원 모집 공고";
  const foot = "공판조서 열람 후 원고 승 · 피고 승 · 쌍방 과실 중 1표. 마감 6시간.";
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: `linear-gradient(180deg, #1b1e26, ${OG.court})`,
          color: "#fff",
          fontFamily: "Serif",
          padding: "56px 70px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Brand dark size={22} />
          <div style={{ display: "flex", fontFamily: "Type", fontSize: 24, color: "rgba(255,255,255,0.5)" }}>{c?.case_no ?? ""}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", borderTop: "2px solid rgba(255,255,255,0.4)", borderBottom: "2px solid rgba(255,255,255,0.4)", padding: "26px 0" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 900, color: "#ff8f8f", letterSpacing: 10 }}>{head}</div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 900, lineHeight: 1.25, marginTop: 14 }}>{title}</div>
          <div style={{ display: "flex", fontFamily: "Type", fontSize: 28, marginTop: 20, color: "rgba(255,255,255,0.8)" }}>{vs}</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Type", fontSize: 22, color: "rgba(255,255,255,0.5)" }}>{foot}</div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts(title + vs + head + foot + (c?.case_no ?? "")) },
  );
}
