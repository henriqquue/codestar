import React from 'react';
import { Challenge } from '../challenge/challenge';

interface ChallengePanelProps {
  challenge: Challenge;
}

/**
 * Painel informativo do desafio atual, apresentando objetivo, instruções
 * e a lista de comandos permitidos.
 */
export const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge }) => {
  return (
    <section className="challenge-card" aria-labelledby="challenge-title">
      <div className="challenge-header">
        <div className="challenge-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="challenge-title-group">
          <span className="challenge-badge">Desafio 01</span>
          <h2 id="challenge-title" className="challenge-title">{challenge.title}</h2>
        </div>
      </div>

      <div className="challenge-body">
        <p className="challenge-instructions">{challenge.instructions}</p>

        <div className="challenge-section">
          <h3 className="challenge-section-title">Objetivo</h3>
          <p className="challenge-objective">{challenge.objective}</p>
        </div>

        <div className="challenge-section">
          <h3 className="challenge-section-title">Comandos Permitidos</h3>
          <div className="allowed-commands-list" role="list">
            {challenge.allowedCommands.map((cmd) => (
              <span key={cmd} className="command-pill" role="listitem">
                <code>{cmd}</code>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
