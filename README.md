# CodeStar

## Descrição

O **CodeStar** é uma aplicação gamificada voltada ao aprendizado de lógica de programação por meio da criação e execução de ritmos musicais. Através de uma linguagem de domínio específico (DSL) simples e intuitiva, alunos e iniciantes em programação podem compor sequências rítmicas, aprender estruturas de controle (como loops de repetição) e visualizar/ouvir o resultado de seus códigos em tempo real.

---

## Tecnologias

* **Linguagem & Runtime:** JavaScript / TypeScript, Node.js e npm
* **Frontend:** React (Vite)
* **Processamento de Áudio:** Web Audio API (prevista para execução sonora)
* **Linguagem de Domínio Específico (DSL):** Lexer, Parser e Interpretador customizados em TypeScript
* **Controle de Versão:** Git e GitHub

---

## Status do Projeto

✅ **DSL & Interpretador Concluídos:** Definição da sintaxe, analisador léxico (Lexer), analisador sintático (Parser) e interpretador semântico (Interpreter) totalmente implementados e testados.

⏳ **Próxima Fase:** Integração do interpretador com a Web Audio API e construção da interface visual no React.

---

## Estrutura e Atualizações da DSL

A linguagem do CodeStar permite descrever ritmos musicais linha a linha. 

### 1. Comandos e Sintaxe

| Comando | Sintaxe | Descrição |
| :--- | :--- | :--- |
| `INSTRUMENT` | `INSTRUMENT <nome>` | Define o instrumento ativo (`kick`, `snare` ou `hihat`). |
| `PLAY` | `PLAY` | Toca uma batida do instrumento selecionado no tempo atual. |
| `WAIT` | `WAIT` | Insere uma pausa de um tempo no ritmo. |
| `REPEAT` | `REPEAT <quantidade>`<br>`  ...`<br>`END` | Repete o bloco de comandos contido entre `REPEAT` e `END` pela quantidade especificada. |

### 2. Instrumentos Suportados

* `kick` (Bumbo)
* `snare` (Caixa)
* `hihat` (Chimbau)

### 3. Regras e Validações da Linguagem

* **Caixa Alta Obrigatória:** Todos os comandos devem ser escritos em maiúsculas (`PLAY`, `INSTRUMENT`, `WAIT`, `REPEAT`, `END`). Se um comando for escrito em minúsculas (ex: `play`), o analisador indica o erro com uma sugestão educativa.
* **Seleção Prévias de Instrumento:** O comando `PLAY` exige que um instrumento tenha sido selecionado previamente por `INSTRUMENT <nome>`.
* **Blocos de Repetição Fechados:** O comando `REPEAT <n>` exige uma quantidade inteira positiva ($n > 0$) e deve ser obrigatoriamente finalizado com `END`.
* **Feedback de Erros Detalhado:** Mensagens de erro contêm a linha e a coluna exatas para facilitar a correção pelo aluno.

---

## Arquitetura da Pipeline da DSL

O código DSL em texto passa por três etapas principais até a geração de eventos rítmicos:

```
[ Código DSL ] ➔ ( Lexer ) ➔ [ Tokens ] ➔ ( Parser ) ➔ [ AST ] ➔ ( Interpreter ) ➔ [ RhythmEvents ]
```

1. **Lexer (`src/dsl/lexer.ts`):** Transforma o código em tokens estruturados e valida regras formais de palavras-chave.
2. **Parser (`src/dsl/parser.ts`):** Constrói a Árvore Sintática Abstrata (AST), garantindo a estrutura dos blocos.
3. **Interpreter (`src/dsl/interpreter.ts`):** Executa a AST, valida regras semânticas em tempo de execução e gera uma lista ordenada de eventos rítmicos (`RhythmEvent[]`) para o player de áudio.

---

## Execução Local e Testes da DSL

### Instalação das Dependências

```bash
npm install
```

### Execução do Servidor de Desenvolvimento (React + Vite)

```bash
npm run dev
```

### Como Testar a DSL

A suíte de testes automatizados valida o funcionamento do Lexer, Parser, Interpretador e tratamento de erros sintáticos/semânticos.

#### 1. Executar os Testes Automatizados

Você pode rodar a suíte de testes diretamente via `npm`:

```bash
npm test
```

Ou utilizando o `tsx` diretamente:

```bash
npx tsx src/dsl/__tests__/dsl.test.ts
```

#### 2. Casos de Teste Validados

| Caso de Teste | Entrada DSL | Resultado Esperado | Status |
| :--- | :--- | :--- | :---: |
| **Ritmo Simples** | `INSTRUMENT kick`<br>`PLAY`<br>`WAIT`<br>`PLAY` | 3 eventos gerados (2 batidas de `kick`, 1 pausa) sem erros. | ✅ Passou |
| **Repetição (`REPEAT`)** | `REPEAT 2`<br>`  INSTRUMENT snare`<br>`  PLAY`<br>`END` | 2 repetições ativadas com sucesso (2 eventos de `snare`). | ✅ Passou |
| **Erro de Caixa Baixa** | `play` | Retorna erro na linha correspondente sugerindo o uso de `PLAY`. | ✅ Passou |
| **PLAY sem Instrumento** | `PLAY` | Erro semântico: *"PLAY exige que um instrumento seja selecionado previamente"*. | ✅ Passou |
| **REPEAT sem END** | `REPEAT 2`<br>`PLAY` | Erro sintático: *"Bloco REPEAT iniciado na linha X não foi encerrado com END"*. | ✅ Passou |

#### 3. Exemplo de Teste Manual em Código

Para compilar um trecho de código DSL manualmente e inspecionar a saída:

```typescript
import { compileCode } from './src/dsl';

const codigo = `
REPEAT 2
  INSTRUMENT kick
  PLAY
  WAIT
  INSTRUMENT snare
  PLAY
END
`;

const resultado = compileCode(codigo);

if (resultado.errors.length > 0) {
  console.error('Erros encontrados:', resultado.errors);
} else {
  console.log('Eventos Rítmicos Gerados:', resultado.events);
  console.log('Total de Passos:', resultado.totalSteps);
}
```

---

## Próximas Etapas

* [x] Definição e validação da gramática da DSL
* [x] Desenvolvimento do Analisador Léxico, Analisador Sintático e Interpretador
* [ ] Integração com o player e sintetizador da Web Audio API
* [ ] Construção do componente visual de edição e sequenciador em React
* [ ] Implementação das fases gamificadas e desafios do MVP
