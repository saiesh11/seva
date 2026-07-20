import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Linking, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { requestAndGetLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase';

type NearbyProvider = {
  provider_id: string;
  profile_id: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  years_experience: number | null;
  distance_km: number;
};

export default function NearbyProvidersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { subcategoryId, subcategoryName } = useLocalSearchParams<{
    subcategoryId: string;
    subcategoryName: string;
  }>();

  const [providers, setProviders] = useState<NearbyProvider[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPermissionBlocked(false);

    try {
      const location = await requestAndGetLocation();
      if (!location.granted) {
        if (!location.canAskAgain) {
          setPermissionBlocked(true);
          setError(t('nearbyProviders.locationPermissionBlocked'));
        } else {
          setError(t('nearbyProviders.locationPermissionDenied'));
        }
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('nearby_providers', {
        p_subcategory_id: subcategoryId,
        p_lat: location.coords.latitude,
        p_lng: location.coords.longitude,
      });

      if (rpcError) {
        setError(rpcError.message);
      } else {
        setProviders(data ?? []);
      }
    } catch {
      setError(t('nearbyProviders.locationError'));
    } finally {
      setLoading(false);
    }
  }, [subcategoryId, t]);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="link" themeColor="textSecondary">
              {t('common.back')}
            </ThemedText>
          </Pressable>
          <ThemedText type="subtitle">{subcategoryName}</ThemedText>
        </ThemedView>

        {loading && (
          <ThemedText themeColor="textSecondary">{t('nearbyProviders.searching')}</ThemedText>
        )}

        {!loading && error && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.error}>{error}</ThemedText>
            <Pressable
              onPress={permissionBlocked ? () => ExpoLinking.openSettings() : search}
              style={[styles.retryButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small">
                {permissionBlocked ? t('common.openSettings') : t('common.tryAgain')}
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {!loading && !error && providers && providers.length === 0 && (
          <ThemedText themeColor="textSecondary">{t('nearbyProviders.empty')}</ThemedText>
        )}

        <FlatList
          data={providers ?? []}
          keyExtractor={(item) => item.provider_id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">
                {item.full_name ?? t('nearbyProviders.fallbackName')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('nearbyProviders.distanceAway', { distance: item.distance_km.toFixed(1) })}
                {item.years_experience
                  ? ` · ${t('nearbyProviders.yearsExperience', { years: item.years_experience })}`
                  : ''}
              </ThemedText>
              {item.bio && (
                <ThemedText type="small" themeColor="textSecondary">
                  {item.bio}
                </ThemedText>
              )}
              <Pressable
                onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}
                style={[styles.callButton, { backgroundColor: theme.text }]}>
                <ThemedText type="smallBold" style={{ color: theme.background }}>
                  {t('nearbyProviders.call')}
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  error: {
    color: '#D92D20',
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  list: {
    flex: 1,
    alignSelf: 'stretch',
  },
  listContent: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  callButton: {
    marginTop: Spacing.one,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});