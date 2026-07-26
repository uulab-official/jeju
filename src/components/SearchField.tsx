import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TextInput, View } from 'react-native';

import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

export function SearchField({ value, onChangeText, autoFocus = false }: { value: string; onChangeText: (value: string) => void; autoFocus?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name="search" size={20} color={colors.muted} />
      <TextInput
        accessibilityLabel="검색어"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        clearButtonMode="while-editing"
        onChangeText={onChangeText}
        placeholder="제주어, 뜻, 분류를 검색하세요"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={[styles.input, { color: colors.text }]}
        value={value}
      />
      {value ? (
        <HapticPressable
          accessibilityLabel="검색어 지우기"
          feedback="light"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={19} color={colors.muted} />
        </HapticPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 50, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  clearButton: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
});
