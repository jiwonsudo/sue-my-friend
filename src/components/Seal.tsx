/** 서비스 자체 디자인 도장. 실제 관인과 닮지 않게 둥근 사각 + 이름. */
export function Seal({ name, size = 64, className = "" }: { name: string; size?: number; className?: string }) {
  const chars = [...name].slice(0, 4);
  const lines = chars.length <= 2 ? [chars.join("")] : [chars.slice(0, 2).join(""), chars.slice(2).join("")];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`${name} 도장`}
      style={{ mixBlendMode: "multiply" }}
    >
      <defs>
        <filter id="seal-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
        </filter>
      </defs>
      <g filter="url(#seal-rough)" fill="none" stroke="#c8102e" opacity="0.88">
        <rect x="8" y="8" width="84" height="84" rx="22" strokeWidth="7" />
        <text
          x="50"
          y={lines.length === 1 ? 62 : 46}
          textAnchor="middle"
          fill="#c8102e"
          stroke="none"
          fontFamily="var(--font-serif)"
          fontWeight="900"
          fontSize={lines.length === 1 ? (lines[0].length === 1 ? 44 : 32) : 28}
        >
          {lines[0]}
        </text>
        {lines[1] && (
          <text x="50" y="76" textAnchor="middle" fill="#c8102e" stroke="none" fontFamily="var(--font-serif)" fontWeight="900" fontSize="28">
            {lines[1]}
          </text>
        )}
      </g>
    </svg>
  );
}

/** 봉투·판결문용 사각 스탬프 */
export function RubberStamp({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span
      className={`inline-block rounded-sm border-[3px] border-seal px-2 py-0.5 font-serif text-lg font-black tracking-[0.2em] text-seal opacity-90 ${className}`}
      style={{ mixBlendMode: "multiply" }}
    >
      {text}
    </span>
  );
}
