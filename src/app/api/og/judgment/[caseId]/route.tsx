import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { DISCLAIMER } from "@/lib/constants";
import { formatDate, VERDICT_LABEL } from "@/lib/document";
import { fetchJudgment, loadCase } from "@/server/cases";
import { Brand, OG, ogFonts, StampBox } from "@/server/og";

export async function GET(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const story = req.nextUrl.searchParams.get("format") === "story";
  const c = await loadCase(caseId);
  const j = c ? await fetchJudgment(c.id) : null;
  if (!c || !j) return new Response("Not found", { status: 404 });

  const label = VERDICT_LABEL[j.verdict];
  const date = formatDate(j.created_at);
  const executed = !!j.executed_at;
  const allText = [c.case_no, c.draft.title, c.plaintiff_nick, c.defendant_nick, j.order_text, j.reason_text, label, date, "판결주문이유사건원고피고배심법정집행완료"].join("");
  const fonts = await ogFonts(allText);

  if (!story) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#ece7dc", padding: 40, fontFamily: "Serif" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: OG.paper, padding: "44px 60px", border: "1px solid #e6dfcf", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Brand size={24} />
              <div style={{ display: "flex", fontSize: 24, color: OG.muted }}>{c.case_no}</div>
            </div>
            <div style={{ display: "flex", fontSize: 30, color: OG.muted, marginTop: 30 }}>{c.draft.title}</div>
            <div style={{ display: "flex", fontSize: 26, color: OG.muted, marginTop: 6 }}>
              원고 {c.plaintiff_nick} · 피고 {c.defendant_nick}
            </div>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 900, marginTop: 36, letterSpacing: 12 }}>주문</div>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 900, lineHeight: 1.4, marginTop: 8, color: OG.ink }}>{j.order_text}</div>
            <div style={{ display: "flex", position: "absolute", right: 60, bottom: 50 }}>
              <StampBox text={label} size={44} />
            </div>
            {executed && (
              <div style={{ display: "flex", position: "absolute", right: 340, bottom: 46 }}>
                <StampBox text="집행 완료" size={44} rotate={-14} />
              </div>
            )}
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  }

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#ece7dc", padding: 60, fontFamily: "Serif" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            background: OG.paper,
            padding: "90px 80px 60px",
            border: "1px solid #e6dfcf",
            position: "relative",
            color: OG.ink,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", fontSize: 28, color: OG.muted, letterSpacing: 8 }}>친구 고소하기 배심 법정</div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 96, fontWeight: 900, letterSpacing: 60, marginTop: 20, paddingLeft: 60 }}>판결</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 36, marginTop: 60, gap: 10 }}>
            <div style={{ display: "flex" }}>
              <span style={{ color: OG.muted, width: 140 }}>사 건</span>
              <span style={{ display: "flex", flex: 1 }}>{c.case_no}</span>
            </div>
            <div style={{ display: "flex" }}>
              <span style={{ color: OG.muted, width: 140 }}> </span>
              <span style={{ display: "flex", flex: 1 }}>{c.draft.title}</span>
            </div>
            <div style={{ display: "flex" }}>
              <span style={{ color: OG.muted, width: 140 }}>원 고</span>
              <span>{c.plaintiff_nick}</span>
            </div>
            <div style={{ display: "flex" }}>
              <span style={{ color: OG.muted, width: 140 }}>피 고</span>
              <span>{c.defendant_nick}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 40, fontWeight: 900, letterSpacing: 30, marginTop: 80 }}>주문</div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 900, lineHeight: 1.5, marginTop: 24 }}>{j.order_text}</div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 40, fontWeight: 900, letterSpacing: 30, marginTop: 70 }}>이유</div>
          <div style={{ display: "flex", fontSize: 34, lineHeight: 1.7, marginTop: 24 }}>{j.reason_text}</div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", justifyContent: "center", fontSize: 36, letterSpacing: 4 }}>{date}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
            <StampBox text={label} size={64} />
          </div>
          {executed && (
            <div style={{ display: "flex", position: "absolute", left: 110, top: 1440 }}>
              <StampBox text="집행 완료" size={84} rotate={-12} />
            </div>
          )}
          <div style={{ display: "flex", height: 1, background: "#e6dfcf", marginTop: 50 }} />
          <div style={{ display: "flex", fontSize: 24, color: OG.muted, lineHeight: 1.6, marginTop: 24 }}>{DISCLAIMER}</div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
            <Brand size={30} />
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts },
  );
}
