import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

const questions = [
  ['여행 정보는 어디에서 오나요?', '한국관광공사 국문 관광정보 서비스(TourAPI)를 기준으로 장소를 수집하고, 상세 화면에 원문 출처와 이용 조건을 표시합니다. 연결이 일시적으로 지연되면 기기에 저장된 최근 자료를 먼저 보여드려요.'],
  ['후기는 네이버에서 가져오나요?', '아니요. 네이버 등 외부 서비스의 후기를 복제하거나 크롤링하지 않습니다. 커뮤니티 후기는 이 앱 사용자가 직접 작성하는 구조로 제공할 예정입니다.'],
  ['제주어 자료는 어디에서 오나요?', '제주특별자치도가 제공하는 제주 생활방언, 속담, 방언사전, 색인어 OpenAPI를 사용합니다.'],
  ['인터넷이 없어도 볼 수 있나요?', '한 번 불러온 자료는 기기에 저장됩니다. 다음 실행부터는 네트워크 연결이 없더라도 최근에 저장된 자료와 즐겨찾기를 볼 수 있습니다.'],
  ['검색은 어떤 내용을 찾나요?', '낱말 이름뿐 아니라 뜻풀이, 분류, 관련어, 영어·중국어·일본어 번역까지 네 사전을 한 번에 검색합니다.'],
  ['발음 버튼이 없는 낱말이 있어요.', '원 제공 데이터에 음성 파일 주소가 있는 항목만 발음 듣기 버튼이 나타납니다.'],
  ['표기법 예시 이미지가 보이지 않아요.', '표기법 본문은 앱에 포함되어 있지만 일부 예시 이미지는 제주특별자치도 서버에서 불러오므로 네트워크 연결이 필요합니다.'],
  ['자료가 잘못된 것 같아요.', '앱은 원 제공 데이터를 가공해 표시합니다. 표기 오류나 누락은 제주특별자치도 원문과 비교한 뒤 지원 채널로 알려주세요.'],
] as const;

export default function FaqScreen() {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="자주 묻는 질문" />
      <ScrollView contentContainerStyle={styles.content}>
        {questions.map(([question, answer], index) => {
          const expanded = open === index;
          return (
            <View key={question} style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <HapticPressable onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(expanded ? null : index); }} style={styles.question}>
                <Text style={[styles.questionText, { color: colors.text }]}>{question}</Text><Ionicons name={expanded ? 'remove' : 'add'} size={21} color={colors.primaryStrong} />
              </HapticPressable>
              {expanded ? <Text style={[styles.answer, { color: colors.muted, borderTopColor: colors.border }]}>{answer}</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: 18, gap: 10, paddingBottom: 34 }, item: { borderWidth: 1, borderRadius: 17, overflow: 'hidden' }, question: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, questionText: { flex: 1, fontSize: 15, fontWeight: '700' }, answer: { borderTopWidth: 1, padding: 16, fontSize: 14, lineHeight: 23 } });
