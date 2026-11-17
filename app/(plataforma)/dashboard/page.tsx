import React from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="dashboard-page-container">
      <div className="dashboard-soon-card">
        <div className="dashboard-soon-icon">📊</div>
        <h1 className="dashboard-soon-title">Dashboard em Breve</h1>
        <p className="dashboard-soon-desc">
          Na Fase 4 da plataforma, esta área exibirá métricas de aprendizado, histórico de submissões, gráficos de ritmo e estatísticas de tentativas.
        </p>
        <Link href="/trilha" className="dashboard-back-link">
          ← Ir para a Trilha de Desafios
        </Link>
      </div>
    </div>
  );
}
