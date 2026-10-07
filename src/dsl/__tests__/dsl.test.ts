import { compileCode } from '../index';

function runTests() {
  console.log('=== Teste 1: Ritmo simples ===');
  const code1 = `
INSTRUMENT kick
PLAY
WAIT
PLAY
  `;
  const result1 = compileCode(code1);
  console.log('Erros:', result1.errors);
  console.log('Total de passos:', result1.totalSteps);
  console.log('Eventos:', JSON.stringify(result1.events, null, 2));

  console.log('\n=== Teste 2: Repetição (REPEAT 2 ... END) ===');
  const code2 = `
REPEAT 2
  INSTRUMENT kick
  PLAY
  INSTRUMENT snare
  PLAY
  WAIT
END
  `;
  const result2 = compileCode(code2);
  console.log('Erros:', result2.errors);
  console.log('Total de passos:', result2.totalSteps);

  console.log('\n=== Teste 3: Tratamento de Erro - Letras minúsculas ===');
  const code3 = `
instrument kick
play
  `;
  const result3 = compileCode(code3);
  console.log('Erros esperados:', result3.errors);

  console.log('\n=== Teste 4: Tratamento de Erro - PLAY sem instrumento ===');
  const code4 = `
PLAY
  `;
  const result4 = compileCode(code4);
  console.log('Erros esperados:', result4.errors);

  console.log('\n=== Teste 5: Tratamento de Erro - REPEAT sem END ===');
  const code5 = `
REPEAT 3
  INSTRUMENT hihat
  PLAY
  `;
  const result5 = compileCode(code5);
  console.log('Erros esperados:', result5.errors);
}

runTests();
