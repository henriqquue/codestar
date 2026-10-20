/**
 * MOTOR DE ÁUDIO - Web Audio API Nativa
 *
 * POR QUE USAR O RELÓGIO DE ÁUDIO (ctx.currentTime) EM VEZ DE setTimeout?
 *
 * 1. Thread Dedicada de Áudio vs. Thread Principal (Event Loop):
 *    O JavaScript no navegador executa em uma única thread principal, que lida com
 *    renderização do DOM, estilos, manipulação de eventos e garbage collection. Qualquer
 *    operação mais pesada pode atrasar um `setTimeout` em 10ms a 100ms (fenômeno conhecido
 *    como jitter temporal).
 *
 * 2. Percepção Auditiva Humana:
 *    O ouvido humano é extremamente sensível a flutuações de tempo: um atraso de apenas
 *    5 a 10 milissegundos é percebido imediatamente como uma falha rítmica ou "engasgo".
 *
 * 3. Precisão por Hardware:
 *    A Web Audio API roda em um processo/thread de áudio prioritário em nível de hardware.
 *    Ao calcular os tempos exatos com `startTime + stepIndex * STEP_SECONDS` e registrá-los
 *    no relógio de hardware (`ctx.currentTime`), todos os osciladores e envelopes são disparados
 *    com precisão cirúrgica de microssegundos, independentemente de travamentos na interface.
 *    O `setTimeout` é utilizado exclusivamente para feedback visual na interface (onStep).
 */

import { RhythmEvent } from '../dsl/types';

// 1. Constantes exportadas de andamento
export const BPM = 100;
export const STEP_SECONDS = 60 / BPM; // 0.6 segundos por tempo

export interface AudioEngineHandlers {
  onStep?: (stepIndex: number) => void;
  onEnd?: () => void;
}

/**
 * Síntese do Bumbo (Kick):
 * Oscilador senoidal com queda rápida de frequência de ~150 Hz para ~40 Hz em ~0,12 s
 * e envelope de ganho exponencial descendente.
 */
export function synthesizeKick(
  ctx: AudioContext,
  time: number,
  destination: AudioNode
): AudioScheduledSourceNode[] {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  // Queda rápida exponencial para simular o ataque do pedal e ressonância da pele
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

  // Envelope de ganho exponencial
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + 0.12);

  return [osc];
}

/**
 * Síntese da Caixa (Snare):
 * Combinação de ruído branco filtrado com passa-alta (~1000 Hz) para a esteira
 * + oscilador triangular curto (~180 Hz) para o corpo e ressonância do tambor.
 */
export function synthesizeSnare(
  ctx: AudioContext,
  time: number,
  destination: AudioNode
): AudioScheduledSourceNode[] {
  const duration = 0.15;

  // 1. Ruído branco para a esteira
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(1000, time);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(destination);

  noise.start(time);
  noise.stop(time + duration);

  // 2. Componente tonal (corpo do tambor): oscilador triangular
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(60, time + 0.08);

  oscGain.gain.setValueAtTime(0.6, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  osc.connect(oscGain);
  oscGain.connect(destination);

  osc.start(time);
  osc.stop(time + 0.08);

  return [noise, osc];
}

/**
 * Síntese do Chimbal (Hi-hat):
 * Ruído branco com filtro passa-alta acentuado (~7000 Hz) e envelope percussivo ultracurto (~0,05 s).
 */
export function synthesizeHihat(
  ctx: AudioContext,
  time: number,
  destination: AudioNode
): AudioScheduledSourceNode[] {
  const duration = 0.05;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(7000, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + duration);

  return [noise];
}

/**
 * Motor de Áudio central baseado em Web Audio API nativa.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private playing: boolean = false;
  private activeSourceNodes: AudioScheduledSourceNode[] = [];
  private masterGain: GainNode | null = null;
  private visualTimers: ReturnType<typeof setTimeout>[] = [];

  /**
   * Obtém ou inicializa de forma preguiçosa o AudioContext.
   * Em conformidade com a política de autoplay dos navegadores, a instância
   * deve ser ativada preferencialmente após uma ação explícita do usuário (ex: clique).
   */
  private getOrCreateContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    return this.ctx;
  }

  /**
   * Reproduz uma sequência de RhythmEvent[] agendando os sons diretamente no relógio de áudio.
   */
  public async play(
    events: RhythmEvent[],
    handlers?: AudioEngineHandlers
  ): Promise<void> {
    // Requisito 8: Tratar play() chamado durante reprodução (parar e reiniciar)
    if (this.isPlaying()) {
      this.stop();
    }

    // Requisito 3: AudioContext preguiçoso com retomada se estiver suspenso
    const ctx = this.getOrCreateContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (events.length === 0) {
      this.playing = false;
      handlers?.onEnd?.();
      return;
    }

    this.playing = true;

    // Ganho mestre para isolar a reprodução e permitir corte imediato no stop()
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(1, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    // Requisito 5: Pequeno atraso inicial de 0.1s para permitir que o hardware
    // processe o buffer de áudio sem estalos
    const INITIAL_DELAY = 0.1;
    const startTime = ctx.currentTime + INITIAL_DELAY;

    // Agendamento no relógio de áudio para cada evento
    for (const event of events) {
      const eventTime = startTime + event.stepIndex * STEP_SECONDS;

      if (event.type === 'play' && event.instrument) {
        let nodes: AudioScheduledSourceNode[] = [];
        switch (event.instrument) {
          case 'kick':
            nodes = synthesizeKick(ctx, eventTime, this.masterGain);
            break;
          case 'snare':
            nodes = synthesizeSnare(ctx, eventTime, this.masterGain);
            break;
          case 'hihat':
            nodes = synthesizeHihat(ctx, eventTime, this.masterGain);
            break;
        }
        this.activeSourceNodes.push(...nodes);
      }
      // Eventos do tipo 'wait' são silenciosos: não geram nós de áudio, mas ocupam o tempo do passo.
    }

    // Requisito 6: Agendamento sincronizado dos callbacks visuais (onStep)
    const uniqueSteps = Array.from(new Set(events.map((e) => e.stepIndex))).sort(
      (a, b) => a - b
    );

    for (const stepIndex of uniqueSteps) {
      const stepTime = startTime + stepIndex * STEP_SECONDS;
      const delayMs = Math.max(0, (stepTime - ctx.currentTime) * 1000);

      const timer = setTimeout(() => {
        if (this.playing) {
          handlers?.onStep?.(stepIndex);
        }
      }, delayMs);

      this.visualTimers.push(timer);
    }

    // Requisito 6: onEnd dispara exatamente ao final do último passo da sequência
    const maxStep = Math.max(...events.map((e) => e.stepIndex));
    const endTime = startTime + (maxStep + 1) * STEP_SECONDS;
    const endDelayMs = Math.max(0, (endTime - ctx.currentTime) * 1000);

    const endTimer = setTimeout(() => {
      if (this.playing) {
        this.playing = false;
        this.activeSourceNodes = [];
        handlers?.onEnd?.();
      }
    }, endDelayMs);

    this.visualTimers.push(endTimer);
  }

  /**
   * Requisito 7: Cancela todos os sons agendados e timers visuais, sem disparar onEnd.
   */
  public stop(): void {
    this.playing = false;

    // Cancela todos os timers visuais pendentes (onStep e onEnd)
    for (const timer of this.visualTimers) {
      clearTimeout(timer);
    }
    this.visualTimers = [];

    // Corta o ganho mestre imediatamente para silenciar qualquer cauda restante
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.disconnect();
      } catch {
        // Ignora erro se já desconectado
      }
      this.masterGain = null;
    }

    // Interrompe e desconecta todas as fontes sonoras agendadas
    for (const node of this.activeSourceNodes) {
      try {
        node.stop();
      } catch {
        // Pode já ter finalizado
      }
      try {
        node.disconnect();
      } catch {
        // Ignora se já desconectado
      }
    }
    this.activeSourceNodes = [];
  }

  /**
   * Indica se a reprodução está ativa no momento.
   */
  public isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Libera recursos e encerra o AudioContext.
   */
  public dispose(): void {
    this.stop();
    if (this.ctx) {
      if (this.ctx.state !== 'closed') {
        this.ctx.close().catch(() => {});
      }
      this.ctx = null;
    }
  }
}
