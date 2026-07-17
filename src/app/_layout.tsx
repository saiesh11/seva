import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import '@/lib/i18n';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, profile, hasProviderDetails } = useAuth();
  const isProviderRole = profile?.role === 'provider' || profile?.role === 'both';

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