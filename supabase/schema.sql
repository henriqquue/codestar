-- CodeStar - Esquema do Banco de Dados (Supabase / PostgreSQL)
-- Documentação do esquema com RLS para referência do projeto

-- 1. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')) DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis visíveis por usuários autenticados"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuário pode criar ou atualizar seu próprio perfil"
  ON public.profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Tabela de Turmas (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Turmas visíveis por membros ou professor"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.class_members
      WHERE class_id = public.classes.id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Apenas professores criam e gerenciam turmas"
  ON public.classes FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- 3. Tabela de Membros da Turma (Class Members)
CREATE TABLE IF NOT EXISTS public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (class_id, student_id)
);

ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros visíveis pelo estudante ou pelo professor da turma"
  ON public.class_members FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = public.class_members.class_id AND teacher_id = auth.uid()
    )
  );

-- 4. Função RPC para o aluno entrar na turma pelo código
CREATE OR REPLACE FUNCTION public.join_class(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_id UUID;
  v_student_id UUID := auth.uid();
BEGIN
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT id INTO v_class_id
  FROM public.classes
  WHERE upper(code) = upper(trim(p_code));

  IF v_class_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Código de turma inválido ou inexistente.');
  END IF;

  INSERT INTO public.class_members (class_id, student_id)
  VALUES (v_class_id, v_student_id)
  ON CONFLICT (class_id, student_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'class_id', v_class_id);
END;
$$;

-- 5. Tabela de Desafios Customizados (Custom Challenges - Fase 5)
CREATE TABLE IF NOT EXISTS public.custom_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  instructions TEXT NOT NULL,
  allowed_commands TEXT[] NOT NULL DEFAULT ARRAY['INSTRUMENT', 'PLAY', 'WAIT', 'REPEAT', 'END'],
  spec JSONB NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('basic', 'intermediate', 'advanced')) DEFAULT 'basic',
  xp INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.custom_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Desafios customizados visíveis para membros da turma ou criador"
  ON public.custom_challenges FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    (class_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.class_members
      WHERE class_id = public.custom_challenges.class_id AND student_id = auth.uid()
    ))
  );

CREATE POLICY "Apenas o professor gerencia seus desafios"
  ON public.custom_challenges FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- 6. Tabela de Progresso do Usuário (Progress)
CREATE TABLE IF NOT EXISTS public.progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, challenge_id)
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê apenas seu próprio progresso"
  ON public.progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere ou atualiza seu próprio progresso"
  ON public.progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professores podem ver progresso dos alunos de suas turmas"
  ON public.progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      JOIN public.classes c ON c.id = cm.class_id
      WHERE cm.student_id = public.progress.user_id
      AND c.teacher_id = auth.uid()
    )
  );
