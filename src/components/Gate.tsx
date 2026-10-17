import Link from "next/link";
import { Header } from "./Header";

export function Gate({ title, body }: { title: string; body: string }) {
  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-24 text-center">
        <p className="mb-2 font-serif text-xl font-bold">{title}</p>
        <p className="mb-8 text-sm leading-relaxed text-muted">{body}</p>
        <Link href="/" className="min-h-11 rounded-xl border border-black/15 px-5 py-3 text-sm font-semibold">
          처음으로
        </Link>
      </main>
    </>
  );
}
