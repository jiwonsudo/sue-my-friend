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

console.log("\n[3] 공방: 피고 한마디 → 원고 반박 → 바로 판결");
ok((await P.req(`/api/cases/${id}/statements?as=plaintiff`, { method: "POST", json: { sentences: ["원고가 피고 차례에 끼어듦"] } })).status === 403, "피고 차례에 원고 진술 불가");
ok((await D.req(`/api/cases/${id}/statements?as=defendant`, { method: "POST", json: { sentences: ["저는 치킨을 사려 했습니다.", "가게가 문을 닫았습니다."] } })).status === 400, "두 문장 거부 (한 문장만)");
console.log("\n[3-1] 광고 보상형 AI 변호인 (피고 첫 마디에도)");
ok((await P.req(`/api/cases/${id}/lawyer?as=plaintiff`, { method: "POST", json: { action: "ticket" } })).status === 403, "상대 차례에는 변호인 선임 불가");
const tk = await D.req(`/api/cases/${id}/lawyer?as=defendant`, { method: "POST", json: { action: "ticket" } });
ok(tk.status === 200 && tk.data.ticket && tk.data.minAdMs >= 1000, "광고 티켓 발급");
ok((await D.req(`/api/cases/${id}/lawyer?as=defendant`, { method: "POST", json: { action: "grant", ticket: tk.data.ticket } })).status === 409, "광고 시간 전에는 선임 불가");
ok((await D.req(`/api/cases/${id}/lawyer?as=defendant`, { method: "POST", json: { action: "grant", ticket: "x".repeat(43) } })).status === 403, "엉뚱한 티켓 거부");
await new Promise((r) => setTimeout(r, tk.data.minAdMs + 200));
const gr = await D.req(`/api/cases/${id}/lawyer?as=defendant`, { method: "POST", json: { action: "grant", ticket: tk.data.ticket } });
ok(gr.status === 200 && gr.data.suggestions?.length >= 2 && gr.data.suggestions.every((x) => x.lawId && x.sentence), "변호인 추천 2~3개");
ok((await D.req(`/api/cases/${id}/lawyer?as=defendant`, { method: "POST", json: { action: "ticket" } })).status === 409, "같은 차례 두 번 선임 불가");
ok((await D.req(`/api/cases/${id}/statements?as=defendant`, { method: "POST", json: { sentences: ["주말은 두 번입니다."], lawId: "civil-x" } })).status === 400, "추천받지 않은 조항 인용 불가");
const tv1 = await D.req(`/api/cases/${id}/trial?as=defendant`);
ok(tv1.data.lawyer?.used === true && tv1.data.lawyer.suggestions?.length >= 2, "새로고침해도 추천 유지");
ok((await D.req(`/api/cases/${id}/statements?as=defendant`, { method: "POST", json: { sentences: ["가게가 문을 닫아 치킨을 못 샀습니다."], lawId: gr.data.suggestions[0].lawId } })).status === 200, "피고 증언 (변호인 인용)");
ok(sql(`select law_id from statements where case_id='${id}' and role='defendant'`) === gr.data.suggestions[0].lawId, "인용 조항 저장");
const ev = await P.req(`/api/cases/${id}/evidence?as=plaintiff`, { method: "POST", body: png() });
ok(ev.status === 200 && ev.data.label === "증 제1호증" && ev.data.url, "증거 업로드 + 자동 이름");
const big = new FormData(); big.append("file", new Blob([Buffer.alloc(5 * 1024 * 1024 + 10)], { type: "image/png" }), "b.png");
ok((await P.req(`/api/cases/${id}/evidence?as=plaintiff`, { method: "POST", body: big })).status === 400, "5MB 초과 거부");
const txt = new FormData(); txt.append("file", new Blob(["hi"], { type: "text/plain" }), "a.txt");
ok((await P.req(`/api/cases/${id}/evidence?as=plaintiff`, { method: "POST", body: txt })).status === 400, "이미지 아닌 파일 거부");
ok((await D.req(`/api/cases/${id}/evidence/${ev.data.id}?as=defendant`, { method: "PATCH", json: { label: "남의 증거" } })).status === 403, "남의 증거 이름 수정 불가");
ok((await P.req(`/api/cases/${id}/evidence/${ev.data.id}?as=plaintiff`, { method: "PATCH", json: { label: "카톡 캡처" } })).status === 200, "내 증거 이름 수정");
const pick = await stranger.req(`/case/${id}/trial`);
ok(pick.status === 200 && pick.data.includes("본인 자리에 앉으십시오") && pick.data.includes(`/case/${id}/trial?as=plaintiff`), "공방 주소: 쿠키 없이 열면 원고·피고 자리 고르기");
const pre = await P.req(`/case/${id}/trial?as=plaintiff`);
ok(pre.status === 200 && !/\/j\/[A-Za-z0-9_-]{40,}/.test(pre.data) && new RegExp(`/case/${id}/trial\\\\?"`).test(pre.data), "공방 화면: 배심원 링크 없음, 보낼 공방 주소 있음");
ok((await stranger.req(`/api/cases/${id}/trial`)).status === 400, "자리(as) 없이 공방 조회 불가");
ok((await stranger.req(`/api/cases/${id}/statements?as=defendant`, { method: "POST", json: { sentences: ["끼어들기"] } })).status === 403, "상대 차례 자리로 진술 불가");
ok((await D.req(`/api/cases/${id}/jury`, { method: "POST", json: {} })).status === 404, "배심원 초대 API 없음");
ok((await P.req(`/api/cases/${id}/statements?as=plaintiff`, { method: "POST", json: { sentences: ["그 가게는 24시간입니다.", "두 문장"] } })).status === 400, "반박 1문장 제한");
ok((await stranger.req(`/api/cases/${id}/statements?as=plaintiff`, { method: "POST", json: { sentences: ["그 가게는 24시간입니다."], cardId: "delay", evidenceId: ev.data.id } })).status === 200, "쿠키 없는 브라우저에서 원고 자리로 반박 (대상 자동 + 카드 + 증거)");
ok(sql(`select target_sentence_idx from statements where case_id='${id}' and role='plaintiff'`) === "0", "반박 대상 자동 지정");
ok(sql(`select status || ':' || coalesce((select judged_by from judgments where case_id='${id}'), '-') from cases where id='${id}'`) === "judged:judge", "한마디씩 끝나면 바로 AI 재판장 판결");
ok(sql(`select voting_deadline_at is null from cases where id='${id}'`) === "t", "투표 마감 없음");
const tv = await P.req(`/api/cases/${id}/trial?as=plaintiff`);
ok(tv.status === 200 && tv.data.statements.length === 2 && !JSON.stringify(tv.data).includes("token_salt"), "공방 상태 조회 (salt 비노출)");

console.log("\n[4] 판결");
const vpage = await stranger.req(`/v/${id}`);
// 판결문 본문은 망치 연출 뒤 클라이언트에서 그려지므로 서버가 내려준 주문 문구로 확인
ok(vpage.status === 200 && vpage.data.includes(sql(`select order_text from judgments where case_id='${id}'`)), "판결 페이지에 주문");
ok(sql(`select verdict from judgments where case_id='${id}'`) === "defendant", "키 없을 때 규칙 판결: 진술 수 같으면 변호인 인용한 쪽 승");

console.log("\n[5] 집행 인증 기능 없음");
ok((await D.req(`/api/cases/${id}/execution`, { method: "POST", body: png() })).status === 404, "집행 인증 API 없음");

console.log("\n[6] OG 이미지");
for (const [path, w, h] of [[`/api/og/case/${def}`, 1200, 630], [`/api/og/judgment/${id}`, 1200, 630], [`/api/og/judgment/${id}?format=story`, 1080, 1920]]) {
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

console.log("\n[9] 맞고소 + 턴 만료 → 진술 포기 → AI 재판장 판결");
const P4 = new Jar("p4", "10.7.7.7"), D4 = new Jar("d4", "10.8.8.8");
const c4 = (await newCase(P4)).data.caseId; const l4 = await sendAndLink(P4, c4);
await D4.req(`/api/c/${l4.def}/respond`, { method: "POST", json: { action: "countersue" } });
sql(`update cases set trial_started_at = now() - interval '7 days' where id='${c4}'`);
await P4.req(`/api/cases/${c4}/trial?as=plaintiff`);
ok(sql(`select count(*) from statements where case_id='${c4}' and forfeited`) === "2", "만료된 턴 2개 진술 포기 기록");
ok(sql(`select judged_by from judgments where case_id='${c4}'`) === "judge", "턴 만료 후 AI 재판장 판결 (투표 단계 없음)");
ok(sql(`select voting_deadline_at is null from cases where id='${c4}'`) === "t", "투표 마감 없음");

console.log("\n[10] 기각");
const P5 = new Jar("p5", "10.10.0.1"), D5 = new Jar("d5", "10.10.0.2");
const c5 = (await newCase(P5)).data.caseId; const l5 = await sendAndLink(P5, c5);
ok((await D5.req(`/api/c/${l5.def}/report`, { method: "POST", json: { reason: "테스트 신고" } })).status === 200, "신고 접수");
await D5.req(`/api/c/${l5.def}/dismiss`, { method: "POST", json: {} });
ok((await D5.req(`/c/${l5.def}`)).data.includes("기각된 사건"), "피고 화면 문서 숨김");
ok((await P5.req(`/case/${c5}`)).data.includes("기각했습니다"), "원고 진행 차단");

console.log("\n[11] 차례 알림 링크");
const P7 = new Jar("p7", "10.12.0.1"), D7 = new Jar("d7", "10.12.0.2");
const c7 = (await newCase(P7)).data.caseId; const l7 = await sendAndLink(P7, c7);
await D7.req(`/api/c/${l7.def}/respond`, { method: "POST", json: { action: "object" } });
const T7 = new Jar("t7", "10.12.0.4");
const t7 = await T7.req(`/t/${l7.def}`);
ok(t7.status === 307 && t7.res.headers.get("location").endsWith(`/case/${c7}/trial?as=defendant`) && T7.header().includes("smf_"), "예전 차례 알림 링크(/t/) → 공방 화면 + 피고 쿠키");
ok((await new Jar("x", "10.12.0.5").req(`/case/${c7}/trial?as=defendant`)).status === 200, "링크만 있으면 쿠키 없이도 자리 골라 입장");

console.log("\n[11-1] 세부 사건 유형");
const P8 = new Jar("p8", "10.13.0.1");
const nt = await P8.req("/api/draft", { method: "POST", json: { input: { type: "dutch", plaintiff_nick: "지원", defendant_nick: "민수", incident_date: "2026-10-01", situation: "회식 2차 정산 안 함", demand: "17,500원" }, tone: "기본" } });
ok(nt.status === 200 && sql(`select type from cases where id='${nt.data.caseId}'`) === "dutch", "새 세부 유형(더치페이 미정산) 접수");
ok((await P8.req("/api/draft", { method: "POST", json: { input: { type: "chicken", plaintiff_nick: "a", defendant_nick: "b", incident_date: "2026-10-01", situation: "x", demand: "y" }, tone: "기본" } })).status === 400, "없는 유형 거부");

console.log("\n[12] IP당 시간당 초안 10회");
const P6 = new Jar("p6", "10.11.0.1");
let last;
for (let i = 0; i < 11; i++) last = await newCase(P6);
ok(last.status === 429, "11번째 초안 차단");

console.log(`\n결과: ${pass} 통과, ${failN} 실패`);
process.exit(failN ? 1 : 0);
