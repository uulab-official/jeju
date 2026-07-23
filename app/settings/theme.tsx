import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { ThemeMode, useAppTheme } from '@/src/providers/AppThemeProvider';

const options: { mode: ThemeMode; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'system', label: '시스템 설정', description: '기기의 화면 모드를 따라가요.', icon: 'phone-portrait-outline' },
  { mode: 'light', label: '라이트 모드', description: '항상 밝은 화면을 사용해요.', icon: 'sunny-outline' },
  { mode: 'dark', label: '다크 모드', description: '항상 어두운 화면을 사용해요.', icon: 'moon-outline' },
];

export default function ThemeScreen() {
  const { colors, mode, setMode } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="화면 테마" />
      <View style={styles.content}>
        {options.map((option) => {
          const selected = mode === option.mode;
          return (
            <HapticPressable key={option.mode} feedback="selection" onPress={() => setMode(option.mode)} style={[styles.row, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}><Ionicons name={option.icon} size={22} color={colors.primaryStrong} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.label, { color: colors.text }]}>{option.label}</Text><Text style={[styles.description, { color: colors.muted }]}>{option.description}</Text></View>
              <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={23} color={selected ? colors.primary : colors.muted} />
            </HapticPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: 18, gap: 12 }, row: { minHeight: 82, borderWidth: 1.5, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13 }, icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, label: { fontSize: 16, fontWeight: '800', marginBottom: 4 }, description: { fontSize: 12 } });
