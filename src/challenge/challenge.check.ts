import assert from 'node:assert';
import { compileCode } from '../dsl';
import { checkChallenge, MVP_CHALLENGE } from './challenge';
import { RhythmEvent } from '../dsl/types';

let passedCount = 0;
let failedCount = 0;

function runTestCase(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASSOU: ${name}`);
    passedCount++;
  } catch (error: any) {
    console.error(`FALHOU: ${name} - ${error.message}`);
    failedCount++;
  }
}

console.log('=== Testes do Desafio: ' + MVP_CHALLENGE.title + ' ===\n');

// 1. Solução de referência
runTestCase('Solução de Referência (2 batidas de kick em posições distintas)', () => {
  const compilation = compileCode(MVP_CHALLENGE.referenceSolution);
  assert.strictEqual(compilation.errors.length, 0, 'Solução de referência não deve conter erros de compilação');
  
  const result = checkChallenge(compilation.events, MVP_CHALLENGE);
  assert.strictEqual(result.success, true, 'Solução de referência deve ter sucesso === true');
  assert.match(result.message, /Parabéns/i, 'Mensagem deve indicar sucesso');
});

// 2. Caso de falha 1: Nenhuma batida
runTestCase('Caso de Falha 1: Nenhuma batida (apenas WAIT)', () => {
  const code = 'INSTRUMENT kick\nWAIT';
  const compilation = compileCode(code);
  const result = checkChallenge(compilation.events, MVP_CHALLENGE);

  assert.strictEqual(result.success, false, 'Deve falhar quando não há batidas');
  assert.match(result.message, /Nenhuma batida/i, 'Mensagem deve indicar que nenhuma batida foi executada');
});

// 3. Caso de falha 2: Só uma batida
runTestCase('Caso de Falha 2: Só uma batida', () => {
  const code = 'INSTRUMENT kick\nPLAY';
  const compilation = compileCode(code);
  const result = checkChallenge(compilation.events, MVP_CHALLENGE);

  assert.strictEqual(result.success, false, 'Deve falhar quando há apenas uma batida');
  assert.match(result.message, /Apenas uma batida/i, 'Mensagem deve indicar que apenas uma batida foi tocada');
});

// 4. Caso de falha 3: Mais de duas batidas
runTestCase('Caso de Falha 3: Mais de duas batidas (3 batidas de kick)', () => {
  const code = 'INSTRUMENT kick\nPLAY\nWAIT\nPLAY\nWAIT\nPLAY';
  const compilation = compileCode(code);
  const result = checkChallenge(compilation.events, MVP_CHALLENGE);

  assert.strictEqual(result.success, false, 'Deve falhar quando há mais de duas batidas');
  assert.match(result.message, /Mais de duas batidas/i, 'Mensagem deve indicar excesso de batidas');
});

// 5. Caso de falha 4: Instrumento errado
runTestCase('Caso de Falha 4: Instrumento errado (snare em vez de kick, e misturado)', () => {
  // Teste 4a: Apenas snare
  const codeSnare = 'INSTRUMENT snare\nPLAY\nWAIT\nPLAY';
  const compSnare = compileCode(codeSnare);
  const resSnare = checkChallenge(compSnare.events, MVP_CHALLENGE);

  assert.strictEqual(resSnare.success, false, 'Deve falhar quando o instrumento é snare');
  assert.match(resSnare.message, /Instrumento errado/i, 'Mensagem deve alertar sobre instrumento errado');

  // Teste 4b: Kick misturado com snare
  const codeMixed = 'INSTRUMENT kick\nPLAY\nINSTRUMENT snare\nPLAY';
  const compMixed = compileCode(codeMixed);
  const resMixed = checkChallenge(compMixed.events, MVP_CHALLENGE);

  assert.strictEqual(resMixed.success, false, 'Deve falhar quando há instrumento não permitido misturado');
  assert.match(resMixed.message, /Instrumento errado/i, 'Mensagem deve alertar sobre instrumento errado');
});

// 6. Caso de falha 5: Batidas na mesma posição (mesmo stepIndex)
runTestCase('Caso de Falha 5: Batidas no mesmo stepIndex (mesma posição temporal)', () => {
  const simultaneousEvents: RhythmEvent[] = [
    { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
    { stepIndex: 0, type: 'play', instrument: 'kick', line: 2 },
  ];
  const result = checkChallenge(simultaneousEvents, MVP_CHALLENGE);

  assert.strictEqual(result.success, false, 'Deve falhar quando as batidas estão no mesmo stepIndex');
  assert.match(result.message, /posições/i, 'Mensagem deve alertar sobre batidas em posições não distintas');
});

console.log(`\nResultado final: ${passedCount} testes passaram, ${failedCount} testes falharam.`);

if (failedCount > 0) {
  process.exit(1);
}
