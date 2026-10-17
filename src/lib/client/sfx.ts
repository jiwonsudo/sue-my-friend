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

let master: AudioNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    // iOS: 무음 스위치가 켜져 있어도 효과음이 나게 (Safari 17+)
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "playback";
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** 모든 효과음이 지나가는 출력: 휴대폰 스피커에서도 들리게 키우고, 리미터로 찢어지지 않게 */
function out(a: AudioContext): AudioNode {
  if (master) return master;
  const comp = a.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 8;
  comp.ratio.value = 6;
  comp.attack.value = 0.002;
  comp.release.value = 0.12;
  const gain = a.createGain();
  gain.gain.value = 2.4;
  gain.connect(comp).connect(a.destination);
  master = gain;
  return master;
}

/**
 * 모바일 브라우저는 사용자가 화면을 처음 누를 때까지 소리를 막는다.
 * 첫 터치·클릭·키 입력에서 오디오를 깨우고 무음 한 샘플을 재생해 잠금을 푼다.
 */
function unlock() {
  const a = ac();
  if (!a) return;
  const src = a.createBufferSource();
  src.buffer = a.createBuffer(1, 1, 22050);
  src.connect(a.destination);
  src.start(0);
  if (a.state === "running") {
    for (const ev of ["pointerdown", "touchend", "keydown"]) window.removeEventListener(ev, unlock, true);
  }
}
if (typeof window !== "undefined") {
  for (const ev of ["pointerdown", "touchend", "keydown"]) window.addEventListener(ev, unlock, true);
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
  osc.connect(g).connect(out(a));
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
  src.connect(hp).connect(ng).connect(out(a));
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
  osc.connect(g).connect(out(a));
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
    osc.connect(g).connect(out(a));
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

// ── 책상 위 서류 작업 효과음 ─────────────────────────────
// 전부 노이즈·발진기로 합성한다. 음원 파일 없음.

type NoiseOpts = { at?: number; dur: number; type?: BiquadFilterType; freq: number; q?: number; gain: number; attack?: number; sweepTo?: number };

function noise(a: AudioContext, o: NoiseOpts) {
  const t = a.currentTime + (o.at ?? 0);
  const len = Math.max(1, Math.floor(a.sampleRate * o.dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  f.type = o.type ?? "bandpass";
  f.frequency.setValueAtTime(o.freq, t);
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t + o.dur);
  f.Q.value = o.q ?? 1;
  const atk = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.buffer = buf;
  src.connect(f).connect(g).connect(out(a));
  src.start(t);
  src.stop(t + o.dur + 0.02);
}

function tone(a: AudioContext, o: { at?: number; dur: number; type?: OscillatorType; from: number; to?: number; gain: number }) {
  const t = a.currentTime + (o.at ?? 0);
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.from, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  g.gain.setValueAtTime(o.gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(out(a));
  osc.start(t);
  osc.stop(t + o.dur + 0.02);
}

function play(fn: (a: AudioContext) => void) {
  if (isMuted()) return;
  const a = ac();
  if (!a) return;
  // 아직 깨어나는 중이면 깨어난 뒤에 재생 (그냥 두면 소리가 사라진다)
  if (a.state === "running") fn(a);
  else a.resume().then(() => fn(a)).catch(() => {});
}

/** 펜으로 쓰는 사각 소리 (입력할 때, 너무 잦지 않게 끊어서) */
let lastPen = 0;
export function playPen() {
  const now = Date.now();
  if (now - lastPen < 70) return;
  lastPen = now;
  play((a) => noise(a, { dur: 0.05 + Math.random() * 0.04, type: "highpass", freq: 3500 + Math.random() * 1500, gain: 0.05 }));
}

/** 체크칸에 체크 */
export function playTick() {
  play((a) => {
    noise(a, { dur: 0.06, type: "highpass", freq: 3000, gain: 0.08 });
    noise(a, { at: 0.07, dur: 0.1, type: "highpass", freq: 2600, gain: 0.07, sweepTo: 4000 });
  });
}

/** 도트 프린터: 한 줄 찍는 지지직 */
export function playPrintLine() {
  play((a) => {
    for (let i = 0; i < 6; i++) noise(a, { at: i * 0.035, dur: 0.03, type: "bandpass", freq: 1800 + Math.random() * 900, q: 4, gain: 0.08 });
    tone(a, { at: 0.22, dur: 0.12, type: "sawtooth", from: 90, to: 70, gain: 0.03 });
  });
}

/** 종이가 출지구에서 밀려 나오는 소리 */
export function playPaperFeed() {
  play((a) => noise(a, { dur: 0.5, type: "lowpass", freq: 900, gain: 0.06, attack: 0.08, sweepTo: 400 }));
}

/** 종이 접기 / 펼치기 (바스락) */
export function playFold() {
  play((a) => {
    noise(a, { dur: 0.22, type: "bandpass", freq: 2500, q: 0.8, gain: 0.12, attack: 0.03, sweepTo: 1200 });
    noise(a, { at: 0.16, dur: 0.06, type: "highpass", freq: 3000, gain: 0.08 });
  });
}

/** 종이를 옆으로 밀기 */
export function playSlide() {
  play((a) => noise(a, { dur: 0.35, type: "bandpass", freq: 1400, q: 0.6, gain: 0.07, attack: 0.1, sweepTo: 700 }));
}

/** 종이 구기기 */
export function playCrumple() {
  play((a) => {
    for (let i = 0; i < 9; i++) noise(a, { at: i * 0.05 + Math.random() * 0.03, dur: 0.05, type: "bandpass", freq: 1500 + Math.random() * 3000, q: 2, gain: 0.12 });
  });
}

/** 고무도장 쾅 (인주 찍는 소리 포함 여부) */
export function playStamp({ ink = false }: { ink?: boolean } = {}) {
  play((a) => {
    const dt = ink ? 0.18 : 0;
    if (ink) noise(a, { dur: 0.08, type: "lowpass", freq: 500, gain: 0.1 });
    tone(a, { at: dt, dur: 0.16, type: "sine", from: 140, to: 50, gain: 0.55 });
    noise(a, { at: dt, dur: 0.07, type: "lowpass", freq: 1200, gain: 0.25 });
  });
}

/** 봉투 뜯기 */
export function playTear() {
  play((a) => {
    for (let i = 0; i < 12; i++) noise(a, { at: i * 0.028, dur: 0.035, type: "bandpass", freq: 2200 + i * 120, q: 3, gain: 0.1 });
  });
}

/** 우편함 철문 열기: 끼익 + 덜컹 */
export function playMailbox() {
  play((a) => {
    tone(a, { dur: 0.35, type: "sawtooth", from: 420, to: 260, gain: 0.025 });
    tone(a, { at: 0.3, dur: 0.25, type: "square", from: 160, to: 70, gain: 0.08 });
    noise(a, { at: 0.3, dur: 0.12, type: "bandpass", freq: 900, q: 2, gain: 0.2 });
  });
}

/** 봉투를 책상 밖으로 휙 */
export function playWhoosh() {
  play((a) => noise(a, { dur: 0.4, type: "bandpass", freq: 600, q: 0.7, gain: 0.1, attack: 0.15, sweepTo: 2400 }));
}
