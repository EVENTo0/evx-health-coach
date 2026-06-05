import { useEffect } from 'react';
import { useAppStore } from '../store';
import { supabase, authService, healthProfileService } from '../services/supabase';

export const useAuth = () => {
  const { user, setUser, setHealthProfile, setLoading } = useAppStore();

  useEffect(() => {
    // Get initial session
    authService.getSession().then(async (session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name,
        } as any);
        const profile = await healthProfileService.get(session.user.id);
        setHealthProfile(profile);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name,
        } as any);
        const profile = await healthProfileService.get(session.user.id);
        setHealthProfile(profile);
      } else {
        setUser(null);
        setHealthProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      await authService.signUp(email, password, fullName);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
  };

  return { user, signIn, signUp, signOut };
};
