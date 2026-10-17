import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Gate } from "@/components/Gate";
import { Header } from "@/components/Header";
import { KIND_LABEL, ROLE_LABEL } from "@/lib/trial";
import type { CaseRow } from "@/lib/types";
import { resolveToken, rolesForCase } from "@/server/auth";
import { fetchStatements, loadCase, tallyVotes } from "@/server/cases";
import { db } from "@/server/supabase";
import { sha256 } from "@/server/tokens";
import { JuryVote } from "./JuryVote";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ token: string }> };

async function caseForJury(token: string): Promise<CaseRow | null> {
  const found = await resolveToken(token);
  if (!found || found.role !== "jury") return null;
  return loadCase(found.caseId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const c = await caseForJury(token);
  if (!c) return { title: "배심원 모집" };
  const title = `${c.draft.title} — 배심원을 모집합니다`;
  const image = `/api/og/jury/${token}`;
  return {
    title,
    description: `${c.plaintiff_nick} vs ${c.defendant_nick}. 공방을 읽고 판단해주세요.`,
    robots: { index: false },
    openGraph: { title, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [image] },
  };
}

export default async function JuryPage({ params }: Props) {
  const { token } = await params;
  const c = await caseForJury(token);
  if (!c || c.status === "dismissed") return <Gate title="사건을 찾을 수 없습니다" body="주소 오류 또는 기각된 사건." />;
  if (!c.jury_invited_at) return <Gate title="배심원 모집 전인 사건입니다" body="당사자가 배심원을 초대하면 이 주소로 공방 기록 열람과 투표가 가능함." />;

  const [statements, votes, roles] = await Promise.all([fetchStatements(c.id), tallyVotes(c.id), rolesForCase(c.id)]);
  const nick = (r: "plaintiff" | "defendant") => (r === "plaintiff" ? c.plaintiff_nick : c.defendant_nick);

  const voterId = (await cookies()).get("smf_voter")?.value;
  let voted = false;
  if (voterId) {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "0.0.0.0";
    const { data } = await db().from("votes").select("verdict").eq("case_id", c.id).eq("voter_hash", sha256(`${voterId}:${ip}`)).maybeSingle();
    voted = !!data;
  }

  const open = c.status === "trial" || c.status === "voting";
  return (
    <div className="court-bg min-h-dvh text-white">
      <Header />
      <main className="mx-auto max-w-md px-4 pt-6 pb-80">
        <p className="text-xs tracking-wider text-white/40">{c.case_no} · 배심원 열람용</p>
        <h1 className="mt-1 font-serif text-xl font-bold">{c.draft.title}</h1>
        <p className="mt-1 text-sm text-white/60">
          원고 {c.plaintiff_nick} vs 피고 {c.defendant_nick}
        </p>

        <section className="mt-5 rounded-xl bg-white/[0.06] p-4 text-[14px] leading-relaxed">
          <p className="mb-1 text-xs font-bold text-seal">원고의 청구</p>
          <p>
            {c.defendant_nick}은(는) {c.plaintiff_nick}에게 {c.demand}을(를) 이행하라.
          </p>
          <p className="mt-2 text-white/60">{c.situation}</p>
        </section>

        <section className="mt-6 space-y-4">
          {statements.length === 0 && <p className="text-sm text-white/40">아직 진술이 없습니다.</p>}
          {statements.map((s) => {
            const target = s.target_statement_id ? statements.find((x) => x.id === s.target_statement_id) : null;
            return (
              <div key={s.id}>
                <p className="mb-1 text-xs font-bold text-white/50">
                  {ROLE_LABEL[s.role]} {nick(s.role)} · {s.round}R {KIND_LABEL[s.kind]}
                </p>
                <div className="rounded-xl border-2 border-white/70 bg-black/60 p-3 text-[15px] leading-relaxed">
                  {s.forfeited ? (
                    <span className="text-white/40 italic">(진술 포기)</span>
                  ) : (
                    <>
                      {target && s.target_sentence_idx != null && (
                        <p className="mb-1 border-l-2 border-seal pl-2 text-[13px] text-white/60">「{target.sentences[s.target_sentence_idx]}」</p>
                      )}
                      {s.sentences.join(" ")}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </main>
      <JuryVote
        token={token}
        open={open}
        isParty={roles.length > 0}
        initialVoted={voted}
        votes={votes}
        deadline={c.status === "voting" ? c.voting_deadline_at : null}
        plaintiff={c.plaintiff_nick}
        defendant={c.defendant_nick}
        verdictHref={c.status === "judged" || c.status === "executed" ? `/v/${c.id}` : null}
      />
    </div>
  );
}
