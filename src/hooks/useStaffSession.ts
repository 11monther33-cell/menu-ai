import { useState, useEffect, useCallback } from 'react';

export interface StaffSession {
  staffId: string;
  name: string;
  role: 'cashier' | 'chef' | 'waiter' | 'branch_manager' | string;
  permissions: string[];
  branchId: string | null;
  restaurantId: string;
  restaurantName: string;
  loginTime: string;
}

const STORAGE_KEY = 'visiono_staff_session';

export function getStaffSession(): StaffSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useStaffSession() {
  const [session, setSessionState] = useState<StaffSession | null>(() => getStaffSession());

  useEffect(() => {
    const handleUpdate = () => {
      setSessionState(getStaffSession());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('staff_session_change', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('staff_session_change', handleUpdate);
    };
  }, []);

  const setSession = useCallback((newSession: StaffSession) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch (e) {
      console.error('Failed to save staff session', e);
    }
    setSessionState(newSession);
    window.dispatchEvent(new Event('staff_session_change'));
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear staff session', e);
    }
    setSessionState(null);
    window.dispatchEvent(new Event('staff_session_change'));
  }, []);

  const hasPermission = useCallback((permissionKey: string): boolean => {
    if (!session) return false;
    if (session.role === 'branch_manager') return true;
    return Array.isArray(session.permissions) && session.permissions.includes(permissionKey);
  }, [session]);

  return {
    session,
    setSession,
    clearSession,
    hasPermission,
    isLoggedIn: !!session
  };
}
