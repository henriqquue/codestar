'use client';

import React from 'react';
import { Challenge, MVP_CHALLENGE } from './challenge/challenge';
import { ChallengeWorkspace } from './components/ChallengeWorkspace';
import { UiState } from './state/appReducer';
import './App.css';

export type { UiState };

export interface AppProps {
  challenge?: Challenge;
}

export const App: React.FC<AppProps> = ({ challenge = MVP_CHALLENGE }) => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo">
            <span className="app-logo-badge">♪</span>
            <span className="app-logo-text">CODESTAR</span>
          </div>
          <span className="app-tagline">Aprenda lógica de programação com música</span>
        </div>
      </header>

      <ChallengeWorkspace challenge={challenge} />
    </div>
  );
};

export default App;
