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

revoke all on function public.cast_daily_question_vote(date, text) from public;
grant execute on function public.cast_daily_question_vote(date, text)
  to authenticated;
