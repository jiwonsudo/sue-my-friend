"use client";

/** 외부 음원 없이 WebAudio 로 직접 만든 짧은 효과음 */
let ctx: AudioContext | null = null;
const KEY = "smf_muted";

export function isMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(m: boolean) {
  try {
    localStorage.setItem(KEY, m ? "1" : "0");
  } catch {}
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** 컷인: 낮은 쿵 + 짧은 노이즈 쨍 */
export function playImpact() {
  if (isMuted()) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + 0.42);

  const len = Math.floor(a.sampleRate * 0.25);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = a.createBufferSource();
  const hp = a.createBiquadFilter();
  const ng = a.createGain();
  hp.type = "highpass";
  hp.frequency.value = 2200;
  ng.gain.value = 0.35;
  src.buffer = buf;
  src.connect(hp).connect(ng).connect(a.destination);
  src.start(t);
}

/** 타이핑 삑 */
export function playBlip() {
  if (isMuted()) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = "square";
  osc.frequency.value = 620 + Math.random() * 60;
  g.gain.setValueAtTime(0.04, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + 0.06);
}

/** 법정 망치 */
export function playGavel() {
  if (isMuted()) return;
  const a = ac();
  if (!a) return;
  [0, 0.28].forEach((dt) => {
    const t = a.currentTime + dt;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g).connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}
