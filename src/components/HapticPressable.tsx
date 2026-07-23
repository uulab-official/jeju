import { forwardRef, useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

import { HapticFeedback, triggerHaptic } from '@/src/lib/haptics';

type Props = PressableProps & {
  feedback?: HapticFeedback | 'none';
  pressedScale?: number;
};

export const HapticPressable = forwardRef<View, Props>(function HapticPressable(
  { feedback = 'selection', pressedScale = 0.985, onPress, style, disabled, ...props },
  ref,
) {
  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>((event) => {
    if (feedback !== 'none') void triggerHaptic(feedback);
    onPress?.(event);
  }, [feedback, onPress]);

  return (
    <Pressable
      {...props}
      ref={ref}
      accessibilityRole={props.accessibilityRole ?? 'button'}
      disabled={disabled}
      onPress={handlePress}
      style={(state) => {
        const base = typeof style === 'function' ? style(state) : style;
        const feedbackStyle: StyleProp<ViewStyle> = state.pressed && !disabled
          ? { opacity: 0.82, transform: [{ scale: pressedScale }] }
          : undefined;
        return [base, feedbackStyle];
      }}
    />
  );
});
