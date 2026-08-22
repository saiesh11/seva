import { Image } from 'expo-image';
import * as ExpoLinking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { NearbyProvidersMap } from '@/components/nearby-providers-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { requestAndGetLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase';

type NearbyProvider = {
  provider_id: string;
  profile_id: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  years_experience: number | null;
  photo_url: string | null;
  is_verified: boolean;
  avg_rating: number | null;
  review_count: number;
  latitude: number;
  longitude: number;
  distance_km: number;
};

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <ThemedText type="small">
      {'★'.repeat(filled)}
      {'☆'.repeat(5 - filled)}
    </ThemedText>
  );
}

export default function NearbyProvidersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, session } = useAuth();
  const { subcategoryId, subcategoryName } = useLocalSearchParams<{
    subcategoryId: string;
    subcategoryName: string;
  }>();

  const [providers, setProviders] = useState<NearbyProvider[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [customerCoords, setCustomerCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPermissionBlocked(false);

    try {
      let coords: { latitude: number; longitude: number };

      if (profile?.search_location_lat != null && profile?.search_location_lng != null) {
        coords = { latitude: profile.search_location_lat, longitude: profile.search_location_lng };
      } else {
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
        coords = location.coords;
      }

      setCustomerCoords(coords);

      const { data, error: rpcError } = await supabase.rpc('nearby_providers', {
        p_subcategory_id: subcategoryId,
        p_lat: coords.latitude,
        p_lng: coords.longitude,
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
  }, [subcategoryId, t, profile]);

  useEffect(() => {
    search();
  }, [search]);

  function openReview(providerId: string) {
    setReviewingId(providerId);
    setReviewRating(5);
    setReviewComment('');
    setReviewError(null);
  }

  function closeReview() {
    setReviewingId(null);
    setReviewError(null);
  }

  async function submitReview(providerId: string) {
    if (!session) return;

    setReviewSubmitting(true);
    setReviewError(null);

    const { error: reviewSubmitError } = await supabase.from('reviews').upsert(
      {
        provider_id: providerId,
        reviewer_id: session.user.id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      },
      { onConflict: 'provider_id,reviewer_id' }
    );

    setReviewSubmitting(false);

    if (reviewSubmitError) {
      setReviewError(t('reviews.error'));
      return;
    }

    setReviewingId(null);
    await search();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="link" themeColor="textSecondary">
              {t('common.back')}
            </ThemedText>
          </Pressable>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.titleText} numberOfLines={1}>
              {subcategoryName}
            </ThemedText>
            {Platform.OS !== 'web' && (
              <View style={[styles.viewToggle, { backgroundColor: theme.backgroundElement }]}>
                <Pressable
                  onPress={() => setViewMode('list')}
                  style={[
                    styles.viewToggleOption,
                    viewMode === 'list' && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="small">{t('nearbyProviders.listView')}</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setViewMode('map')}
                  style={[
                    styles.viewToggleOption,
                    viewMode === 'map' && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="small">{t('nearbyProviders.mapView')}</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </ThemedView>

        {loading && (
          <ThemedText themeColor="textSecondary">{t('nearbyProviders.searching')}</ThemedText>
        )}

        {!loading && error && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.error}>{error}</ThemedText>
            <Button
              label={permissionBlocked ? t('common.openSettings') : t('common.tryAgain')}
              variant="secondary"
              onPress={permissionBlocked ? () => ExpoLinking.openSettings() : search}
              style={styles.retryButton}
            />
          </ThemedView>
        )}

        {!loading && !error && providers && providers.length === 0 && (
          <ThemedText themeColor="textSecondary">{t('nearbyProviders.empty')}</ThemedText>
        )}

        {!loading && !error && viewMode === 'map' && customerCoords && (
          <View style={styles.mapWrapper}>
            <NearbyProvidersMap customerCoords={customerCoords} providers={providers ?? []} />
          </View>
        )}

        {viewMode === 'list' && (
          <FlatList
            data={providers ?? []}
            keyExtractor={(item) => item.provider_id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={[styles.card, styles.cardShadow]}>
                <View style={styles.cardRow}>
                  {item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <ThemedView type="backgroundSelected" style={[styles.avatar, styles.avatarPlaceholder]}>
                      <ThemedText style={styles.avatarPlaceholderIcon}>👤</ThemedText>
                    </ThemedView>
                  )}
                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <ThemedText type="smallBold">
                        {item.full_name ?? t('nearbyProviders.fallbackName')}
                      </ThemedText>
                      {item.is_verified && (
                        <View style={styles.verifiedBadge}>
                          <ThemedText type="small" style={styles.verifiedBadgeText}>
                            {t('nearbyProviders.verified')}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('nearbyProviders.distanceAway', { distance: item.distance_km.toFixed(1) })}
                      {item.years_experience
                        ? ` · ${t('nearbyProviders.yearsExperience', { years: item.years_experience })}`
                        : ''}
                    </ThemedText>
                    <View style={styles.ratingRow}>
                      {item.avg_rating != null ? (
                        <>
                          <StarRating rating={item.avg_rating} />
                          <ThemedText type="small" themeColor="textSecondary">
                            {t('nearbyProviders.ratingCount', { count: item.review_count })}
                          </ThemedText>
                        </>
                      ) : (
                        <ThemedText type="small" themeColor="textSecondary">
                          {t('nearbyProviders.noRatingsYet')}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </View>
                {item.bio && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.bio}
                  </ThemedText>
                )}
                <View style={styles.actionRow}>
                  <Button
                    label={t('nearbyProviders.call')}
                    onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}
                  />
                  {item.profile_id !== session?.user.id && (
                    <Button
                      label={t('nearbyProviders.rate')}
                      variant="secondary"
                      onPress={() => openReview(item.provider_id)}
                    />
                  )}
                </View>
  
                {reviewingId === item.provider_id && (
                  <View style={styles.reviewForm}>
                    <ThemedText type="smallBold">{t('reviews.ratingLabel')}</ThemedText>
                    <View style={styles.starPicker}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Pressable key={value} onPress={() => setReviewRating(value)}>
                          <ThemedText style={styles.starPickerIcon}>
                            {value <= reviewRating ? '★' : '☆'}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      value={reviewComment}
                      onChangeText={setReviewComment}
                      placeholder={t('reviews.commentPlaceholder')}
                      placeholderTextColor={theme.textSecondary}
                      multiline
                      style={[styles.reviewInput, { color: theme.text, backgroundColor: theme.background }]}
                    />
                    {reviewError && <ThemedText style={styles.error}>{reviewError}</ThemedText>}
                    <View style={styles.actionRow}>
                      <Button
                        label={reviewSubmitting ? t('reviews.submitting') : t('reviews.submit')}
                        loading={reviewSubmitting}
                        onPress={() => submitReview(item.provider_id)}
                      />
                      <Button
                        label={t('nearbyProviders.cancel')}
                        variant="secondary"
                        onPress={closeReview}
                      />
                    </View>
                  </View>
                )}
              </ThemedView>
            )}
          />
        )}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleText: {
    flex: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: Spacing.four,
    padding: 2,
  },
  viewToggleOption: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  error: {
    color: '#D92D20',
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  list: {
    flex: 1,
    alignSelf: 'stretch',
  },
  mapWrapper: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    overflow: 'hidden',
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderIcon: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  verifiedBadge: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    backgroundColor: '#12B76A',
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  reviewForm: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  starPicker: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  starPickerIcon: {
    fontSize: 24,
  },
  reviewInput: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});