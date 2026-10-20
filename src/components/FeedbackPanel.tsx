import React from 'react';
import { DSLError } from '../dsl/types';
import { ChallengeCheckResult } from '../challenge/challenge';
import { UiState } from './RunControls';

interface FeedbackPanelProps {
  uiState: UiState;
  errors: DSLError[];
  checkResult: ChallengeCheckResult | null;
  onReplay?: () => void;
}

/**
 * Painel de Feedback Acessível:
 * Comunica o status da execução com ícones visíveis, textos descritivos
 * e orientações amigáveis sem depender exclusivamente de cores ou áudio.
 */
export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  uiState,
  errors,
  checkResult,
}) => {
  // Estado 1: Desafio concluído com sucesso
  if (uiState === 'completed' && checkResult?.success) {
    return (
      <section className="feedback-card feedback-success" role="status" aria-live="polite">
        <div className="feedback-icon-container">
          <svg className="feedback-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="feedback-content">
          <h3 className="feedback-title">DESAFIO CONCLUÍDO</h3>
          <p className="feedback-message">{checkResult.message}</p>
        </div>
      </section>
    );
  }

  // Estado 2: Erros de compilação na DSL
  if (uiState === 'error' && errors.length > 0) {
    return (
      <section className="feedback-card feedback-error" role="alert" aria-live="assertive">
        <div className="feedback-icon-container">
          <svg className="feedback-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="feedback-content">
          <h3 className="feedback-title">AJUSTE NECESSÁRIO NO CÓDIGO</h3>
          <ul className="feedback-error-list">
            {errors.map((err, idx) => (
              <li key={idx} className="feedback-error-item">
                <span className="error-line-badge">Linha {err.line}</span>
                <span className="error-text">{err.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  // Estado 3: Reproduzindo áudio
  if (uiState === 'playing') {
    return (
      <section className="feedback-card feedback-playing" role="status" aria-live="polite">
        <div className="feedback-icon-container">
          <svg className="feedback-icon pulse-anim" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </div>
        <div className="feedback-content">
          <h3 className="feedback-title">TOCANDO RITMO</h3>
          <p className="feedback-message">
            Sintetizando áudio em tempo real. Observe o passo ativo iluminado na grade acima!
          </p>
        </div>
      </section>
    );
  }

  // Estado 4: Código válido, mas o desafio ainda não atingiu os critérios após execução
  if (uiState === 'valid' && checkResult && !checkResult.success) {
    return (
      <section className="feedback-card feedback-warning" role="status" aria-live="polite">
        <div className="feedback-icon-container">
          <svg className="feedback-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="feedback-content">
          <h3 className="feedback-title">QUASE LÁ! AJUSTE SEU RITMO</h3>
          <p className="feedback-message">{checkResult.message}</p>
        </div>
      </section>
    );
  }

  // Estado 5: Código válido pronto para tocar
  if (uiState === 'valid') {
    return (
      <section className="feedback-card feedback-ready" role="status" aria-live="polite">
        <div className="feedback-icon-container">
          <svg className="feedback-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="feedback-content">
          <h3 className="feedback-title">RITMO PRONTO</h3>
          <p className="feedback-message">
            Seu código foi compilado com sucesso! Clique em <strong>EXECUTAR</strong> para ouvir o ritmo e validar o objetivo.
          </p>
        </div>
      </section>
    );
  }

  // Estado 6: Usuário digitando
  if (uiState === 'editing') {
    return (
      <section className="feedback-card feedback-neutral" role="status" aria-live="polite">
        <div className="feedback-icon-container">
          <svg className="feedback-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <div className="feedback-content">
          <h3 className="feedback-title">EDITANDO CÓDIGO...</h3>
          <p className="feedback-message">
            Analisando seu ritmo em tempo real conforme você digita.
          </p>
        </div>
      </section>
    );
  }

  // Estado 7: Inicial (nada digitado)
  return (
    <section className="feedback-card feedback-neutral" role="status" aria-live="polite">
      <div className="feedback-icon-container">
        <svg className="feedback-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      <div className="feedback-content">
        <h3 className="feedback-title">BEM-VINDO AO CODESTAR</h3>
        <p className="feedback-message">
          Escreva comandos musicais no editor à esquerda para compor seu ritmo. Comece selecionando o instrumento com <code>INSTRUMENT kick</code> e tocando com <code>PLAY</code>.
        </p>
      </div>
    </section>
  );
};
