'use client';

import React from 'react';
import { Sidebar } from '@/src/components/Sidebar';
import { AuthProvider } from '@/src/lib/auth/AuthContext';
import { ProgressProvider } from '@/src/progress/ProgressContext';
import '@/src/App.css';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProgressProvider>
        <div className="platform-layout-container">
          {/* Menu Lateral Global */}
          <Sidebar />

          {/* Conteúdo Principal da Plataforma */}
          <div className="platform-content-area">{children}</div>
        </div>
      </ProgressProvider>
    </AuthProvider>
  );
}
