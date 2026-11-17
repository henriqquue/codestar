import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChallengeSidebarNav } from '../ChallengeSidebarNav';
import { OFFICIAL_CHALLENGES } from '../../challenge/catalog';
import { TrailNodeState } from '../../progress/types';

describe('Componente ChallengeSidebarNav', () => {
  const [basic, intermediate, advanced] = OFFICIAL_CHALLENGES;

  it('organiza corretamente os grupos quando o desafio atual é o intermediário', () => {
    // Preparar: básico concluído, intermediário atual, avançado bloqueado
    const states: Record<string, TrailNodeState> = {
      [basic.id]: 'completed',
      [intermediate.id]: 'current',
      [advanced.id]: 'locked',
    };

    render(
      <ChallengeSidebarNav
        challenges={OFFICIAL_CHALLENGES}
        currentChallenge={intermediate}
        trailStates={states}
      />
    );

    // Conferir Grupo 1: Anteriores (deve conter o básico)
    const prevGroup = screen.getByText('Desafios anteriores').closest('.drawer-group');
    expect(prevGroup).toHaveTextContent(basic.title);

    // Conferir Grupo 2: Atual (deve conter o intermediário)
    const currentGroup = screen.getByText('Desafio atual').closest('.drawer-group');
    expect(currentGroup).toHaveTextContent(intermediate.title);

    // Conferir Grupo 3: Próximos (deve conter o avançado bloqueado)
    const nextGroup = screen.getByText('Próximos desafios').closest('.drawer-group');
    expect(nextGroup).toHaveTextContent(advanced.title);
    expect(nextGroup).toHaveTextContent('🔒');
  });

  it('desabilita o botão "Próximo" quando o desafio atual ainda não foi concluído', () => {
    // Preparar: básico atual e não concluído
    const states: Record<string, TrailNodeState> = {
      [basic.id]: 'current',
      [intermediate.id]: 'locked',
      [advanced.id]: 'locked',
    };

    render(
      <ChallengeSidebarNav
        challenges={OFFICIAL_CHALLENGES}
        currentChallenge={basic}
        trailStates={states}
      />
    );

    // O botão Próximo deve estar desabilitado
    const nextBtn = screen.getByRole('button', { name: /próximo 🔒/i });
    expect(nextBtn).toBeDisabled();
  });

  it('habilita o link "Próximo" quando o desafio atual foi concluído', () => {
    // Preparar: básico marcado como concluído
    const states: Record<string, TrailNodeState> = {
      [basic.id]: 'completed',
      [intermediate.id]: 'current',
      [advanced.id]: 'locked',
    };

    render(
      <ChallengeSidebarNav
        challenges={OFFICIAL_CHALLENGES}
        currentChallenge={basic}
        trailStates={states}
      />
    );

    // O botão Próximo passa a ser um link ativo
    const nextLink = screen.getByRole('link', { name: /próximo →/i });
    expect(nextLink).toHaveAttribute('href', `/desafio/${intermediate.id}`);
  });
});
