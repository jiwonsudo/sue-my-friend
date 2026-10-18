import type { Metadata } from "next";
import Link from "next/link";
import { FORM_NO } from "@/components/desk/Sheet";
import { LegalDoc } from "@/components/LegalDoc";
import { DISCLAIMER, SERVICE_NAME } from "@/lib/constants";
import { LEGAL_EFFECTIVE, OPERATOR } from "@/lib/legal";

export const metadata: Metadata = { title: "이용약관" };

export default function TermsPage() {
  return (
    <LegalDoc
      title="이용약관"
      formNo={FORM_NO.terms}
      effective={LEGAL_EFFECTIVE}
      intro={
        <p>
          이 약관은 {OPERATOR.name}(이하 &lsquo;운영자&rsquo;)가 제공하는 &lsquo;{SERVICE_NAME}&rsquo;(이하 &lsquo;서비스&rsquo;)를 이용하는 조건과 절차를 정합니다. 서비스에서 사건을 접수하거나 통고서·공방·판결 화면을 이용하면 이 약관에 동의한 것으로 봅니다.
        </p>
      }
      articles={[
        {
          title: "서비스의 성격",
          body: (
            <>
              <p>서비스는 친구 사이의 사소한 다툼을 법률 문서 형식으로 꾸며 주고받는 놀이용 서비스입니다.</p>
              <p className="font-bold">{DISCLAIMER}</p>
              <p>서비스가 만드는 통고서·판결문·법 조항 인용은 실제 법률 문서나 법률 자문이 아니며, 실제 소송·채권 추심·분쟁 해결의 근거로 쓸 수 없습니다.</p>
            </>
          ),
        },
        {
          title: "서비스 내용",
          body: (
            <ul>
              <li>사건 접수와 AI를 이용한 통고서 초안 작성·수정·발송</li>
              <li>상대방(피고)의 열람과 대응, 한마디씩 주고받는 공방</li>
              <li>AI 재판장의 판결과 판결문 이미지 저장·공유</li>
              <li>광고 시청 보상으로 제공하는 AI 변호인 추천(제공되는 경우)</li>
            </ul>
          ),
        },
        {
          title: "이용 대상",
          body: <p>만 14세 미만은 서비스를 이용할 수 없습니다. 회원가입 없이 이용하며, 사건마다 발급되는 링크와 브라우저 쿠키로 당사자를 구분합니다.</p>,
        },
        {
          title: "이용자가 하지 말아야 할 일",
          body: (
            <ul>
              <li>상대방의 실명, 전화번호, 주소, 학교·직장, 계좌번호 등 개인을 알아볼 수 있는 정보를 적는 행위</li>
              <li>사실이 아닌 내용이나 모욕적인 표현으로 다른 사람의 명예를 훼손하거나 괴롭히는 행위</li>
              <li>친구 사이의 장난이 아닌 실제 분쟁, 협박, 금전 요구의 수단으로 쓰는 행위</li>
              <li>성적·혐오·폭력적인 내용, 다른 사람의 사진이나 저작물을 허락 없이 올리는 행위</li>
              <li>자동화된 방법으로 대량의 요청을 보내거나 광고 보상 절차를 우회하는 행위</li>
            </ul>
          ),
        },
        {
          title: "작성한 내용에 대한 책임",
          body: (
            <>
              <p>이용자가 입력한 내용과 그것을 바탕으로 만든 문서를 누구에게 보낼지는 이용자가 정하며, 그에 따른 책임도 이용자에게 있습니다.</p>
              <p>AI가 만든 문장·판결·법 조항 인용은 부정확하거나 사실과 다를 수 있습니다. 운영자는 그 정확성이나 결과를 보장하지 않습니다.</p>
            </>
          ),
        },
        {
          title: "신고와 이용 제한",
          body: (
            <>
              <p>통고서를 받은 사람은 [신고]로 문제를 알리거나 [사건 기각]으로 문서를 숨길 수 있습니다.</p>
              <p>운영자는 이 약관을 어긴 사건을 사전 통지 없이 숨기거나 삭제하고, 해당 이용자의 이용을 제한할 수 있습니다.</p>
            </>
          ),
        },
        {
          title: "광고",
          body: <p>서비스에는 광고가 표시될 수 있습니다. 광고 시청 보상(AI 변호인 등)은 광고를 끝까지 본 경우에만 제공되며, 보상의 내용과 횟수는 운영자가 바꿀 수 있습니다.</p>,
        },
        {
          title: "서비스의 변경과 중단",
          body: <p>운영자는 서비스의 전부 또는 일부를 바꾸거나 중단할 수 있으며, 사건 기록의 보관 기간은 개인정보처리방침에 따릅니다.</p>,
        },
        {
          title: "책임의 제한",
          body: <p>서비스는 무료로 제공되는 놀이용 서비스로, 운영자는 고의 또는 중대한 과실이 없는 한 이용자 사이의 다툼, 이용자가 작성·공유한 내용, 서비스 장애로 생긴 손해에 대해 책임지지 않습니다.</p>,
        },
        {
          title: "약관의 변경",
          body: <p>약관을 바꿀 때는 시행일과 바뀐 내용을 이 페이지에 7일 전부터 알립니다. 바뀐 약관 시행 후에도 서비스를 이용하면 동의한 것으로 봅니다.</p>,
        },
        {
          title: "준거법과 문의",
          body: (
            <>
              <p>이 약관은 대한민국 법에 따릅니다.</p>
              <p>
                문의: {OPERATOR.email ? <a className="underline" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a> : "통고서 화면의 [신고] 기능"}
              </p>
              <p>
                개인정보 처리에 관한 내용은{" "}
                <Link href="/privacy" className="underline">
                  개인정보처리방침
                </Link>
                을 따릅니다.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
