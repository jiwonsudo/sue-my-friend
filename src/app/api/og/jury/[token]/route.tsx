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
  const vs = c ? `원고 ${c.plaintiff_nick}  vs  피고 ${c.defendant_nick}` : "";
  const text = `${title} — 배심원을 모집합니다`;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse at 50% 0%, rgba(200,16,46,0.35), ${OG.court} 70%)`,
          color: "#fff",
          fontFamily: "Serif",
          padding: 70,
          justifyContent: "space-between",
        }}
      >
        <Brand color="#fff" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.6)" }}>{c?.case_no ?? ""}</div>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 900, lineHeight: 1.25, marginTop: 10 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 900, color: OG.seal, marginTop: 8 }}>— 배심원을 모집합니다</div>
          <div style={{ display: "flex", fontSize: 30, marginTop: 30, color: "rgba(255,255,255,0.8)" }}>{vs}</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.5)" }}>공방을 읽고 원고 승 · 피고 승 · 쌍방 과실 중 하나에 투표하세요</div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts(text + vs + (c?.case_no ?? "") + "공방을 읽고 원고 승 · 피고 승 · 쌍방 과실 중 하나에 투표하세요") },
  );
}
