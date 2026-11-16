import { Challenge, MVP_CHALLENGE } from './challenge';

export { MVP_CHALLENGE };

export const CHALLENGE_BASIC: Challenge = MVP_CHALLENGE;

export const CHALLENGE_INTERMEDIATE: Challenge = {
  id: 'laco-kick-snare',
  title: 'Batida em laço',
  level: 'intermediate',
  order: 2,
  xp: 20,
  objective: 'Reproduza o padrão bumbo – pausa – caixa – pausa duas vezes, usando REPEAT.',
  instructions:
    'Em vez de escrever tudo duas vezes, use REPEAT 2 para repetir um bloco. Dentro do bloco: toque o kick, faça uma pausa com WAIT, troque para o snare com INSTRUMENT snare, toque e faça outra pausa. Encerre o bloco com END.',
  allowedCommands: ['INSTRUMENT', 'PLAY', 'WAIT', 'REPEAT', 'END'],
  successCriteria:
    'Gerar o ritmo K – S – K – S – (8 passos), usando REPEAT e com no máximo 10 linhas de código.',
  spec: {
    kind: 'pattern',
    steps: ['kick', null, 'snare', null, 'kick', null, 'snare', null],
    requireRepeat: true,
    maxLines: 10,
  },
  referenceSolution:
    'REPEAT 2\nINSTRUMENT kick\nPLAY\nWAIT\nINSTRUMENT snare\nPLAY\nWAIT\nEND',
};

export const CHALLENGE_ADVANCED: Challenge = {
  id: 'groove-completo',
  title: 'Groove completo',
  level: 'advanced',
  order: 3,
  xp: 30,
  objective:
    'Reproduza um compasso de groove com três instrumentos e repita-o 3 vezes, usando o menor código possível.',
  instructions:
    'Cada compasso tem 6 passos: bumbo, chimbal, chimbal, caixa, chimbal e uma pausa. Repita o compasso 3 vezes. Lembre-se de trocar de instrumento com INSTRUMENT sempre que necessário e use REPEAT para não escrever o compasso três vezes.',
  allowedCommands: ['INSTRUMENT', 'PLAY', 'WAIT', 'REPEAT', 'END'],
  successCriteria:
    'Gerar o ritmo K H H S H – repetido 3 vezes (18 passos), usando REPEAT e com no máximo 14 linhas de código.',
  spec: {
    kind: 'pattern',
    steps: [
      'kick',
      'hihat',
      'hihat',
      'snare',
      'hihat',
      null,
      'kick',
      'hihat',
      'hihat',
      'snare',
      'hihat',
      null,
      'kick',
      'hihat',
      'hihat',
      'snare',
      'hihat',
      null,
    ],
    requireRepeat: true,
    maxLines: 14,
  },
  referenceSolution:
    'REPEAT 3\nINSTRUMENT kick\nPLAY\nINSTRUMENT hihat\nPLAY\nPLAY\nINSTRUMENT snare\nPLAY\nINSTRUMENT hihat\nPLAY\nWAIT\nEND',
};

export const OFFICIAL_CHALLENGES: Challenge[] = [
  CHALLENGE_BASIC,
  CHALLENGE_INTERMEDIATE,
  CHALLENGE_ADVANCED,
].sort((a, b) => a.order - b.order);

export function getChallengeById(id: string): Challenge | undefined {
  return OFFICIAL_CHALLENGES.find((c) => c.id === id);
}
