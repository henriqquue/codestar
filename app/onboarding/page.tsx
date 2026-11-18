'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import { UserRole, parseUserMetadata } from '@/src/lib/auth/redirect';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [classCode, setClassCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { name } = parseUserMetadata(user);
      setUserName(name);
    }
    loadUser();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage('Sessão expirada. Faça login novamente.');
        setIsLoading(false);
        router.push('/login');
        return;
      }

      const { name, avatar_url } = parseUserMetadata(user);

      // 1. Cria o perfil na tabela 'profiles'
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        name,
        avatar_url,
        role: selectedRole,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        setErrorMessage(`Erro ao salvar perfil: ${profileError.message}`);
        setIsLoading(false);
        return;
      }

      // 2. Se for Aluno e informou código de turma, chama a RPC 'join_class'
      if (selectedRole === 'student' && classCode.trim()) {
        try {
          const { data: joinRes, error: rpcError } = await supabase.rpc('join_class', {
            p_code: classCode.trim(),
          });

          if (rpcError) {
            console.warn('Erro ao entrar na turma (RPC):', rpcError.message);
          } else if (joinRes && typeof joinRes === 'object' && 'success' in joinRes) {
            const resObj = joinRes as { success: boolean; message?: string };
            if (!resObj.success) {
              console.warn('Aviso de turma:', resObj.message);
            }
          }
        } catch (err) {
          console.warn('Erro ao processar entrada na turma:', err);
        }
      }

      // 3. Redirecionamento baseado no papel
      if (selectedRole === 'teacher') {
        router.push('/dashboard');
      } else {
        router.push('/trilha');
      }
      router.refresh();
    } catch {
      setErrorMessage('Ocorreu um erro ao concluir o cadastro.');
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-page-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-badge">👋 Bem-vindo{userName ? `, ${userName}` : ''}!</div>
          <h1 className="onboarding-title">Como você vai usar o CodeStar?</h1>
          <p className="onboarding-subtitle">
            Selecione seu papel na plataforma para personalizarmos sua experiência.
          </p>
        </div>

        {errorMessage && (
          <div className="auth-alert error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Cartões de Escolha: Aluno ou Professor */}
          <div className="role-selection-grid">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`role-card ${selectedRole === 'student' ? 'is-selected' : ''}`}
            >
              <div className="role-card-icon">🎓</div>
              <h3 className="role-card-title">Sou Aluno</h3>
              <p className="role-card-desc">
                Quero resolver desafios musicais, desbloquear conquistas na trilha e aprender lógica no meu ritmo.
              </p>
              <div className="role-radio-indicator">
                {selectedRole === 'student' && <span className="radio-dot" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`role-card ${selectedRole === 'teacher' ? 'is-selected' : ''}`}
            >
              <div className="role-card-icon">👨‍🏫</div>
              <h3 className="role-card-title">Sou Professor</h3>
              <p className="role-card-desc">
                Quero criar turmas, acompanhar o desempenho dos alunos e gerenciar desafios rítmicos personalizados.
              </p>
              <div className="role-radio-indicator">
                {selectedRole === 'teacher' && <span className="radio-dot" />}
              </div>
            </button>
          </div>

          {/* Campo opcional de Código da Turma (apenas para aluno) */}
          {selectedRole === 'student' && (
            <div className="class-code-field">
              <label htmlFor="class-code">Código da Turma (opcional)</label>
              <input
                id="class-code"
                type="text"
                placeholder="Ex: MUSICA2026"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="auth-input font-mono uppercase"
              />
              <span className="field-hint">
                Se o seu professor forneceu um código, digite-o aqui para se vincular à turma.
              </span>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="onboarding-submit-btn">
            {isLoading ? 'Configurando...' : 'Continuar para a Plataforma →'}
          </button>
        </form>
      </div>
    </div>
  );
}
