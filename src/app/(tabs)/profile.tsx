import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { localizedName } from '@/lib/localized-name';
import { supabase } from '@/lib/supabase';

const AVATAR_GRADIENT = ['#3C9FFE', '#0274DF'] as const;

const LANGUAGE_OPTIONS = [
  { code: 'en', labelKey: 'language.english' },
  { code: 'te', labelKey: 'language.telugu' },
  { code: 'hi', labelKey: 'language.hindi' },
] as const;

type MyListing = {
  photoUrl: string | null;
  bio: string | null;
  years_experience: number | null;
  service_radius_km: number | null;
  services: { name_en: string; name_te: string | null; name_hi: string | null }[];
};

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { session, profile, hasProviderDetails, refreshProfile } = useAuth();
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
      .select('id, photo_url, bio, years_experience, service_radius_km')
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
      .select('subcategories(name_en, name_te, name_hi)')
      .eq('provider_id', details.id);

    if (servicesError) {
      setListingError(true);
      setLoadingListing(false);
      return;
    }

    setListing({
      photoUrl: details.photo_url,
      bio: details.bio,
      years_experience: details.years_experience,
      service_radius_km: details.service_radius_km,
      services: (services ?? [])
        .map((row: any) => row.subcategories)
        .filter(Boolean),
    });
    setLoadingListing(false);
  }, [isProviderRole, hasProviderDetails, profile]);

  useFocusEffect(
    useCallback(() => {
      loadListing();
    }, [loadListing])
  );

  async function handleLanguageChange(code: 'en' | 'te' | 'hi') {
    if (!session || i18n.language === code) return;
    i18n.changeLanguage(code);
    await supabase.from('profiles').update({ preferred_language: code }).eq('id', session.user.id);
    await refreshProfile();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            {t('profile.title')}
          </ThemedText>

          <ThemedView type="backgroundElement" style={[styles.card, styles.identityCard]}>
            {listing?.photoUrl ? (
              <Image source={{ uri: listing.photoUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={AVATAR_GRADIENT} style={[styles.avatar, styles.avatarGradientFill]}>
                <ThemedText style={styles.avatarInitial}>
                  {(profile?.full_name?.trim().charAt(0) ?? '?').toUpperCase()}
                </ThemedText>
              </LinearGradient>
            )}
            <View style={styles.identityInfo}>
              <ThemedText type="subtitle" style={styles.nameText} numberOfLines={1}>
                {profile?.full_name}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{profile?.phone}</ThemedText>
              <View style={styles.roleBadge}>
                <ThemedText type="small" style={styles.roleBadgeText}>
                  {profile?.role ? t(`roleLabels.${profile.role}`) : ''}
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={[styles.card, styles.cardShadow]}>
            <ThemedText type="smallBold">{t('language.title')}</ThemedText>
            <View style={styles.languageRow}>
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = i18n.language === option.code;
                return (
                  <Pressable
                    key={option.code}
                    onPress={() => handleLanguageChange(option.code)}
                    style={[
                      styles.languageChip,
                      { backgroundColor: selected ? theme.text : theme.backgroundSelected },
                    ]}>
                    <ThemedText type="small" style={{ color: selected ? theme.background : theme.text }}>
                      {t(option.labelKey)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={[styles.card, styles.cardShadow]}>
            <View style={styles.cardHeader}>
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
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {profile?.search_location_label ?? t('profile.myLocationAuto')}
            </ThemedText>
          </ThemedView>

          {isProviderRole && (
            <ThemedView type="backgroundElement" style={[styles.card, styles.cardShadow]}>
              <View style={styles.cardHeader}>
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
              </View>
              {loadingListing && (
                <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>
              )}
              {!loadingListing && listingError && (
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.errorText}>{t('common.loadError')}</ThemedText>
                  <Button label={t('common.tryAgain')} variant="secondary" onPress={loadListing} />
                </View>
              )}
              {!loadingListing && !listingError && listing && (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('profile.services', {
                      services:
                        listing.services.map((s) => localizedName(s, i18n.language)).join(', ') ||
                        t('profile.noServicesYet'),
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

          <Button
            label={t('profile.signOut')}
            variant="destructive"
            onPress={() => supabase.auth.signOut()}
          />
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
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarGradientFill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  identityInfo: {
    flex: 1,
    gap: 4,
  },
  nameText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    backgroundColor: 'rgba(60, 159, 254, 0.16)',
  },
  roleBadgeText: {
    color: '#0274DF',
    textTransform: 'capitalize',
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  languageChip: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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
});