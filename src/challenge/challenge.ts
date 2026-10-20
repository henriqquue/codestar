import { RhythmEvent } from '../dsl/types';

export interface Challenge {
  id: string;
  title: string;
  objective: string;
  instructions: string;
  allowedCommands: string[];
  successCriteria: string;
  referenceSolution: string;
}

export interface ChallengeCheckResult {
  success: boolean;
  message: string;
}

export const MVP_CHALLENGE: Challenge = {
  id: 'kick-duas-batidas',
  title: 'Duas batidas de bumbo',
  objective: 'Crie uma sequência com o instrumento kick que produza duas batidas em posições distintas.',
  instructions:
    'Selecione o instrumento bumbo com INSTRUMENT kick, toque a primeira batida com PLAY, use WAIT para dar uma pausa no ritmo e toque a segunda com PLAY. Vamos lá!',
  allowedCommands: ['INSTRUMENT', 'PLAY', 'WAIT', 'REPEAT', 'END'],
  successCriteria:
    'Produzir exatamente 2 batidas de bumbo (kick) em tempos diferentes, sem nenhum outro instrumento.',
  referenceSolution: 'INSTRUMENT kick\nPLAY\nWAIT\nPLAY',
};

export function checkChallenge(
  events: RhythmEvent[],
  challenge: Challenge
): ChallengeCheckResult {
  // Garante que o desafio é válido
  if (!challenge || !challenge.id) {
    throw new Error('Um desafio válido deve ser fornecido para verificação.');
  }

  // Filtra apenas eventos do tipo 'play'
  const playEvents = events.filter((e) => e.type === 'play');

  // 1. Nenhuma batida
  if (playEvents.length === 0) {
    return {
      success: false,
      message: 'Nenhuma batida foi executada. Use o comando PLAY para tocar o bumbo (kick).',
    };
  }

  // 2. Instrumento errado (qualquer batida com instrumento diferente de 'kick')
  const wrongInstrumentEvents = playEvents.filter((e) => e.instrument !== 'kick');
  if (wrongInstrumentEvents.length > 0) {
    return {
      success: false,
      message: "Instrumento errado detectado. Use apenas o instrumento 'kick' neste desafio.",
    };
  }

  // 3. Só uma batida
  if (playEvents.length === 1) {
    return {
      success: false,
      message: 'Apenas uma batida foi executada. O desafio requer exatamente duas batidas de kick.',
    };
  }

  // 4. Mais de duas batidas
  if (playEvents.length > 2) {
    return {
      success: false,
      message: `Mais de duas batidas executadas (${playEvents.length}). O desafio requer exatamente duas batidas de kick.`,
    };
  }

  // 5. Posições distintas (stepIndex diferentes)
  const distinctSteps = new Set(playEvents.map((e) => e.stepIndex));
  if (distinctSteps.size < playEvents.length) {
    return {
      success: false,
      message: 'As batidas devem ser executadas em posições (stepIndex) distintas.',
    };
  }

  // Sucesso
  return {
    success: true,
    message: 'Parabéns! Você concluiu o desafio com sucesso: duas batidas de kick em posições distintas!',
  };
}
