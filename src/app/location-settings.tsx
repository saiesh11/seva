import * as ExpoLinking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
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

            <ThemedView type="backgroundElement" style={[styles.card, styles.cardShadow]}>
              <ThemedText type="small" themeColor="textSecondary">
                {hasSavedLocation
                  ? t('locationSettings.currentLabel', { label: profile?.search_location_label })
                  : t('profile.myLocationAuto')}
              </ThemedText>
            </ThemedView>

            <Button
              variant="secondary"
              disabled={locating || saving}
              loading={locating}
              onPress={handleUseCurrentLocation}
              label={locating ? t('locationSettings.gettingLocation') : t('locationSettings.useCurrentLocation')}
            />

            <ThemedView style={styles.section}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('locationSettings.searchPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
              <Button
                variant="secondary"
                disabled={searching || saving}
                loading={searching}
                onPress={handleSearch}
                label={searching ? t('locationSettings.searching') : t('locationSettings.search')}
              />
            </ThemedView>

            {pendingResult && (
              <ThemedView type="backgroundElement" style={[styles.card, styles.cardShadow]}>
                <ThemedText type="small">{t('locationSettings.confirmPrompt')}</ThemedText>
                <ThemedText type="smallBold">{pendingResult.label}</ThemedText>
                <View style={styles.confirmRow}>
                  <Button
                    label={t('locationSettings.confirm')}
                    loading={saving}
                    onPress={() => saveLocation(pendingResult.coords, pendingResult.label)}
                  />
                  <Pressable onPress={() => setPendingResult(null)} style={styles.cancelButton}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('locationSettings.cancel')}
                    </ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            )}

            {error && (
              <ThemedView style={styles.section}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                {permissionBlocked && (
                  <Button
                    variant="secondary"
                    label={t('common.openSettings')}
                    onPress={() => ExpoLinking.openSettings()}
                  />
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
  cardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
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
  cancelButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  errorText: {
    color: '#D92D20',
  },
});
