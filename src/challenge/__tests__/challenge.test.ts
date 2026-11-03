import { checkChallenge, MVP_CHALLENGE, Challenge } from '../challenge';
import { compileCode } from '../../dsl';
import { RhythmEvent } from '../../dsl/types';

describe('Desafio MVP - Validador checkChallenge', () => {
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
});
