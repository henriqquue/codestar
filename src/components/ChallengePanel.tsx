import React from 'react';
import { Challenge, patternToLabel } from '../challenge/challenge';

interface ChallengePanelProps {
  challenge: Challenge;
}

const LEVEL_STYLES = {
  basic: {
    label: 'Básico',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  intermediate: {
    label: 'Intermediário',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  advanced: {
    label: 'Avançado',
    className: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
};

/**
 * Painel informativo do desafio atual, apresentando objetivo, instruções,
 * nível de dificuldade, padrão alvo (se houver) e comandos permitidos.
 */
export const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge }) => {
  const levelInfo = LEVEL_STYLES[challenge.level] ?? LEVEL_STYLES.basic;

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
          <div className="challenge-meta-row flex items-center gap-2">
            <span className="challenge-badge">
              Desafio {challenge.order ? challenge.order.toString().padStart(2, '0') : '01'}
            </span>
            <span
              className={`challenge-level-badge px-2 py-0.5 rounded text-xs font-semibold uppercase border ${levelInfo.className}`}
              aria-label={`Nível ${levelInfo.label}`}
            >
              {levelInfo.label}
            </span>
            {challenge.xp !== undefined && (
              <span className="challenge-xp-badge text-xs font-medium text-slate-400">
                +{challenge.xp} XP
              </span>
            )}
          </div>
          <h2 id="challenge-title" className="challenge-title">{challenge.title}</h2>
        </div>
      </div>

      <div className="challenge-body">
        <p className="challenge-instructions">{challenge.instructions}</p>

        <div className="challenge-section">
          <h3 className="challenge-section-title">Objetivo</h3>
          <p className="challenge-objective">{challenge.objective}</p>
        </div>

        {challenge.spec && challenge.spec.kind === 'pattern' && (
          <div className="challenge-section">
            <h3 className="challenge-section-title">Padrão Rítmico Alvo</h3>
            <div className="challenge-target-pattern font-mono text-sm tracking-wider px-3 py-2 rounded bg-slate-900/60 border border-slate-700 text-cyan-300">
              {patternToLabel(challenge.spec.steps)}
            </div>
          </div>
        )}

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
