/** 손글씨 포스트잇 */
export function PostIt({
  children,
  rotate = 2,
  className = "",
  style,
}: {
  children: React.ReactNode;
  rotate?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`postit px-3 pt-2.5 pb-3 font-hand text-[21px] leading-[1.15] text-ink ${className}`} style={{ transform: `rotate(${rotate}deg)`, ...style }}>
      {children}
    </div>
  );
}
