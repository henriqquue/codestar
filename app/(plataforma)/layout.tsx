'use client';

import React from 'react';
import { Sidebar } from '@/src/components/Sidebar';
import { ProgressProvider } from '@/src/progress/ProgressContext';
import '@/src/App.css';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgressProvider>
      <div className="platform-layout-container">
        {/* Menu Lateral Global */}
        <Sidebar />

        {/* Conteúdo Principal da Plataforma */}
        <div className="platform-content-area">
          {children}
        </div>
      </div>
    </ProgressProvider>
  );
}
