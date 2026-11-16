import {
  ProgramNode,
  StatementNode,
  RhythmEvent,
  DSLError,
  ExecutionResult,
} from './types';

const MAX_EXECUTION_STEPS = 1000;
const MAX_OPERATIONS = 10000;

export class Interpreter {
  private currentInstrument: 'kick' | 'snare' | 'hihat' | null = null;
  private events: RhythmEvent[] = [];
  private stepIndex: number = 0;
  private operationCount: number = 0;
  private errors: DSLError[] = [];

  public execute(ast: ProgramNode): ExecutionResult {
    this.currentInstrument = null;
    this.events = [];
    this.stepIndex = 0;
    this.operationCount = 0;
    this.errors = [];

    this.evaluateStatements(ast.body);

    return {
      events: this.events,
      totalSteps: this.stepIndex,
      errors: this.errors,
    };
  }

  private addError(error: DSLError) {
    const exists = this.errors.some(
      (e) => e.line === error.line && e.message === error.message
    );
    if (!exists) {
      this.errors.push(error);
    }
  }

  private evaluateStatements(statements: StatementNode[]) {
    for (const stmt of statements) {
      if (this.stepIndex >= MAX_EXECUTION_STEPS) {
        this.addError({
          line: stmt.line,
          message: `Limite de passos executáveis (${MAX_EXECUTION_STEPS}) excedido. Reduza a quantidade de repetições.`,
        });
        break;
      }

      switch (stmt.type) {
        case 'InstrumentStatement':
          this.currentInstrument = stmt.instrument;
          break;

        case 'PlayStatement':
          if (!this.currentInstrument) {
            this.addError({
              line: stmt.line,
              message: `'PLAY' exige que um instrumento seja selecionado previamente (ex: 'INSTRUMENT kick').`,
            });
          } else {
            this.events.push({
              stepIndex: this.stepIndex,
              type: 'play',
              instrument: this.currentInstrument,
              line: stmt.line,
            });
            this.stepIndex++;
          }
          break;

        case 'WaitStatement':
          this.events.push({
            stepIndex: this.stepIndex,
            type: 'wait',
            line: stmt.line,
          });
          this.stepIndex++;
          break;

        case 'RepeatStatement':
          for (let i = 0; i < stmt.count; i++) {
            this.operationCount++;
            if (this.operationCount > MAX_OPERATIONS) {
              this.addError({
                line: stmt.line,
                message: `Limite de operações executáveis (${MAX_OPERATIONS}) excedido. Reduza a quantidade de repetições.`,
              });
              break;
            }
            this.evaluateStatements(stmt.body);
            if (this.errors.length > 0) {
              break;
            }
          }
          break;
      }
    }
  }
}
