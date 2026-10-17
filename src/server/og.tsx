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
  const all = `${text}${DISCLAIMER}${SERVICE_NAME}0123456789-.·:()「」 `;
  const [serif, serifBold] = await Promise.all([load("Noto Serif KR", 400, all), load("Noto Serif KR", 900, all)]);
  const fonts: Font[] = [];
  if (serif) fonts.push({ name: "Serif", data: serif, weight: 400, style: "normal" });
  if (serifBold) fonts.push({ name: "Serif", data: serifBold, weight: 900, style: "normal" });
  return fonts;
}

export const OG = {
  paper: "#fbf8f1",
  ink: "#1a1a1a",
  seal: "#c8102e",
  court: "#14161c",
  muted: "#6b6b6b",
};

export function Brand({ color = OG.ink, size = 28 }: { color?: string; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color, fontSize: size, fontWeight: 900 }}>
      <div
        style={{
          display: "flex",
          width: size * 1.2,
          height: size * 1.2,
          borderRadius: 999,
          border: `3px solid ${OG.seal}`,
          color: OG.seal,
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.55,
        }}
      >
        訴
      </div>
      {SERVICE_NAME}
    </div>
  );
}

export function StampBox({ text, size = 40, rotate = -8 }: { text: string; size?: number; rotate?: number }) {
  return (
    <div
      style={{
        display: "flex",
        border: `${Math.max(4, size / 8)}px solid ${OG.seal}`,
        color: OG.seal,
        padding: `${size * 0.1}px ${size * 0.4}px`,
        fontSize: size,
        fontWeight: 900,
        letterSpacing: size * 0.15,
        transform: `rotate(${rotate}deg)`,
        borderRadius: 6,
        opacity: 0.9,
      }}
    >
      {text}
    </div>
  );
}
