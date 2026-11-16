'use client';

import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { MVP_CHALLENGE, Challenge, checkChallenge } from './challenge/challenge';
import { OFFICIAL_CHALLENGES, getChallengeById } from './challenge/catalog';
import { compileCode } from './dsl';
import { AudioEngine } from './audio/engine';
import { ChallengePanel } from './components/ChallengePanel';
import { CodeEditor } from './components/CodeEditor';
import { RhythmVisualizer } from './components/RhythmVisualizer';
import { RunControls } from './components/RunControls';
import { FeedbackPanel } from './components/FeedbackPanel';
import { appReducer, initialState, UiState } from './state/appReducer';
import './App.css';

// Exporta o tipo UiState conforme solicitado nos requisitos
export type { UiState };

export interface AppProps {
  challenge?: Challenge;
}

export const App: React.FC<AppProps> = ({ challenge = MVP_CHALLENGE }) => {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(challenge);
  const [state, dispatch] = useReducer(appReducer, initialState);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Sincroniza se a prop challenge inicial for alterada externamente
  useEffect(() => {
    setCurrentChallenge(challenge);
    audioEngineRef.current?.stop();
    dispatch({ type: 'CLEAR_CODE' });
  }, [challenge]);

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
          const checkRes = checkChallenge(events, currentChallenge, {
            source: state.code,
            ast: state.compilation?.ast ?? null,
          });
          dispatch({ type: 'FINISH_PLAYING', payload: checkRes });
        },
      });
    } catch (err) {
      console.error('Erro ao reproduzir áudio:', err);
      dispatch({ type: 'STOP_PLAYING' });
    }
  }, [state.uiState, state.compilation, state.code, currentChallenge]);

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

  // Ação de alternar desafio (utilizada tanto pelo seletor de botões quanto pelo select)
  const selectChallenge = useCallback(
    (challengeId: string) => {
      const selected = getChallengeById(challengeId);
      if (selected && selected.id !== currentChallenge.id) {
        audioEngineRef.current?.stop();
        setCurrentChallenge(selected);
        dispatch({ type: 'CLEAR_CODE' });
      }
    },
    [currentChallenge.id]
  );

  const handleChallengeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      selectChallenge(e.target.value);
    },
    [selectChallenge]
  );

  // O botão executar só é habilitado em estado 'valid' ou 'completed' com eventos
  const canExecute =
    (state.uiState === 'valid' || state.uiState === 'completed') &&
    Boolean(state.compilation && state.compilation.events.length > 0);

  return (
    <div className="app-container">
      {/* Cabeçalho superior com título e seletor de desafios */}
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo">
            <span className="app-logo-text">CODESTAR</span>
          </div>
        </div>

        <div className="header-center">
          <div className="challenge-selector-wrapper">
            {/* Seletor Segmentado Gamificado (Desktop e Tablet) */}
            <nav className="challenge-selector-nav" aria-label="Seletor de Desafios">
              {OFFICIAL_CHALLENGES.map((ch) => {
                const isActive = ch.id === currentChallenge.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => selectChallenge(ch.id)}
                    className={`challenge-nav-item ${isActive ? `active level-${ch.level}` : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    title={`${ch.title} — ${ch.level}`}
                  >
                    <span className={`challenge-nav-badge ${ch.level}`}>
                      {ch.order.toString().padStart(2, '0')} •{' '}
                      {ch.level === 'basic'
                        ? 'BÁSICO'
                        : ch.level === 'intermediate'
                        ? 'MÉDIO'
                        : 'AVANÇADO'}
                    </span>
                    <span className="challenge-nav-title">{ch.title}</span>
                    <span className="challenge-nav-xp">+{ch.xp} XP</span>
                  </button>
                );
              })}
            </nav>

            {/* Dropdown estilizado para telas menores */}
            <div className="challenge-select-mobile-container">
              <label htmlFor="challenge-select" className="sr-only">
                Selecionar desafio
              </label>
              <select
                id="challenge-select"
                aria-label="Selecionar desafio"
                value={currentChallenge.id}
                onChange={handleChallengeChange}
                className="challenge-select-styled"
              >
                {OFFICIAL_CHALLENGES.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.order}. {ch.title} —{' '}
                    {ch.level === 'basic'
                      ? 'Básico'
                      : ch.level === 'intermediate'
                      ? 'Intermediário'
                      : 'Avançado'}{' '}
                    (+{ch.xp} XP)
                  </option>
                ))}
              </select>
            </div>
          </div>
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
          <ChallengePanel challenge={currentChallenge} />
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
