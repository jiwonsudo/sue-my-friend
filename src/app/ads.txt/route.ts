/** 광고 판매자 확인용 ads.txt. Google Ad Manager 에서 받은 줄을 ADS_TXT 환경변수에 넣는다 (여러 줄은 \n 으로 구분). */
export function GET() {
  const body = process.env.ADS_TXT?.replaceAll("\\n", "\n").trim();
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(`${body}\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
