import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticFeedback = 'selection' | 'light' | 'medium' | 'success' | 'warning' | 'error';

const androidFeedback: Record<HapticFeedback, Haptics.AndroidHaptics> = {
  selection: Haptics.AndroidHaptics.Segment_Tick,
  light: Haptics.AndroidHaptics.Virtual_Key,
  medium: Haptics.AndroidHaptics.Context_Click,
  success: Haptics.AndroidHaptics.Confirm,
  warning: Haptics.AndroidHaptics.Reject,
  error: Haptics.AndroidHaptics.Reject,
};

export async function triggerHaptic(feedback: HapticFeedback = 'selection') {
  if (Platform.OS === 'web') return;

  try {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(androidFeedback[feedback]);
      return;
    }

    if (feedback === 'success' || feedback === 'warning' || feedback === 'error') {
      const type = feedback === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : feedback === 'warning'
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Error;
      await Haptics.notificationAsync(type);
      return;
    }

    if (feedback === 'selection') {
      await Haptics.selectionAsync();
      return;
    }

    await Haptics.impactAsync(
      feedback === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
  } catch {
    // Haptics are progressive enhancement and must never block the action.
  }
}
