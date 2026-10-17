"use client";
import Script from "next/script";
import { useState } from "react";

type KakaoSDK = {
  isInitialized(): boolean;
  init(key: string): void;
  Share: { sendDefault(opts: unknown): void };
};

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export function ShareButtons({
  url,
  title,
  text,
  imageUrl,
  buttonLabel = "열어보기",
  compact = false,
}: {
  url: string;
  title: string;
  text: string;
  imageUrl?: string;
  buttonLabel?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return; // 사용자가 취소
      }
    }
    await copy();
  };

  const kakao = () => {
    const K = window.Kakao;
    if (!K || !KAKAO_KEY) return share();
    if (!K.isInitialized()) K.init(KAKAO_KEY);
    K.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description: text,
        imageUrl: imageUrl ?? `${location.origin}/api/og/default`,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: buttonLabel, link: { mobileWebUrl: url, webUrl: url } }],
    });
  };

  const btn = "min-h-11 rounded-[2px] px-4 font-serif text-[15px] font-bold transition active:translate-y-px";
  return (
    <div className={`grid grid-cols-1 ${compact ? "gap-1.5" : "gap-2"}`}>
      {KAKAO_KEY && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="afterInteractive"
          onLoad={() => setKakaoReady(true)}
        />
      )}
      <button
        type="button"
        onClick={kakao}
        disabled={Boolean(KAKAO_KEY) && !kakaoReady}
        className={`${btn} bg-[#FEE500] text-black shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)]`}
      >
        카톡으로 보내기
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={copy} className={`${btn} bg-paper text-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]`}>
          {copied ? "복사됨" : "링크 복사"}
        </button>
        <button type="button" onClick={share} className={`${btn} border border-paper/35 text-paper`}>
          공유
        </button>
      </div>
    </div>
  );
}
