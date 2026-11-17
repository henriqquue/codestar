import { ProgressRepository } from './types';

const COMPLETED_KEY = 'codestar_completed_challenges';
const ATTEMPTS_KEY = 'codestar_challenge_attempts';

function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export class LocalProgressRepository implements ProgressRepository {
  private fallbackCompleted: string[] = [];
  private fallbackAttempts: Record<string, number> = {};

  async getCompleted(): Promise<string[]> {
    if (!isStorageAvailable()) {
      return [...this.fallbackCompleted];
    }
    try {
      const raw = window.localStorage.getItem(COMPLETED_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  }

  async markCompleted(challengeId: string): Promise<void> {
    if (!challengeId) return;
    const current = await this.getCompleted();
    if (!current.includes(challengeId)) {
      const updated = [...current, challengeId];
      if (isStorageAvailable()) {
        try {
          window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(updated));
        } catch {
          this.fallbackCompleted = updated;
        }
      } else {
        this.fallbackCompleted = updated;
      }
    }
  }

  async getAttempts(): Promise<Record<string, number>> {
    if (!isStorageAvailable()) {
      return { ...this.fallbackAttempts };
    }
    try {
      const raw = window.localStorage.getItem(ATTEMPTS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const valid: Record<string, number> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'number') {
            valid[k] = v;
          }
        }
        return valid;
      }
      return {};
    } catch {
      return {};
    }
  }

  async recordAttempt(challengeId: string): Promise<void> {
    if (!challengeId) return;
    const current = await this.getAttempts();
    const updated = {
      ...current,
      [challengeId]: (current[challengeId] || 0) + 1,
    };
    if (isStorageAvailable()) {
      try {
        window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(updated));
      } catch {
        this.fallbackAttempts = updated;
      }
    } else {
      this.fallbackAttempts = updated;
    }
  }
}
