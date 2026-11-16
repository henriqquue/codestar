import { compileCode } from '../index';

describe('DSL - Correção de Bugs Conhecidos', () => {
  /**
   * BUG A:
   * O interpretador executa o laço for do REPEAT `count` vezes.
   * Como o limite de segurança de 1000 passos (`MAX_EXECUTION_STEPS`) só é incrementado por
   * instruções sonoras (`PLAY` e `WAIT`), um bloco REPEAT que contenha apenas atribuições
   * (como `INSTRUMENT kick`) nunca incrementava `this.stepIndex`.
   * Corrigido com limite de operações (`MAX_OPERATIONS = 10000`) interrompendo em tempo < 200 ms.
   */
  it(
    'REPEAT gigante sem passos sonoros dentro não deve travar nem demorar mais de 200 ms',
    () => {
      // Preparar
      const source = `
REPEAT 50000000
  INSTRUMENT kick
END
      `;

      // Agir
      const start = Date.now();
      const result = compileCode(source);
      const duration = Date.now() - start;

      // Conferir
      expect(duration).toBeLessThan(200);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Limite de operações executáveis');
      expect(result.errors[0].line).toBe(2);
    }
  );

  /**
   * BUG B:
   * Quando o aluno esquece de definir um instrumento antes de chamar `PLAY` dentro de um `REPEAT`,
   * o interpretador gerava um erro por iteração.
   * Corrigido com interrupção e deduplicação de erros.
   */
  it(
    'PLAY sem instrumento dentro de REPEAT deve gerar no máximo um único erro semântico',
    () => {
      // Preparar
      const source = `
REPEAT 20000
  PLAY
END
      `;

      // Agir
      const result = compileCode(source);

      // Conferir
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].message).toContain('exige que um instrumento seja selecionado');
      expect(result.errors[0].line).toBe(3);
    }
  );
});
