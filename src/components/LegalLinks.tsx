import Link from "next/link";

/** 이용약관 · 개인정보처리방침 링크 */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex gap-3 ${className}`}>
      <Link href="/terms" className="underline underline-offset-2">
        이용약관
      </Link>
      <Link href="/privacy" className="underline underline-offset-2">
        개인정보처리방침
      </Link>
    </span>
  );
}
