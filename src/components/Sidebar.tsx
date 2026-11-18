'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/lib/auth/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { profile, signOut } = useAuth();

  // Fecha o menu móvel ao teclar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Fecha ao navegar
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    {
      label: 'Trilha',
      href: '/trilha',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      ),
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
  ];

  const isTeacher = profile?.role === 'teacher';

  return (
    <>
      {/* Botão Hambúrguer Mobile */}
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Abrir menu de navegação"
        aria-expanded={isOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {isOpen ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Backdrop para mobile */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Barra lateral */}
      <aside className={`global-sidebar ${isOpen ? 'is-open' : ''}`} aria-label="Menu Principal">
        <div className="sidebar-brand">
          <Link href="/trilha" className="brand-logo-link">
            <span className="brand-logo-badge">♪</span>
            <span className="brand-logo-text">CODESTAR</span>
          </Link>
          <span className="brand-tagline">Programação Rítmica</span>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação da plataforma">
          <ul className="sidebar-menu-list">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/trilha' && pathname.startsWith('/desafio/'));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span className="sidebar-link-text">{item.label}</span>
                  </Link>
                </li>
              );
            })}

            {/* Gerenciar Desafios: Visível APENAS para Professor */}
            {isTeacher && (
              <li>
                <Link
                  href="/professor/desafios"
                  className={`sidebar-nav-link ${pathname === '/professor/desafios' ? 'is-active' : ''}`}
                  aria-current={pathname === '/professor/desafios' ? 'page' : undefined}
                >
                  <span className="sidebar-link-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </span>
                  <span className="sidebar-link-text">Gerenciar Desafios</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Rodapé de Usuário / Sair */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-left">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.name || 'Avatar'}
                  className="sidebar-user-avatar-img"
                />
              ) : (
                <div className="sidebar-user-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="sidebar-user-info">
                <span className="sidebar-user-name" title={profile?.name || 'Usuário'}>
                  {profile?.name || 'Aluno'}
                </span>
                <span className="sidebar-user-role-badge">
                  {profile?.role === 'teacher' ? '👨‍🏫 Professor' : '🎓 Aluno'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              className="sidebar-logout-btn"
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
