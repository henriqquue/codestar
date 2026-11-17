export interface ChallengeSummary {
  id: string;
  order: number;
}

export type TrailNodeState = 'completed' | 'current' | 'locked';

export interface ProgressRepository {
  getCompleted(): Promise<string[]>;
  markCompleted(challengeId: string): Promise<void>;
  recordAttempt(challengeId: string): Promise<void>;
  getAttempts(): Promise<Record<string, number>>;
}

/**
 * Computa o estado de cada nó na trilha visual.
 * Regras:
 * 1. Desafios já concluídos são 'completed'.
 * 2. O primeiro desafio não concluído cujo anterior foi concluído (ou o primeiro da trilha) é 'current'.
 * 3. Todos os demais são 'locked'.
 */
export function computeTrailState<T extends ChallengeSummary>(
  challenges: T[],
  completedIds: string[]
): Record<string, TrailNodeState> {
  const completedSet = new Set(completedIds);
  const result: Record<string, TrailNodeState> = {};
  let foundCurrent = false;

  for (let i = 0; i < challenges.length; i++) {
    const ch = challenges[i];
    const isCompleted = completedSet.has(ch.id);

    if (isCompleted) {
      result[ch.id] = 'completed';
    } else if (!foundCurrent) {
      // O primeiro nó não concluído é o nó 'current'
      result[ch.id] = 'current';
      foundCurrent = true;
    } else {
      result[ch.id] = 'locked';
    }
  }

  return result;
}
