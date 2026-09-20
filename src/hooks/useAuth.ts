import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'SUPER_ADMIN' | 'RESTAURANT_OWNER';
  name: string;
  restaurantId?: string;
  restaurantName?: string;
  restaurantNameAr?: string;
  restaurantNameEn?: string;
  restaurantSlug?: string;
  is_active: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    const fetchProfile = async (authUser: any) => {
      try {
        const userId = authUser.id;
        const userEmail = authUser.email?.trim().toLowerCase();

        // 1. Hardcoded root admin guarantee for project owner
        if (userEmail === '11monther33@gmail.com') {
          setUser({
            uid: userId,
            email: userEmail,
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Super Admin',
            role: 'SUPER_ADMIN',
            restaurantId: undefined,
            is_active: true,
          });
          setLoading(false);
          return;
        }

        // 2. Query profile by userId
        let { data } = await supabase
          .from('profiles')
          .select('id, email, name, role, restaurant_id, is_active')
          .eq('id', userId)
          .maybeSingle();

        // 3. Fallback: match by email
        if (!data && userEmail) {
          const { data: byEmail } = await supabase
            .from('profiles')
            .select('id, email, name, role, restaurant_id, is_active')
            .ilike('email', userEmail)
            .maybeSingle();
          if (byEmail) {
            data = byEmail;
          }
        }

        if (data) {
          const sanitizedData = { ...data };
          if (sanitizedData.restaurant_id === 'undefined') {
            sanitizedData.restaurant_id = undefined;
          }
          setUser({ uid: userId, ...sanitizedData, restaurantId: sanitizedData.restaurant_id } as UserProfile);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for changes on auth state (logged in, signed out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
