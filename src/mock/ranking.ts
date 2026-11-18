export interface RankingEntry {
  name: string;
  xp: number;
  isUser?: boolean;
  position?: number;
}

export const MOCK_STUDENTS: RankingEntry[] = [
  { name: 'Ana Silva', xp: 60 },
  { name: 'Bruno Costa', xp: 45 },
  { name: 'Carla Lima', xp: 30 },
  { name: 'Diego Melo', xp: 20 },
  { name: 'Eva Rocha', xp: 10 },
  { name: 'Fábio Torres', xp: 5 },
  { name: 'Gabi Nunes', xp: 0 },
];
