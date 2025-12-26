// Hook para carregar perfil do usuário atual
import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  credits: number;
  preferences: {
    notifications?: boolean;
    theme?: string;
    language?: string;
    avatar?: string;
  };
  joinDate: string;
  totalQueries: number;
  favoriteService: string;
  role: string;
  status: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se estamos no cliente e se há token
      if (typeof window === 'undefined') {
        setProfile(null);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const data = await apiCall('/api/auth/me');
      setProfile(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const response = await apiCall('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (response.success) {
        // Atualizar estado local
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Erro ao atualizar perfil' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    // Só executar no cliente
    if (typeof window !== 'undefined') {
      loadUserProfile();
    }
  }, []);

  return {
    profile,
    loading,
    error,
    refetch: loadUserProfile,
    updateProfile
  };
}