import { LegalScreen } from '@/src/features/settings/LegalScreen';

const sections = [
  { title: '1. 수집하는 정보', body: '소랑제주는 현재 회원가입을 요구하지 않으며 이름, 이메일, 전화번호, 정밀 위치를 수집하지 않습니다. 알림을 켜면 익명 설치 식별자, Expo 푸시 토큰, 운영체제와 앱 버전을 알림 전송 목적으로 처리합니다.' },
  { title: '2. 기기에 저장되는 정보', body: '사용자가 선택한 화면 테마, 저장한 여행지와 제주어 목록, 제주어 OpenAPI 응답 캐시, 익명 설치 식별자와 Expo 푸시 토큰은 기기에 저장됩니다.' },
  { title: '3. 서버와 외부 데이터 통신', body: '관광·문화 정보 조회와 알림 등록을 위해 UULab Appwrite 서버에 요청을 보냅니다. 지도 열기와 알림 전송 과정에서는 네이버 지도·Expo·Apple·Google 서비스가 통상적인 네트워크 정보를 각 정책에 따라 처리할 수 있습니다.' },
  { title: '4. 보관과 삭제', body: '앱을 삭제하면 기기에 저장된 설정, 즐겨찾기와 캐시가 함께 삭제됩니다. 알림을 끄면 서버의 해당 설치 토큰은 비활성화됩니다. 저장 항목은 앱 안에서 언제든 해제할 수 있습니다.' },
  { title: '5. 문의', body: '개인정보 관련 문의와 지원 정책은 https://uulab.co.kr/privacy 에서 확인할 수 있습니다.' },
];

export default function PrivacyScreen() {
  return <LegalScreen title="개인정보 처리방침" sections={sections} externalUrl="https://uulab.co.kr/privacy" />;
}
