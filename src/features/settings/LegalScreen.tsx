import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { layout, typography } from '@/src/theme/tokens';

export function LegalScreen({
  title,
  sections,
  externalUrl,
}: {
  title: string;
  sections: { title: string; body: string }[];
  externalUrl?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.updated, { color: colors.muted }]}>시행일: 2026년 7월 22일</Text>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>{section.title}</Text>
            <Text selectable style={[styles.body, { color: colors.muted }]}>{section.body}</Text>
          </View>
        ))}
        {externalUrl ? (
          <HapticPressable
            accessibilityLabel={`${title} 웹페이지 열기`}
            feedback="light"
            onPress={() => void Linking.openURL(externalUrl)}
            style={[styles.externalButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.externalText, { color: colors.text }]}>웹에서 최신 내용 확인</Text>
            <Ionicons name="open-outline" size={18} color={colors.primaryStrong} />
          </HapticPressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: layout.screenPadding, paddingBottom: 40 },
  updated: { ...typography.caption, marginBottom: 24 },
  section: { marginBottom: 28 },
  title: { ...typography.subheading, fontSize: 17, marginBottom: 10 },
  body: { ...typography.body, lineHeight: 24 },
  externalButton: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  externalText: { ...typography.body, fontWeight: '800' },
});
