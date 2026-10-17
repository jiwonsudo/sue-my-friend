import type { Metadata, Viewport } from "next";
import { Nanum_Gothic_Coding, Nanum_Pen_Script, Noto_Serif_KR } from "next/font/google";
import { SERVICE_NAME } from "@/lib/constants";
import "./globals.css";

const serif = Noto_Serif_KR({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-noto-serif",
  display: "swap",
});

const typewriter = Nanum_Gothic_Coding({
  weight: ["400", "700"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-typewriter",
  display: "swap",
});

const hand = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  preload: false,
  variable: "--font-handwriting",
  display: "swap",
});

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: SERVICE_NAME, template: `%s · ${SERVICE_NAME}` },
  description: "치킨 내기, 읽씹, 노쇼, 빌린 돈. 사소한 원한을 통고서 양식으로 접수합니다.",
  applicationName: SERVICE_NAME,
  openGraph: {
    siteName: SERVICE_NAME,
    title: SERVICE_NAME,
    description: "사소한 원한, 엄중한 형식. 통고서 접수 창구.",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/api/og/default", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2b1d13",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${serif.variable} ${typewriter.variable} ${hand.variable}`}>
      <head>
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
