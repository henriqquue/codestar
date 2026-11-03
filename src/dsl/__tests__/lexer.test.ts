import { Lexer } from '../lexer';

describe('DSL - Lexer', () => {
  it('reconhece cada palavra-chave e cada instrumento musical suportado', () => {
    // Preparar
    const source = 'INSTRUMENT kick snare hihat PLAY WAIT REPEAT END';
    const lexer = new Lexer(source);

    // Agir
    const { tokens, errors } = lexer.tokenize();

    // Conferir
    expect(errors).toHaveLength(0);
    const tokenTypes = tokens.filter((t) => t.type !== 'NEWLINE' && t.type !== 'EOF').map((t) => t.type);
    expect(tokenTypes).toEqual([
      'KEYWORD_INSTRUMENT',
      'INSTRUMENT_NAME',
      'INSTRUMENT_NAME',
      'INSTRUMENT_NAME',
      'KEYWORD_PLAY',
      'KEYWORD_WAIT',
      'KEYWORD_REPEAT',
      'KEYWORD_END',
    ]);
  });

  it('detecta erro de iniciante ao usar comando em minúsculas, sugerindo maiúsculas mas mantendo a tokenização', () => {
    // Preparar
    const source = 'play wait';
    const lexer = new Lexer(source);

    // Agir
    const { tokens, errors } = lexer.tokenize();

    // Conferir
    expect(errors).toHaveLength(2);
    expect(errors[0].message).toContain('letras maiúsculas');
    expect(errors[0].message).toContain("'PLAY' em vez de 'play'");
    expect(errors[1].message).toContain("'WAIT' em vez de 'wait'");
    const keywordTokens = tokens.filter((t) => t.type === 'KEYWORD_PLAY' || t.type === 'KEYWORD_WAIT');
    expect(keywordTokens).toHaveLength(2);
    expect(keywordTokens[0].value).toBe('PLAY');
    expect(keywordTokens[1].value).toBe('WAIT');
  });

  it('detecta erro de iniciante com palavra desconhecida gerando token UNKNOWN e erro', () => {
    // Preparar
    const source = 'EXPLODE';
    const lexer = new Lexer(source);

    // Agir
    const { tokens, errors } = lexer.tokenize();

    // Conferir
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('desconhecido');
    expect(errors[0].message).toContain('EXPLODE');
    const unknownToken = tokens.find((t) => t.type === 'UNKNOWN');
    expect(unknownToken).toBeDefined();
    expect(unknownToken?.value).toBe('EXPLODE');
  });

  it('detecta erro de iniciante ao tentar usar um instrumento inexistente como piano', () => {
    // Preparar
    const source = 'INSTRUMENT piano';
    const lexer = new Lexer(source);

    // Agir
    const { tokens, errors } = lexer.tokenize();

    // Conferir
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('desconhecido');
    expect(errors[0].message).toContain('piano');
    const unknownToken = tokens.find((t) => t.value === 'piano');
    expect(unknownToken?.type).toBe('UNKNOWN');
  });

  it('detecta caracteres inválidos como @ e $ indicando linha e coluna corretas', () => {
    // Preparar
    const source = 'PLAY @\n$ WAIT';
    const lexer = new Lexer(source);

    // Agir
    const { errors } = lexer.tokenize();

    // Conferir
    expect(errors).toHaveLength(2);
    expect(errors[0].line).toBe(1);
    expect(errors[0].column).toBe(6);
    expect(errors[0].message).toContain('@');
    expect(errors[1].line).toBe(2);
    expect(errors[1].column).toBe(1);
    expect(errors[1].message).toContain('$');
  });

  it('ignora comentários iniciados com # e com // até o fim da linha', () => {
    // Preparar
    const source = '# Este é um comentário com cerquilha\nPLAY // Comentário inline\nWAIT';
    const lexer = new Lexer(source);

    // Agir
    const { tokens, errors } = lexer.tokenize();

    // Conferir
    expect(errors).toHaveLength(0);
    const meaningfulTokens = tokens.filter((t) => t.type !== 'NEWLINE' && t.type !== 'EOF');
    expect(meaningfulTokens.map((t) => t.type)).toEqual(['KEYWORD_PLAY', 'KEYWORD_WAIT']);
  });

  it('remove prefixo de traço - no início da linha comum em anotações de alunos', () => {
    // Preparar
    const source = '- INSTRUMENT kick\n - PLAY\n  - WAIT';
    const lexer = new Lexer(source);

    // Agir
    const { tokens, errors } = lexer.tokenize();

    // Conferir
    expect(errors).toHaveLength(0);
    const meaningfulTokens = tokens.filter((t) => t.type !== 'NEWLINE' && t.type !== 'EOF');
    expect(meaningfulTokens.map((t) => t.type)).toEqual([
      'KEYWORD_INSTRUMENT',
      'INSTRUMENT_NAME',
      'KEYWORD_PLAY',
      'KEYWORD_WAIT',
    ]);
  });

  it('produz a mesma contagem e numeração de linhas para quebras CRLF e LF', () => {
    // Preparar
    const sourceLF = 'PLAY\nWAIT\nPLAY';
    const sourceCRLF = 'PLAY\r\nWAIT\r\nPLAY';

    // Agir
    const resultLF = new Lexer(sourceLF).tokenize();
    const resultCRLF = new Lexer(sourceCRLF).tokenize();

    // Conferir
    const linesLF = resultLF.tokens.map((t) => t.line);
    const linesCRLF = resultCRLF.tokens.map((t) => t.line);
    expect(linesCRLF).toEqual(linesLF);
    expect(resultCRLF.tokens.length).toBe(resultLF.tokens.length);
  });

  it('reconhece números com mais de um dígito corretamente', () => {
    // Preparar
    const source = 'REPEAT 1234';
    const lexer = new Lexer(source);

    // Agir
    const { tokens, errors } = lexer.tokenize();

    // Conferir
    expect(errors).toHaveLength(0);
    const numToken = tokens.find((t) => t.type === 'NUMBER');
    expect(numToken).toBeDefined();
    expect(numToken?.value).toBe('1234');
  });

  it('gera apenas NEWLINE e EOF para código vazio ou composto apenas por espaços', () => {
    // Preparar
    const source = '   \t  \n   ';
    const lexer = new Lexer(source);

    // Agir
    const { tokens, errors } = lexer.tokenize();

    // Conferir
    expect(errors).toHaveLength(0);
    const nonSpacingTokens = tokens.filter((t) => t.type !== 'NEWLINE' && t.type !== 'EOF');
    expect(nonSpacingTokens).toHaveLength(0);
    expect(tokens.some((t) => t.type === 'EOF')).toBe(true);
  });
});
