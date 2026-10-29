// Bagian "akun" di halaman Profil (PRD F7): status masuk, keluar, hapus akun (BR-03).
// Tanpa gaya; Choirun yang menata. Dipasang di ProfilPage dengan <PanelAkun />.

import { useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { hapusAkun, keluar } from '../../lib/auth';
import { useSesi } from '../../lib/sesi';
import { useProgres } from '../../progres/ProgresProvider';

export function PanelAkun() {
  const { pengguna, memuat } = useSesi();
  const { hasilMigrasi } = useProgres();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  if (!supabase || memuat) return null;

  if (!pengguna) {
    return (
      <section aria-labelledby="akun-judul">
        <h2 id="akun-judul">Akun</h2>
        <p>Kamu belajar sebagai tamu. Masuk agar progresmu tersimpan dan ikut ke perangkat lain.</p>
        <Link to="/masuk">Masuk atau buat akun</Link>
      </section>
    );
  }

  async function hapus() {
    setSibuk(true);
    setPesan(null);
    const hasil = await hapusAkun();
    setSibuk(false);
    if (!hasil.ok) setPesan(hasil.pesan);
    // Berhasil: sesi hilang, useSesi menampilkan keadaan tamu.
  }

  return (
    <section aria-labelledby="akun-judul">
      <h2 id="akun-judul">Akun</h2>
      <p>Masuk sebagai {pengguna.email}</p>

      {hasilMigrasi === 'berhasil' && <p role="status">Progres belajarmu sebagai tamu sudah dipindahkan ke akun ini.</p>}
      {hasilMigrasi === 'gagal' && (
        <p role="status">
          Progres tamu belum bisa dipindahkan. Datanya aman di perangkat ini dan akan dicoba lagi saat kamu masuk berikutnya.
        </p>
      )}

      <button type="button" onClick={() => void keluar()}>
        Keluar
      </button>

      {!konfirmasi ? (
        <button type="button" onClick={() => setKonfirmasi(true)}>
          Hapus akun
        </button>
      ) : (
        <div role="alertdialog" aria-labelledby="akun-hapus-judul">
          <p id="akun-hapus-judul">Akun dan semua progresmu akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</p>
          <button type="button" onClick={() => void hapus()} disabled={sibuk}>
            Ya, hapus akun saya
          </button>
          <button type="button" onClick={() => setKonfirmasi(false)} disabled={sibuk}>
            Batal
          </button>
        </div>
      )}

      <p role="alert" hidden={!pesan}>
        {pesan}
      </p>
    </section>
  );
}