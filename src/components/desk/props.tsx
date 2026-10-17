/** 책상 소품. 전부 직접 그린 SVG (외부 이미지 없음). 위에서 내려다본 모습. */

type P = { className?: string; style?: React.CSSProperties };

export function FountainPen({ className = "", style }: P) {
  return (
    <svg viewBox="0 0 320 40" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="pen-barrel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3f4a" />
          <stop offset="0.35" stopColor="#14161b" />
          <stop offset="1" stopColor="#050506" />
        </linearGradient>
        <linearGradient id="pen-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1d68a" />
          <stop offset="1" stopColor="#9b7a2c" />
        </linearGradient>
      </defs>
      <ellipse cx="170" cy="30" rx="150" ry="6" fill="#000" opacity="0.28" />
      <path d="M6 19 L46 11 L46 27 Z" fill="url(#pen-gold)" />
      <path d="M8 19 H40" stroke="#5b4615" strokeWidth="0.8" />
      <circle cx="36" cy="19" r="1.6" fill="#5b4615" />
      <rect x="44" y="11" width="26" height="16" rx="3" fill="#0c0c0e" />
      <rect x="68" y="8" width="150" height="22" rx="10" fill="url(#pen-barrel)" />
      <rect x="216" y="7" width="7" height="24" fill="url(#pen-gold)" />
      <rect x="221" y="7" width="93" height="24" rx="11" fill="url(#pen-barrel)" />
      <rect x="236" y="16" width="72" height="5" rx="2.5" fill="url(#pen-gold)" />
      <rect x="72" y="11" width="236" height="2.5" rx="1.25" fill="#fff" opacity="0.22" />
    </svg>
  );
}

export function RedPen({ className = "", style }: P) {
  return (
    <svg viewBox="0 0 260 24" className={className} style={style} aria-hidden>
      <ellipse cx="130" cy="19" rx="120" ry="4" fill="#000" opacity="0.25" />
      <path d="M4 12 L22 8 L22 16 Z" fill="#cf2a27" />
      <path d="M20 7 h12 v10 h-12 z" fill="#d9d9d9" />
      <rect x="30" y="5" width="200" height="14" rx="3" fill="#f2f2f0" />
      <rect x="30" y="5" width="200" height="4" rx="2" fill="#fff" opacity="0.7" />
      <rect x="196" y="4" width="58" height="16" rx="4" fill="#cf2a27" />
      <rect x="206" y="9" width="44" height="3" rx="1.5" fill="#fff" opacity="0.3" />
    </svg>
  );
}

/** 인주 통 (뚜껑 열림) */
export function InkPad({ className = "", style }: P) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id="ink-tin" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#e8e6e1" />
          <stop offset="0.7" stopColor="#a9a59c" />
          <stop offset="1" stopColor="#6f6b63" />
        </radialGradient>
        <filter id="ink-tex">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 0.45 0 0 0 0 0 0 0 0 0 0.05 0 0 0 0.6 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <circle cx="62" cy="64" r="52" fill="#000" opacity="0.3" />
      <circle cx="58" cy="58" r="52" fill="url(#ink-tin)" />
      <circle cx="58" cy="58" r="43" fill="#9f1020" />
      <circle cx="58" cy="58" r="43" fill="#fff" filter="url(#ink-tex)" />
      <ellipse cx="46" cy="44" rx="14" ry="8" fill="#fff" opacity="0.12" />
    </svg>
  );
}

/** 막도장 (뉘어 놓은 모습) */
export function StampStick({ className = "", style }: P) {
  return (
    <svg viewBox="0 0 150 40" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="stick-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9cf9a" />
          <stop offset="0.5" stopColor="#c99a55" />
          <stop offset="1" stopColor="#8a5d2a" />
        </linearGradient>
      </defs>
      <ellipse cx="78" cy="33" rx="66" ry="5" fill="#000" opacity="0.3" />
      <rect x="10" y="6" width="130" height="26" rx="13" fill="url(#stick-wood)" />
      <rect x="10" y="6" width="14" height="26" rx="4" fill="#a41425" />
      <path d="M40 10 q30 3 60 0 M44 26 q30 -2 70 1" stroke="#7b521f" strokeWidth="0.8" fill="none" opacity="0.5" />
    </svg>
  );
}

export function PaperClip({ className = "", style }: P) {
  return (
    <svg viewBox="0 0 30 80" className={className} style={style} aria-hidden>
      <path
        d="M10 22 V60 a8 8 0 0 0 16 0 V14 a11 11 0 0 0 -22 0 V58"
        fill="none"
        stroke="#00000055"
        strokeWidth="3.4"
        strokeLinecap="round"
        transform="translate(1.5 2)"
      />
      <path d="M10 22 V60 a8 8 0 0 0 16 0 V14 a11 11 0 0 0 -22 0 V58" fill="none" stroke="#b9bcc2" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 22 V60 a8 8 0 0 0 16 0 V14 a11 11 0 0 0 -22 0 V58" fill="none" stroke="#f4f5f7" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/** 커피잔 자국. 종이 위에도 책상 위에도 올린다. */
export function CoffeeRing({ className = "", style }: P) {
  return (
    <svg viewBox="0 0 140 140" className={className} style={{ mixBlendMode: "multiply", ...style }} aria-hidden>
      <circle cx="70" cy="70" r="54" fill="none" stroke="#8a5a2b" strokeWidth="5" opacity="0.18" strokeDasharray="250 18 60 12" />
      <circle cx="70" cy="70" r="51" fill="none" stroke="#7a4a1f" strokeWidth="1.6" opacity="0.28" strokeDasharray="120 30 140" />
      <circle cx="71" cy="69" r="47" fill="#a8763d" opacity="0.05" />
      <circle cx="125" cy="98" r="3.5" fill="#8a5a2b" opacity="0.18" />
    </svg>
  );
}

/** 쌓아 둔 서류철 */
export function FolderStack({ className = "", style }: P) {
  return (
    <svg viewBox="0 0 260 200" className={className} style={style} aria-hidden>
      <g transform="rotate(-4 130 100)">
        <rect x="18" y="26" width="220" height="160" rx="3" fill="#000" opacity="0.3" />
        <rect x="12" y="18" width="220" height="160" rx="3" fill="#cfae6c" />
        <path d="M24 18 v-10 h70 l8 10 z" fill="#cfae6c" />
      </g>
      <g transform="rotate(3 130 100)">
        <rect x="10" y="20" width="220" height="160" rx="3" fill="#e3c98f" />
        <path d="M150 20 v-12 h62 l8 12 z" fill="#e3c98f" />
        <rect x="160" y="10" width="44" height="7" fill="#fbf8f1" opacity="0.8" />
        <rect x="30" y="40" width="180" height="2" fill="#000" opacity="0.06" />
      </g>
    </svg>
  );
}

/** 압정 대신 쓰는 클립형 집게 (바인더 클립) */
export function BinderClip({ className = "", style }: P) {
  return (
    <svg viewBox="0 0 70 60" className={className} style={style} aria-hidden>
      <path d="M18 26 L10 4 M52 26 L60 4" stroke="#9aa0a8" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 4 h50" stroke="#9aa0a8" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 24 h58 l-4 30 h-50 z" fill="#1c1d21" />
      <path d="M8 26 h54" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" />
    </svg>
  );
}

export function Scissors({ className = "", style }: P) {
  return (
    <svg viewBox="0 0 24 16" className={className} style={style} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="4.5" cy="4" r="3" />
      <circle cx="4.5" cy="12" r="3" />
      <path d="M7 5.5 L22 12 M7 10.5 L22 4" strokeLinecap="round" />
    </svg>
  );
}
