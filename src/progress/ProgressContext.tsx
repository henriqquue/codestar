'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { ProgressRepository } from './types';
import { LocalProgressRepository } from './LocalProgressRepository';
import { SupabaseProgressRepository } from './SupabaseProgressRepository';
import { useAuth } from '@/src/lib/auth/AuthContext';
import { createClient } from '@/src/lib/supabase/client';

interface ProgressContextValue {
  completed: string[];
  attempts: Record<string, number>;
  loading: boolean;
  networkWarning: boolean;
  markCompleted: (challengeId: string) => Promise<void>;
  recordAttempt: (challengeId: string) => Promise<void>;
}

const defaultLocalRepo = new LocalProgressRepository();

const ProgressContext = createContext<ProgressContextValue | null>(null);

export interface ProgressProviderProps {
  children: React.ReactNode;
  repository?: ProgressRepository;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({
  children,
  repository: overrideRepo,
}) => {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // Seleciona o repositório: prop override -> Supabase (se logado) -> LocalStorage
  const activeRepo = useMemo<ProgressRepository>(() => {
    if (overrideRepo) return overrideRepo;
    if (user?.id) {
      return new SupabaseProgressRepository(supabase, user.id);
    }
    return defaultLocalRepo;
  }, [overrideRepo, user?.id, supabase]);

  const [completed, setCompleted] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [networkWarning, setNetworkWarning] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [comp, att] = await Promise.all([
          activeRepo.getCompleted(),
          activeRepo.getAttempts(),
        ]);
        if (mounted) {
          setCompleted(comp);
          setAttempts(att);
          setLoading(false);
          setNetworkWarning(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
          setNetworkWarning(true);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activeRepo]);

  const markCompleted = useCallback(
    async (challengeId: string) => {
      try {
        // Atualização otimista na interface para não travar a experiência do usuário
        setCompleted((prev) => (prev.includes(challengeId) ? prev : [...prev, challengeId]));
        await activeRepo.markCompleted(challengeId);
        const updated = await activeRepo.getCompleted();
        setCompleted(updated);
        setNetworkWarning(false);
      } catch {
        setNetworkWarning(true);
      }
    },
    [activeRepo]
  );

  const recordAttempt = useCallback(
    async (challengeId: string) => {
      try {
        setAttempts((prev) => ({
          ...prev,
          [challengeId]: (prev[challengeId] || 0) + 1,
        }));
        await activeRepo.recordAttempt(challengeId);
        const updated = await activeRepo.getAttempts();
        setAttempts(updated);
        setNetworkWarning(false);
      } catch {
        setNetworkWarning(true);
      }
    },
    [activeRepo]
  );

  const value = useMemo(
    () => ({
      completed,
      attempts,
      loading,
      networkWarning,
      markCompleted,
      recordAttempt,
    }),
    [completed, attempts, loading, networkWarning, markCompleted, recordAttempt]
  );

  return (
    <ProgressContext.Provider value={value}>
      {networkWarning && (
        <div className="network-warning-bar" role="status">
          <span>⚠️ Falha temporária de rede ao sincronizar progresso. Você pode continuar resolvendo os desafios offline.</span>
        </div>
      )}
      {children}
    </ProgressContext.Provider>
  );
};

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress deve ser usado dentro de um ProgressProvider');
  }
  return ctx;
}
