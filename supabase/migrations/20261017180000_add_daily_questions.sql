create table if not exists public.daily_question_votes (
  question_date date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer text not null check (answer in ('Absolutely', 'It depends')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (question_date, user_id)
);

alter table public.daily_question_votes enable row level security;
revoke all on table public.daily_question_votes from public, anon, authenticated;

create or replace function public.get_daily_question_results(
  p_question_date date
)
returns table (
  answer text,
  vote_count bigint,
  my_vote text
)
language sql
stable
security definer
set search_path = ''
as $$
  with answers(answer) as (
    values ('Absolutely'::text), ('It depends'::text)
  ),
  counts as (
    select votes.answer, count(*)::bigint as vote_count
    from public.daily_question_votes as votes
    where votes.question_date = p_question_date
    group by votes.answer
  )
  select
    answers.answer,
    coalesce(counts.vote_count, 0),
    (
      select votes.answer
      from public.daily_question_votes as votes
      where votes.question_date = p_question_date
        and votes.user_id = (select auth.uid())
    )
  from answers
  left join counts using (answer);
$$;

create or replace function public.cast_daily_question_vote(
  p_question_date date,
  p_answer text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to vote.'
      using errcode = '42501';
  end if;

  if p_question_date is distinct from
    ((now() at time zone 'UTC')::date) then
    raise exception 'You can only vote on today''s question.'
      using errcode = '22023';
  end if;

  if p_answer not in ('Absolutely', 'It depends') then
    raise exception 'Choose a valid answer.'
      using errcode = '22023';
  end if;

  insert into public.daily_question_votes (
    question_date,
    user_id,
    answer
  )
  values (
    p_question_date,
    (select auth.uid()),
    p_answer
  )
  on conflict (question_date, user_id)
  do nothing;
end;
$$;

revoke all on function public.get_daily_question_results(date) from public;
grant execute on function public.get_daily_question_results(date)
  to anon, authenticated;
revoke all on function public.cast_daily_question_vote(date, text) from public;
grant execute on function public.cast_daily_question_vote(date, text)
  to authenticated;

create table if not exists public.daily_question_replies (
  id uuid primary key default gen_random_uuid(),
  question_date date not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null
    check (char_length(btrim(author_name)) between 1 and 80),
  content text not null
    check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists daily_question_replies_date_created_at_idx
  on public.daily_question_replies (question_date, created_at);

alter table public.daily_question_replies enable row level security;

grant select on public.daily_question_replies to anon, authenticated;
grant insert on public.daily_question_replies to authenticated;

drop policy if exists "Anyone can read daily question replies"
  on public.daily_question_replies;
create policy "Anyone can read daily question replies"
  on public.daily_question_replies
  for select
  using (true);

drop policy if exists "Users can reply as themselves to daily questions"
  on public.daily_question_replies;
create policy "Users can reply as themselves to daily questions"
  on public.daily_question_replies
  for insert
  to authenticated
  with check (author_id = (select auth.uid()));
