import "server-only";
import { DISCLAIMER, SERVICE_NAME } from "@/lib/constants";

type Font = { name: string; data: ArrayBuffer; weight: 400 | 700 | 900; style: "normal" };

const cache = new Map<string, ArrayBuffer>();

/** Google Fonts 에서 필요한 글자만 잘라 받아온다 (한글 글리프용). 실패하면 기본 폰트로. */
async function load(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  const chars = [...new Set(text)].sort().join("");
  const key = `${family}:${weight}:${chars}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(chars)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const data = await (await fetch(src)).arrayBuffer();
    if (cache.size > 200) cache.clear();
    cache.set(key, data);
    return data;
  } catch {
    return null;
  }
}

export async function ogFonts(text: string): Promise<Font[]> {
  const all = `${text}${DISCLAIMER}${SERVICE_NAME}${SERVICE_NAME.replaceAll(" ", "")}친고서식제호쪽0123456789-.·:()[]「」 `;
  const [serif, serifBold, type, hand] = await Promise.all([
    load("Noto Serif KR", 400, all),
    load("Noto Serif KR", 900, all),
    load("Nanum Gothic Coding", 700, all),
    load("Nanum Pen Script", 400, all),
  ]);
  const fonts: Font[] = [];
  if (serif) fonts.push({ name: "Serif", data: serif, weight: 400, style: "normal" });
  if (serifBold) fonts.push({ name: "Serif", data: serifBold, weight: 900, style: "normal" });
  if (type) fonts.push({ name: "Type", data: type, weight: 700, style: "normal" });
  if (hand) fonts.push({ name: "Hand", data: hand, weight: 400, style: "normal" });
  return fonts;
}

export const OG = {
  paper: "#fbf8f1",
  paper2: "#f3eee2",
  ink: "#1a1a1a",
  inkBlue: "#1f2d5c",
  seal: "#c8102e",
  court: "#14161c",
  muted: "#6b6b6b",
  wood: "#5e4029",
  woodDark: "#2b1d13",
  mat: "#2e4337",
  postit: "#f5e27c",
};

/** 위에서 본 원목 책상 배경 (나뭇결 줄) */
export const woodBg = {
  backgroundColor: OG.wood,
  backgroundImage:
    "linear-gradient(90deg, rgba(0,0,0,0.22), rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.22)), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.05) 13%, rgba(255,255,255,0.03) 27%, rgba(0,0,0,0.06) 41%, rgba(255,255,255,0.03) 58%, rgba(0,0,0,0.05) 73%, rgba(255,255,255,0.04) 88%, rgba(0,0,0,0.05) 100%)",
} as const;

export const sheetShadow = "0 2px 2px rgba(0,0,0,0.25), 0 24px 40px rgba(0,0,0,0.45)";

/** 라벨 테이프에 찍은 서비스 이름 (원형 인장 대신) */
export function Brand({ size = 26, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        background: dark ? "transparent" : "#141414",
        border: dark ? "2px solid rgba(255,255,255,0.35)" : "none",
        color: "#f2f0ea",
        fontFamily: "Type",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: size * 0.18,
        padding: `${size * 0.25}px ${size * 0.5}px`,
        boxShadow: dark ? "none" : "0 3px 4px rgba(0,0,0,0.5)",
      }}
    >
      {SERVICE_NAME.replaceAll(" ", "")}
    </div>
  );
}

/** 이중 테두리 고무도장 */
export function StampBox({ text, size = 40, rotate = -8 }: { text: string; size?: number; rotate?: number }) {
  const b = Math.max(3, size / 12);
  return (
    <div style={{ display: "flex", padding: b * 1.2, border: `${b}px solid ${OG.seal}`, transform: `rotate(${rotate}deg)`, opacity: 0.88 }}>
      <div
        style={{
          display: "flex",
          border: `${b}px solid ${OG.seal}`,
          color: OG.seal,
          padding: `${size * 0.08}px ${size * 0.35}px`,
          fontSize: size,
          fontWeight: 900,
          letterSpacing: size * 0.15,
        }}
      >
        {text}
      </div>
    </div>
  );
}

/** 서식 번호 줄: [친고 서식 제N호] ... (1쪽) */
export function FormLine({ no, side, size = 18 }: { no: string; side?: string; size?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Type", fontSize: size, color: "rgba(0,0,0,0.45)" }}>
      <span>[{no}]</span>
      <span>{side ?? ""}</span>
    </div>
  );
}
