import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

const ROLE_OPTIONS = [
  { value: 'customer', label: "I'm looking for services" },
  { value: 'provider', label: 'I offer services' },
  { value: 'both', label: 'Both' },
] as const;

export default function RoleScreen() {
  const theme = useTheme();
  const { session, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]['value'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!session) return;
    if (fullName.trim().length < 2) {
      setError('Enter your name');
      return;
    }
    if (!role) {
      setError('Pick one to continue');
      return;
    }

    setError(null);
    setLoading(true);
    const { error: insertError } = await supabase.from('profiles').insert({
      id: session.user.id,
      phone: session.user.phone,
      full_name: fullName.trim(),
      role,
      preferred_language: 'en',
    });
    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await refreshProfile();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.content}>
            <ThemedText type="subtitle">A couple of details</ThemedText>

            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              textContentType="name"
              autoFocus
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            <ThemedView style={styles.roleList}>
              {ROLE_OPTIONS.map((option) => {
                const selected = role === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setRole(option.value)}
                    style={[
                      styles.roleOption,
                      {
                        backgroundColor: selected ? theme.text : theme.backgroundElement,
                      },
                    ]}>
                    <ThemedText style={{ color: selected ? theme.background : theme.text }}>
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <Pressable
              onPress={handleContinue}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.text, opacity: pressed || loading ? 0.7 : 1 },
              ]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                {loading ? 'Saving…' : 'Continue'}
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
  },
  roleList: {
    gap: Spacing.two,
  },
  roleOption: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
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