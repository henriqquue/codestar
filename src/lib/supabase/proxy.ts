import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveRedirect, UserRole } from '@/src/lib/auth/redirect';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Importante: usar getUser() em vez de getSession() para validar com o servidor de auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasSession = Boolean(user);
  let hasProfile = false;
  let role: UserRole | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      hasProfile = true;
      role = (profile.role as UserRole) || 'student';
    }
  }

  const pathname = request.nextUrl.pathname;
  const targetRedirect = resolveRedirect({
    hasSession,
    hasProfile,
    role,
    pathname,
  });

  if (targetRedirect && targetRedirect !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = targetRedirect;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
