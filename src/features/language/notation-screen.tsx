import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

const notation = require('../../../assets/data/notation.json') as {
  data: { title: string; item: { subTitle?: string; subItem: { type: string; value: string }[] }[] }[];
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function NotationScreen() {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const toggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="제주어 표기법" subtitle="제주특별자치도 표기 원칙" back />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.intro, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="language-outline" size={28} color={colors.primaryStrong} />
          <View style={styles.introCopy}><Text style={[styles.introTitle, { color: colors.text }]}>제주어를 바르게 적는 방법</Text><Text style={[styles.introBody, { color: colors.muted }]}>원칙과 예시를 장별로 펼쳐서 확인할 수 있어요.</Text></View>
        </View>
        {notation.data.map((chapter, chapterIndex) => {
          const expanded = open.has(chapterIndex);
          return (
            <View key={chapter.title} style={[styles.chapter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <HapticPressable accessibilityLabel={`${chapter.title} ${expanded ? '접기' : '펼치기'}`} accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => toggle(chapterIndex)} style={styles.chapterHeader}>
                <Text style={[styles.chapterTitle, { color: colors.text }]}>{chapter.title}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
              </HapticPressable>
              {expanded ? <View style={[styles.chapterBody, { borderTopColor: colors.border }]}>{chapter.item.map((rule, ruleIndex) => (
                <View key={`${chapter.title}-${ruleIndex}`} style={styles.rule}>
                  {rule.subTitle ? <Text style={[styles.ruleTitle, { color: colors.primaryStrong }]}>{rule.subTitle}</Text> : null}
                  {rule.subItem.map((item, itemIndex) => item.type === 'image' ? (
                    <View key={itemIndex} style={[styles.example, { backgroundColor: colors.surfaceAlt }]}><Image source={{ uri: item.value }} contentFit="contain" style={styles.exampleImage} /></View>
                  ) : <Text key={itemIndex} style={[styles.ruleText, { color: colors.text }]}>• {item.value}</Text>)}
                </View>
              ))}</View> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 32, gap: 12 },
  intro: { borderRadius: 20, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 4 }, introCopy: { flex: 1 },
  introTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 }, introBody: { fontSize: 13, lineHeight: 19 },
  chapter: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' }, chapterHeader: { minHeight: 62, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, chapterTitle: { fontSize: 17, fontWeight: '800' },
  chapterBody: { borderTopWidth: 1, padding: 17, gap: 22 }, rule: { gap: 10 }, ruleTitle: { fontSize: 15, fontWeight: '800' }, ruleText: { fontSize: 14, lineHeight: 23 },
  example: { borderRadius: 14, padding: 10, minHeight: 100 }, exampleImage: { width: '100%', height: 110 },
});
