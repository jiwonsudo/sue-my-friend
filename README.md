# 내 친구 고소하기

치킨 내기, 읽씹, 노쇼, 빌린 돈 같은 사소한 원한을 아주 진지한 통고서로 보내고, 상대가 버티면 한마디씩 주고받고(피고 → 원고) 바로 AI 재판장 판결까지 가는 장난 웹 서비스.

> 형식은 끝까지 진지한 법률 문서, 내용은 끝까지 하찮게.

- Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion
- Supabase (Postgres + Storage), 클라이언트는 Supabase에 직접 접근하지 않음
- Anthropic API (`@anthropic-ai/sdk`)로 통고서 초안 생성
- `next/og`로 링크 미리보기·판결문 이미지 생성

---

## 로컬 실행

필요한 것: Node 20+, pnpm, Docker(로컬 Supabase용)

```bash
pnpm install
pnpm exec supabase start      # 로컬 Supabase (Docker)
pnpm exec supabase db reset   # supabase/migrations 적용
cp .env.example .env.local    # 아래 환경변수 채우기
pnpm dev
```

로컬 Supabase 키는 `pnpm exec supabase status -o env`로 확인할 수 있습니다 (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`).

> `ANTHROPIC_API_KEY`가 비어 있고 `NODE_ENV`가 production이 아니면, 초안 API는 **고정된 가짜 초안**을 돌려줍니다. 키 없이도 전체 흐름을 테스트할 수 있게 하기 위함이며, 배포 환경에서는 동작하지 않습니다.

Studio 등 무거운 컨테이너가 필요 없다면:

```bash
pnpm exec supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,realtime,inbucket,postgres-meta
```

## 환경변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | anon 키. RLS로 모든 테이블이 막혀 있어 실제로는 쓰이지 않지만 표준 설정으로 둠 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | 서버 전용. 모든 DB·Storage 접근은 이 키로 Route Handler에서만 |
| `ANTHROPIC_API_KEY` | ✓(배포) | 초안 생성용 |
| `ANTHROPIC_MODEL` | ✓ | 기본 `claude-sonnet-5-5` (사건당 200원 상한 기준). Opus 는 200원 안에서 재생성 횟수가 줄어듦 |
| `AI_BUDGET_KRW_PER_CASE` | | 사건 1건당 AI 비용 상한(원). 기본 200 |
| `KRW_PER_USD` | | 상한 계산용 환율. 기본 1400 |
| `NEXT_PUBLIC_GAM_REWARDED_UNIT` | | Google Ad Manager 보상형 광고 단위. 비우면 배포에서 변호인 기능 숨김 |
| `ADS_TXT` | | `/ads.txt` 내용 (Ad Manager 판매자 확인) |
| `NEXT_PUBLIC_AD_MOCK` | | `1`이면 배포에서도 가짜 광고 (테스트용) |
| `AI_LAWYER_BUDGET_KRW` | | AI 변호인 1회 비용 상한(원). 기본 40 |
| `NEXT_PUBLIC_OPERATOR_NAME` | | 약관·개인정보처리방침의 운영자(보호책임자) 이름 |
| `NEXT_PUBLIC_CONTACT_EMAIL` | | 약관·개인정보처리방침의 문의 이메일. 비우면 '[신고] 기능'으로 안내 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | | 카카오 JS 키. 없으면 [카톡으로 보내기]가 Web Share → 링크 복사로 대체 |
| `NEXT_PUBLIC_SITE_URL` | ✓ | 예: `https://sue-my-friend.vercel.app` (링크·OG 이미지 절대 경로, Origin 검사에 사용) |
| `PROMPT_CANARY` | ✓ | 시스템 프롬프트 끝에 붙는 랜덤 문자열. 출력에 나오면 유출로 보고 폐기 |
| `TOKEN_SECRET` | ✓ | 32자 이상 랜덤 (`openssl rand -hex 32`). 피고 링크 토큰 파생용 |

## Supabase 설정 순서 (클라우드)

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. 로컬에서 연결하고 마이그레이션 적용
   ```bash
   pnpm exec supabase login
   pnpm exec supabase link --project-ref <프로젝트 ref>
   pnpm exec supabase db push
   ```
3. Storage에 비공개 버킷 `evidence`가 생겼는지 확인 (마이그레이션이 생성: 비공개, 5MB, 이미지 MIME만)
4. Project Settings → API에서 URL, anon 키, service_role 키를 복사해 환경변수에 넣기
5. (선택) 카카오 개발자 콘솔에서 JS 키 발급 → 플랫폼 > Web에 사이트 도메인 등록

## Vercel 배포

1. 저장소를 Vercel에 Import
2. 위 환경변수 전부 등록 (`NEXT_PUBLIC_SITE_URL`은 실제 도메인)
3. Deploy

---

## 구조

```
src/
  app/
    page.tsx                  랜딩
    new/                      통고서 작성 · 미리보기 · 톤 재생성 · 직접 수정
    case/[id]/                원고 현황판 (원고 쿠키 필요)
    case/[id]/trial/          공방 (원고/피고 쿠키)
    c/[token]/                피고 수신 (우편함 연출)
    t/[token]/                차례 알림 링크 → 쿠키 발급 후 공방으로
    v/[caseId]/               판결문 (공개)
    enter/[token]/            "내 사건 링크" → 쿠키 발급 후 이동
    api/...                   모든 쓰기·읽기 (service role)
    api/og/...                링크 미리보기·판결문 이미지
  server/                     서버 전용 (server-only)
    prompts/draft.ts          시스템 프롬프트 (이 파일에만)
    llm.ts                    초안 생성 + 유출 검사
    cases.ts                  사건 로드 + lazy 기한 처리 + 판결 생성
    auth.ts, tokens.ts        링크 토큰·쿠키 인증
  lib/                        클라이언트·서버 공용 (상수, 문서 템플릿, 공방 순서)
supabase/migrations/          DB 스키마 (RLS 전면 차단)
```

### 접근 방식

- 로그인 없음. 역할별 링크 토큰(32바이트, base64url)으로 들어오고, DB에는 SHA-256 해시만 저장.
  - 원고: 사건 생성 시 랜덤 토큰 발급 → httpOnly 쿠키 + "내 사건 링크"(`/enter/<token>`)
  - 피고: `HMAC(TOKEN_SECRET, 사건id:역할:사건별 salt)`로 파생. 원고가 현황판에서 발송 링크를 다시 볼 수 있어야 해서 원문을 저장하지 않고 파생하는 방식을 택함.
  - 피고는 `/c/<token>`을 열 때 피고 쿠키가 발급되어 이후 공방 화면에 들어갈 수 있음.
- 모든 테이블 RLS ON + 정책 없음 + anon/authenticated 권한 회수. 읽기·쓰기는 Route Handler에서 service role로, 서버가 쿠키 토큰과 역할을 검증.
- 모든 POST/PATCH는 `Origin` 헤더가 같은 출처일 때만 허용.
- 증거 이미지는 비공개 버킷, 화면에는 1시간 서명 URL로만. (집행 인증 기능은 없앰. `judgments.execution_proof_path`·`executed_at` 칸은 쓰지 않음)

### 기한 처리 (크론 없음)

사건을 불러올 때마다(`loadCase`) 서버가 마감을 확인하고 상태를 넘깁니다.

- 답변 기한(12h) 경과 → `defendant_response = ignore`, 궐석 판결
- 공방 턴(6h) 경과 → 해당 턴을 "진술 포기"로 기록하고 다음 턴으로 (여러 턴이 지났으면 연속 처리)
- 공방 종료(6턴 모두 진술 또는 진술 포기) → AI 재판장이 바로 판결

### 사건당 AI 비용 상한

- 초안·재생성·AI 재판장을 합쳐 사건 1건에 `AI_BUDGET_KRW_PER_CASE`(기본 200원)를 넘지 않게 호출한다 (`src/server/aiBudget.ts`).
- 사용액은 `cases.ai_cost_usd`에 실제 청구 토큰(`usage`) 기준으로 누적한다.
- 호출 전에 남은 예산에서 입력 비용(글자 수 × 1.5 토큰으로 넉넉히 추정)을 빼고, 남는 만큼만 `max_tokens`로 준다. 출력은 `max_tokens`를 넘지 않으므로 호출 1번이 상한을 넘을 수 없다.
- 초안은 AI 재판장 몫(입력 8천 + 출력 3천 토큰)을 남겨 두고 쓴다. 남은 예산으로 초안이 잘릴 정도면 재생성을 거절한다("AI 사용 한도에 도달").
- AI 재판장도 남은 예산이 모자라면 부르지 않고 규칙 기반으로 판결한다.
- 생각(thinking) 토큰도 출력 요금이라 두 호출 모두 `effort: "low"`.

### 광고 보상형 AI 변호인

- 내 차례마다 1번, [광고 보고 변호인 선임] → 보상형 광고 시청 → AI 변호인이 법 조항을 인용한 이의 2~3개를 추천 → 하나 골라 제출.
- 인용 조항은 `src/lib/laws.ts`의 실존 조항 목록(요지)에서만 고른다. 목록 밖 조항은 버리고, 키가 없거나 실패하면 정해진 문장으로 추천.
- 광고 확인: 광고를 띄우기 직전 서버가 일회용 티켓을 발급하고(`lawyer_uses`), 발급 후 5초가 지나야 선임된다. 웹 보상형 광고(GPT)는 서버 측 보상 검증이 없어서 이 정도가 한계다.
- 보여 줄 광고가 없으면(no fill, 데스크톱 등) 그 차례는 무료로 선임해 준다.
- 변호인이 인용한 진술은 AI 재판장에게 가산점(프롬프트), 규칙 기반 판결에서는 1건당 +0.5점.
- 비용: 1회 `AI_LAWYER_BUDGET_KRW`(기본 40원) 상한, 사건당 200원과 별도.
- Google Ad Manager 설정: 계정 → 사이트 등록·승인 → 보상형(Rewarded) 광고 단위 생성 → `NEXT_PUBLIC_GAM_REWARDED_UNIT`, `ADS_TXT` 환경변수. 보상형 웹 광고는 모바일 화면에서만 나온다.

### AI 재판장

- AI 재판장은 청구와 양측이 제출한 진술(증언·반박·최후진술, 항변 카드, 진술 포기)만으로 판결한다. 시스템 프롬프트는 `src/server/prompts/judge.ts`.
- `ANTHROPIC_API_KEY`가 없거나 호출이 실패·거절되면 정해진 규칙으로 판결한다: 진술을 포기한 턴이 적은 쪽이 이기고, 같으면 쌍방 과실.
- `judgments.judged_by`: `system`(인낙·궐석), `judge`(AI 재판장). 배심원 제도는 없앴고 `votes` 테이블·`jury_invited_at`·`voting_deadline_at` 칸은 쓰지 않음 (예전 데이터 호환용으로 남겨 둠)

### 테스트할 때 마감 당기기

```sql
-- 답변 기한 → 궐석 판결
update cases set response_deadline_at = now() - interval '1 minute' where case_no = '2026킹-0001';
-- 공방 턴 만료 → 진술 포기 (시작 시각을 과거로)
update cases set trial_started_at = now() - interval '2 days' where case_no = '2026킹-0001';
```

로컬에서는 `docker exec -it supabase_db_sue-my-friend psql -U postgres`로 접속할 수 있습니다. 다음에 그 사건 화면을 열면 반영됩니다.

### 프롬프트 추출 방지

1. 시스템 프롬프트는 `src/server/prompts/draft.ts`에만 있고 `server-only`로 클라이언트 번들에 들어가지 않음. API는 파싱한 `title`, `items`, `preview_line`만 반환.
2. 출력에 `PROMPT_CANARY`가 있거나, 시스템 프롬프트와 연속 20자 이상 겹치면(공백·JSON 기호·이스케이프를 정규화해서 비교) 폐기 후 재생성. 2회 연속이면 "초안을 만들 수 없는 내용이에요". 프롬프트가 그대로 쓰라고 지시한 지체책임 문장과 자리표시자는 예외.
3. 입력 길이 제한(무슨 일 500자, 원하는 것 100자), `<user_input>` 태그 문자열 제거.
4. IP당 시간당 초안 10회, 사건당 4회(최초 1 + 재생성 3).
5. 같은 출처 요청만 허용.

## 스크립트

```bash
pnpm dev         # 개발 서버
pnpm build       # 프로덕션 빌드
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
```
