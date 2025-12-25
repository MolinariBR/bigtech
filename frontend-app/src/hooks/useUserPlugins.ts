// Hook para carregar plugins permitidos para o usuário atual
import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';

interface UserPlugin {
  id: string;
  name: string;
  type: string;
  version: string;
  config?: Record<string, any>;
}

export function useUserPlugins() {
  const [plugins, setPlugins] = useState<UserPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserPlugins = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiCall('/api/auth/me/plugins');
      setPlugins(data.plugins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar plugins');
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPlugins();
  }, []);

  return {
    plugins,
    loading,
    error,
    refetch: loadUserPlugins
  };
}