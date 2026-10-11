-- Skema AksaraLens (PRD, Model data & keamanan). Pemilik: Emil.
-- Hanya data milik pengguna; konten belajar ada di JSON frontend.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  status text not null default 'completed' check (status = 'completed'),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.letter_stats (
  user_id uuid not null references public.profiles (id) on delete cascade,
  letter text not null,
  correct int not null default 0 check (correct >= 0),
  wrong int not null default 0 check (wrong >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, letter)
);

-- RLS: pengguna hanya select/insert/update baris miliknya sendiri.
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.letter_stats enable row level security;

create policy "profil sendiri: baca" on public.profiles for select using (id = auth.uid());
create policy "profil sendiri: ubah" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "progres sendiri: baca" on public.lesson_progress for select using (user_id = auth.uid());
create policy "progres sendiri: tambah" on public.lesson_progress for insert with check (user_id = auth.uid());
create policy "progres sendiri: ubah" on public.lesson_progress for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "stat sendiri: baca" on public.letter_stats for select using (user_id = auth.uid());
create policy "stat sendiri: tambah" on public.letter_stats for insert with check (user_id = auth.uid());
create policy "stat sendiri: ubah" on public.letter_stats for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Baris profiles dibuat otomatis saat pengguna baru mendaftar.
create function public.buat_profil_baru() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger saat_pengguna_baru
  after insert on auth.users
  for each row execute function public.buat_profil_baru();

-- Hapus akun: menghapus auth.users -> cascade ke profiles -> progres & statistik.
-- Penghapusan auth.users butuh service role, jadi lewat Edge Function/RPC (TODO Emil).
