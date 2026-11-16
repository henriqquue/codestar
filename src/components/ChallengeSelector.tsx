import React from 'react';
import { Challenge } from '../challenge/challenge';

interface ChallengeSelectorProps {
  challenges: Challenge[];
  currentChallenge: Challenge;
  onSelectChallenge: (challengeId: string) => void;
}

/**
 * Ícones temáticos para cada tipo de desafio rítmico
 */
const ChallengeIcon: React.FC<{ level: Challenge['level'] }> = ({ level }) => {
  if (level === 'basic') {
    // Ícone de Bumbo (Kick) com ondas sonoras
    return (
      <svg
        className="challenge-icon-svg text-emerald-400"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      </svg>
    );
  }

  if (level === 'intermediate') {
    // Ícone de Laço / Repetição (Loop REPEAT)
    return (
      <svg
        className="challenge-icon-svg text-amber-400"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m17 2 4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="m7 22-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      </svg>
    );
  }

  // Ícone de Groove / Equalizador Multitimbral (Avançado)
  return (
    <svg
      className="challenge-icon-svg text-rose-400"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 10v4" />
      <path d="M6 6v12" />
      <path d="M10 3v18" />
      <path d="M14 8v8" />
      <path d="M18 5v14" />
      <path d="M22 10v4" />
    </svg>
  );
};

const CONCEPT_LABELS: Record<string, string> = {
  'kick-duas-batidas': 'Instruções Sequenciais & Pausa',
  'laco-kick-snare': 'Laço de Repetição (REPEAT 2)',
  'groove-completo': 'Polirritmia & Três Timbres',
};

/**
 * Componente Seletor de Desafios Gamificado (Trilha de Missões Rítmicas)
 * Apresenta as fases em destaque com cards estilizados, badges de nível,
 * recompensas de XP, status de missão ativa e visualizador responsivo.
 */
export const ChallengeSelector: React.FC<ChallengeSelectorProps> = ({
  challenges,
  currentChallenge,
  onSelectChallenge,
}) => {
  const totalXp = challenges.reduce((acc, ch) => acc + (ch.xp || 0), 0);

  return (
    <section className="challenge-track-section" aria-label="Trilha de Desafios">
      {/* Cabeçalho da Trilha de Missões */}
      <div className="challenge-track-header">
        <div className="track-header-left">
          <div className="track-badge">
            <span className="track-badge-pulse" />
            <span className="track-badge-text">TRILHA RÍTMICA</span>
          </div>
          <span className="track-subtitle">
            Selecione uma missão para programar novos ritmos e desbloquear conceitos
          </span>
        </div>

        <div className="track-header-right">
          <div className="track-progress-info">
            <span className="track-step-count">
              Fase <strong>{currentChallenge.order}</strong> de {challenges.length}
            </span>
            <span className="track-total-xp">
              <span className="text-amber-400">⚡</span> {totalXp} XP no total
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Cards Gamificados (Desktop / Tablet) */}
      <div className="challenge-track-container">
        <div className="challenge-track-rail" aria-hidden="true" />
        <nav className="challenge-cards-grid" aria-label="Navegação entre desafios">
          {challenges.map((ch) => {
            const isActive = ch.id === currentChallenge.id;
            const levelLabel =
              ch.level === 'basic'
                ? 'Básico'
                : ch.level === 'intermediate'
                ? 'Médio'
                : 'Avançado';
            const concept = CONCEPT_LABELS[ch.id] || 'Lógica Musical';

            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onSelectChallenge(ch.id)}
                className={`challenge-card-item level-${ch.level} ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
                title={`Desafio ${ch.order}: ${ch.title} (${levelLabel})`}
              >
                {/* Linha superior: Marcador de Fase, Badge de Dificuldade e Ícone */}
                <div className="card-top-row">
                  <div className="card-step-badge">
                    <span className="card-step-number">
                      {ch.order.toString().padStart(2, '0')}
                    </span>
                    <span className={`card-level-chip chip-${ch.level}`}>
                      {levelLabel}
                    </span>
                  </div>

                  <div className="card-icon-container">
                    <ChallengeIcon level={ch.level} />
                  </div>
                </div>

                {/* Conteúdo central: Título do desafio e conceito pedagógico */}
                <div className="card-main-content">
                  <span className="card-title-text">{ch.title}</span>
                  <span className="card-concept-hint">{concept}</span>
                </div>

                {/* Linha inferior: XP e Indicador de Status */}
                <div className="card-bottom-row">
                  <span className="card-xp-pill">
                    <span className="xp-star">⭐</span> +{ch.xp} XP
                  </span>

                  {isActive ? (
                    <span className="card-status-active">
                      <span className="status-beacon" />
                      MISSÃO ATIVA
                    </span>
                  ) : (
                    <span className="card-status-action">
                      SELECIONAR <span className="action-arrow">→</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dropdown acessível para mobile e leitores de tela */}
      <div className="challenge-mobile-selector">
        <label htmlFor="challenge-select" className="sr-only">
          Selecionar desafio
        </label>
        <div className="mobile-select-wrapper">
          <span className="mobile-select-icon">🎯</span>
          <select
            id="challenge-select"
            aria-label="Selecionar desafio"
            value={currentChallenge.id}
            onChange={(e) => onSelectChallenge(e.target.value)}
            className="challenge-mobile-select"
          >
            {challenges.map((ch) => (
              <option key={ch.id} value={ch.id}>
                Desafio {ch.order.toString().padStart(2, '0')}: {ch.title} —{' '}
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
    </section>
  );
};

