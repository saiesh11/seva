import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function PhoneScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    if (digits.length !== 10) {
      setError(t('phone.invalidNumber'));
      return;
    }

    const phone = `+91${digits}`;

    setError(null);
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    router.push({ pathname: '/(auth)/verify', params: { phone } });
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.content}>
            <ThemedText type="subtitle">{t('phone.title')}</ThemedText>
            <ThemedText themeColor="textSecondary">{t('phone.subtitle')}</ThemedText>

            <ThemedView
              type="backgroundElement"
              style={[styles.inputRow, styles.inputShadow]}>
              <ThemedText type="default" themeColor="textSecondary" style={styles.prefix}>
                +91
              </ThemedText>
              <TextInput
                value={digits}
                onChangeText={(text) => setDigits(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="XXXXXXXXXX"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                textContentType="telephoneNumber"
                maxLength={10}
                autoFocus
                style={[styles.input, { color: theme.text }]}
              />
            </ThemedView>

            {error && (
              <ThemedText themeColor="text" style={styles.error}>
                {error}
              </ThemedText>
            )}

            <Button
              label={loading ? t('phone.sending') : t('phone.sendCode')}
              loading={loading}
              onPress={handleSendCode}
            />
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingLeft: Spacing.three,
  },
  inputShadow: {
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
  prefix: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  error: {
    color: '#D92D20',
  },
});