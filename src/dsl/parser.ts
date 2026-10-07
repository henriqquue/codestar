import {
  Token,
  ProgramNode,
  StatementNode,
  InstrumentStatementNode,
  PlayStatementNode,
  WaitStatementNode,
  RepeatStatementNode,
  DSLError,
  ParseResult,
} from './types';

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private errors: DSLError[] = [];

  constructor(tokens: Token[], existingErrors: DSLError[] = []) {
    this.tokens = tokens;
    this.errors = [...existingErrors];
  }

  public parse(): ParseResult {
    this.current = 0;
    const body: StatementNode[] = [];

    while (!this.isAtEnd()) {
      this.skipNewlines();
      if (this.isAtEnd()) break;

      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      } else {
        this.synchronize();
      }
    }

    const ast: ProgramNode = {
      type: 'Program',
      body,
    };

    return {
      ast: this.errors.length > 0 ? null : ast,
      tokens: this.tokens,
      errors: this.errors,
    };
  }

  private parseStatement(): StatementNode | null {
    const token = this.peek();

    switch (token.type) {
      case 'KEYWORD_INSTRUMENT':
        return this.parseInstrumentStatement();
      case 'KEYWORD_PLAY':
        return this.parsePlayStatement();
      case 'KEYWORD_WAIT':
        return this.parseWaitStatement();
      case 'KEYWORD_REPEAT':
        return this.parseRepeatStatement();
      case 'KEYWORD_END':
        this.errors.push({
          line: token.line,
          column: token.column,
          message: `'END' inesperado sem um bloco 'REPEAT' correspondente.`,
        });
        this.advance();
        return null;
      default:
        if (token.type !== 'NEWLINE' && token.type !== 'EOF') {
          this.errors.push({
            line: token.line,
            column: token.column,
            message: `Instrução inválida ou inesperada: '${token.value}'.`,
          });
        }
        this.advance();
        return null;
    }
  }

  private parseInstrumentStatement(): InstrumentStatementNode | null {
    const startToken = this.advance(); // consume INSTRUMENT

    const argToken = this.peek();
    if (argToken.type === 'INSTRUMENT_NAME') {
      this.advance();
      this.ensureEndOfStatement();
      return {
        type: 'InstrumentStatement',
        instrument: argToken.value as 'kick' | 'snare' | 'hihat',
        line: startToken.line,
      };
    } else {
      this.errors.push({
        line: startToken.line,
        column: startToken.column,
        message: `'INSTRUMENT' exige um instrumento válido ('kick', 'snare' ou 'hihat').`,
      });
      this.ensureEndOfStatement();
      return null;
    }
  }

  private parsePlayStatement(): PlayStatementNode {
    const startToken = this.advance(); // consume PLAY
    this.ensureEndOfStatement();
    return {
      type: 'PlayStatement',
      line: startToken.line,
    };
  }

  private parseWaitStatement(): WaitStatementNode {
    const startToken = this.advance(); // consume WAIT
    this.ensureEndOfStatement();
    return {
      type: 'WaitStatement',
      line: startToken.line,
    };
  }

  private parseRepeatStatement(): RepeatStatementNode | null {
    const startToken = this.advance(); // consume REPEAT

    const countToken = this.peek();
    let count = 0;

    if (countToken.type === 'NUMBER') {
      count = parseInt(countToken.value, 10);
      this.advance();

      if (count <= 0) {
        this.errors.push({
          line: countToken.line,
          column: countToken.column,
          message: `'REPEAT' exige uma quantidade inteira positiva maior que 0.`,
        });
      }
    } else {
      this.errors.push({
        line: startToken.line,
        column: startToken.column,
        message: `'REPEAT' exige um número indicando a quantidade de repetições. Ex: REPEAT 2`,
      });
    }

    this.ensureEndOfStatement();

    const body: StatementNode[] = [];

    while (!this.isAtEnd() && this.peek().type !== 'KEYWORD_END') {
      this.skipNewlines();
      if (this.isAtEnd() || this.peek().type === 'KEYWORD_END') break;

      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      } else {
        this.synchronize();
      }
    }

    if (this.isAtEnd()) {
      this.errors.push({
        line: startToken.line,
        column: startToken.column,
        message: `Bloco 'REPEAT' iniciado na linha ${startToken.line} não foi encerrado com 'END'.`,
      });
      return null;
    }


    this.advance();
    this.ensureEndOfStatement();

    return {
      type: 'RepeatStatement',
      count,
      body,
      line: startToken.line,
    };
  }

  private ensureEndOfStatement() {
    if (!this.isAtEnd() && this.peek().type !== 'NEWLINE' && this.peek().type !== 'EOF') {
      const extraToken = this.peek();
      this.errors.push({
        line: extraToken.line,
        column: extraToken.column,
        message: `Conteúdo inesperado '${extraToken.value}' na mesma linha. Cada instrução deve ocupar uma linha própria.`,
      });
      while (!this.isAtEnd() && this.peek().type !== 'NEWLINE') {
        this.advance();
      }
    }
  }

  private skipNewlines() {
    while (!this.isAtEnd() && this.peek().type === 'NEWLINE') {
      this.advance();
    }
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', line: -1, column: -1 };
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private synchronize() {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.tokens[this.current - 1].type === 'NEWLINE') return;
      const type = this.peek().type;
      if (
        type === 'KEYWORD_INSTRUMENT' ||
        type === 'KEYWORD_PLAY' ||
        type === 'KEYWORD_WAIT' ||
        type === 'KEYWORD_REPEAT' ||
        type === 'KEYWORD_END'
      ) {
        return;
      }
      this.advance();
    }
  }
}
