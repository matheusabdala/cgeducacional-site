-- ===========================================================================
-- CG Educacional LMS — Row Level Security (Supabase / Postgres)
--
-- Rode este arquivo no SQL Editor do Supabase DEPOIS de `prisma migrate deploy`
-- (o Prisma cria as tabelas; o RLS não é gerenciado por ele).
--
-- Arquitetura: o app acessa o banco via Prisma (server-side, conexão direta)
-- e NÃO é limitado por RLS — a regra de acesso a conteúdo é aplicada em código
-- (checagem de Enrollment nas Server Actions). Estas policies são defesa em
-- profundidade caso alguma tabela seja lida pelo cliente Supabase (anon/auth).
-- Nomes de tabela são PascalCase (Prisma) → precisam de aspas.
-- ===========================================================================

-- Helpers -------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from "User" u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

create or replace function public.is_enrolled(course_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from "Enrollment" e
    where e."userId" = auth.uid() and e."courseId" = course_id
  );
$$;

-- Habilita RLS --------------------------------------------------------------

alter table "User"           enable row level security;
alter table "Course"         enable row level security;
alter table "Module"         enable row level security;
alter table "Lesson"         enable row level security;
alter table "Enrollment"     enable row level security;
alter table "LessonProgress" enable row level security;
alter table "Certificate"    enable row level security;

-- User ----------------------------------------------------------------------

create policy "user_select_own" on "User"
  for select using (id = auth.uid() or public.is_admin());

create policy "user_update_own" on "User"
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Course --------------------------------------------------------------------

create policy "course_select_visible" on "Course"
  for select using (
    published = true or "instructorId" = auth.uid() or public.is_admin()
  );

create policy "course_write_owner" on "Course"
  for all using ("instructorId" = auth.uid() or public.is_admin())
  with check ("instructorId" = auth.uid() or public.is_admin());

-- Module --------------------------------------------------------------------

create policy "module_select_visible" on "Module"
  for select using (
    exists (
      select 1 from "Course" c
      where c.id = "Module"."courseId" and (
        c.published = true
        or c."instructorId" = auth.uid()
        or public.is_admin()
        or public.is_enrolled(c.id)
      )
    )
  );

create policy "module_write_owner" on "Module"
  for all using (
    exists (
      select 1 from "Course" c
      where c.id = "Module"."courseId"
        and (c."instructorId" = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from "Course" c
      where c.id = "Module"."courseId"
        and (c."instructorId" = auth.uid() or public.is_admin())
    )
  );

-- Lesson --------------------------------------------------------------------

create policy "lesson_select_visible" on "Lesson"
  for select using (
    exists (
      select 1 from "Module" m
      join "Course" c on c.id = m."courseId"
      where m.id = "Lesson"."moduleId" and (
        c.published = true
        or c."instructorId" = auth.uid()
        or public.is_admin()
        or public.is_enrolled(c.id)
      )
    )
  );

create policy "lesson_write_owner" on "Lesson"
  for all using (
    exists (
      select 1 from "Module" m
      join "Course" c on c.id = m."courseId"
      where m.id = "Lesson"."moduleId"
        and (c."instructorId" = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from "Module" m
      join "Course" c on c.id = m."courseId"
      where m.id = "Lesson"."moduleId"
        and (c."instructorId" = auth.uid() or public.is_admin())
    )
  );

-- Enrollment (matrícula manual via admin) -----------------------------------

create policy "enrollment_select_own" on "Enrollment"
  for select using ("userId" = auth.uid() or public.is_admin());

create policy "enrollment_admin_write" on "Enrollment"
  for all using (public.is_admin()) with check (public.is_admin());

-- LessonProgress (o aluno gerencia o próprio progresso) ---------------------

create policy "progress_select_own" on "LessonProgress"
  for select using ("userId" = auth.uid() or public.is_admin());

create policy "progress_insert_own" on "LessonProgress"
  for insert with check ("userId" = auth.uid());

create policy "progress_update_own" on "LessonProgress"
  for update using ("userId" = auth.uid()) with check ("userId" = auth.uid());

-- Certificate ---------------------------------------------------------------

create policy "certificate_select_own" on "Certificate"
  for select using ("userId" = auth.uid() or public.is_admin());

create policy "certificate_admin_write" on "Certificate"
  for all using (public.is_admin()) with check (public.is_admin());
