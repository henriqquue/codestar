export type TokenType =
  | 'KEYWORD_INSTRUMENT'
  | 'KEYWORD_PLAY'
  | 'KEYWORD_WAIT'
  | 'KEYWORD_REPEAT'
  | 'KEYWORD_END'
  | 'INSTRUMENT_NAME'
  | 'NUMBER'
  | 'NEWLINE'
  | 'EOF'
  | 'UNKNOWN';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export interface DSLError {
  line: number;
  column?: number;
  message: string;
}

// AST Nodes
export type ASTNode =
  | ProgramNode
  | InstrumentStatementNode
  | PlayStatementNode
  | WaitStatementNode
  | RepeatStatementNode;

export type StatementNode =
  | InstrumentStatementNode
  | PlayStatementNode
  | WaitStatementNode
  | RepeatStatementNode;

export interface ProgramNode {
  type: 'Program';
  body: StatementNode[];
}

export interface InstrumentStatementNode {
  type: 'InstrumentStatement';
  instrument: 'kick' | 'snare' | 'hihat';
  line: number;
}

export interface PlayStatementNode {
  type: 'PlayStatement';
  line: number;
}

export interface WaitStatementNode {
  type: 'WaitStatement';
  line: number;
}

export interface RepeatStatementNode {
  type: 'RepeatStatement';
  count: number;
  body: StatementNode[];
  line: number;
}


export interface RhythmEvent {
  stepIndex: number;
  type: 'play' | 'wait';
  instrument?: 'kick' | 'snare' | 'hihat';
  line: number;
}

export interface ParseResult {
  ast: ProgramNode | null;
  tokens: Token[];
  errors: DSLError[];
}

export interface ExecutionResult {
  events: RhythmEvent[];
  totalSteps: number;
  errors: DSLError[];
}
