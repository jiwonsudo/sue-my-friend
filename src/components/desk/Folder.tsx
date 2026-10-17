/** 펼친 마닐라 서류철. 탭에 사건번호. */
export function Folder({ tab, children, className = "" }: { tab: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mt-8 ${className}`}>
      <div className="manila absolute -top-7 left-3 h-9 w-44 rounded-t-[6px] px-3 pt-1.5 [clip-path:polygon(0_0,92%_0,100%_100%,0_100%)]">
        <span className="block border border-black/15 bg-paper/80 px-1.5 font-type text-[11.5px] leading-5 tracking-wide text-ink">{tab}</span>
      </div>
      <div className="manila relative rounded-[3px] px-2.5 pt-3 pb-4">
        <div className="pointer-events-none absolute inset-x-0 top-1.5 h-px bg-black/10" />
        {children}
      </div>
    </div>
  );
}
