import { computeXp, levelFromXp, buildRanking } from '../stats';
import { MOCK_STUDENTS } from '@/src/mock/ranking';

const CHALLENGES = [
  { id: 'kick-duas-batidas', order: 1, xp: 10, level: 'basic' as const, title: 'Kick' },
  { id: 'laco-kick-snare', order: 2, xp: 20, level: 'intermediate' as const, title: 'Laço' },
  { id: 'groove-completo', order: 3, xp: 30, level: 'advanced' as const, title: 'Groove' },
] as const;

// ---- computeXp ----
describe('computeXp', () => {
  it('retorna 0 quando nenhum desafio foi concluído', () => {
    expect(computeXp(CHALLENGES as any, [])).toBe(0);
  });

  it('retorna xp de um único desafio concluído', () => {
    expect(computeXp(CHALLENGES as any, ['kick-duas-batidas'])).toBe(10);
  });

  it('soma xp de todos os desafios concluídos', () => {
    expect(
      computeXp(CHALLENGES as any, ['kick-duas-batidas', 'laco-kick-snare', 'groove-completo'])
    ).toBe(60);
  });

  it('ignora IDs que não existem no catálogo', () => {
    expect(computeXp(CHALLENGES as any, ['id-inexistente'])).toBe(0);
  });

  it('funciona com array de desafios vazio', () => {
    expect(computeXp([], ['kick-duas-batidas'])).toBe(0);
  });
});

// ---- levelFromXp ----
describe('levelFromXp', () => {
  it('retorna Iniciante para XP 0', () => {
    expect(levelFromXp(0)).toBe('Iniciante');
  });

  it('retorna Iniciante para XP 9', () => {
    expect(levelFromXp(9)).toBe('Iniciante');
  });

  it('retorna Aprendiz para XP 10', () => {
    expect(levelFromXp(10)).toBe('Aprendiz');
  });

  it('retorna Aprendiz para XP 29', () => {
    expect(levelFromXp(29)).toBe('Aprendiz');
  });

  it('retorna Ritmista para XP 30', () => {
    expect(levelFromXp(30)).toBe('Ritmista');
  });

  it('retorna Ritmista para XP 59', () => {
    expect(levelFromXp(59)).toBe('Ritmista');
  });

  it('retorna Mestre para XP 60', () => {
    expect(levelFromXp(60)).toBe('Mestre');
  });

  it('retorna Mestre para XP acima de 60', () => {
    expect(levelFromXp(100)).toBe('Mestre');
  });
});

// ---- buildRanking ----
describe('buildRanking', () => {
  it('coloca o usuário no topo quando tem o maior XP', () => {
    const { top5, userRow, userInTop5 } = buildRanking('Zé Top', 999);
    expect(userRow.position).toBe(1);
    expect(top5[0].isUser).toBe(true);
    expect(userInTop5).toBe(true);
  });

  it('coloca o usuário no meio quando tem XP intermediário', () => {
    // XP=25 fica entre Diego(20) e Carla(30) → posição 4 (Ana60, Bruno45, Carla30, Zé25...)
    const { userRow, userInTop5 } = buildRanking('Zé Meio', 25);
    expect(userRow.position).toBeGreaterThan(1);
    expect(userInTop5).toBe(true);
  });

  it('coloca o usuário fora do top 5 quando tem pouco XP', () => {
    // XP=1 fica após todos os 7 fictícios (Gabi tem 0, mas XP=1 > 0 → posição 7)
    const { userRow, userInTop5 } = buildRanking('Zé Baixo', 1);
    expect(userRow.position).toBeGreaterThan(5);
    expect(userInTop5).toBe(false);
  });

  it('trata empate de XP com desempate por nome alfabético', () => {
    // Ana Silva tem XP 60 → usuário com XP 60 fica após Ana (a=A, z>A)
    const { top5 } = buildRanking('Zé Empate', 60);
    const anas = top5.filter((r) => r.name === 'Ana Silva');
    const zes = top5.filter((r) => r.isUser);
    expect(anas[0].position).toBeLessThan(zes[0].position);
  });

  it('funciona corretamente com XP 0', () => {
    // Gabi Nunes tem XP 0 → usuário com XP 0 fica após Gabi (Z > G)
    const { userRow } = buildRanking('Zé Zero', 0);
    expect(userRow.xp).toBe(0);
    expect(userRow.position).toBe(8);
  });

  it('top5 sempre tem no máximo 5 entradas', () => {
    const { top5 } = buildRanking('Alguém', 15);
    expect(top5.length).toBe(5);
  });

  it('userRow.isUser é verdadeiro', () => {
    const { userRow } = buildRanking('Maria', 35);
    expect(userRow.isUser).toBe(true);
  });
});
