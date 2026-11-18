import { SupabaseClient } from '@supabase/supabase-js';
import { ProgressRepository } from './types';

const COMPLETED_LOCAL_KEY = 'codestar_completed_challenges';
const ATTEMPTS_LOCAL_KEY = 'codestar_challenge_attempts';

export class SupabaseProgressRepository implements ProgressRepository {
  private supabase: SupabaseClient;
  private userId: string;
  private hasMigrated = false;

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Migração única e silenciosa do progresso que existia em localStorage
   */
  async migrateFromLocalStorage(): Promise<void> {
    if (this.hasMigrated) return;
    this.hasMigrated = true;

    if (typeof window === 'undefined') return;

    try {
      const rawCompleted = window.localStorage.getItem(COMPLETED_LOCAL_KEY);
      const rawAttempts = window.localStorage.getItem(ATTEMPTS_LOCAL_KEY);

      let localCompleted: string[] = [];
      let localAttempts: Record<string, number> = {};

      if (rawCompleted) {
        try {
          const parsed = JSON.parse(rawCompleted);
          if (Array.isArray(parsed)) localCompleted = parsed;
        } catch {
          // ignora JSON corrompido
        }
      }

      if (rawAttempts) {
        try {
          const parsed = JSON.parse(rawAttempts);
          if (parsed && typeof parsed === 'object') localAttempts = parsed;
        } catch {
          // ignora JSON corrompido
        }
      }

      const allChallengeIds = Array.from(
        new Set([...localCompleted, ...Object.keys(localAttempts)])
      );

      if (allChallengeIds.length > 0) {
        const rows = allChallengeIds.map((id) => ({
          user_id: this.userId,
          challenge_id: id,
          completed: localCompleted.includes(id),
          attempts: localAttempts[id] || (localCompleted.includes(id) ? 1 : 0),
          completed_at: localCompleted.includes(id) ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }));

        await this.supabase.from('progress').upsert(rows, {
          onConflict: 'user_id,challenge_id',
        });

        // Limpa chaves locais após migração bem sucedida
        window.localStorage.removeItem(COMPLETED_LOCAL_KEY);
        window.localStorage.removeItem(ATTEMPTS_LOCAL_KEY);
      }
    } catch (err) {
      console.warn('Aviso: Falha na migração de progresso do localStorage:', err);
    }
  }

  async getCompleted(): Promise<string[]> {
    try {
      await this.migrateFromLocalStorage();

      const { data, error } = await this.supabase
        .from('progress')
        .select('challenge_id')
        .eq('user_id', this.userId)
        .eq('completed', true);

      if (error) {
        console.warn('Erro ao buscar desafios concluídos no Supabase:', error.message);
        return [];
      }

      return (data || []).map((row) => row.challenge_id);
    } catch {
      return [];
    }
  }

  async markCompleted(challengeId: string): Promise<void> {
    if (!challengeId) return;

    try {
      // 1. Busca registro atual para preservar ou incrementar tentativas
      const { data: current } = await this.supabase
        .from('progress')
        .select('attempts')
        .eq('user_id', this.userId)
        .eq('challenge_id', challengeId)
        .maybeSingle();

      const attempts = (current?.attempts || 0) + 1;

      const { error } = await this.supabase.from('progress').upsert(
        {
          user_id: this.userId,
          challenge_id: challengeId,
          completed: true,
          attempts,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,challenge_id' }
      );

      if (error) {
        console.warn('Erro ao marcar desafio como concluído no Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Falha de rede ao marcar conclusão:', err);
    }
  }

  async recordAttempt(challengeId: string): Promise<void> {
    if (!challengeId) return;

    try {
      const { data: current } = await this.supabase
        .from('progress')
        .select('attempts, completed')
        .eq('user_id', this.userId)
        .eq('challenge_id', challengeId)
        .maybeSingle();

      const currentAttempts = current?.attempts || 0;
      const isCompleted = current?.completed || false;

      const { error } = await this.supabase.from('progress').upsert(
        {
          user_id: this.userId,
          challenge_id: challengeId,
          attempts: currentAttempts + 1,
          completed: isCompleted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,challenge_id' }
      );

      if (error) {
        console.warn('Erro ao registrar tentativa no Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Falha de rede ao registrar tentativa:', err);
    }
  }

  async getAttempts(): Promise<Record<string, number>> {
    try {
      await this.migrateFromLocalStorage();

      const { data, error } = await this.supabase
        .from('progress')
        .select('challenge_id, attempts')
        .eq('user_id', this.userId);

      if (error) {
        console.warn('Erro ao buscar tentativas no Supabase:', error.message);
        return {};
      }

      const map: Record<string, number> = {};
      (data || []).forEach((row) => {
        map[row.challenge_id] = row.attempts || 0;
      });

      return map;
    } catch {
      return {};
    }
  }
}
