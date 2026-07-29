import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { typography } from '@/src/theme/tokens';

export function SectionHeading({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: { label: string; onPress: () => void; icon?: ReactNode };
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text selectable style={[styles.title, { color: colors.text }]}>{title}</Text>
        {caption ? <Text selectable style={[styles.caption, { color: colors.muted }]}>{caption}</Text> : null}
      </View>
      {action ? (
        <HapticPressable accessibilityLabel={action.label} feedback="light" onPress={action.onPress} style={styles.action}>
          {action.icon}
          <Text style={[styles.actionText, { color: colors.primaryStrong }]}>{action.label}</Text>
        </HapticPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  copy: { flex: 1, gap: 3 },
  title: typography.heading,
  caption: typography.caption,
  action: { minHeight: 44, paddingVertical: 8, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: typography.label,
});
