import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { ThemeMode, useAppTheme } from '@/src/providers/AppThemeProvider';
import { layout, typography } from '@/src/theme/tokens';

const options: { mode: ThemeMode; label: string; description: string }[] = [
  { mode: 'system', label: '시스템 설정', description: '기기의 화면 모드를 따라가요.' },
  { mode: 'light', label: '라이트 모드', description: '항상 밝은 화면을 사용해요.' },
  { mode: 'dark', label: '다크 모드', description: '항상 어두운 화면을 사용해요.' },
];

export default function ThemeScreen() {
  const { colors, mode, setMode } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="화면 테마" />
      <View style={styles.content}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>테마 선택</Text>
        <View style={[styles.list, { borderColor: colors.border }]}>
          {options.map((option, index) => {
            const selected = mode === option.mode;
            return (
              <HapticPressable
                accessibilityLabel={`${option.label}: ${option.description}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={option.mode}
                feedback="selection"
                onPress={() => setMode(option.mode)}
                style={[styles.row, index < options.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              >
                <View style={styles.copy}>
                  <Text style={[styles.label, { color: selected ? colors.primaryStrong : colors.text }]}>{option.label}</Text>
                  <Text style={[styles.description, { color: colors.muted }]}>{option.description}</Text>
                </View>
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={23} color={selected ? colors.primary : colors.muted} />
              </HapticPressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: 10 },
  sectionLabel: { ...typography.label, marginBottom: 10, paddingHorizontal: 2 },
  list: { borderTopWidth: 1, borderBottomWidth: 1 },
  row: { minHeight: 72, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 3 },
  label: { ...typography.subheading, fontSize: 15 },
  description: { ...typography.caption },
});
