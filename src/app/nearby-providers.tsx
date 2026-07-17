import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
  const { subcategoryId, subcategoryName } = useLocalSearchParams<{
    subcategoryId: string;
    subcategoryName: string;
  }>();

  const [providers, setProviders] = useState<NearbyProvider[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const location = await requestAndGetLocation();
      if (!location.granted) {
        setError('Location permission is needed to find providers near you.');
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
      setError('Could not get your location. Try again.');
    } finally {
      setLoading(false);
    }
  }, [subcategoryId]);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="link" themeColor="textSecondary">
              ‹ Back
            </ThemedText>
          </Pressable>
          <ThemedText type="subtitle">{subcategoryName}</ThemedText>
        </ThemedView>

        {loading && <ThemedText themeColor="textSecondary">Finding providers near you…</ThemedText>}

        {!loading && error && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.error}>{error}</ThemedText>
            <Pressable
              onPress={search}
              style={[styles.retryButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small">Try again</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {!loading && !error && providers && providers.length === 0 && (
          <ThemedText themeColor="textSecondary">No providers found nearby for this yet.</ThemedText>
        )}

        <FlatList
          data={providers ?? []}
          keyExtractor={(item) => item.provider_id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{item.full_name ?? 'Provider'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.distance_km.toFixed(1)} km away
                {item.years_experience ? ` · ${item.years_experience} yrs experience` : ''}
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
                  Call
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