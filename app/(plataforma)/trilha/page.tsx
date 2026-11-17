'use client';

import React from 'react';
import { OFFICIAL_CHALLENGES } from '@/src/challenge/catalog';
import { useProgress } from '@/src/progress/ProgressContext';
import { computeTrailState } from '@/src/progress/types';
import { Trail, TrailNode } from '@/src/components/Trail';

export default function TrilhaPage() {
  const { completed } = useProgress();

  const trailStates = computeTrailState(OFFICIAL_CHALLENGES, completed);

  const trailNodes: TrailNode[] = OFFICIAL_CHALLENGES.map((ch) => ({
    id: ch.id,
    order: ch.order,
    title: ch.title,
    level: ch.level,
    xp: ch.xp,
    state: trailStates[ch.id] || 'locked',
  }));

  return (
    <div className="trilha-page-container">
      <Trail nodes={trailNodes} />
    </div>
  );
}
