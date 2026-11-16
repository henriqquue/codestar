import { appReducer, initialState, AppState, AppAction, UiState } from '../appReducer';
import { CompilationResult } from '../../dsl';
import { ChallengeCheckResult } from '../../challenge/challenge';

describe('Estado da Aplicação - appReducer', () => {
  const dummyCompilationWithEvents: CompilationResult = {
    tokens: [],
    ast: { type: 'Program', body: [] },
    events: [{ stepIndex: 0, type: 'play', instrument: 'kick', line: 1 }],
    totalSteps: 1,
    errors: [],
  };

  const dummyCompilationWithError: CompilationResult = {
    tokens: [],
    ast: null,
    events: [],
    totalSteps: 0,
    errors: [{ line: 1, message: 'Comando inválido' }],
  };

  const dummyCompilationEmpty: CompilationResult = {
    tokens: [],
    ast: { type: 'Program', body: [] },
    events: [],
    totalSteps: 0,
    errors: [],
  };

  it('inicia no estado initial com código vazio e compilação nula', () => {
    // Preparar & Agir
    const state = initialState;

    // Conferir
    expect(state.uiState).toBe('initial');
    expect(state.code).toBe('');
    expect(state.compilation).toBeNull();
    expect(state.activeStep).toBeNull();
    expect(state.checkResult).toBeNull();
  });

  it('transita para editing quando o aluno digita novo código com texto', () => {
    // Preparar
    const startState = initialState;
    const action: AppAction = { type: 'TYPE_CODE', payload: 'INSTRUMENT kick' };

    // Agir
    const nextState = appReducer(startState, action);

    // Conferir
    expect(nextState.uiState).toBe('editing');
    expect(nextState.code).toBe('INSTRUMENT kick');
    expect(nextState.activeStep).toBeNull();
  });

  it('retorna a initial e limpa dados ao digitar código vazio ou apenas espaços', () => {
    // Preparar
    const modifiedState: AppState = {
      uiState: 'valid',
      code: 'PLAY',
      compilation: dummyCompilationWithEvents,
      activeStep: 2,
      checkResult: { success: true, message: 'Ok' },
    };
    const action: AppAction = { type: 'TYPE_CODE', payload: '   \n  ' };

    // Agir
    const nextState = appReducer(modifiedState, action);

    // Conferir
    expect(nextState.uiState).toBe('initial');
    expect(nextState.compilation).toBeNull();
    expect(nextState.activeStep).toBeNull();
    expect(nextState.checkResult).toBeNull();
  });

  it('transita para error e armazena compilação quando chegam erros sintáticos/semânticos', () => {
    // Preparar
    const editingState: AppState = {
      ...initialState,
      uiState: 'editing',
      code: 'PLAY',
    };
    const action: AppAction = { type: 'COMPILE_RESULT', payload: dummyCompilationWithError };

    // Agir
    const nextState = appReducer(editingState, action);

    // Conferir
    expect(nextState.uiState).toBe('error');
    expect(nextState.compilation).toBe(dummyCompilationWithError);
    expect(nextState.activeStep).toBeNull();
    expect(nextState.checkResult).toBeNull();
  });

  it('transita para valid quando a compilação é bem sucedida e possui eventos sonoros', () => {
    // Preparar
    const editingState: AppState = {
      ...initialState,
      uiState: 'editing',
      code: 'INSTRUMENT kick\nPLAY',
    };
    const action: AppAction = { type: 'COMPILE_RESULT', payload: dummyCompilationWithEvents };

    // Agir
    const nextState = appReducer(editingState, action);

    // Conferir
    expect(nextState.uiState).toBe('valid');
    expect(nextState.compilation).toBe(dummyCompilationWithEvents);
  });

  it('retorna para initial se a compilação não tem erros mas não gera eventos como apenas comentários', () => {
    // Preparar
    const editingState: AppState = {
      ...initialState,
      uiState: 'editing',
      code: '# Apenas comentário',
    };
    const action: AppAction = { type: 'COMPILE_RESULT', payload: dummyCompilationEmpty };

    // Agir
    const nextState = appReducer(editingState, action);

    // Conferir
    expect(nextState.uiState).toBe('initial');
    expect(nextState.compilation).toBe(dummyCompilationEmpty);
  });

  it('mantém o estado initial se um resultado de compilação assíncrono chegar após o código ser apagado', () => {
    // Preparar
    const clearedState: AppState = {
      ...initialState,
      code: '',
      uiState: 'initial',
    };
    const action: AppAction = { type: 'COMPILE_RESULT', payload: dummyCompilationWithEvents };

    // Agir
    const nextState = appReducer(clearedState, action);

    // Conferir
    expect(nextState.uiState).toBe('initial');
    expect(nextState.compilation).toBeNull();
  });

  it('transita para playing com activeStep 0 ao disparar START_PLAYING', () => {
    // Preparar
    const validState: AppState = {
      ...initialState,
      uiState: 'valid',
      compilation: dummyCompilationWithEvents,
    };
    const action: AppAction = { type: 'START_PLAYING' };

    // Agir
    const nextState = appReducer(validState, action);

    // Conferir
    expect(nextState.uiState).toBe('playing');
    expect(nextState.activeStep).toBe(0);
  });

  it('atualiza activeStep em tempo real com STEP_CHANGED durante a reprodução', () => {
    // Preparar
    const playingState: AppState = {
      ...initialState,
      uiState: 'playing',
      activeStep: 0,
    };
    const action: AppAction = { type: 'STEP_CHANGED', payload: 2 };

    // Agir
    const nextState = appReducer(playingState, action);

    // Conferir
    expect(nextState.activeStep).toBe(2);
  });

  it('transita para completed e guarda o checkResult quando a reprodução finaliza com sucesso', () => {
    // Preparar
    const playingState: AppState = {
      ...initialState,
      uiState: 'playing',
      activeStep: 1,
    };
    const successResult: ChallengeCheckResult = {
      success: true,
      message: 'Desafio concluído com louvor!',
    };
    const action: AppAction = { type: 'FINISH_PLAYING', payload: successResult };

    // Agir
    const nextState = appReducer(playingState, action);

    // Conferir
    expect(nextState.uiState).toBe('completed');
    expect(nextState.activeStep).toBeNull();
    expect(nextState.checkResult).toEqual(successResult);
  });

  it('retorna para valid e guarda a mensagem de feedback quando o desafio não é superado', () => {
    // Preparar
    const playingState: AppState = {
      ...initialState,
      uiState: 'playing',
      activeStep: 1,
    };
    const failureResult: ChallengeCheckResult = {
      success: false,
      message: 'Faltou uma batida.',
    };
    const action: AppAction = { type: 'FINISH_PLAYING', payload: failureResult };

    // Agir
    const nextState = appReducer(playingState, action);

    // Conferir
    expect(nextState.uiState).toBe('valid');
    expect(nextState.activeStep).toBeNull();
    expect(nextState.checkResult).toEqual(failureResult);
  });

  it('retorna para valid e zera activeStep ao interromper manualmente com STOP_PLAYING', () => {
    // Preparar
    const playingState: AppState = {
      ...initialState,
      uiState: 'playing',
      activeStep: 3,
    };
    const action: AppAction = { type: 'STOP_PLAYING' };

    // Agir
    const nextState = appReducer(playingState, action);

    // Conferir
    expect(nextState.uiState).toBe('valid');
    expect(nextState.activeStep).toBeNull();
  });

  it('restaura integralmente o initialState ao invocar CLEAR_CODE', () => {
    // Preparar
    const currentState: AppState = {
      uiState: 'completed',
      code: 'INSTRUMENT kick\nPLAY',
      compilation: dummyCompilationWithEvents,
      activeStep: null,
      checkResult: { success: true, message: 'Ok' },
    };
    const action: AppAction = { type: 'CLEAR_CODE' };

    // Agir
    const nextState = appReducer(currentState, action);

    // Conferir
    expect(nextState).toEqual(initialState);
  });

  it('percorre com êxito o fluxo completo de estados: initial -> editing -> valid -> playing -> completed', () => {
    // Preparar
    let state = initialState;
    expect(state.uiState).toBe('initial');

    // 1. Aluno digita código
    state = appReducer(state, { type: 'TYPE_CODE', payload: 'INSTRUMENT kick\nPLAY\nWAIT\nPLAY' });
    expect(state.uiState).toBe('editing');

    // 2. Compilador retorna código válido
    state = appReducer(state, { type: 'COMPILE_RESULT', payload: dummyCompilationWithEvents });
    expect(state.uiState).toBe('valid');

    // 3. Aluno clica em Executar
    state = appReducer(state, { type: 'START_PLAYING' });
    expect(state.uiState).toBe('playing');
    expect(state.activeStep).toBe(0);

    // 4. Temporizador avança passo
    state = appReducer(state, { type: 'STEP_CHANGED', payload: 1 });
    expect(state.activeStep).toBe(1);

    // 5. Reprodução finaliza e desafio é aprovado
    state = appReducer(state, {
      type: 'FINISH_PLAYING',
      payload: { success: true, message: 'Parabéns!' },
    });
    expect(state.uiState).toBe('completed');
  });

  it('garante que após qualquer combinação arbitrária de ações o uiState sempre pertence aos 6 estados válidos', () => {
    // Preparar
    const validUiStates: Set<UiState> = new Set([
      'initial',
      'editing',
      'error',
      'valid',
      'playing',
      'completed',
    ]);

    const sampleActions: AppAction[] = [
      { type: 'TYPE_CODE', payload: 'PLAY' },
      { type: 'TYPE_CODE', payload: '' },
      { type: 'COMPILE_RESULT', payload: dummyCompilationWithError },
      { type: 'COMPILE_RESULT', payload: dummyCompilationWithEvents },
      { type: 'COMPILE_RESULT', payload: dummyCompilationEmpty },
      { type: 'START_PLAYING' },
      { type: 'STEP_CHANGED', payload: 1 },
      { type: 'FINISH_PLAYING', payload: { success: true, message: 'Ok' } },
      { type: 'FINISH_PLAYING', payload: { success: false, message: 'Erro' } },
      { type: 'STOP_PLAYING' },
      { type: 'CLEAR_CODE' },
    ];

    let currentState = initialState;

    // Agir & Conferir sequencialmente
    for (const action of sampleActions) {
      currentState = appReducer(currentState, action);
      expect(validUiStates.has(currentState.uiState)).toBe(true);
    }
  });
});

