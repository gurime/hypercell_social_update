create table if not exists public.note_reactions (
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('good', 'cold')),
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

alter table public.note_reactions enable row level security;

create or replace function public.get_note_reaction_summaries(p_note_ids uuid[])
returns table (
  note_id uuid,
  good_count bigint,
  cold_count bigint,
  my_reaction text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    requested.note_id,
    count(reactions.user_id) filter (where reactions.reaction = 'good'),
    count(reactions.user_id) filter (where reactions.reaction = 'cold'),
    max(reactions.reaction) filter (where reactions.user_id = auth.uid())
  from unnest(coalesce(p_note_ids, '{}'::uuid[])) as requested(note_id)
  left join public.note_reactions as reactions
    on reactions.note_id = requested.note_id
  group by requested.note_id;
$$;

create or replace function public.toggle_note_reaction(
  p_note_id uuid,
  p_reaction text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing_reaction text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_reaction is null or p_reaction not in ('good', 'cold') then
    raise exception 'Unsupported note reaction';
  end if;

  select reaction
    into existing_reaction
    from public.note_reactions
    where note_id = p_note_id
      and user_id = auth.uid();

  if existing_reaction = p_reaction then
    delete from public.note_reactions
      where note_id = p_note_id
        and user_id = auth.uid();
    return false;
  end if;

  insert into public.note_reactions (note_id, user_id, reaction)
    values (p_note_id, auth.uid(), p_reaction)
    on conflict (note_id, user_id)
    do update set reaction = excluded.reaction;

  return true;
end;
$$;

revoke all on function public.get_note_reaction_summaries(uuid[]) from public, anon, authenticated;
grant execute on function public.get_note_reaction_summaries(uuid[]) to anon, authenticated;

revoke all on function public.toggle_note_reaction(uuid, text) from public, anon, authenticated;
grant execute on function public.toggle_note_reaction(uuid, text) to authenticated;
