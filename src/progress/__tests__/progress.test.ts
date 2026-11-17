import { computeTrailState, ChallengeSummary } from '../types';
import { LocalProgressRepository } from '../LocalProgressRepository';

describe('computeTrailState', () => {
  const mockChallenges: ChallengeSummary[] = [
    { id: 'ch-1', order: 1 },
    { id: 'ch-2', order: 2 },
    { id: 'ch-3', order: 3 },
  ];

  it('libera apenas o primeiro quando nenhum desafio foi concluído', () => {
    // Preparar / Agir
    const state = computeTrailState(mockChallenges, []);

    // Conferir
    expect(state['ch-1']).toBe('current');
    expect(state['ch-2']).toBe('locked');
    expect(state['ch-3']).toBe('locked');
  });

  it('marca o primeiro como concluído e o segundo como atual quando 1 foi concluído', () => {
    // Preparar / Agir
    const state = computeTrailState(mockChallenges, ['ch-1']);

    // Conferir
    expect(state['ch-1']).toBe('completed');
    expect(state['ch-2']).toBe('current');
    expect(state['ch-3']).toBe('locked');
  });

  it('marca todos como concluídos quando todos foram finalizados', () => {
    // Preparar / Agir
    const state = computeTrailState(mockChallenges, ['ch-1', 'ch-2', 'ch-3']);

    // Conferir
    expect(state['ch-1']).toBe('completed');
    expect(state['ch-2']).toBe('completed');
    expect(state['ch-3']).toBe('completed');
  });

  it('lida com lista de concluídos fora de ordem mantendo a liberação sequencial', () => {
    // Preparar: se 'ch-2' estiver em completed mas não 'ch-1'
    const state = computeTrailState(mockChallenges, ['ch-2']);

    // ch-1 não foi concluído, logo é 'current'. ch-2 foi concluído ('completed'). ch-3 está bloqueado ('locked').
    expect(state['ch-1']).toBe('current');
    expect(state['ch-2']).toBe('completed');
    expect(state['ch-3']).toBe('locked');
  });
});

describe('LocalProgressRepository', () => {
  let repo: LocalProgressRepository;

  beforeEach(() => {
    window.localStorage.clear();
    repo = new LocalProgressRepository();
  });

  it('persiste e recupera desafios concluídos com sucesso', async () => {
    // Preparar / Agir
    expect(await repo.getCompleted()).toEqual([]);
    await repo.markCompleted('kick-duas-batidas');

    // Conferir
    expect(await repo.getCompleted()).toEqual(['kick-duas-batidas']);

    // Não duplica se marcar novamente
    await repo.markCompleted('kick-duas-batidas');
    expect(await repo.getCompleted()).toEqual(['kick-duas-batidas']);
  });

  it('persiste e incrementa tentativas por desafio', async () => {
    // Preparar / Agir
    expect(await repo.getAttempts()).toEqual({});
    await repo.recordAttempt('kick-duas-batidas');
    await repo.recordAttempt('kick-duas-batidas');
    await repo.recordAttempt('laco-kick-snare');

    // Conferir
    const attempts = await repo.getAttempts();
    expect(attempts['kick-duas-batidas']).toBe(2);
    expect(attempts['laco-kick-snare']).toBe(1);
  });

  it('trata valor corrompido em localStorage com segurança retornando array/objeto vazio', async () => {
    // Preparar: insere JSON quebrado ou formato inválido
    window.localStorage.setItem('codestar_completed_challenges', '{invalid json');
    window.localStorage.setItem('codestar_challenge_attempts', 'not a json');

    // Conferir
    expect(await repo.getCompleted()).toEqual([]);
    expect(await repo.getAttempts()).toEqual({});
  });

  it('opera com fallback gracioso em memória quando localStorage lança exceção ou está indisponível', async () => {
    // Preparar: simula localStorage indisponível lançando erro
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: LocalStorage is blocked');
    });
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError: LocalStorage is blocked');
    });

    // Agir: criar e usar o repositório
    const isolatedRepo = new LocalProgressRepository();
    await isolatedRepo.markCompleted('ch-memory');
    await isolatedRepo.recordAttempt('ch-memory');

    // Conferir: opera em memória sem quebrar
    expect(await isolatedRepo.getCompleted()).toEqual(['ch-memory']);
    expect(await isolatedRepo.getAttempts()).toEqual({ 'ch-memory': 1 });

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
