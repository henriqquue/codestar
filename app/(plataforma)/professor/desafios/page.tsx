import React from 'react';
import Link from 'next/link';

export default function ProfessorDesafiosPage() {
  return (
    <div className="dashboard-page-container">
      <div className="dashboard-soon-card">
        <div className="dashboard-soon-icon">🎼</div>
        <h1 className="dashboard-soon-title">Gerenciar Desafios (Professor)</h1>
        <p className="dashboard-soon-desc">
          Na Fase 5 da plataforma, você poderá criar desafios rítmicos customizados com a DSL do CodeStar, definir objetivos e vincular às suas turmas.
        </p>
        <Link href="/dashboard" className="dashboard-back-link">
          ← Voltar para o Dashboard
        </Link>
      </div>
    </div>
  );
}
