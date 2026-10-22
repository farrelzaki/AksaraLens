-- F6/F7 + BR-03: hapus akun menghapus semua baris milik pengguna.
-- Menghapus auth.users; profiles, lesson_progress, letter_stats ikut terhapus
-- lewat ON DELETE CASCADE. Hanya memakai auth.uid(), jadi hanya akun sendiri.
create or replace function public.hapus_akun()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.hapus_akun() from public, anon;
grant execute on function public.hapus_akun() to authenticated;