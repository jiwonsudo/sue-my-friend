import { BrandLabel } from "./desk/Desk";

/** 법정(어두운 화면) 상단 */
export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-white/10 bg-court px-4 text-white">
      <BrandLabel dark />
      {right}
    </header>
  );
}
