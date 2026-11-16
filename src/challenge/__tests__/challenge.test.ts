import {
  checkChallenge,
  MVP_CHALLENGE,
  Challenge,
  patternToEvents,
  patternToLabel,
} from '../challenge';
import {
  CHALLENGE_BASIC,
  CHALLENGE_INTERMEDIATE,
  CHALLENGE_ADVANCED,
  OFFICIAL_CHALLENGES,
  getChallengeById,
} from '../catalog';
import { compileCode } from '../../dsl';
import { RhythmEvent } from '../../dsl/types';

describe('Desafio MVP (Básico) - Validador checkChallenge', () => {
  it('aprova a solução de referência padrão com kick, play, wait e play', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
WAIT
PLAY
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, MVP_CHALLENGE);

    // Conferir
    expect(result.success).toBe(true);
    expect(result.message).toContain('Parabéns');
    expect(result.message).toContain('duas batidas de kick');
  });

  it('aprova o ritmo quando o aluno toca duas batidas de kick seguidas sem intervalo WAIT', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
PLAY
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, MVP_CHALLENGE);

    // Conferir
    expect(result.success).toBe(true);
    expect(result.message).toContain('Parabéns');
  });

  it('reprova com mensagem específica quando o aluno não executa nenhuma batida usando apenas pausas', () => {
    // Preparar
    const source = `
WAIT
WAIT
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, MVP_CHALLENGE);

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('Nenhuma batida foi executada');
    expect(result.message).toContain('Use o comando PLAY');
  });

  it('reprova com mensagem específica quando o aluno executa apenas uma única batida de kick', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, MVP_CHALLENGE);

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('Apenas uma batida foi executada');
    expect(result.message).toContain('exatamente duas batidas');
  });

  it('reprova e informa a quantidade exata quando o aluno executa três batidas', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
PLAY
PLAY
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, MVP_CHALLENGE);

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('Mais de duas batidas executadas (3)');
  });

  it('reprova com mensagem específica quando o aluno usa instrumento errado como snare no lugar de kick', () => {
    // Preparar
    const source = `
INSTRUMENT snare
PLAY
PLAY
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, MVP_CHALLENGE);

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('Instrumento errado detectado');
    expect(result.message).toContain("apenas o instrumento 'kick'");
  });

  it('reprova quando o aluno mistura kick com outro instrumento como snare', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
INSTRUMENT snare
PLAY
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, MVP_CHALLENGE);

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('Instrumento errado detectado');
  });

  it('reprova com mensagem de posições distintas caso haja batidas com o mesmo stepIndex', () => {
    // Preparar
    const artificialEvents: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 2 },
    ];

    // Agir
    const result = checkChallenge(artificialEvents, MVP_CHALLENGE);

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('posições (stepIndex) distintas');
  });

  it('lança erro quando um objeto de desafio inválido é fornecido', () => {
    // Preparar
    const invalidChallenge = {} as Challenge;

    // Agir & Conferir
    expect(() => {
      checkChallenge([], invalidChallenge);
    }).toThrow('Um desafio válido deve ser fornecido');
  });

  it('garante que a solução de referência oficial definida em MVP_CHALLENGE é aprovada pelo validador', () => {
    // Preparar
    const compilation = compileCode(MVP_CHALLENGE.referenceSolution);

    // Agir
    const result = checkChallenge(compilation.events, MVP_CHALLENGE);

    // Conferir
    expect(compilation.errors).toHaveLength(0);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Parabéns');
  });

  it('valida desafios genéricos com spec count diferente de 2 batidas', () => {
    // Preparar
    const customChallenge: Challenge = {
      id: 'snare-tres-batidas',
      title: 'Três caixas',
      level: 'basic',
      order: 4,
      xp: 15,
      objective: 'Três batidas de snare',
      instructions: 'Instruções',
      allowedCommands: ['INSTRUMENT', 'PLAY'],
      successCriteria: 'Critério',
      referenceSolution: 'INSTRUMENT snare\nPLAY\nPLAY\nPLAY',
      spec: { kind: 'count', instrument: 'snare', count: 3 },
    };

    // Caso 1: menos batidas
    const comp1 = compileCode('INSTRUMENT snare\nPLAY\nPLAY');
    const res1 = checkChallenge(comp1.events, customChallenge);
    expect(res1.success).toBe(false);
    expect(res1.message).toContain('Apenas 2 batida(s) executada(s)');

    // Caso 2: mais batidas
    const comp2 = compileCode('INSTRUMENT snare\nPLAY\nPLAY\nPLAY\nPLAY');
    const res2 = checkChallenge(comp2.events, customChallenge);
    expect(res2.success).toBe(false);
    expect(res2.message).toContain('Mais de 3 batidas executadas (4)');
  });
});

describe('Desafio Intermediário - Batida em Laço (laco-kick-snare)', () => {
  it('aprova a solução de referência de ponta a ponta com REPEAT e limite de linhas respeitado', () => {
    // Preparar
    const source = CHALLENGE_INTERMEDIATE.referenceSolution;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(compilation.errors).toHaveLength(0);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Parabéns');
  });

  it('reprova quando o aluno toca instrumento errado no lugar de snare', () => {
    // Preparar: toca hihat no lugar de snare
    const source = `
REPEAT 2
  INSTRUMENT kick
  PLAY
  WAIT
  INSTRUMENT hihat
  PLAY
  WAIT
END
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('No passo 3 era esperado snare, mas foi tocado hihat');
  });

  it('reprova quando o aluno toca uma batida onde deveria haver uma pausa', () => {
    // Preparar: não faz WAIT após kick
    const source = `
REPEAT 2
  INSTRUMENT kick
  PLAY
  INSTRUMENT snare
  PLAY
  WAIT
END
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('No passo 2 era esperada uma pausa, mas foi tocado snare');
  });

  it('reprova quando o aluno faz uma pausa onde deveria haver uma batida de instrumento', () => {
    // Preparar: substitui a batida de kick por WAIT
    const source = `
REPEAT 2
  WAIT
  WAIT
  INSTRUMENT snare
  PLAY
  WAIT
END
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('No passo 1 era esperado kick, mas houve pausa');
  });

  it('reprova quando o aluno produz um ritmo curto com menos passos que o esperado', () => {
    // Preparar: executa apenas 1 repetição em vez de 2
    const source = `
INSTRUMENT kick
PLAY
WAIT
INSTRUMENT snare
PLAY
WAIT
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('passos');
    expect(result.message).toContain('o esperado tem 7');
  });

  it('reprova quando o aluno produz um ritmo longo com repetições em excesso', () => {
    // Preparar: repete 3 vezes em vez de 2
    const source = `
REPEAT 3
  INSTRUMENT kick
  PLAY
  WAIT
  INSTRUMENT snare
  PLAY
  WAIT
END
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('Seu ritmo tem 11 passos; o esperado tem 7');
  });

  it('reprova o aluno que desenrola o ritmo corretamente sem usar REPEAT quando requireRepeat é true', () => {
    // Preparar: ritmo gerado é o mesmo, mas escrito linearmente sem REPEAT
    const source = `
INSTRUMENT kick
PLAY
WAIT
INSTRUMENT snare
PLAY
WAIT
INSTRUMENT kick
PLAY
WAIT
INSTRUMENT snare
PLAY
WAIT
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('Ritmo correto! Mas este desafio exige o uso de REPEAT.');
  });

  it('reprova o ritmo correto quando a quantidade de linhas de código excede o limite máximo', () => {
    // Preparar: usa REPEAT, mas espalha instruções redundantes ou quebras ultrapassando 10 linhas
    const source = `
REPEAT 2
  INSTRUMENT kick
  PLAY
  WAIT
  INSTRUMENT snare
  PLAY
  WAIT
  # Comentario inline que nao conta
  INSTRUMENT snare
  INSTRUMENT kick
  INSTRUMENT snare
END
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('linhas (máximo 10)');
    expect(result.message).toContain('Use REPEAT para reduzir o código');
  });

  it('aprova o ritmo mesmo se houver pausas finais ausentes ou excedentes', () => {
    // Preparar: adiciona WAITs adicionais no final que devem ser ignorados pelo validador
    const source = `
REPEAT 2
  INSTRUMENT kick
  PLAY
  WAIT
  INSTRUMENT snare
  PLAY
  WAIT
END
WAIT
WAIT
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(true);
    expect(result.message).toContain('Parabéns');
  });

  it('reprova o código quando há erro de sintaxe impedindo a geração de eventos', () => {
    // Preparar: esquece o END do REPEAT
    const source = `
REPEAT 2
  INSTRUMENT kick
  PLAY
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(compilation.errors.length).toBeGreaterThan(0);
    expect(compilation.events).toHaveLength(0);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Nenhuma batida foi executada');
  });
});

describe('Desafio Avançado - Groove Completo (groove-completo)', () => {
  it('aprova a solução de referência de 3 compassos com kick, snare e hihat', () => {
    // Preparar
    const source = CHALLENGE_ADVANCED.referenceSolution;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_ADVANCED, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(compilation.errors).toHaveLength(0);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Parabéns');
  });

  it('reprova quando há instrumento divergente na posição da caixa', () => {
    // Preparar: toca kick em vez de snare no passo 4
    const source = `
REPEAT 3
  INSTRUMENT kick
  PLAY
  INSTRUMENT hihat
  PLAY
  PLAY
  INSTRUMENT kick
  PLAY
  INSTRUMENT hihat
  PLAY
  WAIT
END
    `;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_ADVANCED, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('No passo 4 era esperado snare, mas foi tocado kick');
  });

  it('reprova a versão desenrolada sem REPEAT que ultrapassa o limite de 14 linhas', () => {
    // Preparar: 3 compassos sem REPEAT (terá ~30 linhas)
    const compasso = `
INSTRUMENT kick
PLAY
INSTRUMENT hihat
PLAY
PLAY
INSTRUMENT snare
PLAY
INSTRUMENT hihat
PLAY
WAIT
    `;
    const source = compasso + compasso + compasso;
    const compilation = compileCode(source);

    // Agir
    const result = checkChallenge(compilation.events, CHALLENGE_ADVANCED, {
      source,
      ast: compilation.ast,
    });

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('Ritmo correto! Mas este desafio exige o uso de REPEAT.');
  });
});

describe('Funções utilitárias de padrão e catálogo', () => {
  it('converte sequência de passos em lista de eventos rítmicos com patternToEvents', () => {
    // Preparar
    const steps = ['kick', null, 'snare', 'hihat'] as const;

    // Agir
    const events = patternToEvents([...steps]);

    // Conferir
    expect(events).toHaveLength(4);
    expect(events[0]).toMatchObject({ stepIndex: 0, type: 'play', instrument: 'kick' });
    expect(events[1]).toMatchObject({ stepIndex: 1, type: 'wait' });
    expect(events[2]).toMatchObject({ stepIndex: 2, type: 'play', instrument: 'snare' });
    expect(events[3]).toMatchObject({ stepIndex: 3, type: 'play', instrument: 'hihat' });
  });

  it('gera legenda textual formatada com patternToLabel', () => {
    // Preparar
    const steps = ['kick', null, 'snare', null, 'kick', null, 'snare', null] as const;

    // Agir
    const label = patternToLabel([...steps]);

    // Conferir
    expect(label).toBe('K – S – K – S –');
  });

  it('retorna string vazia para patternToLabel com lista vazia', () => {
    // Preparar & Agir
    const label = patternToLabel([]);

    // Conferir
    expect(label).toBe('');
  });

  it('retorna erro técnico amigável caso contexto seja omitido em desafio com restrições', () => {
    // Preparar
    const compilation = compileCode(CHALLENGE_INTERMEDIATE.referenceSolution);

    // Agir: sem passar o 3º argumento context
    const result = checkChallenge(compilation.events, CHALLENGE_INTERMEDIATE);

    // Conferir
    expect(result.success).toBe(false);
    expect(result.message).toContain('Contexto de código não fornecido');
  });

  it('disponibiliza os 3 desafios oficiais ordenados por order no catálogo', () => {
    // Preparar & Agir & Conferir
    expect(OFFICIAL_CHALLENGES).toHaveLength(3);
    expect(OFFICIAL_CHALLENGES[0].id).toBe(CHALLENGE_BASIC.id);
    expect(OFFICIAL_CHALLENGES[1].id).toBe(CHALLENGE_INTERMEDIATE.id);
    expect(OFFICIAL_CHALLENGES[2].id).toBe(CHALLENGE_ADVANCED.id);
    expect(OFFICIAL_CHALLENGES[0].order).toBe(1);
    expect(OFFICIAL_CHALLENGES[1].order).toBe(2);
    expect(OFFICIAL_CHALLENGES[2].order).toBe(3);

    expect(getChallengeById('kick-duas-batidas')).toBe(CHALLENGE_BASIC);
    expect(getChallengeById('laco-kick-snare')).toBe(CHALLENGE_INTERMEDIATE);
    expect(getChallengeById('groove-completo')).toBe(CHALLENGE_ADVANCED);
    expect(getChallengeById('inexistente')).toBeUndefined();
  });
});
