import Link from "next/link";
import { SERVICE_NAME } from "@/lib/constants";
import { DeskTray } from "./DeskTray";
import { SoundToggle } from "./SoundToggle";
import { CoffeeRing, FolderStack, FountainPen, InkPad, PaperClip, RedPen, StampStick } from "./props";

export type DeskScene = "intake" | "folder" | "defendant" | "judgment" | "plain";

/**
 * 위에서 내려다본 변호사 책상.
 * - 책상 면과 소품은 화면에 고정(fixed)되고, 서류(children)가 그 위로 스크롤된다.
 * - 책상은 1200px 폭으로 그리고 가운데를 맞춘다. 모바일에서는 가장자리만 보이고, 가로 스크롤은 생기지 않는다.
 * - tray: 엄지가 닿는 하단 고정 영역 (핵심 버튼, 카운트다운)
 */
export function Desk({
  children,
  tray,
  scene = "plain",
  right,
}: {
  children: React.ReactNode;
  tray?: React.ReactNode;
  scene?: DeskScene;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh">
      <DeskSurface scene={scene} />
      <div className="relative z-10 mx-auto flex h-14 max-w-[480px] items-center justify-between px-4">
        <BrandLabel />
        {right ?? <SoundToggle />}
      </div>
      <main className="relative z-10 mx-auto w-full max-w-[480px] px-5 pb-[calc(var(--tray-h,0px)+40px)]">{children}</main>
      {tray && <DeskTray>{tray}</DeskTray>}
    </div>
  );
}

export function DeskSurface({ scene = "plain" }: { scene?: DeskScene }) {
  return (
    <div aria-hidden className="desk-wood pointer-events-none fixed inset-0 overflow-hidden">
      <div className="desk-mat absolute top-12 bottom-[-40px] left-1/2 w-[min(560px,calc(100vw-16px))] -translate-x-1/2 rounded-[10px]" />
      <div className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2">
        <CoffeeRing className="absolute top-[-34px] left-[330px] w-36 rotate-12 opacity-90" />
        <FountainPen className="absolute top-[14px] left-[760px] w-[300px] rotate-[-4deg] max-[480px]:left-[730px] max-[480px]:w-[210px]" />
        {scene === "intake" && (
          <>
            <InkPad className="absolute top-[150px] left-[870px] w-28" />
            <StampStick className="absolute top-[290px] left-[860px] w-36 rotate-[70deg]" />
            <FolderStack className="absolute top-[120px] left-[70px] w-64 -rotate-6" />
          </>
        )}
        {scene === "folder" && (
          <>
            <FolderStack className="absolute top-[90px] left-[880px] w-60 rotate-6" />
            <PaperClip className="absolute top-[420px] left-[300px] w-5 rotate-[30deg]" />
            <PaperClip className="absolute top-[450px] left-[320px] w-5 -rotate-[60deg]" />
            <InkPad className="absolute top-[520px] left-[150px] w-24" />
          </>
        )}
        {scene === "defendant" && (
          <>
            <RedPen className="absolute top-[200px] left-[860px] w-56 rotate-[80deg]" />
            <CoffeeRing className="absolute top-[420px] left-[160px] w-40 -rotate-12" />
          </>
        )}
        {scene === "judgment" && (
          <>
            <InkPad className="absolute top-[120px] left-[120px] w-28" />
            <StampStick className="absolute top-[260px] left-[150px] w-36 -rotate-[20deg]" />
            <FolderStack className="absolute top-[360px] left-[890px] w-60 rotate-3" />
          </>
        )}
      </div>
    </div>
  );
}

/** 라벨 테이프에 찍은 서비스 이름 (원형 관인처럼 보이지 않게) */
export function BrandLabel({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-11 items-center ${dark ? "" : "-rotate-1"}`}
      aria-label={`${SERVICE_NAME} 처음으로`}
    >
      <span
        className={`px-2.5 py-1 font-type text-[13px] font-bold tracking-[0.18em] ${
          dark ? "border border-white/25 text-white/80" : "bg-[#141414] text-[#f2f0ea] shadow-[0_2px_3px_rgb(0_0_0/0.5)]"
        }`}
        style={dark ? undefined : { textShadow: "0 1px 0 rgb(255 255 255 / 0.15)" }}
      >
        {SERVICE_NAME.replaceAll(" ", "")}
      </span>
    </Link>
  );
}
