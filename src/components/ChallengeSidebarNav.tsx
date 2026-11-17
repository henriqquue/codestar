'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Challenge } from '../challenge/challenge';
import { TrailNodeState } from '../progress/types';

export interface ChallengeSidebarNavProps {
  challenges: Challenge[];
  currentChallenge: Challenge;
  trailStates: Record<string, TrailNodeState>;
  onNavigate?: (challengeId: string) => void;
}

export const ChallengeSidebarNav: React.FC<ChallengeSidebarNavProps> = ({
  challenges,
  currentChallenge,
  trailStates,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Divide os desafios em 3 grupos relativos ao desafio atual
  const currentIndex = challenges.findIndex((c) => c.id === currentChallenge.id);

  const previousChallenges = challenges.filter((_, idx) => idx < currentIndex);
  const nextChallenges = challenges.filter((_, idx) => idx > currentIndex);

  const prevChallenge = currentIndex > 0 ? challenges[currentIndex - 1] : null;
  const nextChallenge = currentIndex < challenges.length - 1 ? challenges[currentIndex + 1] : null;

  const isCurrentCompleted = trailStates[currentChallenge.id] === 'completed';
  const isNextUnlocked = nextChallenge ? trailStates[nextChallenge.id] !== 'locked' : false;

  return (
    <aside
      className={`challenge-nav-drawer ${collapsed ? 'is-collapsed' : ''}`}
      aria-label="Navegação entre Desafios"
    >
      <div className="drawer-header">
        <span className="drawer-title">Etapas</span>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="drawer-toggle-btn"
          aria-label={collapsed ? 'Expandir painel de desafios' : 'Recolher painel de desafios'}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`drawer-arrow-icon ${collapsed ? 'rotated' : ''}`}
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="drawer-body">
          {/* Botões de Ação Rápida */}
          <div className="drawer-quick-nav">
            {prevChallenge ? (
              <Link
                href={`/desafio/${prevChallenge.id}`}
                className="quick-nav-btn prev-btn"
                title={`Ir para ${prevChallenge.title}`}
              >
                ← Anterior
              </Link>
            ) : (
              <span className="quick-nav-btn is-disabled">← Anterior</span>
            )}

            {nextChallenge ? (
              isCurrentCompleted || isNextUnlocked ? (
                <Link
                  href={`/desafio/${nextChallenge.id}`}
                  className="quick-nav-btn next-btn is-unlocked highlight"
                  title={`Avançar para ${nextChallenge.title}`}
                >
                  Próximo →
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="quick-nav-btn next-btn is-disabled"
                  title="Conclua o desafio atual para avançar"
                >
                  Próximo 🔒
                </button>
              )
            ) : (
              <span className="quick-nav-btn is-disabled">Fim da Trilha</span>
            )}
          </div>

          {/* Grupo 1: Desafios anteriores */}
          <div className="drawer-group">
            <h4 className="drawer-group-title">Desafios anteriores</h4>
            {previousChallenges.length === 0 ? (
              <p className="drawer-empty-hint">Este é o primeiro desafio.</p>
            ) : (
              <ul className="drawer-items-list">
                {previousChallenges.map((ch) => {
                  const state = trailStates[ch.id];
                  const isDone = state === 'completed';
                  return (
                    <li key={ch.id}>
                      <Link
                        href={`/desafio/${ch.id}`}
                        className={`drawer-item-link ${isDone ? 'is-completed' : ''}`}
                      >
                        <span className="item-status-icon">
                          {isDone ? '✓' : '•'}
                        </span>
                        <span className="item-name">{ch.title}</span>
                        <span className="item-xp">+{ch.xp} XP</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Grupo 2: Desafio atual */}
          <div className="drawer-group current-group">
            <h4 className="drawer-group-title">Desafio atual</h4>
            <div className="drawer-current-card">
              <div className="current-card-badge">
                <span>Fase {currentChallenge.order}</span>
                {isCurrentCompleted && <span className="completed-tag">Concluído!</span>}
              </div>
              <p className="current-card-title">{currentChallenge.title}</p>
              <span className="current-card-reward">Recompensa: +{currentChallenge.xp} XP</span>
            </div>
          </div>

          {/* Grupo 3: Próximos desafios */}
          <div className="drawer-group">
            <h4 className="drawer-group-title">Próximos desafios</h4>
            {nextChallenges.length === 0 ? (
              <p className="drawer-empty-hint">Você chegou ao final da trilha oficial!</p>
            ) : (
              <ul className="drawer-items-list">
                {nextChallenges.map((ch) => {
                  const state = trailStates[ch.id] || 'locked';
                  const isUnlocked = state !== 'locked';

                  return (
                    <li key={ch.id}>
                      {isUnlocked ? (
                        <Link href={`/desafio/${ch.id}`} className="drawer-item-link is-unlocked">
                          <span className="item-status-icon">🔓</span>
                          <span className="item-name">{ch.title}</span>
                          <span className="item-xp">+{ch.xp} XP</span>
                        </Link>
                      ) : (
                        <div
                          className="drawer-item-link is-locked"
                          role="link"
                          aria-disabled="true"
                          title="Conclua o desafio anterior para liberar"
                        >
                          <span className="item-status-icon">🔒</span>
                          <span className="item-name">{ch.title}</span>
                          <span className="item-xp">+{ch.xp} XP</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
