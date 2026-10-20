import React from 'react';

export type UiState = 'initial' | 'editing' | 'error' | 'valid' | 'playing' | 'completed';

interface RunControlsProps {
  uiState: UiState;
  onPlay: () => void;
  onStop: () => void;
  onReplay: () => void;
  onClear: () => void;
  canExecute: boolean;
}

/**
 * Controles de execução do ritmo:
 * - Botão 'Executar' que se transforma em 'Parar' durante a reprodução
 * - Botão 'Ouvir novamente' quando o desafio for concluído
 * - Botão 'Limpar' para reiniciar o código
 */
export const RunControls: React.FC<RunControlsProps> = ({
  uiState,
  onPlay,
  onStop,
  onReplay,
  onClear,
  canExecute,
}) => {
  const isPlaying = uiState === 'playing';
  const isCompleted = uiState === 'completed';

  return (
    <div className="run-controls-card">
      {isPlaying ? (
        <button
          type="button"
          onClick={onStop}
          className="btn-control btn-stop"
          aria-label="Parar reprodução de áudio"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
          PARAR
        </button>
      ) : isCompleted ? (
        <button
          type="button"
          onClick={onReplay}
          className="btn-control btn-replay"
          aria-label="Ouvir ritmo novamente"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          OUVIR NOVAMENTE
        </button>
      ) : (
        <button
          type="button"
          onClick={onPlay}
          disabled={!canExecute}
          className={`btn-control btn-play ${canExecute ? 'can-execute' : ''}`}
          aria-label="Executar ritmo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          EXECUTAR
        </button>
      )}

      <button
        type="button"
        onClick={onClear}
        disabled={isPlaying}
        className="btn-control btn-clear"
        aria-label="Limpar código do editor"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        LIMPAR
      </button>
    </div>
  );
};
