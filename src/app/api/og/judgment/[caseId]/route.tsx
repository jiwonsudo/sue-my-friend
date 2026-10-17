import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { DISCLAIMER, SERVICE_NAME } from "@/lib/constants";
import { formatDate, VERDICT_LABEL } from "@/lib/document";
import { fetchJudgment, loadCase } from "@/server/cases";
import { Brand, FormLine, OG, ogFonts, sheetShadow, StampBox, woodBg } from "@/server/og";

const SIGNER = { jury: "배심원 일동", judge: "재판장 (AI)", system: "본 법정" } as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const story = req.nextUrl.searchParams.get("format") === "story";
  const c = await loadCase(caseId);
  const j = c ? await fetchJudgment(c.id) : null;
  if (!c || !j) return new Response("Not found", { status: 404 });

  const label = VERDICT_LABEL[j.verdict];
  const date = formatDate(j.created_at);
  const executed = !!j.executed_at;
  const signer = SIGNER[j.judged_by ?? "system"];
  const allText = [c.case_no, c.draft.title, c.plaintiff_nick, c.defendant_nick, j.order_text, j.reason_text, label, date, signer, "판결주문이유사건원고피고배심법정집행완료쪽"].join("");
  const fonts = await ogFonts(allText);
  const row = (h: string, v: string, size: number, first = false) => (
    <div style={{ display: "flex", borderTop: first ? "none" : `1.5px solid ${OG.ink}` }}>
      <div style={{ display: "flex", width: size * 4.6, padding: `${size * 0.35}px ${size * 0.5}px`, background: "rgba(0,0,0,0.04)", borderRight: `1.5px solid ${OG.ink}`, letterSpacing: size * 0.2 }}>{h}</div>
      <div style={{ display: "flex", flex: 1, padding: `${size * 0.35}px ${size * 0.6}px` }}>{v}</div>
    </div>
  );

  if (!story) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", ...woodBg, fontFamily: "Serif", position: "relative" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              left: 120,
              top: 34,
              width: 960,
              height: 580,
              background: OG.paper,
              padding: "22px 54px",
              transform: "rotate(-1deg)",
              boxShadow: sheetShadow,
              color: OG.ink,
            }}
          >
            <FormLine no="친고 서식 제9호" side={c.case_no} />
            <div style={{ display: "flex", alignItems: "flex-end", gap: 30, marginTop: 12 }}>
              <div style={{ display: "flex", fontSize: 52, fontWeight: 900, letterSpacing: 40 }}>판결</div>
              <div style={{ display: "flex", fontSize: 26, color: OG.muted, paddingBottom: 8 }}>{c.draft.title}</div>
            </div>
            <div style={{ display: "flex", fontSize: 24, color: OG.muted, marginTop: 10 }}>
              원고 {c.plaintiff_nick} · 피고 {c.defendant_nick}
            </div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 900, marginTop: 26, letterSpacing: 14 }}>주문</div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 900, lineHeight: 1.4, marginTop: 8, borderLeft: `6px solid ${OG.ink}`, paddingLeft: 20 }}>{j.order_text}</div>
            <div style={{ display: "flex", flex: 1 }} />
            <div style={{ display: "flex", fontSize: 17, color: OG.muted, lineHeight: 1.5, borderTop: "1px solid #e2dacb", paddingTop: 12, width: 640 }}>{DISCLAIMER}</div>
            <div style={{ display: "flex", position: "absolute", right: 56, bottom: 40 }}>
              <StampBox text={label} size={42} />
            </div>
            {executed && (
              <div style={{ display: "flex", position: "absolute", right: 40, top: 26 }}>
                <StampBox text="집행 완료" size={40} rotate={8} />
              </div>
            )}
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  }

  return (
    new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", ...woodBg, padding: 56, fontFamily: "Serif" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              background: OG.paper,
              padding: "36px 74px 40px",
              position: "relative",
              color: OG.ink,
              boxShadow: sheetShadow,
            }}
          >
            <FormLine no="친고 서식 제9호" side="(1쪽)" size={24} />
            <div style={{ display: "flex", fontFamily: "Type", fontSize: 26, color: OG.muted, letterSpacing: 6, marginTop: 56 }}>{SERVICE_NAME} 배심 법정</div>
            <div style={{ display: "flex", fontSize: 104, fontWeight: 900, letterSpacing: 80, marginTop: 16 }}>판결</div>
            <div style={{ display: "flex", width: 300, height: 12, borderTop: `3px solid ${OG.ink}`, borderBottom: `3px solid ${OG.ink}`, marginTop: 16 }} />
            <div style={{ display: "flex", flexDirection: "column", fontSize: 34, marginTop: 50, border: `3px solid ${OG.ink}` }}>
              {row("사 건", `${c.case_no} ${c.draft.title}`, 34, true)}
              {row("원 고", c.plaintiff_nick, 34)}
              {row("피 고", c.defendant_nick, 34)}
            </div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 900, letterSpacing: 28, marginTop: 70 }}>주문</div>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 900, lineHeight: 1.5, marginTop: 18, borderLeft: `8px solid ${OG.ink}`, paddingLeft: 28 }}>{j.order_text}</div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 900, letterSpacing: 28, marginTop: 64 }}>이유</div>
            <div style={{ display: "flex", fontSize: 34, lineHeight: 1.7, marginTop: 18 }}>{j.reason_text}</div>
            <div style={{ display: "flex", flex: 1 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 36, letterSpacing: 4 }}>{date}</div>
                <div style={{ display: "flex", fontSize: 30, color: OG.muted, marginTop: 8 }}>{signer}</div>
              </div>
              <StampBox text={label} size={62} />
            </div>
            {executed && (
              <div style={{ display: "flex", position: "absolute", left: 100, top: 1180 }}>
                <StampBox text="집행 완료" size={84} rotate={-12} />
              </div>
            )}
            <div style={{ display: "flex", height: 1, background: "#e2dacb", marginTop: 44 }} />
            <div style={{ display: "flex", fontSize: 24, color: OG.muted, lineHeight: 1.6, marginTop: 20 }}>{DISCLAIMER}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 30 }}>
              <Brand size={24} />
              <div style={{ display: "flex", fontFamily: "Type", fontSize: 24, color: OG.muted }}>- 1 -</div>
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1920, fonts },
    )
  );
}
