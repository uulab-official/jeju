import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

export function LegalScreen({ title, sections }: { title: string; sections: { title: string; body: string }[] }) {
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, updated: { fontSize: 12, marginBottom: 24 }, section: { marginBottom: 28 }, title: { fontSize: 17, fontWeight: '800', marginBottom: 10 }, body: { fontSize: 14, lineHeight: 24 } });
