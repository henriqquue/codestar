'use client';

import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { MVP_CHALLENGE, checkChallenge, ChallengeCheckResult } from './challenge/challenge';
import { compileCode, CompilationResult } from './dsl';
import { AudioEngine } from './audio/engine';
import { ChallengePanel } from './components/ChallengePanel';
import { CodeEditor } from './components/CodeEditor';
import { RhythmVisualizer } from './components/RhythmVisualizer';
import { RunControls, UiState } from './components/RunControls';
import { FeedbackPanel } from './components/FeedbackPanel';
import './App.css';

// Exporta o tipo UiState conforme solicitado nos requisitos
export type { UiState };

interface AppState {
  uiState: UiState;
  code: string;
  compilation: CompilationResult | null;
  activeStep: number | null;
  checkResult: ChallengeCheckResult | null;
}

type AppAction =
  | { type: 'TYPE_CODE'; payload: string }
  | { type: 'COMPILE_RESULT'; payload: CompilationResult }
  | { type: 'START_PLAYING' }
  | { type: 'STEP_CHANGED'; payload: number }
  | { type: 'FINISH_PLAYING'; payload: ChallengeCheckResult }
  | { type: 'STOP_PLAYING' }
  | { type: 'CLEAR_CODE' };

const initialState: AppState = {
  uiState: 'initial',
  code: '',
  compilation: null,
  activeStep: null,
  checkResult: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TYPE_CODE': {
      const newCode = action.payload;
      // Código vazio retorna imediatamente ao estado 'initial'
      if (newCode.trim() === '') {
        return {
          ...state,
          code: newCode,
          uiState: 'initial',
          compilation: null,
          activeStep: null,
          checkResult: null,
        };
      }
      // Qualquer alteração enquanto o usuário digita transita para 'editing'
      return {
        ...state,
        code: newCode,
        uiState: 'editing',
        activeStep: null,
      };
    }

    case 'COMPILE_RESULT': {
      // Se o código foi limpo no meio tempo, mantém initial
      if (state.code.trim() === '') {
        return {
          ...state,
          uiState: 'initial',
          compilation: null,
          activeStep: null,
          checkResult: null,
        };
      }

      const comp = action.payload;
      if (comp.errors.length > 0) {
        return {
          ...state,
          uiState: 'error',
          compilation: comp,
          activeStep: null,
          checkResult: null,
        };
      }

      // Código válido sem erros e com eventos rítmicos gerados
      if (comp.events.length > 0) {
        return {
          ...state,
          uiState: 'valid',
          compilation: comp,
          activeStep: null,
        };
      }

      // Código sem erros mas sem batidas/passos executáveis (ex: apenas comentários ou linhas vazias)
      return {
        ...state,
        uiState: 'initial',
        compilation: comp,
        activeStep: null,
      };
    }

    case 'START_PLAYING':
      return {
        ...state,
        uiState: 'playing',
        activeStep: 0,
      };

    case 'STEP_CHANGED':
      return {
        ...state,
        activeStep: action.payload,
      };

    case 'FINISH_PLAYING': {
      const res = action.payload;
      return {
        ...state,
        uiState: res.success ? 'completed' : 'valid',
        activeStep: null,
        checkResult: res,
      };
    }

    case 'STOP_PLAYING':
      return {
        ...state,
        uiState: 'valid',
        activeStep: null,
      };

    case 'CLEAR_CODE':
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Instancia o motor de áudio uma única vez e garante limpeza no desmonte
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    return () => {
      audioEngineRef.current?.dispose();
    };
  }, []);

  // Debounce de 400ms: digitar → editing → compileCode → error ou valid
  useEffect(() => {
    if (state.code.trim() === '') {
      return;
    }

    const timer = setTimeout(() => {
      const compilation = compileCode(state.code);
      dispatch({ type: 'COMPILE_RESULT', payload: compilation });
    }, 400);

    return () => clearTimeout(timer);
  }, [state.code]);

  // Ação de Executar o ritmo sintetizado no navegador
  const handlePlay = useCallback(async () => {
    // Tratar: execução durante reprodução (ignorar)
    if (state.uiState === 'playing') {
      return;
    }

    // Tratar: Executar sem sequência válida (desabilitado)
    if (!state.compilation || state.compilation.events.length === 0) {
      return;
    }

    const events = state.compilation.events;
    dispatch({ type: 'START_PLAYING' });

    try {
      await audioEngineRef.current?.play(events, {
        onStep: (stepIndex) => {
          dispatch({ type: 'STEP_CHANGED', payload: stepIndex });
        },
        onEnd: () => {
          const checkRes = checkChallenge(events, MVP_CHALLENGE);
          dispatch({ type: 'FINISH_PLAYING', payload: checkRes });
        },
      });
    } catch (err) {
      console.error('Erro ao reproduzir áudio:', err);
      dispatch({ type: 'STOP_PLAYING' });
    }
  }, [state.uiState, state.compilation]);

  // Ação de Parar a reprodução imediatamente
  const handleStop = useCallback(() => {
    audioEngineRef.current?.stop();
    dispatch({ type: 'STOP_PLAYING' });
  }, []);

  // Ação de Limpar o editor
  const handleClear = useCallback(() => {
    audioEngineRef.current?.stop();
    dispatch({ type: 'CLEAR_CODE' });
  }, []);

  // Ação de Ouvir novamente (quando concluído)
  const handleReplay = useCallback(() => {
    handlePlay();
  }, [handlePlay]);

  // O botão executar só é habilitado em estado 'valid' ou 'completed' com eventos
  const canExecute =
    (state.uiState === 'valid' || state.uiState === 'completed') &&
    Boolean(state.compilation && state.compilation.events.length > 0);

  return (
    <div className="app-container">
      {/* Cabeçalho superior com título e metadados */}
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo">
            <span className="app-logo-text">CODESTAR</span>
          </div>
        </div>

        <div className="header-center">
          <span className="header-challenge-name">
            Desafio 01 — {MVP_CHALLENGE.title}
          </span>
        </div>

        <div className="header-right">
          <div className="user-avatar" title="Aluno">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
      </header>

      {/* Layout Split Screen (Painel Esquerdo + Painel Direito) */}
      <main className="app-split-layout">
        {/* Painel Esquerdo: ChallengePanel + CodeEditor */}
        <section className="panel-column panel-left" aria-label="Painel de desafios e editor de código">
          <ChallengePanel challenge={MVP_CHALLENGE} />
          <CodeEditor
            value={state.code}
            onChange={(newCode) => dispatch({ type: 'TYPE_CODE', payload: newCode })}
            errors={state.compilation?.errors || []}
            disabled={state.uiState === 'playing'}
          />
        </section>

        {/* Painel Direito: RhythmVisualizer + RunControls + FeedbackPanel */}
        <section className="panel-column panel-right" aria-label="Painel de visualização e controles">
          <RhythmVisualizer
            events={state.compilation?.events || []}
            activeStep={state.activeStep}
            totalSteps={state.compilation?.totalSteps || 0}
          />

          <RunControls
            uiState={state.uiState}
            onPlay={handlePlay}
            onStop={handleStop}
            onReplay={handleReplay}
            onClear={handleClear}
            canExecute={canExecute}
          />

          <FeedbackPanel
            uiState={state.uiState}
            errors={state.compilation?.errors || []}
            checkResult={state.checkResult}
            onReplay={handleReplay}
          />
        </section>
      </main>

      {/* Rodapé com indicador de estado da máquina (útil para prints do TCC) */}
      <footer className="app-footer">
        <span className="state-indicator-badge" title="Estado interno da máquina de estados">
          Estado: <strong className="state-name">{state.uiState}</strong>
        </span>
      </footer>
    </div>
  );
};

export default App;
