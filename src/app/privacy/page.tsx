import type { Metadata } from "next";
import { FORM_NO } from "@/components/desk/Sheet";
import { LegalDoc } from "@/components/LegalDoc";
import { SERVICE_NAME } from "@/lib/constants";
import { LEGAL_EFFECTIVE, OPERATOR } from "@/lib/legal";

export const metadata: Metadata = { title: "개인정보처리방침" };

const contact = OPERATOR.email ? (
  <a className="underline" href={`mailto:${OPERATOR.email}`}>
    {OPERATOR.email}
  </a>
) : (
  "통고서 화면의 [신고] 기능"
);

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="개인정보처리방침"
      formNo={FORM_NO.privacy}
      effective={LEGAL_EFFECTIVE}
      intro={
        <p>
          {OPERATOR.name}(이하 &lsquo;운영자&rsquo;)는 &lsquo;{SERVICE_NAME}&rsquo; 서비스를 제공하면서 아래와 같이 개인정보를 처리합니다. 서비스는 회원가입이 없고 이름·전화번호·이메일을 받지 않습니다.
        </p>
      }
      articles={[
        {
          title: "처리하는 항목",
          body: (
            <table>
              <tbody>
                <tr>
                  <th>이용자가 입력</th>
                  <td>원고·피고 닉네임, 사건 발생일, 사건 경위, 청구 내용, 통고서 본문과 수정 내용, 공방 진술, 피고의 대응·신고 사유, 업로드한 이미지(해당 기능을 쓴 경우)</td>
                </tr>
                <tr>
                  <th>자동 생성·수집</th>
                  <td>통고서 열람 시각, 사건별 접근 토큰(쿠키), 요청 횟수 제한을 위한 접속 IP의 해시값(원래 IP는 저장하지 않음), AI 사용 비용 기록</td>
                </tr>
              </tbody>
            </table>
          ),
        },
        {
          title: "처리 목적",
          body: (
            <ul>
              <li>통고서 작성·발송, 열람 기록, 공방 진행, 판결과 판결문 이미지 제공</li>
              <li>AI 초안·판결·변호인 추천 생성</li>
              <li>과도한 요청과 남용 방지, 신고 처리</li>
            </ul>
          ),
        },
        {
          title: "보유 기간과 파기",
          body: (
            <>
              <p>사건 기록(닉네임, 경위, 진술, 판결문 등)은 판결이 나거나 사건이 기각된 때부터 1시간 동안만 보관하고, 그 뒤 자동으로 파기합니다. 진행 중인 사건은 끝날 때까지 보관합니다. 사건 당사자가 삭제를 요청하거나 운영자가 약관 위반으로 판단한 사건은 지체 없이 파기합니다. 서비스를 종료하면 모든 기록을 파기합니다.</p>
              <p>요청 횟수 제한용 IP 해시값은 남용 방지에 필요한 기간 동안만 보관합니다.</p>
              <p>피고가 [사건 기각]을 누르면 그 사건의 통고서는 더 이상 화면에 표시되지 않습니다.</p>
            </>
          ),
        },
        {
          title: "제3자 제공",
          body: <p>운영자는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 이용자가 직접 공유한 링크와 판결문 이미지는 그 링크를 받은 사람이 볼 수 있습니다.</p>,
        },
        {
          title: "처리 위탁과 국외 이전",
          body: (
            <>
              <p>서비스 운영을 위해 아래 업체에 처리를 맡기며, 일부는 국외로 이전됩니다. 이전은 서비스 이용 시 네트워크를 통해 이루어집니다.</p>
              <table>
                <thead>
                  <tr>
                    <th>업체(국가)</th>
                    <th>이전 항목</th>
                    <th>목적·보유</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Anthropic, PBC (미국)</td>
                    <td>닉네임, 사건 경위·청구, 통고서, 공방 진술</td>
                    <td>AI 초안·판결·변호인 추천 생성. 업체 정책에 따른 기간 보관</td>
                  </tr>
                  <tr>
                    <td>Supabase, Inc. (데이터 저장 위치: 대한민국 서울 리전)</td>
                    <td>제1조의 모든 항목</td>
                    <td>데이터베이스·이미지 저장. 위 보유 기간 동안</td>
                  </tr>
                  <tr>
                    <td>Vercel Inc. (미국)</td>
                    <td>접속 기록, 요청 내용</td>
                    <td>웹사이트 호스팅. 업체 정책에 따른 기간 보관</td>
                  </tr>
                  <tr>
                    <td>Google LLC (미국)</td>
                    <td>광고 식별자, 쿠키, 접속 정보</td>
                    <td>광고 표시·보상 확인(광고가 표시되는 경우)</td>
                  </tr>
                  <tr>
                    <td>(주)카카오 (대한민국)</td>
                    <td>공유하는 링크·제목·이미지</td>
                    <td>카카오톡 공유(공유 버튼을 누른 경우)</td>
                  </tr>
                </tbody>
              </table>
              <p>국외 이전을 원하지 않으면 서비스를 이용하지 않거나, 이미 저장된 기록의 삭제를 요청할 수 있습니다.</p>
            </>
          ),
        },
        {
          title: "쿠키와 브라우저 저장소",
          body: (
            <ul>
              <li>사건 접근 쿠키: 원고·피고가 자기 사건 화면에 다시 들어올 수 있게 합니다. 60일 보관</li>
              <li>브라우저 저장소: 효과음 켜기/끄기, 이미 본 공방 연출 기록</li>
              <li>광고가 표시되는 경우 Google이 광고용 쿠키를 사용할 수 있습니다</li>
              <li>브라우저 설정에서 쿠키를 지울 수 있으나, 그러면 사건 화면에 다시 들어오려면 받은 링크가 필요합니다</li>
            </ul>
          ),
        },
        {
          title: "이용자의 권리",
          body: <p>사건 당사자는 자기 사건 기록의 열람·정정·삭제와 처리 정지를 요청할 수 있습니다. 회원가입이 없으므로 요청할 때 사건번호와 사건 링크로 당사자임을 확인합니다. 요청은 아래 문의처로 보내 주세요.</p>,
        },
        {
          title: "만 14세 미만",
          body: <p>서비스는 만 14세 미만을 대상으로 하지 않으며, 만 14세 미만의 정보임을 알게 되면 지체 없이 파기합니다.</p>,
        },
        {
          title: "안전성 확보 조치",
          body: (
            <ul>
              <li>모든 데이터베이스 테이블의 직접 접근 차단(서버를 통해서만 접근)</li>
              <li>사건 링크 토큰은 원문 대신 해시값으로 저장</li>
              <li>업로드 이미지는 비공개 저장소에 두고 1시간짜리 임시 주소로만 표시</li>
            </ul>
          ),
        },
        {
          title: "개인정보 보호책임자와 문의",
          body: (
            <>
              <p>개인정보 보호책임자: {OPERATOR.name}</p>
              <p>문의: {contact}</p>
              <p>개인정보 침해 신고·상담은 개인정보침해신고센터(국번 없이 118), 개인정보분쟁조정위원회(1833-6972)에도 할 수 있습니다.</p>
            </>
          ),
        },
        {
          title: "방침의 변경",
          body: <p>이 방침을 바꿀 때는 시행일과 바뀐 내용을 이 페이지에 7일 전부터 알립니다.</p>,
        },
      ]}
    />
  );
}
