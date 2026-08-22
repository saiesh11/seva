import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProviderListingForm, ProviderListingValues } from '@/components/provider-listing-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function ProviderSetupScreen() {
  const { t } = useTranslation();
  const { session, refreshProviderDetails } = useAuth();

  async function handleSubmit(values: ProviderListingValues) {
    if (!session) return t('providerSetup.genericError');

    const { data: providerDetails, error: insertError } = await supabase
      .from('provider_details')
      .insert({
        profile_id: session.user.id,
        location: `SRID=4326;POINT(${values.coords.longitude} ${values.coords.latitude})`,
        service_radius_km: values.radiusKm,
        years_experience: values.yearsExperience,
        bio: values.bio,
        photo_url: values.photoUrl,
      })
      .select('id')
      .single();

    if (insertError || !providerDetails) {
      return insertError?.message ?? t('providerSetup.genericError');
    }

    const { error: servicesError } = await supabase.from('provider_services').insert(
      values.subcategoryIds.map((subcategoryId) => ({
        provider_id: providerDetails.id,
        subcategory_id: subcategoryId,
      }))
    );

    if (servicesError) {
      return servicesError.message;
    }

    await refreshProviderDetails();
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.content}>
            <ThemedText type="subtitle">{t('providerSetup.title')}</ThemedText>
            <ProviderListingForm
              submitLabel={t('providerSetup.finish')}
              savingLabel={t('providerSetup.saving')}
              onSubmit={handleSubmit}
            />
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
});
