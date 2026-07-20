import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, hasProviderDetails } = useAuth();
  const [listing, setListing] = useState<MyListing | null>(null);
  const [loadingListing, setLoadingListing] = useState(false);
  const [listingError, setListingError] = useState(false);

  const isProviderRole = profile?.role === 'provider' || profile?.role === 'both';

  const loadListing = useCallback(async () => {
    if (!isProviderRole || !hasProviderDetails || !profile) {
      return;
    }

    setLoadingListing(true);
    setListingError(false);

    const { data: details, error: detailsError } = await supabase
      .from('provider_details')
      .select('id, bio, years_experience, service_radius_km')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (detailsError) {
      setListingError(true);
      setLoadingListing(false);
      return;
    }

    if (!details) {
      setLoadingListing(false);
      return;
    }

    const { data: services, error: servicesError } = await supabase
      .from('provider_services')
      .select('subcategories(name_en)')
      .eq('provider_id', details.id);

    if (servicesError) {
      setListingError(true);
      setLoadingListing(false);
      return;
    }

    setListing({
      bio: details.bio,
      years_experience: details.years_experience,
      service_radius_km: details.service_radius_km,
      services: (services ?? [])
        .map((row: any) => row.subcategories?.name_en)
        .filter((name: string | undefined): name is string => Boolean(name)),
    });
    setLoadingListing(false);
  }, [isProviderRole, hasProviderDetails, profile]);

  useFocusEffect(
    useCallback(() => {
      loadListing();
    }, [loadListing])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="subtitle">{t('profile.title')}</ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{profile?.full_name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {profile?.phone}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('profile.accountType', {
                role: profile?.role ? t(`roleLabels.${profile.role}`) : '',
              })}
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedView style={styles.cardHeader}>
              <ThemedText type="smallBold">{t('profile.myLocation')}</ThemedText>
              <Pressable
                onPress={() => router.push('/location-settings')}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.editButton,
                  { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
                ]}>
                <ThemedText type="small">📍 {t('profile.editListing')}</ThemedText>
              </Pressable>
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              {profile?.search_location_label ?? t('profile.myLocationAuto')}
            </ThemedText>
          </ThemedView>

          {isProviderRole && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedView style={styles.cardHeader}>
                <ThemedText type="smallBold">{t('profile.yourListing')}</ThemedText>
                <Pressable
                  onPress={() => router.push('/edit-listing')}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.editButton,
                    { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <ThemedText type="small">⚙️ {t('profile.editListing')}</ThemedText>
                </Pressable>
              </ThemedView>
              {loadingListing && (
                <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>
              )}
              {!loadingListing && listingError && (
                <ThemedView style={styles.cardHeader}>
                  <ThemedText style={styles.errorText}>{t('common.loadError')}</ThemedText>
                  <Pressable
                    onPress={loadListing}
                    style={[styles.editButton, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="small">{t('common.tryAgain')}</ThemedText>
                  </Pressable>
                </ThemedView>
              )}
              {!loadingListing && !listingError && listing && (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('profile.services', {
                      services: listing.services.join(', ') || t('profile.noServicesYet'),
                    })}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('profile.serviceRadius', { radius: listing.service_radius_km })}
                  </ThemedText>
                  {listing.years_experience != null && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('profile.experience', { years: listing.years_experience })}
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
            <ThemedText type="smallBold">{t('profile.signOut')}</ThemedText>
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
  errorText: {
    color: '#D92D20',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  signOutButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});