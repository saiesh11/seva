import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Subcategory = { id: string; name_en: string };

export default function SubcategoriesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadSubcategories = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from('subcategories')
      .select('id, name_en')
      .eq('category_id', categoryId)
      .order('name_en');
    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setSubcategories(data ?? []);
    setLoading(false);
  }, [categoryId]);

  useEffect(() => {
    loadSubcategories();
  }, [loadSubcategories]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="link" themeColor="textSecondary">
              {t('common.back')}
            </ThemedText>
          </Pressable>
          <ThemedText type="subtitle">{categoryName}</ThemedText>
        </ThemedView>

        {loading && <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>}
        {!loading && loadError && (
          <ThemedView style={styles.header}>
            <ThemedText style={styles.errorText}>{t('common.loadError')}</ThemedText>
            <Pressable
              onPress={loadSubcategories}
              style={[styles.retryButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small">{t('common.tryAgain')}</ThemedText>
            </Pressable>
          </ThemedView>
        )}
        {!loading && !loadError && subcategories.length === 0 && (
          <ThemedText themeColor="textSecondary">{t('subcategories.empty')}</ThemedText>
        )}

        <FlatList
          data={subcategories}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/nearby-providers',
                  params: { subcategoryId: item.id, subcategoryName: item.name_en },
                })
              }
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="default">{item.name_en}</ThemedText>
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
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  list: {
    flex: 1,
    alignSelf: 'stretch',
  },
  listContent: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});