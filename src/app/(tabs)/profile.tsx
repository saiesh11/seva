import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type MyListing = {
  bio: string | null;
  years_experience: number | null;
  service_radius_km: number | null;
  services: string[];
};

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, hasProviderDetails } = useAuth();
  const [listing, setListing] = useState<MyListing | null>(null);
  const [loadingListing, setLoadingListing] = useState(false);

  const isProviderRole = profile?.role === 'provider' || profile?.role === 'both';

  useEffect(() => {
    if (!isProviderRole || !hasProviderDetails || !profile) {
      return;
    }

    let cancelled = false;
    setLoadingListing(true);

    async function loadListing() {
      const { data: details } = await supabase
        .from('provider_details')
        .select('id, bio, years_experience, service_radius_km')
        .eq('profile_id', profile!.id)
        .maybeSingle();

      if (!details) {
        if (!cancelled) setLoadingListing(false);
        return;
      }

      const { data: services } = await supabase
        .from('provider_services')
        .select('subcategories(name_en)')
        .eq('provider_id', details.id);

      if (cancelled) return;

      setListing({
        bio: details.bio,
        years_experience: details.years_experience,
        service_radius_km: details.service_radius_km,
        services: (services ?? [])
          .map((row: any) => row.subcategories?.name_en)
          .filter((name: string | undefined): name is string => Boolean(name)),
      });
      setLoadingListing(false);
    }

    loadListing();
    return () => {
      cancelled = true;
    };
  }, [isProviderRole, hasProviderDetails, profile]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="subtitle">Profile</ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{profile?.full_name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {profile?.phone}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Account type: {profile?.role}
            </ThemedText>
          </ThemedView>

          {isProviderRole && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Your listing</ThemedText>
              {loadingListing && <ThemedText themeColor="textSecondary">Loading…</ThemedText>}
              {!loadingListing && listing && (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    Services: {listing.services.join(', ') || 'None yet'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Service radius: {listing.service_radius_km} km
                  </ThemedText>
                  {listing.years_experience != null && (
                    <ThemedText type="small" themeColor="textSecondary">
                      Experience: {listing.years_experience} yrs
                    </ThemedText>
                  )}
                  {listing.bio && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {listing.bio}
                    </ThemedText>
                  )}
                </>
              )}
            </ThemedView>
          )}

          <Pressable
            onPress={() => supabase.auth.signOut()}
            style={[styles.signOutButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">Sign out</ThemedText>
          </Pressable>
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  signOutButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});