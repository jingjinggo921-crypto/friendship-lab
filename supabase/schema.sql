-- Friendship Lab classroom public-answer archive
-- Run in Supabase SQL Editor after creating a project.
-- Explicit submission only; do not import private drafts or localStorage automatically.
create table if not exists public.class_answers (
  id bigint generated always as identity primary key,
  question_key text not null check (char_length(question_key) between 1 and 80),
  answer_text text not null check (char_length(answer_text) between 1 and 1500),
  created_at timestamptz not null default now()
);
create index if not exists class_answers_question_created_idx on public.class_answers(question_key, created_at desc);
alter table public.class_answers enable row level security;
revoke all on public.class_answers from public, anon, authenticated;
grant select, insert on public.class_answers to anon, authenticated;
grant usage on sequence public.class_answers_id_seq to anon, authenticated;
drop policy if exists "Anyone can read classroom answers" on public.class_answers;
create policy "Anyone can read classroom answers" on public.class_answers
  for select to anon, authenticated using (true);
drop policy if exists "Anyone can submit classroom answers" on public.class_answers;
create policy "Anyone can submit classroom answers" on public.class_answers
  for insert to anon, authenticated
  with check (question_key in ('apps','birthday','conflictChoice','rank','threadReply','storyMessage','care','other'));
-- No update or delete permissions for anonymous visitors. Do not collect names, phone numbers or emails.
-- Anonymous public submissions may be spammed: use captcha/rate limits if opened beyond a classroom.
