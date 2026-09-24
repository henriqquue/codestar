# CodeStar DSL

## 1. Comandos

| Comando | Sintaxe | Descrição |
|---|---|---|
| INSTRUMENT | INSTRUMENT <nome> | Define o instrumento musical. |
| PLAY | PLAY | Executa uma batida do instrumento selecionado. |
| WAIT | WAIT | Insere uma pausa rítmica. |
| REPEAT | REPEAT <quantidade> ... END | Repete um bloco de comandos. |

## 2. Instrumentos disponíveis

- kick
- snare
- hihat

## 3. Regras básicas

- Cada instrução deve ocupar uma linha.
- Os comandos devem ser escritos em letras maiúsculas.
- PLAY exige um instrumento previamente selecionado.
- REPEAT deve possuir uma quantidade positiva e ser
  encerrado com END.
- Comandos inválidos devem gerar uma mensagem de erro.

## 4. Exemplos

### Ritmo simples

- INSTRUMENT kick
- PLAY
- WAIT
- PLAY

### Alternância de instrumentos

- INSTRUMENT kick
- PLAY
- INSTRUMENT snare
- PLAY
- INSTRUMENT hihat
- PLAY

### Repetição

- REPEAT 2
- - INSTRUMENT kick
- - PLAY
- - WAIT
- END