'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { ProgressRepository } from './types';
import { LocalProgressRepository } from './LocalProgressRepository';

interface ProgressContextValue {
  completed: string[];
  attempts: Record<string, number>;
  loading: boolean;
  markCompleted: (challengeId: string) => Promise<void>;
  recordAttempt: (challengeId: string) => Promise<void>;
}

const defaultRepository = new LocalProgressRepository();

const ProgressContext = createContext<ProgressContextValue | null>(null);

export interface ProgressProviderProps {
  children: React.ReactNode;
  repository?: ProgressRepository;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({
  children,
  repository = defaultRepository,
}) => {
  const [completed, setCompleted] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [comp, att] = await Promise.all([
          repository.getCompleted(),
          repository.getAttempts(),
        ]);
        if (mounted) {
          setCompleted(comp);
          setAttempts(att);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [repository]);

  const markCompleted = useCallback(
    async (challengeId: string) => {
      await repository.markCompleted(challengeId);
      const updated = await repository.getCompleted();
      setCompleted(updated);
    },
    [repository]
  );

  const recordAttempt = useCallback(
    async (challengeId: string) => {
      await repository.recordAttempt(challengeId);
      const updated = await repository.getAttempts();
      setAttempts(updated);
    },
    [repository]
  );

  const value = useMemo(
    () => ({
      completed,
      attempts,
      loading,
      markCompleted,
      recordAttempt,
    }),
    [completed, attempts, loading, markCompleted, recordAttempt]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress deve ser usado dentro de um ProgressProvider');
  }
  return ctx;
}
