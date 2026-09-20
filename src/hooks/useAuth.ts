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
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    const fetchProfile = async (userId: string) => {
      try {
        let { data, error } = await supabase
          .from('profiles')
          .select('id, email, name, role, restaurant_id, is_active')
          .eq('id', userId)
          .maybeSingle();

        // If not found by auth id (e.g. first-time Google OAuth), fallback to match by email
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userEmail = authUser?.email?.trim().toLowerCase();

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

        // Hardcoded root admin guarantee for project owner
        if (userEmail === '11monther33@gmail.com') {
          data = {
            id: userId,
            email: userEmail,
            name: data?.name || 'Super Admin',
            role: 'SUPER_ADMIN',
            restaurant_id: data?.restaurant_id || undefined,
            is_active: true,
          };
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
        // 🔒 Silent fail
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
