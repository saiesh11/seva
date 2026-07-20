import * as ExpoLinking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { labelForCoords, requestAndGetLocation, searchForLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase';

type Coords = { latitude: number; longitude: number };

export default function LocationSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { session, profile, refreshProfile } = useAuth();

  const [query, setQuery] = useState('');
  const [pendingResult, setPendingResult] = useState<{ coords: Coords; label: string } | null>(
    null
  );
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  const hasSavedLocation = profile?.search_location_lat != null && profile?.search_location_lng != null;

  async function saveLocation(coords: Coords | null, label: string | null) {
    if (!session) return;
    setError(null);
    setSaving(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        search_location_lat: coords?.latitude ?? null,
        search_location_lng: coords?.longitude ?? null,
        search_location_label: label,
      })
      .eq('id', session.user.id);

    setSaving(false);

    if (updateError) {
      setError(t('locationSettings.saveError'));
      return;
    }

    await refreshProfile();
    router.back();
  }

  async function handleUseCurrentLocation() {
    setError(null);
    setPermissionBlocked(false);
    setLocating(true);
    try {
      const location = await requestAndGetLocation({ forceRefresh: true });
      if (!location.granted) {
        if (!location.canAskAgain) {
          setPermissionBlocked(true);
          setError(t('locationSettings.locationPermissionBlocked'));
        } else {
          setError(t('locationSettings.locationPermissionDenied'));
        }
        return;
      }
      const label = await labelForCoords(location.coords);
      await saveLocation(location.coords, label);
    } catch {
      setError(t('locationSettings.locationError'));
    } finally {
      setLocating(false);
    }
  }

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setError(null);
    setPendingResult(null);
    setSearching(true);
    try {
      const result = await searchForLocation(trimmed);
      if (!result) {
        setError(t('locationSettings.notFound'));
      } else {
        setPendingResult(result);
      }
    } catch {
      setError(t('locationSettings.notFound'));
    } finally {
      setSearching(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.content}>
            <ThemedView style={styles.header}>
              <Pressable onPress={() => router.back()}>
                <ThemedText type="link" themeColor="textSecondary">
                  {t('common.back')}
                </ThemedText>
              </Pressable>
              <ThemedText type="subtitle">{t('locationSettings.title')}</ThemedText>
              <ThemedText themeColor="textSecondary">{t('locationSettings.explainer')}</ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="small" themeColor="textSecondary">
                {hasSavedLocation
                  ? t('locationSettings.currentLabel', { label: profile?.search_location_label })
                  : t('profile.myLocationAuto')}
              </ThemedText>
            </ThemedView>

            <Pressable
              onPress={handleUseCurrentLocation}
              disabled={locating || saving}
              style={[styles.secondaryButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small">
                {locating ? t('locationSettings.gettingLocation') : t('locationSettings.useCurrentLocation')}
              </ThemedText>
            </Pressable>

            <ThemedView style={styles.section}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('locationSettings.searchPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
              <Pressable
                onPress={handleSearch}
                disabled={searching || saving}
                style={[styles.secondaryButton, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small">
                  {searching ? t('locationSettings.searching') : t('locationSettings.search')}
                </ThemedText>
              </Pressable>
            </ThemedView>

            {pendingResult && (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="small">{t('locationSettings.confirmPrompt')}</ThemedText>
                <ThemedText type="smallBold">{pendingResult.label}</ThemedText>
                <ThemedView style={styles.confirmRow}>
                  <Pressable
                    onPress={() => saveLocation(pendingResult.coords, pendingResult.label)}
                    disabled={saving}
                    style={[styles.confirmButton, { backgroundColor: theme.text }]}>
                    <ThemedText type="smallBold" style={{ color: theme.background }}>
                      {t('locationSettings.confirm')}
                    </ThemedText>
                  </Pressable>
                  <Pressable onPress={() => setPendingResult(null)} style={styles.cancelButton}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('locationSettings.cancel')}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              </ThemedView>
            )}

            {error && (
              <ThemedView style={styles.section}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                {permissionBlocked && (
                  <Pressable
                    onPress={() => ExpoLinking.openSettings()}
                    style={[styles.secondaryButton, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="small">{t('common.openSettings')}</ThemedText>
                  </Pressable>
                )}
              </ThemedView>
            )}

            {hasSavedLocation && (
              <Pressable onPress={() => saveLocation(null, null)} disabled={saving}>
                <ThemedText type="link" themeColor="textSecondary">
                  {t('locationSettings.useAutomatic')}
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  secondaryButton: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  confirmButton: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  cancelButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  errorText: {
    color: '#D92D20',
  },
});
