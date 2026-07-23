import { LegalScreen } from '@/src/features/settings/LegalScreen';

const sections = [
  { title: '1. 서비스 목적', body: '소랑제주는 여행지, 지도, 문화와 제주어 자료를 더 쉽게 탐색하고 저장할 수 있도록 정리해 제공하는 정보 서비스입니다.' },
  { title: '2. 데이터 이용', body: '관광정보는 화면에 표시된 공식 출처를, 제주어 자료는 제주특별자치도 OpenAPI를 기반으로 합니다. 정확성, 운영 여부, 최신성은 각 원 제공기관의 안내를 우선합니다.' },
  { title: '3. 이용자의 책임', body: '앱의 자료는 학습과 참고 목적으로 이용해야 하며, 별도의 권리 확인 없이 상업적 재배포나 타인의 권리를 침해하는 방식으로 사용해서는 안 됩니다.' },
  { title: '4. 서비스 변경', body: '공공 API의 변경, 중단 또는 운영상 필요에 따라 제공 항목이나 방식이 달라질 수 있습니다. 중요한 변경은 앱 업데이트 설명이나 공지로 안내합니다.' },
  { title: '5. 면책', body: '네트워크 장애나 외부 데이터 제공 중단으로 일시적으로 최신 자료를 불러오지 못할 수 있습니다. 앱은 가능한 경우 저장된 자료를 대신 표시합니다.' },
];

export default function TermsScreen() {
  return <LegalScreen title="이용약관" sections={sections} />;
}
