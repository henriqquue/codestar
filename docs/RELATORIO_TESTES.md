# Relatório de Testes Automatizados — CodeStar

**Projeto:** CodeStar (Trabalho de Conclusão de Curso em Engenharia de Software)  
**Ambiente:** Next.js 16 (App Router), React 19, TypeScript, Jest & Testing Library  
**Data:** 16 de Novembro de 2026  

---

## 1. Ferramentas e Como Executar

A infraestrutura de testes foi configurada utilizando o framework de testes **Jest** em conjunto com o compilador **`next/jest`** (adaptador oficial do Next.js baseado no compilador SWC), evitando incompatibilidades de compilação com o TypeScript moderno e React 19.

### Tecnologias Utilizadas:
* **Jest:** Framework de testes unitários e de integração.
* **`next/jest`:** Integração nativa com a pipeline do Next.js sem necessidade de `ts-jest`.
* **`jest-environment-jsdom`:** Simulação do DOM no ambiente Node.js.
* **`@testing-library/react` & `@testing-library/jest-dom`:** Renderização de componentes e matchers para asserções semânticas da interface.
* **Mocks Customizados:** Mock de `AudioContext` nativo da Web Audio API (`src/audio/__tests__/mockAudio.ts`).

### Comandos de Execução:
```bash
# Executa todos os testes automatizados
npm test

# Executa os testes em modo contínuo (watch)
npm run test:watch

# Executa a suíte completa com relatório de cobertura de código
npm run test:coverage
```

---

## 2. Matriz de Rastreabilidade e Cenários de Teste

| Módulo | Cenário de Teste | Entrada | Resultado Esperado | Resultado |
| :--- | :--- | :--- | :--- | :---: |
| **DSL - Lexer** | Reconhecimento de palavras-chave e instrumentos | `INSTRUMENT kick snare hihat PLAY WAIT REPEAT END` | Tokens mapeados corretamente, 0 erros | Passou |
| **DSL - Lexer** | Erro de caixa baixa com sugestão educativa | `play wait` | Erros apontando `PLAY` e `WAIT`, mantendo tokens | Passou |
| **DSL - Lexer** | Palavra desconhecida gera UNKNOWN | `EXPLODE` | Token UNKNOWN e erro indicando a palavra | Passou |
| **DSL - Lexer** | Instrumento inexistente | `INSTRUMENT piano` | Token UNKNOWN para 'piano' e erro gerado | Passou |
| **DSL - Lexer** | Caracteres inválidos e coordenadas | `PLAY @\n$ WAIT` | Erros com linha 1, coluna 6 e linha 2, coluna 1 | Passou |
| **DSL - Lexer** | Remoção de comentários `#` e `//` | `PLAY # nota\nWAIT // pausa` | Ignora comentários e mantém tokens válidos | Passou |
| **DSL - Lexer** | Prefixo de traço (`-`) inicial | `- INSTRUMENT kick\n - PLAY` | Remove traços de anotação de aluno | Passou |
| **DSL - Lexer** | Equivalência CRLF e LF | Código com `\r\n` e `\n` | Mesma contagem e numeração de linhas | Passou |
| **DSL - Lexer** | Números com múltiplos dígitos | `REPEAT 1234` | Token NUMBER com valor '1234' | Passou |
| **DSL - Lexer** | Código vazio ou só espaços | `'   \t  \n   '` | Apenas tokens NEWLINE e EOF | Passou |
| **DSL - Parser** | Sequência simples para AST | `INSTRUMENT kick\nPLAY\nWAIT` | AST com 3 nós correspondentes | Passou |
| **DSL - Parser** | REPEAT com contagem e corpo | `REPEAT 3\nPLAY\nWAIT\nEND` | Nó RepeatStatement com count=3 e 2 filhos | Passou |
| **DSL - Parser** | REPEAT aninhado | REPEAT 2 contendo REPEAT 3 | Estrutura hierárquica na AST correta | Passou |
| **DSL - Parser** | REPEAT com valor 0 | `REPEAT 0\nPLAY\nEND` | Erro "maior que 0", AST nula | Passou |
| **DSL - Parser** | REPEAT sem número | `REPEAT\nPLAY\nEND` | Erro "exige um número", AST nula | Passou |
| **DSL - Parser** | REPEAT sem END | `REPEAT 2\nPLAY` | Erro citando linha de início, AST nula | Passou |
| **DSL - Parser** | END sem REPEAT prévio | `PLAY\nEND` | Erro "END inesperado", AST nula | Passou |
| **DSL - Parser** | INSTRUMENT sem parâmetro | `INSTRUMENT\nPLAY` | Erro "exige instrumento válido", AST nula | Passou |
| **DSL - Parser** | Duas instruções na mesma linha | `PLAY WAIT` | Erro "linha própria", AST nula | Passou |
| **DSL - Parser** | Recuperação de múltiplos erros | Erros variados consecutivos | Múltiplos erros coletados via synchronize | Passou |
| **DSL - Parser** | AST nula na presença de erros | `REPEAT -1\nPLAY\nEND` | ast === null | Passou |
| **DSL - Parser** | Token isolado no início de instrução | `123\nPLAY` | Erro de instrução inválida reportado | Passou |
| **DSL - Parser** | Sincronização dentro de REPEAT | Erro no corpo do loop | Recupera sincronização e coleta erros | Passou |
| **DSL - Interpreter** | Indexação sequencial de passos | `INSTRUMENT kick\nPLAY\nWAIT\nPLAY` | stepIndex: 0, 1, 2 | Passou |
| **DSL - Interpreter** | Evento WAIT | `WAIT` | type: 'wait', stepIndex: 0, totalSteps: 1 | Passou |
| **DSL - Interpreter** | REPEAT com PLAY | REPEAT 3 com PLAY | 3 eventos rítmicos gerados | Passou |
| **DSL - Interpreter** | Persistência de instrumento após loop | REPEAT com INSTRUMENT e PLAY externo | Mantém instrumento ativo após END | Passou |
| **DSL - Interpreter** | Alternância de instrumento | `kick` seguido de `snare` | Eventos com instrumentos correspondentes | Passou |
| **DSL - Interpreter** | PLAY sem instrumento | `WAIT\nPLAY` | Erro semântico na linha correta | Passou |
| **DSL - Interpreter** | Limite de segurança de 1000 passos | REPEAT 2000 com PLAY | Interrompe em 1000 passos com mensagem de erro | Passou |
| **DSL - Integração** | Ritmo simples (README) | `kick -> PLAY -> WAIT -> PLAY` | 3 passos, 0 erros | Passou |
| **DSL - Integração** | REPEAT com snare (README) | `REPEAT 2 ... snare ... END` | 2 passos, 0 erros | Passou |
| **DSL - Integração** | Minúsculas (README) | `play` | Erro reportado, events vazio | Passou |
| **DSL - Integração** | PLAY sem instrumento (README) | `PLAY` | Erro semântico, events vazio | Passou |
| **DSL - Integração** | REPEAT sem END (README) | `REPEAT 2\nPLAY` | Erro sintático, events vazio | Passou |
| **DSL - Integração** | Sequência com 3 instrumentos | `kick`, `snare` e `hihat` | 3 passos com timbres corretos | Passou |
| **DSL - Integração** | Erro léxico isola interpretador | `@\nINSTRUMENT kick\nPLAY` | AST nula, events vazio | Passou |
| **DSL - Casos Iniciais** | Casos originais do dsl.test.ts | 5 casos de compilação iniciais | Validados com asserções expect formais | Passou |
| **DSL - Bugs Corrigidos** | REPEAT sem passos sonoros | `REPEAT 50000000\nINSTRUMENT kick\nEND` | Finaliza em < 200ms com erro na linha do REPEAT | Passou |
| **DSL - Bugs Corrigidos** | PLAY sem instrumento em loop | `REPEAT 20000\nPLAY\nEND` | Gera exatamente 1 erro semântico | Passou |
| **Desafio Básico** | Solução de referência | `kick -> PLAY -> WAIT -> PLAY` | `success: true` | Passou |
| **Desafio Básico** | Batidas seguidas sem WAIT | `kick -> PLAY -> PLAY` | `success: true` | Passou |
| **Desafio Básico** | Nenhuma batida (só WAIT) | `WAIT\nWAIT` | Reprovação com mensagem orientadora | Passou |
| **Desafio Básico** | Apenas uma batida | `kick -> PLAY` | Reprovação: exige exatamente duas | Passou |
| **Desafio Básico** | Três batidas | `kick -> PLAY x3` | Reprovação informando contagem (3) | Passou |
| **Desafio Básico** | Instrumento errado | `snare -> PLAY x2` | Reprovação indicando apenas 'kick' | Passou |
| **Desafio Básico** | Instrumentos misturados | `kick` e `snare` | Reprovação por instrumento indevido | Passou |
| **Desafio Básico** | Batidas no mesmo stepIndex | Eventos manuais sobrepostos | Reprovação: posições distintas | Passou |
| **Desafio Básico** | Objeto de desafio inválido | Desafio nulo ou sem ID | Lança Error | Passou |
| **Desafio Básico** | Gabarito oficial de MVP_CHALLENGE | `MVP_CHALLENGE.referenceSolution` | Aprovado no validador | Passou |
| **Desafio Genérico** | Spec tipo count com count!=2 | Menos e mais batidas que o exigido | Mensagens informando quantidade e instrumento | Passou |
| **Desafio Intermediário** | Solução de referência com REPEAT | `CHALLENGE_INTERMEDIATE.referenceSolution` | Aprovado de ponta a ponta | Passou |
| **Desafio Intermediário** | Instrumento divergente | Hi-hat no lugar de snare no passo 3 | Mensagem: esperado snare, mas foi tocado hihat | Passou |
| **Desafio Intermediário** | Batida no lugar de pausa | Snare no lugar de pausa no passo 2 | Mensagem: esperada pausa, mas foi tocado snare | Passou |
| **Desafio Intermediário** | Pausa no lugar de batida | Pausa no lugar de kick no passo 1 | Mensagem: esperado kick, mas houve pausa | Passou |
| **Desafio Intermediário** | Ritmo curto | Apenas 1 repetição | Mensagem indicando passos obtidos vs esperados | Passou |
| **Desafio Intermediário** | Ritmo longo | 3 repetições em vez de 2 | Mensagem indicando passos excedentes | Passou |
| **Desafio Intermediário** | Versão desenrolada sem REPEAT | 12 linhas sem REPEAT | Reprovação: exige o uso de REPEAT | Passou |
| **Desafio Intermediário** | Excesso de linhas de código | Código com mais de 10 linhas | Reprovação com contagem de linhas e teto | Passou |
| **Desafio Intermediário** | Pausas finais excedentes | WAITs adicionais no final | Aprovado (pausas finais ignoradas) | Passou |
| **Desafio Intermediário** | Erro de sintaxe | REPEAT sem END | Reprovação informando ausência de batidas | Passou |
| **Desafio Avançado** | Solução de referência com 3 timbres | `CHALLENGE_ADVANCED.referenceSolution` | Aprovado de ponta a ponta | Passou |
| **Desafio Avançado** | Caixa com timbre incorreto | Kick no lugar de snare no passo 4 | Mensagem informando divergência no passo 4 | Passou |
| **Desafio Avançado** | Versão desenrolada sem REPEAT | Código sem REPEAT (> 14 linhas) | Reprovação: exige o uso de REPEAT | Passou |
| **Desafio - Utilitários** | Conversão patternToEvents | Lista de passos com pausas | Converte em RhythmEvent[] sequenciais | Passou |
| **Desafio - Utilitários** | Formatação patternToLabel | Lista de passos rítmicos | Gera legenda textual com K, S, H e – | Passou |
| **Desafio - Utilitários** | Legenda para lista vazia | Array vazio | Retorna string vazia | Passou |
| **Desafio - Utilitários** | Contexto omitido em desafio com regras | checkChallenge sem context | Falha técnica clara sem lançar exceção | Passou |
| **Desafio - Catálogo** | Catálogo oficial de desafios | OFFICIAL_CHALLENGES e getChallengeById | Retorna desafios ordenados por order (1, 2, 3) | Passou |
| **Estado (Reducer)** | Estado inicial | initialState | `initial`, code vazio, compilação nula | Passou |
| **Estado (Reducer)** | Digitação de código | TYPE_CODE com texto | `editing` | Passou |
| **Estado (Reducer)** | Código apagado | TYPE_CODE com espaços | Retorna a `initial` e reseta dados | Passou |
| **Estado (Reducer)** | Compilação com erro | COMPILE_RESULT com erros | `error`, salva compilação | Passou |
| **Estado (Reducer)** | Compilação com eventos válidos | COMPILE_RESULT com eventos | `valid`, salva compilação | Passou |
| **Estado (Reducer)** | Código sem eventos sonoros | COMPILE_RESULT com comentários | Retorna a `initial` | Passou |
| **Estado (Reducer)** | Corrida assíncrona após limpar | COMPILE_RESULT após código vazio | Permanece em `initial` | Passou |
| **Estado (Reducer)** | Início de reprodução | START_PLAYING | `playing`, activeStep=0 | Passou |
| **Estado (Reducer)** | Atualização de passo em tempo real | STEP_CHANGED | activeStep atualizado | Passou |
| **Estado (Reducer)** | Conclusão com sucesso | FINISH_PLAYING (success: true) | `completed`, salva checkResult | Passou |
| **Estado (Reducer)** | Conclusão com falha | FINISH_PLAYING (success: false) | `valid`, exibe feedback de erro | Passou |
| **Estado (Reducer)** | Interrupção manual | STOP_PLAYING | `valid`, activeStep=null | Passou |
| **Estado (Reducer)** | Limpeza geral | CLEAR_CODE | Retorna a initialState | Passou |
| **Estado (Reducer)** | Máquina de estados completa | Ciclo do início à conclusão | Transições válidas em todo o trajeto | Passou |
| **Estado (Reducer)** | Invariante dos 6 estados | Ações arbitrárias aleatórias | uiState sempre contido no domínio | Passou |
| **Interface (App)** | Feedback de erro e botão desabilitado | Digitar 'PLAY' + 400ms | Estado `error`, botão Executar desabilitado | Passou |
| **Interface (App)** | Solução válida e botão habilitado | Solução de referência + 400ms | Estado `valid`, botão Executar habilitado | Passou |
| **Interface (App)** | Indicador do rodapé sincronizado | Ciclo de digitação e compilação | Badge "Estado: ..." reflete máquina | Passou |
| **Áudio** | Constantes de andamento | BPM e STEP_SECONDS | BPM=100, STEP_SECONDS=0.6 | Passou |
| **Áudio** | Inicialização preguiçosa | Instanciação de AudioEngine | Não cria AudioContext até `play()` | Passou |
| **Áudio** | Retomada de contexto suspenso | Contexto em suspended | Invocação de `resume()` | Passou |
| **Áudio** | Agendamento sem nós para WAIT | `kick -> wait -> kick` | 2 osciladores criados, 0 para wait | Passou |
| **Áudio** | Precisão temporal Web Audio | Delays e timestamps | Início em startTime + stepIndex * 0.6s | Passou |
| **Áudio** | Síntese acústica do Kick | synthesizeKick | Oscilador senoidal com varredura de frequência | Passou |
| **Áudio** | Síntese acústica da Snare | synthesizeSnare | Ruído branco com passa-alta + oscilador triangular | Passou |
| **Áudio** | Síntese acústica do Hi-hat | synthesizeHihat | Ruído branco com passa-alta a 7000 Hz | Passou |
| **Áudio** | Sequência de callbacks onStep | Avanço de timers virtuais | Disparos sequenciais 0, 1, 2 | Passou |
| **Áudio** | Disparo único de onEnd | Término do último passo | Dispara exatamente 1 vez ao final | Passou |
| **Áudio** | Interrupção via stop() | stop() durante execução | Cancela timers, desconecta nós, sem onEnd | Passou |
| **Áudio** | Reinício via play() concorrente | play() durante reprodução | Cancela anterior sem onEnd espúrio | Passou |
| **Áudio** | Execução de lista vazia | play([]) | Chama onEnd imediato e não aloca nós | Passou |
| **Áudio** | Descarte e liberação com dispose() | dispose() | Fecha AudioContext e zera instâncias | Passou |

---

## 3. Tabela de Cobertura de Código

Resultado oficial obtido através do comando `npm run test:coverage`:

```text
-----------------------|---------|----------|---------|---------|-------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------------|---------|----------|---------|---------|-------------------
All files              |   94.48 |       82 |   92.85 |   94.47 |                   
 audio                 |   97.33 |    72.41 |   92.85 |   97.22 |                   
  engine.ts            |   97.33 |    72.41 |   92.85 |   97.22 | 234-238           
 challenge             |   96.03 |     92.1 |     100 |   96.62 |                   
  challenge.ts         |   96.03 |     92.1 |     100 |   96.62 | 82,90,101         
 components            |   84.14 |    67.64 |   85.71 |   82.85 |                   
  ChallengePanel.tsx   |     100 |    71.42 |     100 |     100 | 28-43             
  CodeEditor.tsx       |   56.66 |    43.75 |    62.5 |   53.84 | 35-36,42-54       
  FeedbackPanel.tsx    |     100 |    73.68 |     100 |     100 | 24,68-89          
  RhythmVisualizer.tsx |     100 |    81.81 |     100 |     100 | 70,84-95          
  RunControls.tsx      |     100 |       50 |     100 |     100 | 34-46             
 dsl                   |   95.63 |    84.69 |   95.23 |    95.5 |                   
  index.ts             |   82.35 |      100 |     100 |   82.35 | 7-9               
  interpreter.ts       |   97.72 |    81.25 |      75 |   97.67 | 37                
  lexer.ts             |     100 |      100 |     100 |     100 |                   
  parser.ts            |   94.44 |    78.18 |     100 |   94.18 | 162,224-234       
 state                 |   95.65 |    94.44 |     100 |   95.45 |                   
  appReducer.ts        |   95.65 |    94.44 |     100 |   95.45 | 134               
-----------------------|---------|----------|---------|---------|-------------------
```

> **Destaque:** As camadas centrais da aplicação (**`src/challenge` com 96.03%** e **`src/dsl` com 95.63%**) mantêm-se consistentemente acima do teto de qualidade de 90%.

---

## 4. Correção dos Bugs Históricos

Os bugs identificados na fase inicial foram devidamente corrigidos no interpretador (`src/dsl/interpreter.ts`) e seus testes em `src/dsl/__tests__/bugs.test.ts` agora passam normalmente:

### Bug A: Congelamento por Repetição Gigante sem Passos Sonoros
* **O que acontecia:** O interpretador entrava em um laço de repetição síncrono avaliando o corpo `count` vezes. Como o limite de segurança (`MAX_EXECUTION_STEPS = 1000`) só incrementava com `PLAY` e `WAIT`, laços vazios ou com atribuições puras travavam o navegador.
* **Entrada de Exemplo:** `REPEAT 50000000\n  INSTRUMENT kick\nEND`
* **Correção Implementada:** Foi introduzido o limitador `MAX_OPERATIONS = 10000` que contabiliza cada iteração de blocos `REPEAT`. Caso o teto seja atingido, a execução é abortada imediatamente com a mensagem `"Limite de operações executáveis (10000) excedido. Reduza a quantidade de repetições."` associada à linha do comando `REPEAT`.

### Bug B: Explosão de Erros Semânticos em Cascata dentro de Loops
* **O que acontecia:** Quando o comando `PLAY` era chamado sem instrumento selecionado dentro de um `REPEAT`, a condição anterior só interrompia o loop se houvesse avanço de `stepIndex >= MAX_EXECUTION_STEPS`. Como o erro impedia o incremento do passo, o laço executava milhares de vezes gerando erros duplicados.
* **Entrada de Exemplo:** `REPEAT 20000\n  PLAY\nEND`
* **Correção Implementada:** O interpretador agora interrompe a repetição imediatamente ao detectar um erro no corpo do loop (`if (this.errors.length > 0) break;`) e deduplica mensagens idênticas na mesma linha de código via `addError()`, retornando exatamente 1 erro semântico.

---

## 5. Limitações dos Testes Automatizados

Apesar da alta cobertura e confiabilidade da suíte, certos aspectos técnicos e pedagógicos não são cobertos por testes unitários e de integração sintéticos:

1. **Geração Real de Áudio no Hardware:**
   * Os testes utilizam um mock simulado de `AudioContext` (`mockAudio.ts`). Embora verifique a criação correta de nós, parâmetros e agendamento de tempos, ele não valida problemas como corte de buffer (buffer underrun), taxa de amostragem incompatível da placa de som do usuário ou estalos acústicos (clicks/pops) causados por transições de fase.
2. **Sincronismo Visual vs. Thread de Áudio:**
   * O motor de áudio utiliza `ctx.currentTime` (thread de hardware de alta prioridade) para o som e `setTimeout` na thread principal do JavaScript para o feedback visual (`onStep`). Em máquinas com alta carga de processamento, pode haver dessincronia visual que não se manifesta nos testes com `jest.useFakeTimers()`.
3. **Compatibilidade Multi-Navegador:**
   * Políticas de autoplay e implementações de Web Audio diferem entre o motor Blink (Chrome/Edge), WebKit (Safari no iOS/macOS exige toque físico específico) e Gecko (Firefox). Os testes rodam em ambiente headless JSDOM.
4. **Usabilidade e Eficácia Pedagógica com Alunos:**
   * Os testes validam a lógica e robustez do software, mas não medem a clareza didática das mensagens de erro ou a curva de aprendizado de alunos iniciantes ao resolver os desafios rítmicos.
