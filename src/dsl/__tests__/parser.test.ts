import { Lexer } from '../lexer';
import { Parser } from '../parser';
import { RepeatStatementNode } from '../types';

function parseSource(source: string) {
  const { tokens, errors: lexerErrors } = new Lexer(source).tokenize();
  const parser = new Parser(tokens, lexerErrors);
  return parser.parse();
}

describe('DSL - Parser', () => {
  it('gera AST com os nós esperados para uma sequência simples', () => {
    // Preparar
    const source = `
INSTRUMENT kick
PLAY
WAIT
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();
    expect(result.ast?.body).toHaveLength(3);
    expect(result.ast?.body[0]).toMatchObject({ type: 'InstrumentStatement', instrument: 'kick' });
    expect(result.ast?.body[1]).toMatchObject({ type: 'PlayStatement' });
    expect(result.ast?.body[2]).toMatchObject({ type: 'WaitStatement' });
  });

  it('gera RepeatStatement com contagem e corpo corretos', () => {
    // Preparar
    const source = `
REPEAT 3
  PLAY
  WAIT
END
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();
    expect(result.ast?.body).toHaveLength(1);
    const repeatNode = result.ast?.body[0] as RepeatStatementNode;
    expect(repeatNode.type).toBe('RepeatStatement');
    expect(repeatNode.count).toBe(3);
    expect(repeatNode.body).toHaveLength(2);
    expect(repeatNode.body[0].type).toBe('PlayStatement');
    expect(repeatNode.body[1].type).toBe('WaitStatement');
  });

  it('suporta REPEAT aninhado dentro de outro REPEAT', () => {
    // Preparar
    const source = `
REPEAT 2
  REPEAT 3
    PLAY
  END
END
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();
    const outerRepeat = result.ast?.body[0] as RepeatStatementNode;
    expect(outerRepeat.count).toBe(2);
    expect(outerRepeat.body).toHaveLength(1);
    const innerRepeat = outerRepeat.body[0] as RepeatStatementNode;
    expect(innerRepeat.count).toBe(3);
    expect(innerRepeat.body).toHaveLength(1);
    expect(innerRepeat.body[0].type).toBe('PlayStatement');
  });

  it('detecta erro de iniciante ao usar REPEAT com valor 0', () => {
    // Preparar
    const source = `
REPEAT 0
  PLAY
END
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('maior que 0');
    expect(result.ast).toBeNull();
  });

  it('detecta erro de iniciante ao esquecer o número no comando REPEAT', () => {
    // Preparar
    const source = `
REPEAT
  PLAY
END
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('exige um número');
    expect(result.ast).toBeNull();
  });

  it('detecta erro de iniciante ao esquecer o END de um REPEAT citando a linha de início', () => {
    // Preparar
    const source = `
REPEAT 2
  PLAY
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("não foi encerrado com 'END'");
    expect(result.errors[0].message).toContain('linha 2');
    expect(result.ast).toBeNull();
  });

  it('detecta erro de iniciante ao colocar END sem um REPEAT correspondente', () => {
    // Preparar
    const source = `
PLAY
END
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("'END' inesperado sem um bloco 'REPEAT'");
    expect(result.ast).toBeNull();
  });

  it('detecta erro de iniciante ao chamar INSTRUMENT sem especificar o nome do instrumento', () => {
    // Preparar
    const source = `
INSTRUMENT
PLAY
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("'INSTRUMENT' exige um instrumento válido");
    expect(result.ast).toBeNull();
  });

  it('detecta erro de iniciante ao colocar duas instruções na mesma linha como PLAY WAIT', () => {
    // Preparar
    const source = `
PLAY WAIT
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Conteúdo inesperado');
    expect(result.errors[0].message).toContain('linha própria');
    expect(result.ast).toBeNull();
  });

  it('reporta múltiplos erros no mesmo código recuperando-se com synchronize', () => {
    // Preparar
    const source = `
END
INSTRUMENT
PLAY WAIT
END
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.ast).toBeNull();
  });

  it('retorna ast como null quando há qualquer erro sintático ou léxico', () => {
    // Preparar
    const source = `
REPEAT -1
  PLAY
END
    `;

    // Agir
    const result = parseSource(source);

    // Conferir
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.ast).toBeNull();
  });
});
