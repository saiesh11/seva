import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (code.trim().length < 4) {
      setError('Enter the code you received');
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
            <ThemedText type="subtitle">Enter the code</ThemedText>
            <ThemedText themeColor="textSecondary">Sent to {phone}</ThemedText>

            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoFocus
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <Pressable
              onPress={handleVerify}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.text, opacity: pressed || loading ? 0.7 : 1 },
              ]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                {loading ? 'Verifying…' : 'Verify'}
              </ThemedText>
            </Pressable>

            <Pressable onPress={handleResend} disabled={resending}>
              <ThemedText type="link" themeColor="textSecondary">
                {resending ? 'Resending…' : "Didn't get a code? Resend"}
              </ThemedText>
            </Pressable>

            <Pressable onPress={() => router.back()}>
              <ThemedText type="link" themeColor="textSecondary">
                Change phone number
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
  error: {
    color: '#D92D20',
  },
  button: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});