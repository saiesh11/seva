import type { Session } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  phone: string | null;
  full_name: string | null;
  role: 'customer' | 'provider' | 'both';
  preferred_language: 'en' | 'te' | 'hi';
  created_at: string;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  hasProviderDetails: boolean | null;
  loading: boolean;
  profileError: boolean;
  refreshProfile: () => Promise<void>;
  refreshProviderDetails: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasProviderDetails, setHasProviderDetails] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  const loadProviderDetails = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('provider_details')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (error) {
      setProfileError(true);
      return;
    }
    setHasProviderDetails(!!data);
  }, []);

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        setProfileError(true);
        return;
      }

      setProfileError(false);
      setProfile(data);

      if (data && (data.role === 'provider' || data.role === 'both')) {
        await loadProviderDetails(userId);
      } else {
        setHasProviderDetails(null);
      }
    },
    [loadProviderDetails]
  );

  const refreshProfile = useCallback(async () => {
    if (session) {
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile]);

  const refreshProviderDetails = useCallback(async () => {
    if (session) {
      await loadProviderDetails(session.user.id);
    }
  }, [session, loadProviderDetails]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      if (data.session) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setHasProviderDetails(null);
        setProfileError(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        hasProviderDetails,
        loading,
        profileError,
        refreshProfile,
        refreshProviderDetails,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
