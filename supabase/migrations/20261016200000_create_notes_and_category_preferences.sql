alter table public.profiles
  add column if not exists hidden_categories text[] not null default '{}';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_hidden_categories_allowed_values'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_hidden_categories_allowed_values
      check (
        hidden_categories <@ array[
          'Politics',
          'Tech',
          'Gaming',
          'Fashion',
          'Faith',
          'LGBTQ+',
          'Sports',
          'Entertainment',
          'Science',
          'Books',
          'Food',
          'Local'
        ]::text[]
      );
  end if;
end
$$;

create or replace function public.update_my_hidden_categories(p_categories text[])
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
    set hidden_categories = coalesce(p_categories, '{}'::text[])
    where id = auth.uid();

  get diagnostics updated_rows = row_count;
  return updated_rows = 1;
end;
$$;

revoke all on function public.update_my_hidden_categories(text[]) from public, anon, authenticated;
grant execute on function public.update_my_hidden_categories(text[]) to authenticated;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  category text not null check (
    category in (
      'Politics',
      'Tech',
      'Gaming',
      'Fashion',
      'Faith',
      'LGBTQ+',
      'Sports',
      'Entertainment',
      'Science',
      'Books',
      'Food',
      'Local'
    )
  ),
  kind text not null check (kind in ('note', 'letter')),
  title text check (title is null or char_length(title) <= 120),
  content text not null check (
    (kind = 'note' and char_length(content) between 1 and 255 and title is null)
    or
    (kind = 'letter' and char_length(content) between 1 and 400)
  ),
  created_at timestamptz not null default now()
);

create index if not exists notes_created_at_desc_idx
  on public.notes (created_at desc);
create index if not exists notes_category_created_at_desc_idx
  on public.notes (category, created_at desc);

create or replace function public.set_note_author_name()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  profile_first_name text;
  profile_last_name text;
  metadata jsonb;
begin
  select first_name, last_name
    into profile_first_name, profile_last_name
    from public.profiles
    where id = auth.uid();

  new.author_name := nullif(
    trim(concat_ws(' ', profile_first_name, profile_last_name)),
    ''
  );

  if new.author_name is null then
    metadata := auth.jwt() -> 'user_metadata';
    new.author_name := nullif(
      trim(concat_ws(
        ' ',
        metadata ->> 'first_name',
        metadata ->> 'last_name'
      )),
      ''
    );
  end if;

  if new.author_name is null then
    new.author_name := coalesce(
      nullif(split_part(auth.jwt() ->> 'email', '@', 1), ''),
      'Community member'
    );
  end if;

  new.author_name := left(new.author_name, 80);

  return new;
end;
$$;

revoke all on function public.set_note_author_name() from public, anon, authenticated;

drop trigger if exists set_note_author_name_before_insert on public.notes;
create trigger set_note_author_name_before_insert
  before insert on public.notes
  for each row execute function public.set_note_author_name();

alter table public.notes enable row level security;

drop policy if exists "Anyone can read notes" on public.notes;
create policy "Anyone can read notes"
  on public.notes for select
  using (true);

drop policy if exists "Authenticated users can create their own notes" on public.notes;
create policy "Authenticated users can create their own notes"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = author_id);
