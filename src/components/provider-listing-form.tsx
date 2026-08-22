import { Image } from 'expo-image';
import * as ExpoImagePicker from 'expo-image-picker';
import * as ExpoLinking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { localizedName } from '@/lib/localized-name';
import { requestAndGetLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase';

type Category = { id: string; name_en: string; name_te: string | null; name_hi: string | null };
type Subcategory = {
  id: string;
  category_id: string;
  name_en: string;
  name_te: string | null;
  name_hi: string | null;
};

const RADIUS_OPTIONS_KM = [5, 10, 15, 20, 25];

export type ProviderListingValues = {
  subcategoryIds: string[];
  radiusKm: number;
  yearsExperience: number | null;
  bio: string | null;
  coords: { latitude: number; longitude: number };
  photoUrl: string | null;
};

type ProviderListingFormProps = {
  initialSubcategoryIds?: string[];
  initialRadiusKm?: number;
  initialYearsExperience?: number | null;
  initialBio?: string | null;
  initialCoords?: { latitude: number; longitude: number } | null;
  initialPhotoUrl?: string | null;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (values: ProviderListingValues) => Promise<string | void>;
};

async function uploadProviderPhoto(localUri: string, profileId: string): Promise<string> {
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  // Stable path so re-uploads overwrite the same object instead of leaking
  // orphaned files; a cache-busting query param keeps the stored URL fresh
  // so cached <Image> views pick up the change.
  const path = `${profileId}/photo.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('provider-photos')
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('provider-photos').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export function ProviderListingForm({
  initialSubcategoryIds,
  initialRadiusKm,
  initialYearsExperience,
  initialBio,
  initialCoords,
  initialPhotoUrl,
  submitLabel,
  savingLabel,
  onSubmit,
}: ProviderListingFormProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { session } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState(false);

  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<Set<string>>(
    new Set(initialSubcategoryIds ?? [])
  );
  const [radiusKm, setRadiusKm] = useState(initialRadiusKm ?? 10);
  const [yearsExperience, setYearsExperience] = useState(
    initialYearsExperience != null ? String(initialYearsExperience) : ''
  );
  const [bio, setBio] = useState(initialBio ?? '');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    initialCoords ?? null
  );
  const [locating, setLocating] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl ?? null);
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(false);
    const [categoriesRes, subcategoriesRes] = await Promise.all([
      supabase.from('categories').select('id, name_en, name_te, name_hi').order('name_en'),
      supabase.from('subcategories').select('id, category_id, name_en, name_te, name_hi').order('name_en'),
    ]);
    if (categoriesRes.error || subcategoriesRes.error) {
      setCatalogError(true);
      setLoadingCatalog(false);
      return;
    }
    setCategories(categoriesRes.data ?? []);
    setSubcategories(subcategoriesRes.data ?? []);
    setLoadingCatalog(false);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

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

  async function handlePickPhoto() {
    setError(null);
    setPermissionBlocked(false);

    const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        setPermissionBlocked(true);
      }
      setError(t('providerSetup.photoPermissionDenied'));
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setNewPhotoUri(result.assets[0].uri);
    }
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
          setError(t('providerSetup.locationPermissionBlocked'));
        } else {
          setError(t('providerSetup.locationPermissionDenied'));
        }
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
    if (selectedSubcategoryIds.size === 0) {
      setError(t('providerSetup.servicesRequired'));
      return;
    }
    if (!coords) {
      setError(t('providerSetup.locationRequired'));
      return;
    }

    if (newPhotoUri && !session) {
      setError(t('providerSetup.photoUploadError'));
      return;
    }

    setError(null);
    setSubmitting(true);

    let finalPhotoUrl = photoUrl;
    if (newPhotoUri && session) {
      setUploadingPhoto(true);
      try {
        finalPhotoUrl = await uploadProviderPhoto(newPhotoUri, session.user.id);
        setPhotoUrl(finalPhotoUrl);
        setNewPhotoUri(null);
      } catch {
        setError(t('providerSetup.photoUploadError'));
        setSubmitting(false);
        setUploadingPhoto(false);
        return;
      }
      setUploadingPhoto(false);
    }

    const submitError = await onSubmit({
      subcategoryIds: Array.from(selectedSubcategoryIds),
      radiusKm,
      yearsExperience: yearsExperience ? Number(yearsExperience) : null,
      bio: bio.trim() || null,
      coords,
      photoUrl: finalPhotoUrl,
    });

    setSubmitting(false);

    if (submitError) {
      setError(submitError);
    }
  }

  const previewUri = newPhotoUri ?? photoUrl;

  return (
    <>
      <ThemedView style={styles.section}>
        <ThemedText type="smallBold">{t('providerSetup.photoLabel')}</ThemedText>
        <Pressable onPress={handlePickPhoto} style={styles.photoRow}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.photoPreview} contentFit="cover" />
          ) : (
            <ThemedView style={[styles.photoPreview, styles.photoPlaceholder, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.photoPlaceholderIcon}>📷</ThemedText>
            </ThemedView>
          )}
          <ThemedText type="small" themeColor="textSecondary">
            {previewUri ? t('providerSetup.changePhoto') : t('providerSetup.addPhoto')}
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="smallBold">{t('providerSetup.servicesQuestion')}</ThemedText>
        {loadingCatalog && <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>}
        {!loadingCatalog && catalogError && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.error}>{t('common.loadError')}</ThemedText>
            <Button label={t('common.tryAgain')} variant="secondary" onPress={loadCatalog} style={styles.inlineButton} />
          </ThemedView>
        )}
        {categories.map((category) => (
          <ThemedView key={category.id} style={styles.categoryBlock}>
            <ThemedText themeColor="textSecondary">{localizedName(category, i18n.language)}</ThemedText>
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
                      <ThemedText type="small" style={{ color: selected ? theme.background : theme.text }}>
                        {localizedName(sub, i18n.language)}
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
        <Button
          variant="secondary"
          loading={locating}
          onPress={handleUseCurrentLocation}
          label={
            locating
              ? t('providerSetup.gettingLocation')
              : coords
                ? t('providerSetup.locationCaptured')
                : t('providerSetup.useCurrentLocation')
          }
        />

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

      {permissionBlocked && (
        <Button
          variant="secondary"
          label={t('common.openSettings')}
          onPress={() => ExpoLinking.openSettings()}
        />
      )}

      <Button
        label={submitting ? (uploadingPhoto ? t('providerSetup.uploadingPhoto') : savingLabel) : submitLabel}
        loading={submitting}
        onPress={handleSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 24,
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
  inlineButton: {
    alignSelf: 'flex-start',
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
});
