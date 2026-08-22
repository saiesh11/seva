import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (code.trim().length < 4) {
      setError(t('verify.invalidCode'));
      return;
    }

    setError(null);
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code.trim(),
      type: 'sms',
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
    }
    // On success the auth state listener updates the session and the root
    // layout redirects automatically — no manual navigation needed here.
  }

  async function handleResend() {
    setError(null);
    setResending(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
    setResending(false);
    if (otpError) {
      setError(otpError.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.content}>
            <ThemedText type="subtitle">{t('verify.title')}</ThemedText>
            <ThemedText themeColor="textSecondary">{t('verify.sentTo', { phone })}</ThemedText>

            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoFocus
              style={[
                styles.input,
                styles.inputShadow,
                { color: theme.text, backgroundColor: theme.backgroundElement },
              ]}
            />

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <Button
              label={loading ? t('verify.verifying') : t('verify.verify')}
              loading={loading}
              onPress={handleVerify}
            />

            <Pressable onPress={handleResend} disabled={resending}>
              <ThemedText type="link" themeColor="textSecondary">
                {resending ? t('verify.resending') : t('verify.resend')}
              </ThemedText>
            </Pressable>

            <Pressable onPress={() => router.back()}>
              <ThemedText type="link" themeColor="textSecondary">
                {t('verify.changeNumber')}
              </ThemedText>
            </Pressable>
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
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    letterSpacing: 4,
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
  error: {
    color: '#D92D20',
  },
});