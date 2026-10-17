/** 약관·개인정보처리방침에 들어가는 운영자 정보. 배포 환경변수로 채운다. */
export const OPERATOR = {
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME || "내 친구 고소하기 운영자",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
};

export const LEGAL_EFFECTIVE = "2026. 10. 17.";
