import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, Pressable, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryIcon } from '@/constants/category-icons';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { localizedName } from '@/lib/localized-name';
import { supabase } from '@/lib/supabase';

type Category = { id: string; name_en: string; name_te: string | null; name_hi: string | null };
type Subcategory = {
  id: string;
  category_id: string;
  name_en: string;
  name_te: string | null;
  name_hi: string | null;
};

const GRID_COLUMNS = 3;

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');

  const contentWidth = Math.min(windowWidth, MaxContentWidth) - Spacing.four * 2;
  const tileSize = (contentWidth - Spacing.three * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const [categoriesRes, subcategoriesRes] = await Promise.all([
      supabase.from('categories').select('id, name_en, name_te, name_hi').order('name_en'),
      supabase.from('subcategories').select('id, category_id, name_en, name_te, name_hi'),
    ]);
    if (categoriesRes.error || subcategoriesRes.error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setCategories(categoriesRes.data ?? []);
    setSubcategories(subcategoriesRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return categories;

    const matchesQuery = (item: { name_en: string; name_te: string | null; name_hi: string | null }) =>
      [item.name_en, item.name_te, item.name_hi].some((name) =>
        name?.toLowerCase().includes(trimmed)
      );

    const matchingCategoryIds = new Set(
      subcategories.filter(matchesQuery).map((sub) => sub.category_id)
    );

    return categories.filter(
      (category) => matchesQuery(category) || matchingCategoryIds.has(category.id)
    );
  }, [categories, subcategories, query]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">{t('home.title')}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {t('home.greeting', { name: profile?.full_name ?? 'there' })}
          </ThemedText>
        </ThemedView>

        <ThemedView style={[styles.searchRow, styles.searchShadow, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </ThemedView>

        {loading && <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>}
        {!loading && loadError && (
          <ThemedView style={styles.header}>
            <ThemedText style={styles.errorText}>{t('common.loadError')}</ThemedText>
            <Button label={t('common.tryAgain')} variant="secondary" onPress={loadCategories} style={styles.retryButton} />
          </ThemedView>
        )}
        {!loading && !loadError && categories.length === 0 && (
          <ThemedText themeColor="textSecondary">{t('home.noCategories')}</ThemedText>
        )}
        {!loading && !loadError && categories.length > 0 && filteredCategories.length === 0 && (
          <ThemedText themeColor="textSecondary">{t('home.noResults', { query })}</ThemedText>
        )}

        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          numColumns={GRID_COLUMNS}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/subcategories',
                  params: { categoryId: item.id, categoryName: localizedName(item, i18n.language) },
                })
              }
              style={({ pressed }) => [
                styles.tile,
                styles.tileShadow,
                {
                  width: tileSize,
                  height: tileSize,
                  backgroundColor: theme.backgroundElement,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ThemedText style={styles.tileIcon}>{getCategoryIcon(item.name_en)}</ThemedText>
              <ThemedText
                type="small"
                style={styles.tileLabel}
                numberOfLines={2}
                ellipsizeMode="tail">
                {localizedName(item, i18n.language)}
              </ThemedText>
            </Pressable>
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
  errorText: {
    color: '#D92D20',
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  searchShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  list: {
    flex: 1,
    alignSelf: 'stretch',
  },
  listContent: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  gridRow: {
    gap: Spacing.three,
  },
  tile: {
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  tileShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tileIcon: {
    fontSize: 32,
    lineHeight: 40,
  },
  tileLabel: {
    textAlign: 'center',
  },
});
