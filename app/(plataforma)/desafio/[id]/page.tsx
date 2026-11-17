'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { OFFICIAL_CHALLENGES, getChallengeById } from '@/src/challenge/catalog';
import { useProgress } from '@/src/progress/ProgressContext';
import { computeTrailState } from '@/src/progress/types';
import { ChallengeSidebarNav } from '@/src/components/ChallengeSidebarNav';
import Link from 'next/link';

// Import dinâmico do ChallengeWorkspace sem SSR para isolar a Web Audio API
const ChallengeWorkspace = dynamic(
  () =>
    import('@/src/components/ChallengeWorkspace').then((mod) => mod.ChallengeWorkspace),
  { ssr: false }
);

interface ChallengePageProps {
  params: Promise<{ id: string }>;
}

export default function ChallengePage({ params }: ChallengePageProps) {
  const router = useRouter();
  const { completed, markCompleted, recordAttempt } = useProgress();

  // Next.js 16 App Router params é Promise
  const resolvedParams = React.use(params);
  const challengeId = resolvedParams.id;
  const challenge = getChallengeById(challengeId);

  // Calcula estado dos nós da trilha
  const trailStates = computeTrailState(OFFICIAL_CHALLENGES, completed);
  const currentState = challenge ? trailStates[challenge.id] : undefined;

  // Se o desafio for desconhecido
  if (!challenge) {
    return (
      <div className="challenge-not-found-container">
        <div className="not-found-card">
          <span className="not-found-icon">🔍</span>
          <h2>Desafio não encontrado</h2>
          <p>O desafio &quot;{challengeId}&quot; não existe na trilha de aprendizado.</p>
          <Link href="/trilha" className="not-found-back-link">
            ← Voltar para a Trilha
          </Link>
        </div>
      </div>
    );
  }

  // Se o desafio estiver bloqueado, avisa e convida a voltar para a trilha
  if (currentState === 'locked') {
    return (
      <div className="challenge-locked-container">
        <div className="locked-card">
          <span className="locked-icon">🔒</span>
          <h2>Desafio Bloqueado</h2>
          <p>
            Você precisa concluir os desafios anteriores da trilha antes de acessar &quot;{challenge.title}&quot;.
          </p>
          <div className="locked-actions">
            <button
              type="button"
              onClick={() => router.push('/trilha')}
              className="locked-back-btn"
            >
              Voltar para a Trilha
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = completed.includes(challenge.id);

  return (
    <div className="challenge-page-layout">
      {/* Banner discreto de celebração quando concluído */}
      {isCompleted && (
        <div className="challenge-celebration-banner" role="status">
          <span className="celebration-sparkle">🎉</span>
          <span className="celebration-text">
            Parabéns! Você completou este desafio com sucesso (+{challenge.xp} XP).
          </span>
        </div>
      )}

      <div className="challenge-workspace-wrapper">
        {/* Painel Lateral Específico do Desafio */}
        <ChallengeSidebarNav
          challenges={OFFICIAL_CHALLENGES}
          currentChallenge={challenge}
          trailStates={trailStates}
        />

        {/* Área de Trabalho do Desafio */}
        <div className="challenge-main-area">
          <ChallengeWorkspace
            challenge={challenge}
            onCompleted={() => markCompleted(challenge.id)}
            onAttempt={() => recordAttempt(challenge.id)}
          />
        </div>
      </div>
    </div>
  );
}
