-- F8 Koin & Toko Aksa (T-13). Dompet milik pengguna: saldo koin, karakter yang dibeli,
-- dan kunci hadiah yang sudah diberikan (agar mengulang soal/titik tidak memberi koin lagi).
-- Harga dan hadiah ada di JSON frontend (src/content/toko.json), bukan di database.
-- Catatan (BR-06): nilai ditulis dari klien, jadi tidak tahan manipulasi; diterima untuk tugas kuliah.

create table public.user_wallet (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  coins int not null default 0 check (coins >= 0),
  owned_avatars int[] not null default '{}',
  rewarded text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_wallet enable row level security;

create policy "dompet sendiri: baca" on public.user_wallet for select using (user_id = auth.uid());
create policy "dompet sendiri: tambah" on public.user_wallet for insert with check (user_id = auth.uid());
create policy "dompet sendiri: ubah" on public.user_wallet for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Hapus akun (BR-03): baris ikut terhapus lewat ON DELETE CASCADE dari profiles.
