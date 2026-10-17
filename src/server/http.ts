import "server-only";
import { NextResponse, type NextRequest } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function fail(status: number, message: string): never {
  throw new HttpError(status, message);
}

/** 같은 출처에서 온 요청만 허용 */
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) fail(403, "허용되지 않은 요청입니다.");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    fail(403, "허용되지 않은 요청입니다.");
  }
  const hosts = new Set<string>();
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) hosts.add(host);
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try {
      hosts.add(new URL(site).host);
    } catch {}
  }
  if (!hosts.has(originHost)) fail(403, "허용되지 않은 요청입니다.");
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

/** Route Handler 공통 래퍼: HttpError 는 메시지 그대로, 나머지는 숨긴다. */
export function handle<C>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      console.error("[api]", e instanceof Error ? e.message : "unknown error");
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }
  };
}

export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    fail(400, "요청 형식이 올바르지 않습니다.");
  }
}

export function siteUrl(req?: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  if (req) return req.nextUrl.origin;
  return "http://localhost:3000";
}
