import { Challenge } from '@/src/challenge/challenge';
import { RankingEntry, MOCK_STUDENTS } from '@/src/mock/ranking';

/**
 * Soma o XP dos desafios concluídos.
 */
export function computeXp(challenges: Challenge[], completedIds: string[]): number {
  const completedSet = new Set(completedIds);
  return challenges
    .filter((c) => completedSet.has(c.id))
    .reduce((acc, c) => acc + (c.xp ?? 0), 0);
}

export type Level = 'Iniciante' | 'Aprendiz' | 'Ritmista' | 'Mestre';

/**
 * Retorna o nível com base no XP acumulado.
 * Faixas: 0=Iniciante, 10=Aprendiz, 30=Ritmista, 60=Mestre
 */
export function levelFromXp(xp: number): Level {
  if (xp >= 60) return 'Mestre';
  if (xp >= 30) return 'Ritmista';
  if (xp >= 10) return 'Aprendiz';
  return 'Iniciante';
}

export interface RankingRow extends RankingEntry {
  position: number;
  isUser: boolean;
}

/**
 * Constrói um ranking misturando o usuário real com os alunos fictícios.
 * Ordena por XP decrescente; desempate por nome alfabético.
 * Retorna:
 *   - top5: os 5 primeiros colocados
 *   - userRow: linha do usuário (se estiver fora do top 5, incluída abaixo)
 *   - userInTop5: se o usuário já aparece no top 5
 */
export function buildRanking(
  userName: string,
  userXp: number,
  mockStudents: RankingEntry[] = MOCK_STUDENTS
): { top5: RankingRow[]; userRow: RankingRow; userInTop5: boolean } {
  const all: RankingEntry[] = [
    ...mockStudents.map((s) => ({ ...s, isUser: false })),
    { name: userName, xp: userXp, isUser: true },
  ];

  all.sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  const ranked: RankingRow[] = all.map((entry, i) => ({
    ...entry,
    position: i + 1,
    isUser: entry.isUser ?? false,
  }));

  const top5 = ranked.slice(0, 5);
  const userRow = ranked.find((r) => r.isUser)!;
  const userInTop5 = userRow.position <= 5;

  return { top5, userRow, userInTop5 };
}
