import { supabase } from './supabase';

export const logAdminAction = async (
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, any> = {}
) => {
  try {
    // Get current user to log as actor
    const { data: { session } } = await supabase.auth.getSession();
    const actorId = session?.user?.id;
    
    // We assume if this is called from the dashboard, it's a super_admin
    const actorType = 'super_admin';

    const { error } = await supabase.from('admin_activity_log').insert({
      actor_type: actorType,
      actor_id: actorId,
      action: action,
      target_type: targetType,
      target_id: targetId,
      details: details,
    });

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  } catch (err) {
    console.error('Exception logging admin action:', err);
  }
};
