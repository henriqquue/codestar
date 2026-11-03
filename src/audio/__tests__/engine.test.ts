import {
  AudioEngine,
  BPM,
  STEP_SECONDS,
  synthesizeKick,
  synthesizeSnare,
  synthesizeHihat,
} from '../engine';
import {
  installMockAudioContext,
  allCreatedContexts,
  lastCreatedContext,
  MockAudioContext,
  MockOscillatorNode,
  MockAudioBufferSourceNode,
  MockBiquadFilterNode,
} from './mockAudio';
import { RhythmEvent } from '../../dsl/types';

describe('Motor de Áudio - AudioEngine e Síntese Web Audio', () => {
  beforeEach(() => {
    installMockAudioContext();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('valida as constantes rítmicas fundamentais do andamento musical', () => {
    // Preparar & Agir & Conferir
    expect(BPM).toBe(100);
    expect(STEP_SECONDS).toBe(60 / BPM);
    expect(STEP_SECONDS).toBe(0.6);
  });

  it('não cria o AudioContext no construtor mas sim de forma preguiçosa ao chamar play()', async () => {
    // Preparar: instancia o motor
    const engine = new AudioEngine();

    // Conferir: contexto ainda não foi instanciado
    expect(allCreatedContexts).toHaveLength(0);

    // Agir: inicia reprodução
    const events: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
    ];
    await engine.play(events);

    // Conferir: agora o AudioContext foi instanciado preguiçosamente
    expect(allCreatedContexts).toHaveLength(1);
    expect(lastCreatedContext).not.toBeNull();
  });

  it('retoma o AudioContext invocando resume() caso ele esteja com estado suspended', async () => {
    // Preparar
    const engine = new AudioEngine();
    const events: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
    ];

    // Agir
    await engine.play(events);

    // Conferir
    expect(lastCreatedContext?.resume).toHaveBeenCalledTimes(1);
    expect(lastCreatedContext?.state).toBe('running');
  });

  it('agenda nós de áudio apenas para eventos play ignorando eventos silenciosos de wait', async () => {
    // Preparar
    const engine = new AudioEngine();
    const events: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
      { stepIndex: 1, type: 'wait', line: 2 },
      { stepIndex: 2, type: 'play', instrument: 'kick', line: 3 },
    ];

    // Agir
    await engine.play(events);

    // Conferir: cada kick gera 1 oscilador e 1 ganho (+ 1 ganho master)
    const oscillators = lastCreatedContext?.createdNodes.filter(
      (n) => n instanceof MockOscillatorNode
    );
    expect(oscillators).toHaveLength(2);
  });

  it('calcula o instante de início com precisão cirúrgica de startTime + stepIndex * STEP_SECONDS incluindo atraso de 0.1s', async () => {
    // Preparar
    const engine = new AudioEngine();
    const events: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
      { stepIndex: 2, type: 'play', instrument: 'kick', line: 3 },
    ];

    // Agir
    await engine.play(events);

    // Conferir: com currentTime inicial = 0, startTime = 0.1s
    // Step 0: 0.1 + 0 * 0.6 = 0.1s
    // Step 2: 0.1 + 2 * 0.6 = 1.3s
    const oscillators = (lastCreatedContext?.createdNodes.filter(
      (n) => n instanceof MockOscillatorNode
    ) || []) as MockOscillatorNode[];

    expect(oscillators).toHaveLength(2);
    expect(oscillators[0].startCalls[0]).toBeCloseTo(0.1, 4);
    expect(oscillators[1].startCalls[0]).toBeCloseTo(1.3, 4);
  });

  it('sintetiza cada instrumento com os nós de áudio especificados na arquitetura', () => {
    // Preparar
    const ctx = new MockAudioContext();
    const destination = ctx.destination as unknown as AudioNode;

    // 1. Kick: oscilador senoidal com queda de frequência
    const kickNodes = synthesizeKick(ctx as unknown as AudioContext, 0.1, destination);
    expect(kickNodes).toHaveLength(1);
    const kickOsc = kickNodes[0] as unknown as MockOscillatorNode;
    expect(kickOsc.type).toBe('sine');
    expect(kickOsc.frequency.calls[0]).toEqual({
      method: 'setValueAtTime',
      value: 150,
      time: 0.1,
    });

    // 2. Snare: fonte de ruído buffer source + oscilador tonal triangular
    const snareNodes = synthesizeSnare(ctx as unknown as AudioContext, 0.2, destination);
    expect(snareNodes).toHaveLength(2);
    expect(snareNodes[0]).toBeInstanceOf(MockAudioBufferSourceNode);
    expect(snareNodes[1]).toBeInstanceOf(MockOscillatorNode);
    const snareOsc = snareNodes[1] as unknown as MockOscillatorNode;
    expect(snareOsc.type).toBe('triangle');

    // 3. Hihat: ruído com filtro passa-alta em 7000 Hz
    const hihatNodes = synthesizeHihat(ctx as unknown as AudioContext, 0.3, destination);
    expect(hihatNodes).toHaveLength(1);
    expect(hihatNodes[0]).toBeInstanceOf(MockAudioBufferSourceNode);

    const highpassFilters = ctx.createdNodes.filter(
      (n): n is MockBiquadFilterNode => n instanceof MockBiquadFilterNode && n.type === 'highpass'
    );
    expect(highpassFilters).toHaveLength(2);
    // Filtro do snare (1000 Hz)
    expect(highpassFilters[0].frequency.calls[0]).toEqual({
      method: 'setValueAtTime',
      value: 1000,
      time: 0.2,
    });
    // Filtro do hihat (7000 Hz)
    expect(highpassFilters[1].frequency.calls[0]).toEqual({
      method: 'setValueAtTime',
      value: 7000,
      time: 0.3,
    });
  });

  it('dispara onStep estritamente na ordem sequencial 0, 1, 2 conforme os temporizadores avançam', async () => {
    // Preparar
    const engine = new AudioEngine();
    const onStep = jest.fn();
    const events: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
      { stepIndex: 1, type: 'wait', line: 2 },
      { stepIndex: 2, type: 'play', instrument: 'kick', line: 3 },
    ];

    // Agir
    await engine.play(events, { onStep });

    // Início: delay inicial de 100 ms
    jest.advanceTimersByTime(100);
    expect(onStep).toHaveBeenCalledTimes(1);
    expect(onStep).toHaveBeenLastCalledWith(0);

    // Passo 1 (+600 ms)
    jest.advanceTimersByTime(600);
    expect(onStep).toHaveBeenCalledTimes(2);
    expect(onStep).toHaveBeenLastCalledWith(1);

    // Passo 2 (+600 ms)
    jest.advanceTimersByTime(600);
    expect(onStep).toHaveBeenCalledTimes(3);
    expect(onStep).toHaveBeenLastCalledWith(2);
  });

  it('dispara onEnd exatamente uma única vez ao término da duração do último passo', async () => {
    // Preparar
    const engine = new AudioEngine();
    const onEnd = jest.fn();
    const events: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
    ];

    // Agir
    await engine.play(events, { onEnd });

    // Duração total: delay inicial 100 ms + (0 + 1) * 600 ms = 700 ms
    jest.advanceTimersByTime(699);
    expect(onEnd).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('interrompe a reprodução com stop() cancelando timers, desconectando fontes e sem disparar onEnd', async () => {
    // Preparar
    const engine = new AudioEngine();
    const onEnd = jest.fn();
    const events: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
      { stepIndex: 1, type: 'wait', line: 2 },
    ];
    await engine.play(events, { onEnd });
    expect(engine.isPlaying()).toBe(true);

    // Agir: para a reprodução antes do fim
    engine.stop();

    // Conferir
    expect(engine.isPlaying()).toBe(false);

    // Avança todos os temporizadores que estavam pendentes
    jest.runAllTimers();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('reinicia a reprodução ao chamar play() no meio de uma execução sem disparar onEnd da anterior', async () => {
    // Preparar
    const engine = new AudioEngine();
    const onEnd1 = jest.fn();
    const onEnd2 = jest.fn();
    const events: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
    ];

    // Agir 1: inicia primeira execução
    await engine.play(events, { onEnd: onEnd1 });

    // Agir 2: reinicia no meio do caminho com novos handlers
    await engine.play(events, { onEnd: onEnd2 });

    // Avança o tempo até o fim da segunda execução
    jest.runAllTimers();

    // Conferir
    expect(onEnd1).not.toHaveBeenCalled();
    expect(onEnd2).toHaveBeenCalledTimes(1);
  });

  it('chama onEnd imediatamente e não cria nós ao invocar play() com lista vazia', async () => {
    // Preparar
    const engine = new AudioEngine();
    const onEnd = jest.fn();

    // Agir
    await engine.play([], { onEnd });

    // Conferir
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(engine.isPlaying()).toBe(false);
    expect(lastCreatedContext?.createdNodes ?? []).toHaveLength(0);
  });

  it('encerra o AudioContext liberando recursos do hardware ao invocar dispose()', async () => {
    // Preparar
    const engine = new AudioEngine();
    const events: RhythmEvent[] = [
      { stepIndex: 0, type: 'play', instrument: 'kick', line: 1 },
    ];
    await engine.play(events);
    expect(lastCreatedContext?.state).toBe('running');

    // Agir
    engine.dispose();

    // Conferir
    expect(lastCreatedContext?.close).toHaveBeenCalledTimes(1);
    expect(lastCreatedContext?.state).toBe('closed');
  });
});
