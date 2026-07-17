import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { requestAndGetLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase';

type Category = { id: string; name_en: string };
type Subcategory = { id: string; category_id: string; name_en: string };

const RADIUS_OPTIONS_KM = [5, 10, 15, 20, 25];

export default function ProviderSetupScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { session, refreshProviderDetails } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<Set<string>>(new Set());
  const [radiusKm, setRadiusKm] = useState(10);
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      const [categoriesRes, subcategoriesRes] = await Promise.all([
        supabase.from('categories').select('id, name_en').order('name_en'),
        supabase.from('subcategories').select('id, category_id, name_en').order('name_en'),
      ]);
      setCategories(categoriesRes.data ?? []);
      setSubcategories(subcategoriesRes.data ?? []);
      setLoadingCatalog(false);
    }
    loadCatalog();
  }, []);

  function toggleSubcategory(id: string) {
    setSelectedSubcategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleUseCurrentLocation() {
    setError(null);
    setLocating(true);
    try {
      const location = await requestAndGetLocation({ forceRefresh: true });
      if (!location.granted) {
        setError(t('providerSetup.locationPermissionDenied'));
        return;
      }
      setCoords(location.coords);
    } catch {
      setError(t('providerSetup.locationError'));
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    if (!session) return;
    if (selectedSubcategoryIds.size === 0) {
      setError(t('providerSetup.servicesRequired'));
      return;
    }
    if (!coords) {
      setError(t('providerSetup.locationRequired'));
      return;
    }

    setError(null);
    setSubmitting(true);

    const { data: providerDetails, error: insertError } = await supabase
      .from('provider_details')
      .insert({
        profile_id: session.user.id,
        location: `SRID=4326;POINT(${coords.longitude} ${coords.latitude})`,
        service_radius_km: radiusKm,
        years_experience: yearsExperience ? Number(yearsExperience) : null,
        bio: bio.trim() || null,
      })
      .select('id')
      .single();

    if (insertError || !providerDetails) {
      setSubmitting(false);
      setError(insertError?.message ?? t('providerSetup.genericError'));
      return;
    }

    const { error: servicesError } = await supabase.from('provider_services').insert(
      Array.from(selectedSubcategoryIds).map((subcategoryId) => ({
        provider_id: providerDetails.id,
        subcategory_id: subcategoryId,
      }))
    );

    setSubmitting(false);

    if (servicesError) {
      setError(servicesError.message);
      return;
    }

    await refreshProviderDetails();
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.content}>
            <ThemedText type="subtitle">{t('providerSetup.title')}</ThemedText>

            <ThemedView style={styles.section}>
              <ThemedText type="smallBold">{t('providerSetup.servicesQuestion')}</ThemedText>
              {loadingCatalog && <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>}
              {categories.map((category) => (
                <ThemedView key={category.id} style={styles.categoryBlock}>
                  <ThemedText themeColor="textSecondary">{category.name_en}</ThemedText>
                  <ThemedView style={styles.chipWrap}>
                    {subcategories
                      .filter((sub) => sub.category_id === category.id)
                      .map((sub) => {
                        const selected = selectedSubcategoryIds.has(sub.id);
                        return (
                          <Pressable
                            key={sub.id}
                            onPress={() => toggleSubcategory(sub.id)}
                            style={[
                              styles.chip,
                              { backgroundColor: selected ? theme.text : theme.backgroundElement },
                            ]}>
                            <ThemedText
                              type="small"
                              style={{ color: selected ? theme.background : theme.text }}>
                              {sub.name_en}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                  </ThemedView>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="smallBold">{t('providerSetup.locationHeading')}</ThemedText>
              <Pressable
                onPress={handleUseCurrentLocation}
                disabled={locating}
                style={[styles.secondaryButton, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small">
                  {locating
                    ? t('providerSetup.gettingLocation')
                    : coords
                      ? t('providerSetup.locationCaptured')
                      : t('providerSetup.useCurrentLocation')}
                </ThemedText>
              </Pressable>

              <ThemedText type="smallBold">{t('providerSetup.serviceRadius')}</ThemedText>
              <ThemedView style={styles.chipWrap}>
                {RADIUS_OPTIONS_KM.map((km) => {
                  const selected = radiusKm === km;
                  return (
                    <Pressable
                      key={km}
                      onPress={() => setRadiusKm(km)}
                      style={[
                        styles.chip,
                        { backgroundColor: selected ? theme.text : theme.backgroundElement },
                      ]}>
                      <ThemedText type="small" style={{ color: selected ? theme.background : theme.text }}>
                        {t('providerSetup.kmSuffix', { km })}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="smallBold">{t('providerSetup.yearsExperienceLabel')}</ThemedText>
              <TextInput
                value={yearsExperience}
                onChangeText={(text) => setYearsExperience(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder={t('providerSetup.yearsExperiencePlaceholder')}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />

              <ThemedText type="smallBold">{t('providerSetup.bioLabel')}</ThemedText>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder={t('providerSetup.bioPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                multiline
                style={[
                  styles.input,
                  styles.bioInput,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
            </ThemedView>

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.text, opacity: pressed || submitting ? 0.7 : 1 },
              ]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                {submitting ? t('providerSetup.saving') : t('providerSetup.finish')}
              </ThemedText>
            </Pressable>
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
  section: {
    gap: Spacing.two,
  },
  categoryBlock: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: '#D92D20',
  },
  button: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});