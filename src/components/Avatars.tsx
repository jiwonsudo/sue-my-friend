/** 단색 실루엣 아바타 (자체 디자인) */
type P = { size?: number; className?: string; active?: boolean };

export function PlaintiffAvatar({ size = 72, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden fill="currentColor">
      <path d="M50 14c-11 0-19 8-19 19 0 4 1 8 3 11-2 1-3 3-2 5 1 3 3 4 5 4 2 6 7 10 13 10s11-4 13-10c2 0 4-1 5-4 1-2 0-4-2-5 2-3 3-7 3-11 0-11-8-19-19-19z" />
      <path d="M31 30c2-12 12-18 22-17 9 1 17 7 17 17-6-5-13-6-19-3-6 3-13 4-20 3z" opacity=".6" />
      <path d="M16 100c0-17 12-28 26-31l8 10 8-10c14 3 26 14 26 31z" />
      <path d="M48 72h4l2 10-4 8-4-8z" fill="#c8102e" />
    </svg>
  );
}

export function DefendantAvatar({ size = 72, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden fill="currentColor">
      <path d="M50 10c-15 0-26 11-26 26v14c0 6 3 11 7 14l-2 4h42l-2-4c4-3 7-8 7-14V36c0-15-11-26-26-26z" opacity=".55" />
      <path d="M50 22c-10 0-17 8-17 18 0 4 1 7 3 10 2 7 7 12 14 12s12-5 14-12c2-3 3-6 3-10 0-10-7-18-17-18z" />
      <path d="M12 100c0-18 12-30 28-33 3 4 6 6 10 6s7-2 10-6c16 3 28 15 28 33z" />
      <path d="M42 76v16M58 76v16" stroke="#14161c" strokeWidth="2" />
    </svg>
  );
}

export function JudgeAvatar({ size = 72, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden fill="currentColor">
      <circle cx="50" cy="32" r="16" />
      <path d="M34 26c0-10 7-16 16-16s16 6 16 16c-5-4-10-5-16-5s-11 1-16 5z" opacity=".6" />
      <path d="M10 100c0-20 13-34 30-38l10 12 10-12c17 4 30 18 30 38z" />
      <path d="M42 62l8 12 8-12-8 4z" fill="#fff" />
      <g transform="rotate(-30 80 70)">
        <rect x="70" y="62" width="22" height="9" rx="2" fill="#c8102e" />
        <rect x="79" y="70" width="4" height="18" fill="#c8102e" />
      </g>
    </svg>
  );
}
