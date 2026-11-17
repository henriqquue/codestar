'use client';

import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { Challenge, checkChallenge } from '../challenge/challenge';
import { compileCode } from '../dsl';
import { AudioEngine } from '../audio/engine';
import { ChallengePanel } from './ChallengePanel';
import { CodeEditor } from './CodeEditor';
import { RhythmVisualizer } from './RhythmVisualizer';
import { RunControls } from './RunControls';
import { FeedbackPanel } from './FeedbackPanel';
import { appReducer, initialState } from '../state/appReducer';

export interface ChallengeWorkspaceProps {
  challenge: Challenge;
  onCompleted?: () => void;
  onAttempt?: () => void;
}

export const ChallengeWorkspace: React.FC<ChallengeWorkspaceProps> = ({
  challenge,
  onCompleted,
  onAttempt,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Limpa o código e reseta estado quando o desafio mudar
  useEffect(() => {
    audioEngineRef.current?.stop();
    dispatch({ type: 'CLEAR_CODE' });
  }, [challenge.id]);

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
    if (state.uiState === 'playing') {
      return;
    }

    if (!state.compilation || state.compilation.events.length === 0) {
      return;
    }

    const events = state.compilation.events;
    dispatch({ type: 'START_PLAYING' });
    onAttempt?.();

    try {
      await audioEngineRef.current?.play(events, {
        onStep: (stepIndex) => {
          dispatch({ type: 'STEP_CHANGED', payload: stepIndex });
        },
        onEnd: () => {
          const checkRes = checkChallenge(events, challenge, {
            source: state.code,
            ast: state.compilation?.ast ?? null,
          });
          dispatch({ type: 'FINISH_PLAYING', payload: checkRes });
          if (checkRes.success) {
            onCompleted?.();
          }
        },
      });
    } catch (err) {
      console.error('Erro ao reproduzir áudio:', err);
      dispatch({ type: 'STOP_PLAYING' });
    }
  }, [state.uiState, state.compilation, state.code, challenge, onCompleted, onAttempt]);

  const handleStop = useCallback(() => {
    audioEngineRef.current?.stop();
    dispatch({ type: 'STOP_PLAYING' });
  }, []);

  const handleClear = useCallback(() => {
    audioEngineRef.current?.stop();
    dispatch({ type: 'CLEAR_CODE' });
  }, []);

  const handleReplay = useCallback(() => {
    handlePlay();
  }, [handlePlay]);

  const canExecute =
    (state.uiState === 'valid' || state.uiState === 'completed') &&
    Boolean(state.compilation && state.compilation.events.length > 0);

  return (
    <div className="challenge-workspace-root">
      {/* Layout Split Screen (Painel Esquerdo + Painel Direito) */}
      <main className="app-split-layout">
        {/* Painel Esquerdo: ChallengePanel + CodeEditor */}
        <section className="panel-column panel-left" aria-label="Painel de desafios e editor de código">
          <ChallengePanel challenge={challenge} />
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

      {/* Rodapé com indicador de estado da máquina */}
      <footer className="app-footer">
        <span className="state-indicator-badge" title="Estado interno da máquina de estados">
          Estado: <strong className="state-name">{state.uiState}</strong>
        </span>
      </footer>
    </div>
  );
};
