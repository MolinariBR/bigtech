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

      // Verificar se estamos no cliente e se há token
      if (typeof window === 'undefined') {
        setPlugins([]);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setPlugins([]);
        setLoading(false);
        return;
      }

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
    // Só executar no cliente
    if (typeof window !== 'undefined') {
      loadUserPlugins();
    }
  }, []);

  return {
    plugins,
    loading,
    error,
    refetch: loadUserPlugins
  };
}