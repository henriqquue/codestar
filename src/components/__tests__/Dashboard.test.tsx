import React from 'react';
import { render, screen, act } from '@testing-library/react';
import DashboardPage from '@/app/(plataforma)/dashboard/page';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockSupabase = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((resolve) => resolve({ data: [], error: null })),
  }),
  rpc: jest.fn().mockResolvedValue({ data: { success: true }, error: null }),
};

jest.mock('../../lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Variáveis de controle para os mocks de Auth e Progress
let mockAuthData = {
  user: null as any,
  profile: null as any,
  loading: true,
  signOut: jest.fn(),
};

let mockProgressData = {
  completed: [] as string[],
  attempts: {} as Record<string, number>,
  loading: false,
  networkWarning: false,
  markCompleted: jest.fn(),
  recordAttempt: jest.fn(),
};

jest.mock('../../lib/auth/AuthContext', () => ({
  useAuth: () => mockAuthData,
}));

jest.mock('../../progress/ProgressContext', () => ({
  useProgress: () => mockProgressData,
}));

describe('DashboardPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe estado de carregamento quando auth ou progress estiverem carregando', async () => {
    mockAuthData = {
      user: null,
      profile: null,
      loading: true,
      signOut: jest.fn(),
    };
    mockProgressData = {
      completed: [],
      attempts: {},
      loading: false,
      networkWarning: false,
      markCompleted: jest.fn(),
      recordAttempt: jest.fn(),
    };

    await act(async () => {
      render(<DashboardPage />);
    });
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  describe('Dashboard do Aluno', () => {
    const studentProfile = {
      id: 'student-1',
      name: 'João Ritmista',
      avatar_url: null,
      role: 'student' as const,
    };

    it('renderiza corretamente com 0 desafios concluídos', async () => {
      mockAuthData = {
        user: { id: 'student-1' } as any,
        profile: studentProfile,
        loading: false,
        signOut: jest.fn(),
      };
      mockProgressData = {
        completed: [],
        attempts: { 'kick-duas-batidas': 2 },
        loading: false,
        networkWarning: false,
        markCompleted: jest.fn(),
        recordAttempt: jest.fn(),
      };

      await act(async () => {
        render(<DashboardPage />);
      });

      expect(screen.getByTestId('student-dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Olá, João Ritmista!/)).toBeInTheDocument();
      // Cartão progresso: 0 de 3
      expect(screen.getByText('0 de 3 desafios concluídos')).toBeInTheDocument();
      // XP: 0 XP
      expect(screen.getByTestId('card-xp')).toHaveTextContent('0');
      expect(screen.getByTestId('card-xp')).toHaveTextContent('Iniciante');
      // Atividade: 2 execuções
      expect(screen.getByTestId('card-activity')).toHaveTextContent('2');
      // Botão continuar deve apontar para o primeiro desafio
      expect(screen.getByTestId('btn-continue')).toHaveAttribute('href', '/desafio/kick-duas-batidas');
      // Ranking com disclaimer visível
      expect(screen.getByText(/Ranking ilustrativo \(dados fictícios\)/)).toBeInTheDocument();
      // Modo criar música bloqueado
      expect(screen.getByTestId('create-music-locked')).toBeInTheDocument();
    });

    it('renderiza corretamente com 1 desafio concluído', async () => {
      mockAuthData = {
        user: { id: 'student-1' } as any,
        profile: studentProfile,
        loading: false,
        signOut: jest.fn(),
      };
      mockProgressData = {
        completed: ['kick-duas-batidas'], // 10 XP
        attempts: { 'kick-duas-batidas': 3, 'laco-kick-snare': 1 },
        loading: false,
        networkWarning: false,
        markCompleted: jest.fn(),
        recordAttempt: jest.fn(),
      };

      await act(async () => {
        render(<DashboardPage />);
      });

      expect(screen.getByText('1 de 3 desafios concluídos')).toBeInTheDocument();
      expect(screen.getByTestId('card-xp')).toHaveTextContent('10');
      expect(screen.getByTestId('card-xp')).toHaveTextContent('Aprendiz');
      expect(screen.getByTestId('card-activity')).toHaveTextContent('4'); // 3 + 1
      // Desafio concluído visível
      expect(screen.getByTestId('completed-challenge-kick-duas-batidas')).toBeInTheDocument();
      // Próximo a fazer
      expect(screen.getByTestId('pending-challenge-laco-kick-snare')).toBeInTheDocument();
      // Botão continuar para o 2º
      expect(screen.getByTestId('btn-continue')).toHaveAttribute('href', '/desafio/laco-kick-snare');
      // Ainda bloqueado (requer 2)
      expect(screen.getByTestId('create-music-locked')).toBeInTheDocument();
    });

    it('renderiza corretamente com todos os desafios concluídos', async () => {
      mockAuthData = {
        user: { id: 'student-1' } as any,
        profile: studentProfile,
        loading: false,
        signOut: jest.fn(),
      };
      mockProgressData = {
        completed: ['kick-duas-batidas', 'laco-kick-snare', 'groove-completo'], // 60 XP
        attempts: { 'kick-duas-batidas': 2, 'laco-kick-snare': 3, 'groove-completo': 5 },
        loading: false,
        networkWarning: false,
        markCompleted: jest.fn(),
        recordAttempt: jest.fn(),
      };

      await act(async () => {
        render(<DashboardPage />);
      });

      expect(screen.getByText('3 de 3 desafios concluídos')).toBeInTheDocument();
      expect(screen.getByTestId('card-xp')).toHaveTextContent('60');
      expect(screen.getByTestId('card-xp')).toHaveTextContent('Mestre');
      // Banner de parabéns
      expect(screen.getByTestId('all-completed-banner')).toBeInTheDocument();
      // Criar música desbloqueada
      expect(screen.getByTestId('create-music-unlocked')).toBeInTheDocument();
    });
  });

  describe('Dashboard do Professor', () => {
    const teacherProfile = {
      id: 'teacher-1',
      name: 'Maria Professora',
      avatar_url: null,
      role: 'teacher' as const,
    };

    it('renderiza visual enxuto para professor sem ranking', async () => {
      mockAuthData = {
        user: { id: 'teacher-1' } as any,
        profile: teacherProfile,
        loading: false,
        signOut: jest.fn(),
      };
      mockProgressData = {
        completed: [],
        attempts: {},
        loading: false,
        networkWarning: false,
        markCompleted: jest.fn(),
        recordAttempt: jest.fn(),
      };

      await act(async () => {
        render(<DashboardPage />);
      });

      expect(screen.getByTestId('teacher-dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Olá, Professor Maria Professora!/)).toBeInTheDocument();
      expect(screen.getByTestId('teacher-card-challenges')).toBeInTheDocument();
      expect(screen.getByTestId('teacher-card-classes')).toBeInTheDocument();
      expect(screen.getByTestId('link-manage-challenges')).toHaveAttribute('href', '/professor/desafios');
      // Sem ranking
      expect(screen.queryByTestId('card-ranking')).not.toBeInTheDocument();
    });
  });
});
