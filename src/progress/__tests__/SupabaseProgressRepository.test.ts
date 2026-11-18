import { SupabaseProgressRepository } from '../SupabaseProgressRepository';
import { SupabaseClient } from '@supabase/supabase-js';

describe('SupabaseProgressRepository', () => {
  const userId = 'user-test-123';
  let mockSupabase: Partial<SupabaseClient>;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    window.localStorage.clear();
    mockFrom = jest.fn();
    mockSupabase = {
      from: mockFrom as unknown as SupabaseClient['from'],
    };
  });

  it('migra silenciosamente o progresso de localStorage para a tabela progress no banco', async () => {
    // Preparar localStorage antigo
    window.localStorage.setItem(
      'codestar_completed_challenges',
      JSON.stringify(['kick-duas-batidas'])
    );
    window.localStorage.setItem(
      'codestar_challenge_attempts',
      JSON.stringify({ 'kick-duas-batidas': 3, 'laco-kick-snare': 1 })
    );

    const upsertMock = jest.fn().mockResolvedValue({ error: null });
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ challenge_id: 'kick-duas-batidas' }],
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      upsert: upsertMock,
      select: selectMock,
    });

    const repo = new SupabaseProgressRepository(mockSupabase as SupabaseClient, userId);

    // Agir
    const completed = await repo.getCompleted();

    // Conferir: realizou upsert no banco e limpou o localStorage
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const upsertPayload = upsertMock.mock.calls[0][0];
    expect(upsertPayload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: userId,
          challenge_id: 'kick-duas-batidas',
          completed: true,
          attempts: 3,
        }),
        expect.objectContaining({
          user_id: userId,
          challenge_id: 'laco-kick-snare',
          completed: false,
          attempts: 1,
        }),
      ])
    );
    expect(completed).toEqual(['kick-duas-batidas']);
    expect(window.localStorage.getItem('codestar_completed_challenges')).toBeNull();
    expect(window.localStorage.getItem('codestar_challenge_attempts')).toBeNull();
  });

  it('markCompleted busca tentativas existentes e atualiza completed=true com timestamp', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({
      data: { attempts: 2 },
      error: null,
    });
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: maybeSingleMock,
        }),
      }),
    });
    const upsertMock = jest.fn().mockResolvedValue({ error: null });

    mockFrom.mockReturnValue({
      select: selectMock,
      upsert: upsertMock,
    });

    const repo = new SupabaseProgressRepository(mockSupabase as SupabaseClient, userId);
    await repo.markCompleted('groove-completo');

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        challenge_id: 'groove-completo',
        completed: true,
        attempts: 3, // 2 + 1
      }),
      { onConflict: 'user_id,challenge_id' }
    );
  });

  it('recordAttempt incrementa attempts mantendo status completed', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({
      data: { attempts: 1, completed: true },
      error: null,
    });
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: maybeSingleMock,
        }),
      }),
    });
    const upsertMock = jest.fn().mockResolvedValue({ error: null });

    mockFrom.mockReturnValue({
      select: selectMock,
      upsert: upsertMock,
    });

    const repo = new SupabaseProgressRepository(mockSupabase as SupabaseClient, userId);
    await repo.recordAttempt('groove-completo');

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        challenge_id: 'groove-completo',
        attempts: 2,
        completed: true,
      }),
      { onConflict: 'user_id,challenge_id' }
    );
  });

  it('trata erros de rede sem quebrar a execução retornando valores padrão seguros', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Falha de conexão com a API do Supabase');
    });

    const repo = new SupabaseProgressRepository(mockSupabase as SupabaseClient, userId);

    expect(await repo.getCompleted()).toEqual([]);
    expect(await repo.getAttempts()).toEqual({});
    await expect(repo.markCompleted('kick-duas-batidas')).resolves.not.toThrow();
    await expect(repo.recordAttempt('kick-duas-batidas')).resolves.not.toThrow();
  });
});
