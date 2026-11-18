'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Login com Google
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Erro ao conectar com o serviço do Google.');
      setIsLoading(false);
    }
  };

  // Login / Cadastro com E-mail e Senha
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('E-mail ou senha incorretos.');
          } else {
            setErrorMessage(error.message);
          }
          setIsLoading(false);
          return;
        }

        router.push('/');
        router.refresh();
      } else {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }

        // Se o usuário foi criado e já logou (sem confirmação de e-mail obrigatória)
        if (data.session) {
          router.push('/onboarding');
          router.refresh();
        } else {
          setSuccessMessage(
            'Conta criada com sucesso! Verifique a caixa de entrada do seu e-mail para confirmar o cadastro antes de entrar.'
          );
          setMode('signin');
          setIsLoading(false);
        }
      }
    } catch {
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Cabeçalho da Identidade Visual do CodeStar */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge">♪</div>
          <h1 className="auth-title">CODESTAR</h1>
          <p className="auth-subtitle">Aprenda lógica de programação com música</p>
        </div>

        {/* Mensagens de Alerta */}
        {errorMessage && (
          <div className="auth-alert error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert success" role="status">
            <span className="alert-icon">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Botão Entrar com Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="google-auth-btn"
          aria-label="Entrar com conta Google"
        >
          <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isLoading ? 'Conectando...' : 'Entrar com Google'}</span>
        </button>

        {/* Divisor */}
        <div className="auth-divider">
          <span>ou use seu e-mail</span>
        </div>

        {/* Formulário E-mail e Senha */}
        <form onSubmit={handleEmailAuth} className="auth-form">
          <div className="auth-field">
            <label htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="auth-input"
            />
          </div>

          <button type="submit" disabled={isLoading} className="auth-submit-btn">
            {isLoading
              ? 'Aguarde...'
              : mode === 'signin'
              ? 'Entrar no CodeStar'
              : 'Criar Minha Conta'}
          </button>
        </form>

        {/* Alternância Entrar / Criar Conta */}
        <div className="auth-switch-mode">
          {mode === 'signin' ? (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className="switch-btn"
              >
                Criar conta
              </button>
            </p>
          ) : (
            <p>
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className="switch-btn"
              >
                Entrar
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
