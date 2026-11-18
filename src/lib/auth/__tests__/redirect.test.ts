import { resolveRedirect, parseUserMetadata } from '../redirect';

describe('resolveRedirect', () => {
  describe('Rota raiz ("/")', () => {
    it('redireciona para /login quando não há sessão', () => {
      expect(resolveRedirect({ hasSession: false, hasProfile: false, pathname: '/' })).toBe('/login');
    });

    it('redireciona para /onboarding quando há sessão mas não há perfil', () => {
      expect(resolveRedirect({ hasSession: true, hasProfile: false, pathname: '/' })).toBe('/onboarding');
    });

    it('redireciona para /dashboard quando há sessão e perfil', () => {
      expect(resolveRedirect({ hasSession: true, hasProfile: true, role: 'student', pathname: '/' })).toBe('/dashboard');
    });
  });

  describe('Sem sessão ativa', () => {
    it('permite acesso a /login', () => {
      expect(resolveRedirect({ hasSession: false, hasProfile: false, pathname: '/login' })).toBeNull();
    });

    it('permite acesso a rotas de autenticação como /auth/callback', () => {
      expect(resolveRedirect({ hasSession: false, hasProfile: false, pathname: '/auth/callback' })).toBeNull();
    });

    it('redireciona rotas protegidas para /login', () => {
      expect(resolveRedirect({ hasSession: false, hasProfile: false, pathname: '/trilha' })).toBe('/login');
      expect(resolveRedirect({ hasSession: false, hasProfile: false, pathname: '/dashboard' })).toBe('/login');
      expect(resolveRedirect({ hasSession: false, hasProfile: false, pathname: '/desafio/kick-duas-batidas' })).toBe('/login');
      expect(resolveRedirect({ hasSession: false, hasProfile: false, pathname: '/onboarding' })).toBe('/login');
      expect(resolveRedirect({ hasSession: false, hasProfile: false, pathname: '/professor/desafios' })).toBe('/login');
    });
  });

  describe('Com sessão ativa mas sem perfil (/onboarding)', () => {
    it('permite acesso a /onboarding', () => {
      expect(resolveRedirect({ hasSession: true, hasProfile: false, pathname: '/onboarding' })).toBeNull();
    });

    it('permite acesso a rotas sob /auth/*', () => {
      expect(resolveRedirect({ hasSession: true, hasProfile: false, pathname: '/auth/callback' })).toBeNull();
    });

    it('redireciona rotas da plataforma para /onboarding', () => {
      expect(resolveRedirect({ hasSession: true, hasProfile: false, pathname: '/trilha' })).toBe('/onboarding');
      expect(resolveRedirect({ hasSession: true, hasProfile: false, pathname: '/login' })).toBe('/onboarding');
      expect(resolveRedirect({ hasSession: true, hasProfile: false, pathname: '/desafio/kick-duas-batidas' })).toBe('/onboarding');
    });
  });

  describe('Com sessão ativa e perfil completo', () => {
    it('redireciona /login e /onboarding de volta para /dashboard', () => {
      expect(resolveRedirect({ hasSession: true, hasProfile: true, role: 'student', pathname: '/login' })).toBe('/dashboard');
      expect(resolveRedirect({ hasSession: true, hasProfile: true, role: 'student', pathname: '/onboarding' })).toBe('/dashboard');
    });

    it('permite acesso a rotas comuns da plataforma para estudante e professor', () => {
      expect(resolveRedirect({ hasSession: true, hasProfile: true, role: 'student', pathname: '/trilha' })).toBeNull();
      expect(resolveRedirect({ hasSession: true, hasProfile: true, role: 'student', pathname: '/desafio/1' })).toBeNull();
      expect(resolveRedirect({ hasSession: true, hasProfile: true, role: 'teacher', pathname: '/dashboard' })).toBeNull();
    });

    it('permite rota /professor/* apenas para papel teacher', () => {
      expect(resolveRedirect({ hasSession: true, hasProfile: true, role: 'teacher', pathname: '/professor/desafios' })).toBeNull();
    });

    it('redireciona aluno tentando acessar rota /professor/* para /dashboard', () => {
      expect(resolveRedirect({ hasSession: true, hasProfile: true, role: 'student', pathname: '/professor/desafios' })).toBe('/dashboard');
      expect(resolveRedirect({ hasSession: true, hasProfile: true, role: null, pathname: '/professor/desafios' })).toBe('/dashboard');
    });
  });
});

describe('parseUserMetadata', () => {
  it('extrai nome e avatar_url de user_metadata padrão do Google', () => {
    const user = {
      id: 'uuid-1',
      email: 'dev@codestar.app',
      user_metadata: {
        full_name: 'Ada Lovelace',
        avatar_url: 'https://example.com/ada.png',
      },
    };
    const res = parseUserMetadata(user);
    expect(res.name).toBe('Ada Lovelace');
    expect(res.avatar_url).toBe('https://example.com/ada.png');
  });

  it('extrai name e picture alternativos', () => {
    const user = {
      id: 'uuid-2',
      email: 'alan@codestar.app',
      user_metadata: {
        name: 'Alan Turing',
        picture: 'https://example.com/alan.png',
      },
    };
    const res = parseUserMetadata(user);
    expect(res.name).toBe('Alan Turing');
    expect(res.avatar_url).toBe('https://example.com/alan.png');
  });

  it('usa o prefixo do e-mail como fallback quando não há nome no metadata', () => {
    const user = {
      id: 'uuid-3',
      email: 'estudante_ritmo@gmail.com',
      user_metadata: {},
    };
    const res = parseUserMetadata(user);
    expect(res.name).toBe('estudante_ritmo');
    expect(res.avatar_url).toBeNull();
  });

  it('usa fallback "Usuário" quando nem e-mail está disponível', () => {
    const user = {
      id: 'uuid-4',
    };
    const res = parseUserMetadata(user);
    expect(res.name).toBe('Usuário');
    expect(res.avatar_url).toBeNull();
  });
});
