// 내 친구 고소하기 E2E (API 수준)
// 준비: 로컬 Supabase(docker) + `pnpm dev` 실행 중. ANTHROPIC_API_KEY 는 비워 두면 가짜 초안으로 빠르게 돈다.
// 실행: pnpm test:e2e   (다른 주소면 E2E_BASE=http://localhost:3001 pnpm test:e2e)
// 주의: 로컬 DB 에 테스트 사건을 만든다. 마감 조작은 docker exec 로 psql 을 쓴다.
import { execSync } from "node:child_process";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
let pass = 0, failN = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("  ✓", msg); } else { failN++; console.log("  ✗", msg); } };

class Jar {
  constructor(name, ip) { this.name = name; this.c = new Map(); this.ip = ip ?? "10.0.0." + Math.floor(Math.random() * 200); }
  header() { return [...this.c].map(([k, v]) => `${k}=${v}`).join("; "); }
  store(res) {
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      const [kv] = sc.split(";"); const i = kv.indexOf("=");
      this.c.set(kv.slice(0, i), kv.slice(i + 1));
    }
  }
  async req(path, { method = "GET", json, body, origin = true, redirect = "manual" } = {}) {
    const headers = { cookie: this.header(), "x-forwarded-for": this.ip };
    if (origin) headers.origin = BASE;
    if (json !== undefined) headers["content-type"] = "application/json";
    const res = await fetch(BASE + path, { method, headers, body: json !== undefined ? JSON.stringify(json) : body, redirect });
    this.store(res);
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, res };
  }
}

const sql = (q) => execSync(`docker exec supabase_db_sue-my-friend psql -U postgres -tAc ${JSON.stringify(q)}`).toString().trim();
const png = () => {
  // 1x1 png
  const b = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const fd = new FormData(); fd.append("file", new Blob([b], { type: "image/png" }), "e.png"); return fd;
};

async function newCase(p, demand = "뿌링클 1마리") {
  const r = await p.req("/api/draft", { method: "POST", json: { input: { type: "bet", plaintiff_nick: "지원", defendant_nick: "민수", incident_date: "2026-10-01", situation: "롤 내기 지면 치킨 사기로 했는데 '이번 주말에'만 3번째", demand }, tone: "기본" } });
  return r;
}
async function sendAndLink(p, id) {
  const s = await p.req(`/api/cases/${id}/send`, { method: "POST", json: {} });
  const html = (await p.req(`/case/${id}`)).data;
  const def = html.match(/\/c\/([A-Za-z0-9_-]{40,})/)?.[1];
  return { s, def };
}

console.log("\n[1] 사건 생성 → 초안 → 재생성 → 수정 → 발송");
const P = new Jar("plaintiff", "10.1.1.1");
const r1 = await newCase(P);
ok(r1.status === 200 && r1.data.caseId, "초안 생성");
const id = r1.data.caseId;
ok(!JSON.stringify(r1.data).includes("너는 '친구 고소하기'"), "응답에 시스템 프롬프트 없음");
for (let i = 0; i < 3; i++) await P.req("/api/draft", { method: "POST", json: { caseId: id, tone: "더_킹받게" } });
const r4 = await P.req("/api/draft", { method: "POST", json: { caseId: id, tone: "순하게" } });
ok(r4.status === 429, "재생성 3회 초과 차단");
const noOrigin = await P.req("/api/draft", { method: "POST", json: { caseId: id, tone: "순하게" }, origin: false });
ok(noOrigin.status === 403, "Origin 없는 요청 차단");
const ed = await P.req(`/api/cases/${id}/draft`, { method: "PATCH", json: { draft: { ...r1.data.draft, title: "수정된 제목" } } });
ok(ed.status === 200 && ed.data.draft.title === "수정된 제목", "직접 수정 저장");
const { s, def } = await sendAndLink(P, id);
ok(s.status === 200 && def, "발송 + 피고 링크");

console.log("\n[2] 권한 분리");
const D = new Jar("defendant", "10.2.2.2");
const stranger = new Jar("stranger", "10.3.3.3");
ok((await stranger.req(`/api/cases/${id}/draft`, { method: "PATCH", json: { draft: r1.data.draft } })).status === 403, "남이 초안 수정 불가");
ok((await stranger.req(`/case/${id}`)).data.includes("열람 권한이 없습니다"), "남이 원고 현황판 불가");
const page = await D.req(`/c/${def}`);
ok(page.status === 200 && page.data.includes("og:image") && page.data.includes(`/api/og/case/${def}`), "피고 페이지 og:image");
ok(sql(`select opened_at is null from cases where id='${id}'`) === "t", "페이지 렌더(크롤러)만으로는 열람 기록 안 됨");
const op = await D.req(`/api/c/${def}/open`, { method: "POST", json: {} });
ok(op.status === 200 && op.data.openedAt, "열람 기록");
ok((await P.req(`/case/${id}`)).data.includes("열람함"), "원고 현황판에 열람 시각");
ok((await P.req(`/api/c/${r1.data.myLink?.split("/enter/")[1]}/respond`, { method: "POST", json: { action: "accept" } })).status === 404, "원고 토큰으로 피고 대응 불가");
const ob = await D.req(`/api/c/${def}/respond`, { method: "POST", json: { action: "object" } });
ok(ob.status === 200 && ob.data.next.includes("/trial"), "이의신청 → 공방");

console.log("\n[3] 3라운드 공방");
ok((await D.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["피고가 원고 증언 대신 씀"] } })).status === 403, "피고 토큰으로 원고 진술 불가");
ok((await P.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["a", "b", "c", "d", "e"] } })).status === 400, "증언 5문장 거부");
ok((await P.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["피고는 내기에서 졌습니다.", "치킨은 아직 오지 않았습니다.", "주말은 세 번 지나갔습니다."] } })).status === 200, "R1 원고 증언");
const ev = await D.req(`/api/cases/${id}/evidence?as=defendant`, { method: "POST", body: png() });
ok(ev.status === 200 && ev.data.label === "증 제1호증" && ev.data.url, "증거 업로드 + 자동 이름");
const big = new FormData(); big.append("file", new Blob([Buffer.alloc(5 * 1024 * 1024 + 10)], { type: "image/png" }), "b.png");
ok((await D.req(`/api/cases/${id}/evidence?as=defendant`, { method: "POST", body: big })).status === 400, "5MB 초과 거부");
const txt = new FormData(); txt.append("file", new Blob(["hi"], { type: "text/plain" }), "a.txt");
ok((await D.req(`/api/cases/${id}/evidence?as=defendant`, { method: "POST", body: txt })).status === 400, "이미지 아닌 파일 거부");
ok((await P.req(`/api/cases/${id}/evidence/${ev.data.id}?as=plaintiff`, { method: "PATCH", json: { label: "남의 증거" } })).status === 403, "남의 증거 이름 수정 불가");
ok((await D.req(`/api/cases/${id}/evidence/${ev.data.id}?as=defendant`, { method: "PATCH", json: { label: "카톡 캡처" } })).status === 200, "내 증거 이름 수정");
ok((await D.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["주말이 세 번이 아니라 두 번입니다."] } })).status === 400, "반박 대상 문장 필수");
ok((await D.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["주말은 두 번입니다."], targetSentenceIdx: 2, cardId: "amusement", evidenceId: ev.data.id } })).status === 200, "R1 피고 반박(문장 선택+카드+증거)");
ok((await D.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["저는 치킨을 사려 했습니다.", "가게가 문을 닫았습니다."] } })).status === 200, "R2 피고 증언");
ok((await P.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["그 가게는 24시간입니다."], targetSentenceIdx: 1, cardId: "delay" } })).status === 200, "R2 원고 반박");
ok((await P.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["치킨은 식기 전에 받아야 합니다.", "두 문장"] } })).status === 400, "최후진술 1문장 제한");
const preHtml = (await P.req(`/case/${id}/trial?as=plaintiff`)).data;
ok(!/\/j\/[A-Za-z0-9_-]{40,}/.test(preHtml), "초대 전 공방 화면에 배심원 링크 없음");
ok((await stranger.req(`/api/cases/${id}/jury`, { method: "POST", json: {} })).status === 403, "남은 배심원 초대 불가");
const inv = await D.req(`/api/cases/${id}/jury`, { method: "POST", json: {} });
ok(inv.status === 200 && /\/j\/[A-Za-z0-9_-]{40,}/.test(inv.data.jury ?? ""), "피고가 배심원 초대");
ok((await P.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["치킨은 식기 전에 받아야 합니다."] } })).status === 200, "R3 원고 최후진술");
ok((await D.req(`/api/cases/${id}/statements`, { method: "POST", json: { sentences: ["저는 결백합니다."] } })).status === 200, "R3 피고 최후진술");
ok(sql(`select status from cases where id='${id}'`) === "voting", "배심원 초대한 사건은 3라운드 후 voting");
const tv = await P.req(`/api/cases/${id}/trial?as=plaintiff`);
ok(tv.status === 200 && tv.data.statements.length === 6 && !JSON.stringify(tv.data).includes("token_salt"), "공방 상태 조회 (salt 비노출)");

console.log("\n[4] 배심원 투표");
const html = (await P.req(`/case/${id}/trial?as=plaintiff`)).data;
const jury = html.match(/\/j\/([A-Za-z0-9_-]{40,})/)?.[1];
ok(!!jury, "배심원 링크");
ok((await P.req(`/api/j/${jury}/vote`, { method: "POST", json: { verdict: "plaintiff" } })).status === 403, "당사자 투표 불가");
const J1 = new Jar("j1", "10.9.0.1"), J2 = new Jar("j2", "10.9.0.2"), J3 = new Jar("j3", "10.9.0.3");
ok((await J1.req(`/api/j/${jury}/vote`, { method: "POST", json: { verdict: "plaintiff" } })).status === 200, "배심원1 투표");
ok((await J1.req(`/api/j/${jury}/vote`, { method: "POST", json: { verdict: "defendant" } })).status === 409, "같은 사람 중복 투표 불가");
await J2.req(`/api/j/${jury}/vote`, { method: "POST", json: { verdict: "plaintiff" } });
const v3 = await J3.req(`/api/j/${jury}/vote`, { method: "POST", json: { verdict: "both" } });
ok(v3.data.votes?.plaintiff === 2 && v3.data.votes?.both === 1, "득표 집계");
sql(`update cases set voting_deadline_at = now() - interval '1 minute' where id='${id}'`);
const vpage = await stranger.req(`/v/${id}`);
ok(sql(`select verdict || ':' || judged_by from judgments where case_id='${id}'`) === "plaintiff:jury", "마감 후 최다 득표 판결 (원고 승, 배심원)");
// 판결문 본문은 망치 연출 뒤 클라이언트에서 그려지므로 서버가 내려준 주문 문구로 확인
ok(vpage.status === 200 && vpage.data.includes(sql(`select order_text from judgments where case_id='${id}'`)), "판결 페이지에 주문");
ok(sql(`select reason_text from judgments where case_id='${id}'`).includes("가장 많이 반박당한"), "이유에 반박당한 문장 인용");

console.log("\n[5] 집행");
ok((await P.req(`/api/cases/${id}/execution`, { method: "POST", body: png() })).status === 403, "승소 측은 인증 업로드 불가");
ok((await P.req(`/api/cases/${id}/execution/confirm`, { method: "POST", json: {} })).status === 409, "인증 전 확인 불가");
ok((await D.req(`/api/cases/${id}/execution`, { method: "POST", body: png() })).status === 200, "패소 측 인증 업로드");
ok((await D.req(`/api/cases/${id}/execution/confirm`, { method: "POST", json: {} })).status === 403, "패소 측이 스스로 확인 불가");
ok((await P.req(`/api/cases/${id}/execution/confirm`, { method: "POST", json: {} })).status === 200, "원고 확인");
ok(sql(`select status from cases where id='${id}'`) === "executed", "status executed");

console.log("\n[6] OG 이미지");
for (const [path, w, h] of [[`/api/og/case/${def}`, 1200, 630], [`/api/og/jury/${jury}`, 1200, 630], [`/api/og/judgment/${id}`, 1200, 630], [`/api/og/judgment/${id}?format=story`, 1080, 1920]]) {
  const res = await fetch(BASE + path); const buf = Buffer.from(await res.arrayBuffer());
  const W = buf.readUInt32BE(16), H = buf.readUInt32BE(20);
  ok(res.status === 200 && res.headers.get("content-type") === "image/png" && W === w && H === h, `${path.split("?")[0].split("/").slice(0, 4).join("/")} ${W}x${H}`);
}

console.log("\n[7] 인정 → 합의 판결");
const P2 = new Jar("p2", "10.4.4.4"), D2 = new Jar("d2", "10.5.5.5");
const c2 = (await newCase(P2, "3,500원")).data.caseId; const l2 = await sendAndLink(P2, c2);
const acc = await D2.req(`/api/c/${l2.def}/respond`, { method: "POST", json: { action: "accept" } });
ok(acc.status === 200 && sql(`select verdict from judgments where case_id='${c2}'`) === "settled", "합의 판결");
ok(sql(`select order_text from judgments where case_id='${c2}'`).includes("인낙"), "합의 주문 템플릿");
ok((await D2.req(`/api/c/${l2.def}/respond`, { method: "POST", json: { action: "object" } })).status === 409, "중복 대응 불가");

console.log("\n[8] 답변 기한 무응답 → 궐석");
const P3 = new Jar("p3", "10.6.6.6");
const c3 = (await newCase(P3)).data.caseId; await sendAndLink(P3, c3);
sql(`update cases set response_deadline_at = now() - interval '1 minute' where id='${c3}'`);
await P3.req(`/case/${c3}`);
ok(sql(`select verdict from judgments where case_id='${c3}'`) === "default", "궐석 판결");
ok(sql(`select order_text from judgments where case_id='${c3}'`).startsWith("피고는 도주하였다"), "궐석 주문 '피고는 도주하였다'");

console.log("\n[9] 맞고소 + 배심원 미초대 + 턴 만료 → 진술 포기 → AI 재판장 판결");
const P4 = new Jar("p4", "10.7.7.7"), D4 = new Jar("d4", "10.8.8.8");
const c4 = (await newCase(P4)).data.caseId; const l4 = await sendAndLink(P4, c4);
await D4.req(`/api/c/${l4.def}/respond`, { method: "POST", json: { action: "countersue" } });
sql(`update cases set trial_started_at = now() - interval '7 days' where id='${c4}'`);
await P4.req(`/api/cases/${c4}/trial?as=plaintiff`);
ok(sql(`select count(*) from statements where case_id='${c4}' and forfeited`) === "6", "만료된 턴 6개 진술 포기 기록");
ok(sql(`select judged_by from judgments where case_id='${c4}'`) === "judge", "배심원 미초대 → AI 재판장 판결 (투표 단계 없음)");
ok(sql(`select voting_deadline_at is null from cases where id='${c4}'`) === "t", "미초대 사건은 투표 마감 없음");

console.log("\n[10] 기각");
const P5 = new Jar("p5", "10.10.0.1"), D5 = new Jar("d5", "10.10.0.2");
const c5 = (await newCase(P5)).data.caseId; const l5 = await sendAndLink(P5, c5);
ok((await D5.req(`/api/c/${l5.def}/report`, { method: "POST", json: { reason: "테스트 신고" } })).status === 200, "신고 접수");
await D5.req(`/api/c/${l5.def}/dismiss`, { method: "POST", json: {} });
ok((await D5.req(`/c/${l5.def}`)).data.includes("기각된 사건"), "피고 화면 문서 숨김");
ok((await P5.req(`/case/${c5}`)).data.includes("기각했습니다"), "원고 진행 차단");

console.log("\n[11] 배심원 초대했지만 0표 → AI 재판장, 초대 전 투표 불가");
const P7 = new Jar("p7", "10.12.0.1"), D7 = new Jar("d7", "10.12.0.2"), J7 = new Jar("j7", "10.12.0.3");
const c7 = (await newCase(P7)).data.caseId; const l7 = await sendAndLink(P7, c7);
await D7.req(`/api/c/${l7.def}/respond`, { method: "POST", json: { action: "object" } });
const inv7 = await P7.req(`/api/cases/${c7}/jury`, { method: "POST", json: {} });
const jt7 = inv7.data.jury.split("/j/")[1];
ok((await J7.req(`/j/${jt7}`)).status === 200, "초대 후 배심원 페이지 열림");
sql(`update cases set jury_invited_at = null where id='${c7}'`);
ok((await J7.req(`/api/j/${jt7}/vote`, { method: "POST", json: { verdict: "both" } })).status === 409, "초대 전 투표 불가");
ok((await J7.req(`/j/${jt7}`)).data.includes("배심원 모집 전"), "초대 전 배심원 페이지 닫힘");
await P7.req(`/api/cases/${c7}/jury`, { method: "POST", json: {} });
sql(`update cases set trial_started_at = now() - interval '7 days' where id='${c7}'`);
await P7.req(`/api/cases/${c7}/trial?as=plaintiff`);
ok(sql(`select judged_by from judgments where case_id='${c7}'`) === "judge", "0표로 마감 → AI 재판장 판결");

console.log("\n[12] IP당 시간당 초안 10회");
const P6 = new Jar("p6", "10.11.0.1");
let last;
for (let i = 0; i < 11; i++) last = await newCase(P6);
ok(last.status === 429, "11번째 초안 차단");

console.log(`\n결과: ${pass} 통과, ${failN} 실패`);
process.exit(failN ? 1 : 0);
