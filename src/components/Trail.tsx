'use client';

import React from 'react';
import Link from 'next/link';
import { ChallengeLevel } from '../challenge/challenge';
import { TrailNodeState } from '../progress/types';

export interface TrailNode {
  id: string;
  order: number;
  title: string;
  level: ChallengeLevel;
  xp: number;
  state: TrailNodeState;
  instrumentHint?: string;
}

export interface TrailProps {
  nodes: TrailNode[];
}

const LEVEL_COLORS: Record<ChallengeLevel, { text: string; bg: string; border: string }> = {
  basic: {
    text: 'text-emerald-400',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  intermediate: {
    text: 'text-amber-400',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  advanced: {
    text: 'text-rose-400',
    bg: 'rgba(244, 63, 94, 0.15)',
    border: 'rgba(244, 63, 94, 0.4)',
  },
};

export const Trail: React.FC<TrailProps> = ({ nodes }) => {
  return (
    <div className="trail-root" role="region" aria-label="Trilha de Desafios">
      <div className="trail-header-section">
        <h1 className="trail-main-title">Trilha Rítmica</h1>
        <p className="trail-description">
          Aprenda conceitos de programação resolvendo desafios musicais passo a passo. Complete cada etapa para desbloquear a próxima.
        </p>
      </div>

      <div className="trail-track-container">
        {/* Linha musical conectando os nós com visual sinuoso */}
        <div className="trail-sinuous-path" aria-hidden="true">
          <svg className="trail-path-svg" viewBox="0 0 100 400" preserveAspectRatio="none">
            <path
              d="M 50,20 Q 80,100 50,180 T 50,340"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="6 6"
              className="trail-svg-track"
            />
          </svg>
        </div>

        <ol className="trail-nodes-list" aria-label="Etapas da trilha">
          {nodes.map((node, index) => {
            const isCompleted = node.state === 'completed';
            const isCurrent = node.state === 'current';
            const isLocked = node.state === 'locked';
            const colors = LEVEL_COLORS[node.level];

            const nodeContent = (
              <div className={`trail-node-card state-${node.state} level-${node.level}`}>
                {/* Indicador circular de status */}
                <div className="trail-node-circle" aria-hidden="true">
                  {isCompleted && (
                    <span className="circle-icon check-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                  {isCurrent && (
                    <span className="circle-icon pulse-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </span>
                  )}
                  {isLocked && (
                    <span className="circle-icon lock-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Metadados e título */}
                <div className="trail-node-info">
                  <div className="node-top-meta">
                    <span className="node-order-badge">Fase {node.order.toString().padStart(2, '0')}</span>
                    <span
                      className={`node-level-chip ${colors.text}`}
                      style={{ background: colors.bg, borderColor: colors.border }}
                    >
                      {node.level === 'basic' ? 'Básico' : node.level === 'intermediate' ? 'Médio' : 'Avançado'}
                    </span>
                    <span className="node-xp-badge">+{node.xp} XP</span>
                  </div>

                  <h3 className="node-title">{node.title}</h3>

                  {isLocked && (
                    <p className="node-locked-hint">Conclua o desafio anterior para liberar</p>
                  )}
                  {isCurrent && (
                    <p className="node-status-hint">Desafio atual disponível • Clique para programar</p>
                  )}
                  {isCompleted && (
                    <p className="node-status-hint completed">Concluído • Clique para revisitar</p>
                  )}
                </div>
              </div>
            );

            return (
              <li
                key={node.id}
                className={`trail-node-item position-${index % 2 === 0 ? 'left' : 'right'}`}
              >
                {isLocked ? (
                  <div
                    className="trail-node-link is-disabled"
                    role="link"
                    aria-disabled="true"
                    tabIndex={-1}
                    title="Conclua o desafio anterior"
                  >
                    {nodeContent}
                  </div>
                ) : (
                  <Link
                    href={`/desafio/${node.id}`}
                    className="trail-node-link"
                    aria-label={`Desafio ${node.order}: ${node.title}. ${isCompleted ? 'Concluído' : 'Disponível'}.`}
                  >
                    {nodeContent}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
