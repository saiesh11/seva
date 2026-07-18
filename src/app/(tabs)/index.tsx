import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryIcon } from '@/constants/category-icons';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Category = { id: string; name_en: string };
type Subcategory = { id: string; category_id: string; name_en: string };

const GRID_COLUMNS = 3;

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('id, name_en').order('name_en'),
      supabase.from('subcategories').select('id, category_id, name_en'),
    ]).then(([categoriesRes, subcategoriesRes]) => {
      setCategories(categoriesRes.data ?? []);
      setSubcategories(subcategoriesRes.data ?? []);
      setLoading(false);
    });
  }, []);

  const filteredCategories = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return categories;

    const matchingCategoryIds = new Set(
      subcategories.filter((sub) => sub.name_en.toLowerCase().includes(trimmed)).map((sub) => sub.category_id)
    );

    return categories.filter(
      (category) => category.name_en.toLowerCase().includes(trimmed) || matchingCategoryIds.has(category.id)
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

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />

        {loading && <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>}
        {!loading && categories.length === 0 && (
          <ThemedText themeColor="textSecondary">{t('home.noCategories')}</ThemedText>
        )}
        {!loading && categories.length > 0 && filteredCategories.length === 0 && (
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
                  params: { categoryId: item.id, categoryName: item.name_en },
                })
              }
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText style={styles.tileIcon}>{getCategoryIcon(item.name_en)}</ThemedText>
              <ThemedText type="small" style={styles.tileLabel}>
                {item.name_en}
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
  searchInput: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
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
    flex: 1,
    aspectRatio: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  tileIcon: {
    fontSize: 32,
  },
  tileLabel: {
    textAlign: 'center',
  },
});
