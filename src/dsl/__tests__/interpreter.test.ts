import { Lexer } from '../lexer';
import { Parser } from '../parser';
import { Interpreter } from '../interpreter';

function interpretSource(source: string) {
  const { tokens, errors: lexerErrors } = new Lexer(source).tokenize();
  const { ast, errors: parserErrors } = new Parser(tokens, lexerErrors).parse();
  if (!ast || parserErrors.length > 0) {
    throw new Error(`Erro de sintaxe nos testes do interpretador: ${JSON.stringify(parserErrors)}`);
  }
  const interpreter = new Interpreter();
  return interpreter.execute(ast);
}

describe('DSL - Interpreter', () => {
  it('atribui stepIndex sequencial iniciando em 0 para cada instrução temporal', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
WAIT
PLAY
    `;

    // Agir
    const result = interpretSource(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.totalSteps).toBe(3);
    expect(result.events.map((e) => e.stepIndex)).toEqual([0, 1, 2]);
  });

  it('gera evento do tipo wait ocupando exatamente um passo temporal', () => {
    // Preparar
    const source = `
WAIT
    `;

    // Agir
    const result = interpretSource(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.totalSteps).toBe(1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      type: 'wait',
      stepIndex: 0,
      line: 2,
    });
  });

  it('executa REPEAT 3 com PLAY gerando 3 eventos sequenciais', () => {
    // Preparar
    const source = `
INSTRUMENT kick
REPEAT 3
  PLAY
END
    `;

    // Agir
    const result = interpretSource(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.totalSteps).toBe(3);
    expect(result.events).toHaveLength(3);
    expect(result.events.every((e) => e.type === 'play' && e.instrument === 'kick')).toBe(true);
  });

  it('mantém o instrumento selecionado dentro de um bloco REPEAT persistente após o END', () => {
    // Preparar
    const source = `
REPEAT 1
  INSTRUMENT snare
  PLAY
END
PLAY
    `;

    // Agir
    const result = interpretSource(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.events).toHaveLength(2);
    expect(result.events[0].instrument).toBe('snare');
    expect(result.events[1].instrument).toBe('snare');
  });

  it('permite alternar o instrumento ativo no meio da sequência rítmica', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
INSTRUMENT snare
PLAY
    `;

    // Agir
    const result = interpretSource(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.events).toHaveLength(2);
    expect(result.events[0].instrument).toBe('kick');
    expect(result.events[1].instrument).toBe('snare');
  });

  it('detecta erro de iniciante ao invocar PLAY sem instrumento prévio com a linha correta', () => {
    // Preparar
    const source = `
WAIT
PLAY
    `;

    // Agir
    const result = interpretSource(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].line).toBe(3);
    expect(result.errors[0].message).toContain('exige que um instrumento seja selecionado');
  });

  it('interrompe a execução ao atingir o limite de segurança de 1000 passos', () => {
    // Preparar
    const source = `
INSTRUMENT kick
REPEAT 2000
  PLAY
END
    `;

    // Agir
    const result = interpretSource(source);

    // Conferir
    expect(result.totalSteps).toBe(1000);
    expect(result.events).toHaveLength(1000);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Limite de passos executáveis (1000) excedido');
  });
});

