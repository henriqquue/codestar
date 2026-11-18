'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/lib/auth/AuthContext';
import { useProgress } from '@/src/progress/ProgressContext';
import { OFFICIAL_CHALLENGES } from '@/src/challenge/catalog';
import { computeTrailState } from '@/src/progress/types';
import { computeXp, levelFromXp, buildRanking, RankingRow } from '@/src/lib/dashboard/stats';
import { createClient } from '@/src/lib/supabase/client';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { completed, attempts, loading: progressLoading } = useProgress();
  const supabase = useMemo(() => createClient(), []);

  // Estados do aluno
  const [classCode, setClassCode] = useState('');
  const [classStatus, setClassStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });
  const [userClasses, setUserClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [completionDates, setCompletionDates] = useState<Record<string, string>>({});

  // Estados do professor
  const [teacherStats, setTeacherStats] = useState<{ challengesCount: number; classesCount: number; loading: boolean }>({
    challengesCount: 0,
    classesCount: 0,
    loading: true,
  });

  const isTeacher = profile?.role === 'teacher';
  const isLoading = authLoading || progressLoading;

  // Busca turmas do aluno e datas de conclusão no Supabase
  useEffect(() => {
    let mounted = true;
    if (!user?.id || isTeacher) {
      setClassesLoading(false);
      return;
    }

    async function loadStudentData() {
      try {
        // 1. Busca turmas
        const { data: memberData } = await supabase
          .from('class_members')
          .select('class_id, classes(id, name)')
          .eq('user_id', user!.id);

        if (mounted && memberData) {
          const parsedClasses: Array<{ id: string; name: string }> = [];
          for (const item of memberData) {
            if (item.classes) {
              const c = item.classes as unknown as { id: string; name: string };
              parsedClasses.push({ id: c.id, name: c.name });
            }
          }
          setUserClasses(parsedClasses);
        }

        // 2. Busca datas de conclusão
        const { data: progressRows } = await supabase
          .from('progress')
          .select('challenge_id, completed_at')
          .eq('user_id', user!.id)
          .eq('completed', true);

        if (mounted && progressRows) {
          const datesMap: Record<string, string> = {};
          for (const row of progressRows) {
            if (row.completed_at) {
              datesMap[row.challenge_id] = new Date(row.completed_at).toLocaleDateString('pt-BR');
            }
          }
          setCompletionDates(datesMap);
        }
      } catch {
        // Ignora silenciosamente erros em mock/offline
      } finally {
        if (mounted) setClassesLoading(false);
      }
    }

    loadStudentData();
    return () => {
      mounted = false;
    };
  }, [user?.id, isTeacher, supabase]);

  // Busca métricas do professor (Fase 5 não existe ainda, trata tabelas vazias com segurança)
  useEffect(() => {
    let mounted = true;
    if (!user?.id || !isTeacher) return;

    async function loadTeacherStats() {
      try {
        let chCount = 0;
        let clCount = 0;

        // Custom challenges
        try {
          const { count, error } = await supabase
            .from('custom_challenges')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', user!.id);
          if (!error && count !== null) chCount = count;
        } catch {
          chCount = 0;
        }

        // Classes criadas
        try {
          const { count, error } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', user!.id);
          if (!error && count !== null) clCount = count;
        } catch {
          clCount = 0;
        }

        if (mounted) {
          setTeacherStats({ challengesCount: chCount, classesCount: clCount, loading: false });
        }
      } catch {
        if (mounted) {
          setTeacherStats({ challengesCount: 0, classesCount: 0, loading: false });
        }
      }
    }

    loadTeacherStats();
    return () => {
      mounted = false;
    };
  }, [user?.id, isTeacher, supabase]);

  // Ação de entrar em turma
  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    setClassStatus({ type: 'loading' });

    try {
      const { data, error } = await supabase.rpc('join_class', {
        p_code: classCode.trim(),
      });

      if (error) {
        setClassStatus({
          type: 'error',
          message: error.message || 'Código de turma inválido ou erro de conexão.',
        });
        return;
      }

      // O supabase rpc pode retornar json { success: boolean, message: string }
      if (data && typeof data === 'object' && 'success' in data) {
        const res = data as { success: boolean; message?: string };
        if (!res.success) {
          setClassStatus({
            type: 'error',
            message: res.message || 'Código de turma inválido.',
          });
          return;
        }
      }

      setClassStatus({
        type: 'success',
        message: 'Você entrou na turma com sucesso!',
      });
      setClassCode('');

      // Recarrega lista de turmas
      const { data: memberData } = await supabase
        .from('class_members')
        .select('class_id, classes(id, name)')
        .eq('user_id', user!.id);

      if (memberData) {
        const parsed: Array<{ id: string; name: string }> = [];
        for (const item of memberData) {
          if (item.classes) {
            const c = item.classes as unknown as { id: string; name: string };
            parsed.push({ id: c.id, name: c.name });
          }
        }
        setUserClasses(parsed);
      }
    } catch {
      setClassStatus({
        type: 'error',
        message: 'Código de turma inválido ou erro no servidor.',
      });
    }
  };

  // Carregamento Skeleton
  if (isLoading) {
    return (
      <div className="dashboard-container" data-testid="dashboard-loading">
        <div className="dashboard-skeleton-header">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-text-group">
            <div className="skeleton-line line-title"></div>
            <div className="skeleton-line line-subtitle"></div>
          </div>
        </div>
        <div className="dashboard-cards-grid">
          <div className="dashboard-skeleton-card"></div>
          <div className="dashboard-skeleton-card"></div>
          <div className="dashboard-skeleton-card"></div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD DO PROFESSOR ---
  if (isTeacher) {
    const teacherName = profile?.name || 'Professor';

    return (
      <div className="dashboard-container teacher-dashboard" data-testid="teacher-dashboard">
        {/* Cabeçalho */}
        <header className="dashboard-header">
          <div className="dashboard-user-greeting">
            <div className="dashboard-avatar" aria-label="Avatar do Professor">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={teacherName} />
              ) : (
                <div className="dashboard-avatar-fallback">
                  {teacherName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="dashboard-title">Olá, Professor {teacherName}! 🎵</h1>
              <p className="dashboard-subtitle">
                Acompanhe o ritmo dos seus desafios e a gestão de turmas.
              </p>
            </div>
          </div>
        </header>

        {/* Cartões do Professor */}
        <div className="dashboard-cards-grid">
          <div className="dashboard-card stat-card" data-testid="teacher-card-challenges">
            <div className="stat-icon">🎼</div>
            <div className="stat-content">
              <span className="stat-label">Desafios criados</span>
              <span className="stat-value">
                {teacherStats.loading ? '...' : teacherStats.challengesCount}
              </span>
            </div>
          </div>

          <div className="dashboard-card stat-card" data-testid="teacher-card-classes">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-label">Turmas</span>
              <span className="stat-value">
                {teacherStats.loading ? '...' : teacherStats.classesCount}
              </span>
            </div>
          </div>
        </div>

        {/* Atalho para Gerenciar Desafios */}
        <div className="dashboard-section">
          <div className="dashboard-card teacher-actions-card">
            <div className="action-info">
              <h2 className="action-title">Criação & Gestão de Desafios</h2>
              <p className="action-desc">
                Crie padrões rítmicos personalizados e distribua para suas turmas.
              </p>
            </div>
            <Link
              href="/professor/desafios"
              className="dashboard-primary-btn"
              data-testid="link-manage-challenges"
            >
              Gerenciar desafios →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD DO ALUNO ---
  const studentName = profile?.name || 'Ritmista';
  const totalChallenges = OFFICIAL_CHALLENGES.length;
  const completedCount = completed.length;
  const progressPercent = totalChallenges > 0 ? Math.round((completedCount / totalChallenges) * 100) : 0;

  const totalXp = computeXp(OFFICIAL_CHALLENGES, completed);
  const userLevel = levelFromXp(totalXp);

  const totalAttempts = Object.values(attempts).reduce((acc, val) => acc + val, 0);

  // Mensagem motivacional
  let motivationalMessage = 'Boas-vindas ao CodeStar! Vamos começar a programar seus primeiros ritmos?';
  if (completedCount === totalChallenges && totalChallenges > 0) {
    motivationalMessage = 'Incrível! Você concluiu todos os desafios da trilha com maestria! 🎉';
  } else if (completedCount > 0) {
    motivationalMessage = 'Você está mandando muito bem! Continue no compasso certo!';
  }

  // Estado da trilha e próximo desafio
  const trailState = computeTrailState(OFFICIAL_CHALLENGES, completed);
  const nextChallenge = OFFICIAL_CHALLENGES.find((c) => trailState[c.id] === 'current');
  const allCompleted = completedCount === totalChallenges && totalChallenges > 0;

  // Desafios concluídos e a concluir
  const completedChallenges = OFFICIAL_CHALLENGES.filter((c) => trailState[c.id] === 'completed');
  const pendingChallenges = OFFICIAL_CHALLENGES.filter((c) => trailState[c.id] !== 'completed');

  // Ranking
  const rankingData = buildRanking(studentName, totalXp);

  // Desbloqueio da criação de música própria (requer pelo menos 2 desafios concluídos)
  const REQUIRED_CHALLENGES_FOR_CREATION = 2;
  const canCreateMusic = completedCount >= REQUIRED_CHALLENGES_FOR_CREATION;

  return (
    <div className="dashboard-container student-dashboard" data-testid="student-dashboard">
      {/* 1. Saudação com nome, avatar e mensagem curta */}
      <header className="dashboard-header">
        <div className="dashboard-user-greeting">
          <div className="dashboard-avatar" aria-label="Avatar do Aluno">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={studentName} />
            ) : (
              <div className="dashboard-avatar-fallback">
                {studentName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="dashboard-title">Olá, {studentName}! 🥁</h1>
            <p className="dashboard-subtitle">{motivationalMessage}</p>
          </div>
        </div>
      </header>

      {/* 2, 3, 4: Cartões de Estatísticas Principais */}
      <div className="dashboard-cards-grid">
        {/* Cartão "Seu progresso" */}
        <div className="dashboard-card stat-card" data-testid="card-progress">
          <div className="card-header-simple">
            <span className="card-badge">Trilha</span>
            <span className="card-value-percent">{progressPercent}%</span>
          </div>
          <h2 className="stat-label">Seu progresso</h2>
          <p className="stat-detail">
            {completedCount} de {totalChallenges} desafios concluídos
          </p>
          <div className="progress-bar-container" aria-label="Barra de progresso">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Cartão "XP" */}
        <div className="dashboard-card stat-card" data-testid="card-xp">
          <div className="card-header-simple">
            <span className="card-badge badge-level">{userLevel}</span>
          </div>
          <h2 className="stat-label">Experiência acumulada</h2>
          <div className="xp-highlight">
            <span className="xp-number">{totalXp}</span>
            <span className="xp-label">XP</span>
          </div>
          <p className="stat-detail">Nível atual: <strong>{userLevel}</strong></p>
        </div>

        {/* Cartão "Atividade" */}
        <div className="dashboard-card stat-card" data-testid="card-activity">
          <div className="card-header-simple">
            <span className="card-badge badge-activity">Tentativas</span>
          </div>
          <h2 className="stat-label">Atividade</h2>
          <div className="xp-highlight">
            <span className="xp-number">{totalAttempts}</span>
            <span className="xp-label">execuções</span>
          </div>
          <p className="stat-detail">Total de tentativas realizadas na trilha</p>
        </div>
      </div>

      {/* 6. Botão Destacado "Continuar de onde parei" */}
      <div className="dashboard-section">
        <div className="dashboard-card continue-card">
          {allCompleted ? (
            <div className="congrats-banner" data-testid="all-completed-banner">
              <span className="congrats-icon">🏆</span>
              <div>
                <h2 className="congrats-title">Parabéns! Todos os desafios foram concluídos!</h2>
                <p className="congrats-desc">
                  Você dominou os ritmos básicos, intermediários e avançados. Revise a trilha ou crie suas próprias batidas!
                </p>
              </div>
            </div>
          ) : nextChallenge ? (
            <div className="continue-content">
              <div>
                <span className="continue-tag">Próximo Desafio</span>
                <h2 className="continue-title">{nextChallenge.title}</h2>
                <p className="continue-objective">{nextChallenge.objective}</p>
              </div>
              <Link
                href={`/desafio/${nextChallenge.id}`}
                className="dashboard-primary-btn continue-action-btn"
                data-testid="btn-continue"
              >
                Continuar de onde parei →
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* 5. Listas "Concluídos" e "A concluir" */}
      <div className="dashboard-section-columns">
        {/* A concluir */}
        <div className="dashboard-card section-card" data-testid="section-pending">
          <h2 className="section-card-title">A concluir ({pendingChallenges.length})</h2>
          {pendingChallenges.length === 0 ? (
            <p className="empty-list-notice">Tudo feito por aqui!</p>
          ) : (
            <ul className="challenge-list">
              {pendingChallenges.map((ch) => {
                const state = trailState[ch.id];
                const isLocked = state === 'locked';
                const isCurrent = state === 'current';

                return (
                  <li
                    key={ch.id}
                    className={`challenge-item ${isLocked ? 'item-locked' : 'item-active'}`}
                    data-testid={`pending-challenge-${ch.id}`}
                  >
                    <div className="challenge-item-info">
                      <span className={`level-badge level-${ch.level}`}>
                        {ch.level === 'basic' ? 'Básico' : ch.level === 'intermediate' ? 'Médio' : 'Avançado'}
                      </span>
                      <strong className="challenge-item-title">{ch.title}</strong>
                      <span className="challenge-item-xp">+{ch.xp} XP</span>
                    </div>

                    {isLocked ? (
                      <span className="locked-pill" title="Bloqueado: conclua os anteriores">
                        🔒 Bloqueado
                      </span>
                    ) : (
                      <Link
                        href={`/desafio/${ch.id}`}
                        className="start-challenge-btn"
                        data-testid={`btn-start-${ch.id}`}
                      >
                        {isCurrent ? 'Continuar' : 'Começar'}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Concluídos */}
        <div className="dashboard-card section-card" data-testid="section-completed">
          <h2 className="section-card-title">Concluídos ({completedChallenges.length})</h2>
          {completedChallenges.length === 0 ? (
            <p className="empty-list-notice">Nenhum desafio concluído ainda. Vamos começar?</p>
          ) : (
            <ul className="challenge-list">
              {completedChallenges.map((ch) => (
                <li
                  key={ch.id}
                  className="challenge-item item-completed"
                  data-testid={`completed-challenge-${ch.id}`}
                >
                  <div className="challenge-item-info">
                    <span className="completed-check" aria-hidden="true">✓</span>
                    <strong className="challenge-item-title">{ch.title}</strong>
                    <span className="challenge-item-xp">+{ch.xp} XP</span>
                  </div>
                  <div className="completion-meta">
                    {completionDates[ch.id] && (
                      <span className="completion-date">Concluído em: {completionDates[ch.id]}</span>
                    )}
                    <Link href={`/desafio/${ch.id}`} className="review-link">
                      Rever
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 7. Ranking ILUSTRATIVO */}
      <div className="dashboard-section">
        <div className="dashboard-card ranking-card" data-testid="card-ranking">
          <div className="ranking-header">
            <div>
              <h2 className="ranking-title">Tabela de Classificação</h2>
              <span className="ranking-disclaimer-pill">
                Ranking ilustrativo (dados fictícios)
              </span>
            </div>
            <span className="ranking-icon" aria-hidden="true">🏆</span>
          </div>

          <div className="ranking-table-wrapper">
            <table className="ranking-table" aria-label="Ranking de alunos">
              <thead>
                <tr>
                  <th scope="col" className="col-pos">#</th>
                  <th scope="col" className="col-name">Ritmista</th>
                  <th scope="col" className="col-xp">XP</th>
                  <th scope="col" className="col-level">Nível</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.top5.map((row: RankingRow) => (
                  <tr
                    key={row.name}
                    className={`ranking-row ${row.isUser ? 'ranking-row-user' : ''}`}
                    data-testid={row.isUser ? 'ranking-user-row' : undefined}
                  >
                    <td className="col-pos">
                      {row.position === 1 ? '🥇 1' : row.position === 2 ? '🥈 2' : row.position === 3 ? '🥉 3' : row.position}
                    </td>
                    <td className="col-name">
                      {row.name} {row.isUser && <span className="user-indicator">(Você)</span>}
                    </td>
                    <td className="col-xp"><strong>{row.xp}</strong> XP</td>
                    <td className="col-level">{levelFromXp(row.xp)}</td>
                  </tr>
                ))}

                {/* Se o usuário ficou fora do top 5, mostra a posição dele abaixo com separador */}
                {!rankingData.userInTop5 && (
                  <>
                    <tr className="ranking-row-separator">
                      <td colSpan={4}>•••</td>
                    </tr>
                    <tr
                      className="ranking-row ranking-row-user"
                      data-testid="ranking-user-row-outside"
                    >
                      <td className="col-pos">{rankingData.userRow.position}</td>
                      <td className="col-name">
                        {rankingData.userRow.name} <span className="user-indicator">(Você)</span>
                      </td>
                      <td className="col-xp"><strong>{rankingData.userRow.xp}</strong> XP</td>
                      <td className="col-level">{levelFromXp(rankingData.userRow.xp)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 8. Entrar em uma turma (se não pertence a nenhuma) & Minhas Turmas */}
      <div className="dashboard-section-columns">
        {/* Entrar em turma */}
        <div className="dashboard-card section-card" data-testid="card-join-class">
          <h2 className="section-card-title">Entrar em uma turma</h2>
          <p className="join-class-desc">
            Seu professor forneceu um código de turma? Digite-o abaixo para vincular sua conta:
          </p>
          <form onSubmit={handleJoinClass} className="join-class-form">
            <div className="join-class-input-group">
              <input
                type="text"
                placeholder="Ex: TURMA-A"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="join-class-input"
                disabled={classStatus.type === 'loading'}
                aria-label="Código da turma"
              />
              <button
                type="submit"
                className="join-class-btn"
                disabled={classStatus.type === 'loading' || !classCode.trim()}
              >
                {classStatus.type === 'loading' ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
            {classStatus.message && (
              <p
                className={`join-class-message msg-${classStatus.type}`}
                role={classStatus.type === 'error' ? 'alert' : 'status'}
              >
                {classStatus.message}
              </p>
            )}
          </form>

          {/* Turmas atuais */}
          {!classesLoading && userClasses.length > 0 && (
            <div className="enrolled-classes-section">
              <h3 className="enrolled-title">Suas Turmas</h3>
              <ul className="enrolled-list">
                {userClasses.map((cl) => (
                  <li key={cl.id} className="enrolled-item">
                    🏷️ {cl.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 9. Criar a própria música (bloqueada até X desafios) */}
        <div className="dashboard-card section-card" data-testid="card-create-music">
          <h2 className="section-card-title">Criar Sua Própria Música</h2>
          <p className="create-music-desc">
            No modo Livre, você poderá compor canções, ritmos personalizados e salvar suas partituras em código!
          </p>

          {!canCreateMusic ? (
            <div className="create-music-locked" data-testid="create-music-locked">
              <div className="lock-icon" aria-hidden="true">🔒</div>
              <strong className="lock-title">Modo Bloqueado</strong>
              <p className="lock-info">
                Conclua pelo menos <strong>{REQUIRED_CHALLENGES_FOR_CREATION} desafios</strong> na trilha para desbloquear o estúdio de criação livre.
              </p>
              <span className="lock-progress-badge">
                Progresso: {completedCount}/{REQUIRED_CHALLENGES_FOR_CREATION}
              </span>
            </div>
          ) : (
            <div className="create-music-unlocked" data-testid="create-music-unlocked">
              <div className="unlock-icon" aria-hidden="true">✨</div>
              <strong className="unlock-title">Estúdio Liberado!</strong>
              <p className="unlock-info">
                Você provou sua técnica de programação rítmica!
              </p>
              <Link href="/desafio/kick-duas-batidas" className="dashboard-primary-btn">
                Abrir Estúdio →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
