import { compileCode } from '../index';

describe('DSL - Integração compileCode', () => {
  it('compila caso 1 do README: ritmo simples sem erros gerando 3 passos', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
WAIT
PLAY
    `;

    // Agir
    const result = compileCode(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.totalSteps).toBe(3);
    expect(result.events).toHaveLength(3);
    expect(result.events[0]).toMatchObject({ type: 'play', instrument: 'kick', stepIndex: 0 });
    expect(result.events[1]).toMatchObject({ type: 'wait', stepIndex: 1 });
    expect(result.events[2]).toMatchObject({ type: 'play', instrument: 'kick', stepIndex: 2 });
  });

  it('compila caso 2 do README: repetição REPEAT 2 com snare sem erros', () => {
    // Preparar
    const source = `
REPEAT 2
  INSTRUMENT snare
  PLAY
END
    `;

    // Agir
    const result = compileCode(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.totalSteps).toBe(2);
    expect(result.events).toHaveLength(2);
    expect(result.events.every((e) => e.type === 'play' && e.instrument === 'snare')).toBe(true);
  });

  it('compila caso 3 do README: detecta erro de iniciante com comando em letras minúsculas', () => {
    // Preparar
    const source = 'play';

    // Agir
    const result = compileCode(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('letras maiúsculas');
    expect(result.events).toHaveLength(0);
  });

  it('compila caso 4 do README: detecta erro de iniciante com PLAY sem instrumento', () => {
    // Preparar
    const source = 'PLAY';

    // Agir
    const result = compileCode(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('exige que um instrumento seja selecionado');
    expect(result.events).toHaveLength(0);
  });

  it('compila caso 5 do README: detecta erro de iniciante com REPEAT sem fechar com END', () => {
    // Preparar
    const source = `
REPEAT 2
PLAY
    `;

    // Agir
    const result = compileCode(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("não foi encerrado com 'END'");
    expect(result.events).toHaveLength(0);
  });

  it('compila com sucesso uma sequência rítmica complexa contendo os três instrumentos suportados', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
INSTRUMENT snare
PLAY
INSTRUMENT hihat
PLAY
    `;

    // Agir
    const result = compileCode(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.totalSteps).toBe(3);
    expect(result.events).toHaveLength(3);
    expect(result.events[0].instrument).toBe('kick');
    expect(result.events[1].instrument).toBe('snare');
    expect(result.events[2].instrument).toBe('hihat');
  });

  it('assegura que código com erro de lexer não chega ao interpretador mantendo events vazio', () => {
    // Preparar
    const source = `
@
INSTRUMENT kick
PLAY
    `;

    // Agir
    const result = compileCode(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.ast).toBeNull();
    expect(result.events).toHaveLength(0);
    expect(result.totalSteps).toBe(0);
  });
});

