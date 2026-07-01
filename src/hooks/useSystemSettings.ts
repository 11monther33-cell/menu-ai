import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value');

        if (error) throw error;

        const settingsMap: Record<string, string> = {};
        data?.forEach(item => {
          settingsMap[item.key] = item.value;
        });
        setSettings(settingsMap);
      } catch (err) {
        // 🔒 Silent fail — RLS may block non-admin access
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const getSetting = (key: string, defaultValue: string = '') => {
    // Priority: environment variable > DB setting > default value
    
    // 1. Check environment variable
    const envKey = `VITE_${key.toUpperCase()}`;
    const envValue = (import.meta.env as any)[envKey];
    if (envValue && envValue.trim() && !envValue.startsWith('YOUR_')) {
      return envValue.trim();
    }
    
    // 2. Check DB settings
    const dbValue = settings[key];
    if (dbValue && dbValue.trim() && dbValue !== 'P-XXXX') {
      return dbValue.trim();
    }
    
    // 3. Fallback to default (but filter out placeholder values)
    if (defaultValue && defaultValue !== 'P-XXXX') {
      return defaultValue;
    }
    
    return '';
  };

  return { settings, loading, getSetting };
};
