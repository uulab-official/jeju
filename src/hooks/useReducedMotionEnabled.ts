import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotionEnabled() {
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotionEnabled(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotionEnabled,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotionEnabled;
}
