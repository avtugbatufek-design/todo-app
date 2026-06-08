-- Todos tablosu
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task text not null check (char_length(task) > 0),
  is_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sorgu performansı için index
create index if not exists todos_user_id_idx on public.todos (user_id);

-- Row Level Security: her kullanıcı yalnızca kendi todo'larını görür/yönetir
alter table public.todos enable row level security;

create policy "Kullanıcılar kendi todolarını görebilir"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "Kullanıcılar kendi todolarını ekleyebilir"
  on public.todos for insert
  with check (auth.uid() = user_id);

create policy "Kullanıcılar kendi todolarını güncelleyebilir"
  on public.todos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Kullanıcılar kendi todolarını silebilir"
  on public.todos for delete
  using (auth.uid() = user_id);
