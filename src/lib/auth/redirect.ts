export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface ResolveRedirectOptions {
  hasSession: boolean;
  hasProfile: boolean;
  role?: UserRole | null;
  pathname: string;
}

/**
 * Função pura que determina a rota de redirecionamento com base nas regras:
 * 1. Raiz ("/"):
 *    - sem sessão -> "/login"
 *    - com sessão e sem perfil -> "/onboarding"
 *    - com sessão e com perfil -> "/dashboard"
 * 2. Sem sessão:
 *    - apenas "/login" e subrotas de "/auth" (ex: "/auth/callback") são públicas (retorna null)
 *    - qualquer outra rota redireciona para "/login"
 * 3. Com sessão e sem perfil:
 *    - "/onboarding" e "/auth/*" são acessíveis (retorna null)
 *    - qualquer outra rota redireciona para "/onboarding"
 * 4. Com sessão e com perfil:
 *    - "/login" e "/onboarding" redirecionam para "/dashboard"
 *    - rotas sob "/professor/*":
 *      - se role === 'teacher' -> permitido (retorna null)
 *      - se não for 'teacher' -> redireciona para "/dashboard"
 *    - demais rotas -> permitidas (retorna null)
 */
export function resolveRedirect({
  hasSession,
  hasProfile,
  role,
  pathname,
}: ResolveRedirectOptions): string | null {
  // Trata rota raiz
  if (pathname === '/') {
    if (!hasSession) return '/login';
    if (!hasProfile) return '/onboarding';
    return '/dashboard';
  }

  // Rotas de autenticação abertas
  const isAuthRoute = pathname.startsWith('/auth');

  // Caso 1: Usuário não autenticado
  if (!hasSession) {
    if (pathname === '/login' || isAuthRoute) {
      return null;
    }
    return '/login';
  }

  // Caso 2: Usuário autenticado mas sem perfil criado
  if (!hasProfile) {
    if (pathname === '/onboarding' || isAuthRoute) {
      return null;
    }
    return '/onboarding';
  }

  // Caso 3: Usuário autenticado e com perfil completo
  if (pathname === '/login' || pathname === '/onboarding') {
    return '/dashboard';
  }

  // Proteção de rotas restritas para professores (/professor/*)
  if (pathname.startsWith('/professor')) {
    if (role === 'teacher') {
      return null;
    }
    return '/dashboard';
  }

  return null;
}

/**
 * Função utilitária para extrair nome e avatar de user_metadata do Supabase
 */
export function parseUserMetadata(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): { name: string; avatar_url: string | null } {
  const meta = user.user_metadata || {};

  // Tenta full_name, name, ou local-part do e-mail
  let name = '';
  if (typeof meta.full_name === 'string' && meta.full_name.trim()) {
    name = meta.full_name.trim();
  } else if (typeof meta.name === 'string' && meta.name.trim()) {
    name = meta.name.trim();
  } else if (user.email && user.email.includes('@')) {
    name = user.email.split('@')[0];
  } else {
    name = 'Usuário';
  }

  // Tenta avatar_url ou picture
  let avatar_url: string | null = null;
  if (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) {
    avatar_url = meta.avatar_url.trim();
  } else if (typeof meta.picture === 'string' && meta.picture.trim()) {
    avatar_url = meta.picture.trim();
  }

  return { name, avatar_url };
}
