import { compileCode } from '../index';

describe('DSL - Casos de compilação iniciais', () => {
  it('compila um ritmo simples com kick, wait e kick gerando 3 passos sem erros', () => {
    // Preparar
    const code = `
INSTRUMENT kick
PLAY
WAIT
PLAY
    `;

    // Agir
    const result = compileCode(code);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.totalSteps).toBe(3);
    expect(result.events).toHaveLength(3);
    expect(result.events[0]).toMatchObject({ type: 'play', instrument: 'kick', stepIndex: 0 });
    expect(result.events[1]).toMatchObject({ type: 'wait', stepIndex: 1 });
    expect(result.events[2]).toMatchObject({ type: 'play', instrument: 'kick', stepIndex: 2 });
  });

  it('compila REPEAT 2 alternando kick e snare gerando 6 passos sem erros', () => {
    // Preparar
    const code = `
REPEAT 2
  INSTRUMENT kick
  PLAY
  INSTRUMENT snare
  PLAY
  WAIT
END
    `;

    // Agir
    const result = compileCode(code);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.totalSteps).toBe(6);
    expect(result.events).toHaveLength(6);
  });

  it('detecta erro de iniciante ao escrever comandos com letras minúsculas', () => {
    // Preparar
    const code = `
instrument kick
play
    `;

    // Agir
    const result = compileCode(code);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('letras maiúsculas');
  });

  it('detecta erro de iniciante ao esquecer de selecionar um instrumento antes de PLAY', () => {
    // Preparar
    const code = `
PLAY
    `;

    // Agir
    const result = compileCode(code);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('exige que um instrumento seja selecionado');
  });

  it('detecta erro de iniciante ao esquecer o END de um REPEAT', () => {
    // Preparar
    const code = `
REPEAT 3
  INSTRUMENT hihat
  PLAY
    `;

    // Agir
    const result = compileCode(code);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("não foi encerrado com 'END'");
  });
});
