import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProviderListingForm, ProviderListingValues } from '@/components/provider-listing-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { requestAndGetLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase';

type ExistingListing = {
  providerId: string;
  subcategoryIds: string[];
  radiusKm: number;
  yearsExperience: number | null;
  bio: string | null;
  coords: { latitude: number; longitude: number } | null;
};

export default function EditListingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, refreshProviderDetails } = useAuth();
  const [existing, setExisting] = useState<ExistingListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!session) return;

      const [detailsRes, location] = await Promise.all([
        supabase
          .from('provider_details')
          .select('id, service_radius_km, years_experience, bio')
          .eq('profile_id', session.user.id)
          .maybeSingle(),
        requestAndGetLocation(),
      ]);

      const details = detailsRes.data;
      if (!details) {
        setLoading(false);
        return;
      }

      const { data: services } = await supabase
        .from('provider_services')
        .select('subcategory_id')
        .eq('provider_id', details.id);

      setExisting({
        providerId: details.id,
        subcategoryIds: (services ?? []).map((row) => row.subcategory_id),
        radiusKm: details.service_radius_km ?? 10,
        yearsExperience: details.years_experience,
        bio: details.bio,
        coords: location.granted ? location.coords : null,
      });
      setLoading(false);
    }
    load();
  }, [session]);

  async function handleSubmit(values: ProviderListingValues) {
    if (!existing) return t('providerSetup.genericError');

    const { error: updateError } = await supabase
      .from('provider_details')
      .update({
        location: `SRID=4326;POINT(${values.coords.longitude} ${values.coords.latitude})`,
        service_radius_km: values.radiusKm,
        years_experience: values.yearsExperience,
        bio: values.bio,
      })
      .eq('id', existing.providerId);

    if (updateError) return updateError.message;

    const { error: deleteError } = await supabase
      .from('provider_services')
      .delete()
      .eq('provider_id', existing.providerId);

    if (deleteError) return deleteError.message;

    const { error: insertError } = await supabase.from('provider_services').insert(
      values.subcategoryIds.map((subcategoryId) => ({
        provider_id: existing.providerId,
        subcategory_id: subcategoryId,
      }))
    );

    if (insertError) return insertError.message;

    await refreshProviderDetails();
    router.back();
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
              <ThemedText type="subtitle">{t('editListing.title')}</ThemedText>
            </ThemedView>

            {loading && <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>}

            {!loading && existing && (
              <ProviderListingForm
                initialSubcategoryIds={existing.subcategoryIds}
                initialRadiusKm={existing.radiusKm}
                initialYearsExperience={existing.yearsExperience}
                initialBio={existing.bio}
                initialCoords={existing.coords}
                submitLabel={t('editListing.save')}
                savingLabel={t('providerSetup.saving')}
                onSubmit={handleSubmit}
              />
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
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
});
