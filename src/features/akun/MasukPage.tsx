import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';

// F6: email + kata sandi atau Google (Supabase Auth). Setelah masuk pertama kali:
// gabungProgres(server, tamu) -> upsert -> kosongkanTamu().
// TODO(Emil): formulir, lupa kata sandi, migrasi.
export function MasukPage() {
  return (
    <>
      <Link to="/profil">✕ Tutup</Link>
      <h1>Masuk</h1>
      {!supabase && <p role="alert">Supabase belum dikonfigurasi (.env).</p>}
    </>
  );
}
