import { compileCode } from '../index';

describe('DSL - Documentação de Bugs Conhecidos (it.failing)', () => {
  /**
   * BUG A:
   * O interpretador executa o laço for do REPEAT `count` vezes.
   * Como o limite de segurança de 1000 passos (`MAX_EXECUTION_STEPS`) só é incrementado por
   * instruções sonoras (`PLAY` e `WAIT`), um bloco REPEAT que contenha apenas atribuições
   * (como `INSTRUMENT kick`) nunca incrementa `this.stepIndex`.
   * Com isso, o laço de repetição itera milhões de vezes na thread principal,
   * consumindo CPU e congelando a aplicação caso o aluno passe um valor exorbitante.
   *
   * Comportamento correto esperado: O interpretador deveria limitar o número total de
   * iterações avaliadas ou otimizar blocos sem eventos sonoros, executando em tempo insignificante (< 200 ms).
   * Comportamento atual: Bloqueia a execução por centenas de milissegundos a vários segundos.
   */
  it.failing(
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
      compileCode(source);
      const duration = Date.now() - start;

      // Conferir: falha enquanto o bug existir (demora > 200ms)
      expect(duration).toBeLessThan(200);
    }
  );

  /**
   * BUG B:
   * Quando o aluno esquece de definir um instrumento antes de chamar `PLAY` dentro de um `REPEAT`,
   * o interpretador empurra um `DSLError` para `this.errors`. Porém, a condição de interrupção
   * prematura do loop é `if (this.errors.length > 0 && this.stepIndex >= MAX_EXECUTION_STEPS)`.
   * Como o erro de PLAY não incrementa `this.stepIndex`, `stepIndex` permanece 0.
   * O laço continua até o fim de todas as iterações (ex: 20000), gerando 20000 mensagens de erro
   * repetidas no relatório do compilador e sobrecarregando a memória.
   *
   * Comportamento correto esperado: O interpretador deveria registrar no máximo 1 erro semântico
   * ou interromper o laço após encontrar o primeiro erro semântico fatal.
   * Comportamento atual: Gera uma quantidade de erros igual ao número de repetições (20000 erros).
   */
  it.failing(
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

      // Conferir: falha enquanto o bug existir (retorna 20000 erros em vez de <= 1)
      expect(result.errors.length).toBeLessThanOrEqual(1);
    }
  );
});
