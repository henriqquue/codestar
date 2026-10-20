import React from 'react';
import { RhythmEvent } from '../dsl/types';

interface RhythmVisualizerProps {
  events: RhythmEvent[];
  activeStep: number | null;
  totalSteps: number;
}

/**
 * Visualizador rítmico horizontal com exibição dos passos no tempo,
 * distinção por instrumento e destaque dinâmico durante a reprodução.
 */
export const RhythmVisualizer: React.FC<RhythmVisualizerProps> = ({
  events,
  activeStep,
  totalSteps,
}) => {
  const hasEvents = events.length > 0;

  // Organiza eventos por stepIndex para renderizar cada passo
  // Se houver múltiplos eventos no mesmo passo, agrupa
  const stepsMap = new Map<number, RhythmEvent[]>();
  events.forEach((ev) => {
    const list = stepsMap.get(ev.stepIndex) || [];
    list.push(ev);
    stepsMap.set(ev.stepIndex, list);
  });

  // Determina a quantidade de passos a exibir (ao menos 4 para grade mínima)
  const stepsCount = hasEvents ? Math.max(totalSteps, Math.max(...events.map((e) => e.stepIndex)) + 1) : 4;
  const stepIndices = Array.from({ length: stepsCount }, (_, i) => i);

  return (
    <section className="visualizer-card" aria-label="Visualização do Ritmo">
      <div className="visualizer-header">
        <div className="visualizer-title-group">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <h2 className="visualizer-title">Visualização do Ritmo</h2>
        </div>
        {hasEvents && (
          <span className="visualizer-step-count">
            {totalSteps} {totalSteps === 1 ? 'passo' : 'passos'}
          </span>
        )}
      </div>

      <div className="visualizer-body">
        {!hasEvents ? (
          <div className="visualizer-empty">
            <div className="visualizer-empty-track" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="visualizer-step-empty">
                  <div className="step-circle empty" />
                  <span className="step-index-label">{i}</span>
                </div>
              ))}
            </div>
            <p className="visualizer-empty-message">
              Escreva seu código para ver o ritmo aqui
            </p>
          </div>
        ) : (
          <div className="visualizer-track" role="region" aria-label="Passos do ritmo">
            {stepIndices.map((stepIndex) => {
              const stepEvents = stepsMap.get(stepIndex) || [];
              const isActive = activeStep === stepIndex;

              // Identifica tipo do passo: play (kick, snare, hihat) ou wait (pausa/silêncio)
              const playEvent = stepEvents.find((e) => e.type === 'play');
              const isWait = !playEvent && stepEvents.some((e) => e.type === 'wait');
              const instrument = playEvent?.instrument;

              let typeClass = 'step-empty';
              let instrumentLabel = '—';

              if (playEvent && instrument) {
                typeClass = `step-${instrument}`;
                instrumentLabel = instrument.toUpperCase();
              } else if (isWait) {
                typeClass = 'step-wait';
                instrumentLabel = 'PAUSA';
              }

              return (
                <div
                  key={stepIndex}
                  className={`visualizer-step-item ${typeClass} ${isActive ? 'is-active' : ''}`}
                >
                  <div
                    className={`step-circle ${typeClass} ${isActive ? 'active-pulse' : ''}`}
                    aria-label={`Passo ${stepIndex}: ${instrumentLabel}`}
                  >
                    <span className="step-instrument-label">{instrumentLabel}</span>
                  </div>
                  <span className="step-index-label">{stepIndex}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
