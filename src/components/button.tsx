import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRIMARY_GRADIENT_COLORS = ['#3C9FFE', '#0274DF'] as const;

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (isDisabled) return;
    scale.value = withSpring(0.96, { damping: 16, stiffness: 350 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 14, stiffness: 260 });
  }

  function handlePress() {
    if (isDisabled) return;
    Haptics.impactAsync(
      variant === 'primary' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    );
    onPress();
  }

  const textColor =
    variant === 'primary' ? '#FFFFFF' : variant === 'destructive' ? '#D92D20' : theme.text;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'primary' && styles.primaryShadow,
        variant !== 'primary' && { backgroundColor: theme.backgroundSelected },
        animatedStyle,
        isDisabled && styles.disabled,
        style,
      ]}>
      {variant === 'primary' && (
        <LinearGradient
          colors={PRIMARY_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.gradientFill]}
        />
      )}
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={textColor} size="small" />
          <ThemedText type="smallBold" style={{ color: textColor }}>
            {label}
          </ThemedText>
        </View>
      ) : (
        <ThemedText type="smallBold" style={{ color: textColor }}>
          {label}
        </ThemedText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientFill: {
    borderRadius: 14,
  },
  primaryShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#0274DF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
