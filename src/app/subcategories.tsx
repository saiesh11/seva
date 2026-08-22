import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { localizedName } from '@/lib/localized-name';
import { supabase } from '@/lib/supabase';

type Subcategory = { id: string; name_en: string; name_te: string | null; name_hi: string | null };

export default function SubcategoriesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
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
      .select('id, name_en, name_te, name_hi')
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
            <Button
              label={t('common.tryAgain')}
              variant="secondary"
              onPress={loadSubcategories}
              style={styles.retryButton}
            />
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
                  params: { subcategoryId: item.id, subcategoryName: localizedName(item, i18n.language) },
                })
              }
              style={({ pressed }) => [
                styles.row,
                styles.rowShadow,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="default">{localizedName(item, i18n.language)}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.chevron}>
                ›
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
  list: {
    flex: 1,
    alignSelf: 'stretch',
  },
  listContent: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowShadow: {
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
  chevron: {
    fontSize: 20,
  },
});