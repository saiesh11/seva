import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import '@/lib/i18n';

SplashScreen.preventAutoHideAsync();

function AccountLoadError({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedView style={errorStyles.flex}>
      <SafeAreaView style={errorStyles.center}>
        <ThemedView style={errorStyles.content}>
          <ThemedText style={errorStyles.errorText}>{t('common.loadError')}</ThemedText>
          <Pressable
            onPress={onRetry}
            style={[errorStyles.button, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">{t('common.tryAgain')}</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const errorStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  errorText: {
    color: '#D92D20',
    textAlign: 'center',
  },
  button: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
});

function RootNavigator() {
  const { session, profile, hasProviderDetails, profileError, refreshProfile } = useAuth();
  const isProviderRole = profile?.role === 'provider' || profile?.role === 'both';

  if (session && profileError) {
    return <AccountLoadError onRetry={refreshProfile} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !profile}>
        <Stack.Screen name="role" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !!profile && isProviderRole && !hasProviderDetails}>
        <Stack.Screen name="provider-setup" />
      </Stack.Protected>

      <Stack.Protected
        guard={!!session && !!profile && (!isProviderRole || !!hasProviderDetails)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="subcategories" />
        <Stack.Screen name="nearby-providers" />
        <Stack.Screen name="edit-listing" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}