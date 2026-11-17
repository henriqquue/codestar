import React from 'react';
import { render, screen } from '@testing-library/react';
import { Trail, TrailNode } from '../Trail';

describe('Componente Trail', () => {
  const mockNodes: TrailNode[] = [
    {
      id: 'ch-1',
      order: 1,
      title: 'Duas batidas de bumbo',
      level: 'basic',
      xp: 10,
      state: 'completed',
    },
    {
      id: 'ch-2',
      order: 2,
      title: 'Batida em laço',
      level: 'intermediate',
      xp: 20,
      state: 'current',
    },
    {
      id: 'ch-3',
      order: 3,
      title: 'Groove completo',
      level: 'advanced',
      xp: 30,
      state: 'locked',
    },
  ];

  it('renderiza os 3 estados corretamente (completed, current e locked)', () => {
    // Preparar / Agir
    render(<Trail nodes={mockNodes} />);

    // Conferir títulos
    expect(screen.getByText('Duas batidas de bumbo')).toBeInTheDocument();
    expect(screen.getByText('Batida em laço')).toBeInTheDocument();
    expect(screen.getByText('Groove completo')).toBeInTheDocument();

    // Conferir indicação de estados
    expect(screen.getByText(/concluído • clique para revisitar/i)).toBeInTheDocument();
    expect(screen.getByText(/desafio atual disponível/i)).toBeInTheDocument();
    expect(screen.getByText(/conclua o desafio anterior para liberar/i)).toBeInTheDocument();
  });

  it('permite navegação para nós liberados (completed e current) mas bloqueia nó com estado locked', () => {
    // Preparar / Agir
    render(<Trail nodes={mockNodes} />);

    // Nós concluídos e atuais são links normais com href para /desafio/[id]
    const completedLink = screen.getByRole('link', { name: /duas batidas de bumbo/i });
    expect(completedLink).toHaveAttribute('href', '/desafio/ch-1');

    const currentLink = screen.getByRole('link', { name: /batida em laço/i });
    expect(currentLink).toHaveAttribute('href', '/desafio/ch-2');

    // Nó bloqueado possui aria-disabled="true" e não possui href navegável ativo
    const lockedElement = screen.getByRole('link', { name: /conclua o desafio anterior/i });
    expect(lockedElement).toHaveAttribute('aria-disabled', 'true');
    expect(lockedElement).not.toHaveAttribute('href');
  });
});
