import { Token, TokenType, DSLError } from './types';

const KEYWORDS = new Set(['INSTRUMENT', 'PLAY', 'WAIT', 'REPEAT', 'END']);
const VALID_INSTRUMENTS = new Set(['kick', 'snare', 'hihat']);

export class Lexer {
  private input: string;
  private line: number = 1;
  private tokens: Token[] = [];
  private errors: DSLError[] = [];

  constructor(input: string) {
    this.input = input;
  }

  public tokenize(): { tokens: Token[]; errors: DSLError[] } {
    this.tokens = [];
    this.errors = [];
    this.line = 1;

    const lines = this.input.split(/\r?\n/);

    for (let l = 0; l < lines.length; l++) {
      this.line = l + 1;
      let lineText = lines[l];


      lineText = lineText.replace(/^\s*-\s*/, '');

      this.tokenizeLine(lineText);
      this.tokens.push({
        type: 'NEWLINE',
        value: '\n',
        line: this.line,
        column: lineText.length + 1,
      });
    }

    this.tokens.push({
      type: 'EOF',
      value: '',
      line: this.line,
      column: 1,
    });

    return { tokens: this.tokens, errors: this.errors };
  }

  private tokenizeLine(lineText: string) {
    let col = 1;

    while (col <= lineText.length) {
      const char = lineText[col - 1];


      if (char === ' ' || char === '\t') {
        col++;
        continue;
      }


      if (char === '#' || (char === '/' && lineText[col] === '/')) {
        break; // Ignore rest of line
      }

 
      if (/[a-zA-Z]/.test(char)) {
        let word = '';
        const startCol = col;
        while (col <= lineText.length && /[a-zA-Z0-9_]/.test(lineText[col - 1])) {
          word += lineText[col - 1];
          col++;
        }

        const upperWord = word.toUpperCase();

        if (KEYWORDS.has(upperWord)) {
          if (word !== upperWord) {
            this.errors.push({
              line: this.line,
              column: startCol,
              message: `Os comandos devem ser escritos em letras maiúsculas. Use '${upperWord}' em vez de '${word}'.`,
            });
          }
          const tokenType = (`KEYWORD_${upperWord}`) as TokenType;
          this.tokens.push({
            type: tokenType,
            value: upperWord,
            line: this.line,
            column: startCol,
          });
        } else if (VALID_INSTRUMENTS.has(word.toLowerCase())) {
          this.tokens.push({
            type: 'INSTRUMENT_NAME',
            value: word.toLowerCase(),
            line: this.line,
            column: startCol,
          });
        } else {

          this.tokens.push({
            type: 'UNKNOWN',
            value: word,
            line: this.line,
            column: startCol,
          });
          this.errors.push({
            line: this.line,
            column: startCol,
            message: `Palavra-chave ou instrumento desconhecido: '${word}'.`,
          });
        }
        continue;
      }


      if (/[0-9]/.test(char)) {
        let numStr = '';
        const startCol = col;
        while (col <= lineText.length && /[0-9]/.test(lineText[col - 1])) {
          numStr += lineText[col - 1];
          col++;
        }

        this.tokens.push({
          type: 'NUMBER',
          value: numStr,
          line: this.line,
          column: startCol,
        });
        continue;
      }


      this.errors.push({
        line: this.line,
        column: col,
        message: `Caractere inválido encontrado: '${char}'.`,
      });
      col++;
    }
  }
}
