import { Lexer } from './lexer';
import { Parser } from './parser';
import { Interpreter } from './interpreter';
import { ProgramNode, Token, DSLError, RhythmEvent } from './types';

export * from './types';
export { Lexer } from './lexer';
export { Parser } from './parser';
export { Interpreter } from './interpreter';

export interface CompilationResult {
  tokens: Token[];
  ast: ProgramNode | null;
  events: RhythmEvent[];
  totalSteps: number;
  errors: DSLError[];
}


export function compileCode(source: string): CompilationResult {
 
  const lexer = new Lexer(source);
  const { tokens, errors: lexerErrors } = lexer.tokenize();


  const parser = new Parser(tokens, lexerErrors);
  const { ast, errors: parserErrors } = parser.parse();

  if (!ast || parserErrors.length > 0) {
    return {
      tokens,
      ast: null,
      events: [],
      totalSteps: 0,
      errors: parserErrors,
    };
  }


  const interpreter = new Interpreter();
  const { events, totalSteps, errors: executionErrors } = interpreter.execute(ast);

  return {
    tokens,
    ast,
    events,
    totalSteps,
    errors: executionErrors,
  };
}
