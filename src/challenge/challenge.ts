import { RhythmEvent, ProgramNode, StatementNode } from '../dsl/types';

export type Instrument = 'kick' | 'snare' | 'hihat';

export type ChallengeLevel = 'basic' | 'intermediate' | 'advanced';

export type ChallengeSpec =
  | { kind: 'count'; instrument: Instrument; count: number }
  | { kind: 'pattern'; steps: (Instrument | null)[]; requireRepeat?: boolean; maxLines?: number };

export interface Challenge {
  id: string;
  title: string;
  objective: string;
  instructions: string;
  allowedCommands: string[];
  successCriteria: string;
  referenceSolution: string;
  level: ChallengeLevel;
  order: number;
  xp: number;
  spec: ChallengeSpec;
}

export interface ChallengeCheckResult {
  success: boolean;
  message: string;
}

export interface CheckChallengeContext {
  source: string;
  ast: ProgramNode | null;
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
  level: 'basic',
  order: 1,
  xp: 10,
  spec: { kind: 'count', instrument: 'kick', count: 2 },
};

const INSTRUMENT_INITIALS: Record<Instrument, string> = {
  kick: 'K',
  snare: 'S',
  hihat: 'H',
};

export function patternToEvents(steps: (Instrument | null)[]): RhythmEvent[] {
  return steps.map((step, idx) => {
    if (step === null) {
      return {
        stepIndex: idx,
        type: 'wait',
        line: idx + 1,
      };
    }
    return {
      stepIndex: idx,
      type: 'play',
      instrument: step,
      line: idx + 1,
    };
  });
}

export function patternToLabel(steps: (Instrument | null)[]): string {
  if (steps.length === 0) return '';
  return steps
    .map((step) => (step ? INSTRUMENT_INITIALS[step] : '–'))
    .join(' ');
}

export function trimTrailingPauses(steps: (Instrument | null)[]): (Instrument | null)[] {
  const trimmed = [...steps];
  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === null) {
    trimmed.pop();
  }
  return trimmed;
}

export function hasRepeatStatement(
  node: ProgramNode | StatementNode | null | undefined
): boolean {
  if (!node) return false;
  if (node.type === 'RepeatStatement') return true;
  if ('body' in node && Array.isArray(node.body)) {
    return node.body.some(hasRepeatStatement);
  }
  return false;
}

export function countEffectiveLines(source: string): number {
  const lines = source.split(/\r?\n/);
  let count = 0;
  for (const rawLine of lines) {
    let line = rawLine.trim();
    line = line.replace(/^\s*-\s*/, '');
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith('//')) continue;
    count++;
  }
  return count;
}

export function checkChallenge(
  events: RhythmEvent[],
  challenge: Challenge,
  context?: CheckChallengeContext
): ChallengeCheckResult {
  // Garante que o desafio é válido
  if (!challenge || !challenge.id) {
    throw new Error('Um desafio válido deve ser fornecido para verificação.');
  }

  const spec = challenge.spec || { kind: 'count', instrument: 'kick', count: 2 };

  if (spec.kind === 'count') {
    const playEvents = events.filter((e) => e.type === 'play');

    // 1. Nenhuma batida
    if (playEvents.length === 0) {
      return {
        success: false,
        message: 'Nenhuma batida foi executada. Use o comando PLAY para tocar o bumbo (kick).',
      };
    }

    // 2. Instrumento errado (qualquer batida com instrumento diferente de 'kick')
    const wrongInstrumentEvents = playEvents.filter((e) => e.instrument !== spec.instrument);
    if (wrongInstrumentEvents.length > 0) {
      return {
        success: false,
        message: "Instrumento errado detectado. Use apenas o instrumento 'kick' neste desafio.",
      };
    }

    // 3. Menos batidas do que o exigido
    if (playEvents.length < spec.count) {
      if (spec.count === 2 && playEvents.length === 1) {
        return {
          success: false,
          message: 'Apenas uma batida foi executada. O desafio requer exatamente duas batidas de kick.',
        };
      }
      return {
        success: false,
        message: `Apenas ${playEvents.length} batida(s) executada(s). O desafio requer exatamente ${spec.count} batidas de ${spec.instrument}.`,
      };
    }

    // 4. Mais de duas batidas
    if (playEvents.length > spec.count) {
      if (spec.count === 2) {
        return {
          success: false,
          message: `Mais de duas batidas executadas (${playEvents.length}). O desafio requer exatamente duas batidas de kick.`,
        };
      }
      return {
        success: false,
        message: `Mais de ${spec.count} batidas executadas (${playEvents.length}). O desafio requer exatamente ${spec.count} batidas de ${spec.instrument}.`,
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

  // 1. Se não houve nenhum PLAY
  const playEvents = events.filter((e) => e.type === 'play');
  if (playEvents.length === 0) {
    return {
      success: false,
      message: 'Nenhuma batida foi executada. Use o comando PLAY para tocar um instrumento.',
    };
  }

  // 2. Monte o ritmo real para cada stepIndex
  const maxStep = Math.max(...events.map((e) => e.stepIndex));
  const realSteps: (Instrument | null)[] = new Array(maxStep + 1).fill(null);
  for (const ev of events) {
    if (ev.type === 'play' && ev.instrument) {
      realSteps[ev.stepIndex] = ev.instrument;
    } else {
      realSteps[ev.stepIndex] = null;
    }
  }

  const trimmedReal = trimTrailingPauses(realSteps);
  const trimmedExpected = trimTrailingPauses(spec.steps);

  // 3. Compare passo a passo e o tamanho
  const minLength = Math.min(trimmedReal.length, trimmedExpected.length);
  for (let i = 0; i < minLength; i++) {
    const r = trimmedReal[i];
    const exp = trimmedExpected[i];
    if (r !== exp) {
      const stepNum = i + 1;
      if (exp === null) {
        return {
          success: false,
          message: `No passo ${stepNum} era esperada uma pausa, mas foi tocado ${r}.`,
        };
      }
      if (r === null) {
        return {
          success: false,
          message: `No passo ${stepNum} era esperado ${exp}, mas houve pausa.`,
        };
      }
      return {
        success: false,
        message: `No passo ${stepNum} era esperado ${exp}, mas foi tocado ${r}.`,
      };
    }
  }

  if (trimmedReal.length !== trimmedExpected.length) {
    return {
      success: false,
      message: `Seu ritmo tem ${trimmedReal.length} ${
        trimmedReal.length === 1 ? 'passo' : 'passos'
      }; o esperado tem ${trimmedExpected.length}.`,
    };
  }

  // 4. SOMENTE se o ritmo estiver correto, verifique as restrições
  if (spec.requireRepeat || spec.maxLines !== undefined) {
    if (!context) {
      return {
        success: false,
        message: 'Contexto de código não fornecido para validação das restrições do desafio.',
      };
    }

    if (spec.requireRepeat && !hasRepeatStatement(context.ast)) {
      return {
        success: false,
        message: 'Ritmo correto! Mas este desafio exige o uso de REPEAT.',
      };
    }

    if (spec.maxLines !== undefined) {
      const lineCount = countEffectiveLines(context.source);
      if (lineCount > spec.maxLines) {
        return {
          success: false,
          message: `Ritmo correto, porém com ${lineCount} linhas (máximo ${spec.maxLines}). Use REPEAT para reduzir o código.`,
        };
      }
    }
  }

  // 5. Sucesso
  return {
    success: true,
    message: 'Parabéns! Você concluiu o desafio com sucesso!',
  };
}
