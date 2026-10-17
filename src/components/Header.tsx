import Link from "next/link";
import { SERVICE_NAME } from "@/lib/constants";

export function Header({ dark = false, right }: { dark?: boolean; right?: React.ReactNode }) {
  return (
    <header
      className={`sticky top-0 z-30 flex h-12 items-center justify-between px-4 backdrop-blur ${
        dark ? "bg-court/80 text-white" : "bg-white/85 text-ink border-b border-black/5"
      }`}
    >
      <Link href="/" className="flex items-center gap-1.5 font-bold tracking-tight">
        <span
          aria-hidden
          className="grid h-6 w-6 place-items-center rounded-full border-2 border-seal font-serif text-[11px] font-black text-seal"
        >
          訴
        </span>
        {SERVICE_NAME}
      </Link>
      {right}
    </header>
  );
}
