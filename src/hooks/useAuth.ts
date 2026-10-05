import { useState, useEffect, useCallback } from 'react';
import { supabase, type Profile } from '@/lib/supabase';

export type AuthUser = {
  id: string;
  email: string;
  avatarUrl: string | null;
  name: string | null;
};

export type AuthState = {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  needsUsername: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    needsUsername: false,
  });

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        setState({ user: null, profile: null, loading: false, needsUsername: false });
        return;
      }

      const authUser = session.user;
      const user: AuthUser = {
        id: authUser.id,
        email: authUser.email ?? '',
        avatarUrl: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? null,
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
      };

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!mounted) return;

      setState({
        user,
        profile: profile as Profile | null,
        loading: false,
        needsUsername: !profile,
      });
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session) {
          if (mounted) {
            setState({ user: null, profile: null, loading: false, needsUsername: false });
          }
          return;
        }

        const authUser = session.user;
        const user: AuthUser = {
          id: authUser.id,
          email: authUser.email ?? '',
          avatarUrl: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? null,
          name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        };

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!mounted) return;

        setState({
          user,
          profile: profile as Profile | null,
          loading: false,
          needsUsername: !profile,
        });
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, loading: false, needsUsername: false });
  }, []);

  const saveUsername = useCallback(async (username: string) => {
    if (!state.user) return;
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: state.user.id, username })
      .select('*')
      .maybeSingle();

    if (error) throw error;

    setState((prev) => ({
      ...prev,
      profile: data as Profile,
      needsUsername: false,
    }));
  }, [state.user]);

  return {
    ...state,
    signInWithGoogle,
    signOut,
    saveUsername,
  };
}
