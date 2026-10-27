import { Link } from 'react-router';
import { hurufDariKode } from '../../aksara/huruf';
import { hurufSeringSalah } from '../../progres/model';
import { useProgres } from '../../progres/ProgresProvider';
import { TentangSumber } from './TentangSumber';
import { useState, type FormEvent } from 'react';
import { gantiSandi, hapusAkun as hapusAkunSupabase, keluar } from '../../lib/auth';
import { useSesi } from '../../lib/sesi';

// F7: huruf sering salah, akun, tentang & sumber data. Tidak menampilkan progres per bab.

export function ProfilPage() {
  const { stats } = useProgres();
  const { pengguna, memuat: sedangMemuat } = useSesi();
  const lemah = hurufSeringSalah(stats);
  const [ubahSandi, setUbahSandi] = useState(false);
  const [sandiBaru, setSandiBaru] = useState('');
  const [pesanAkun, setPesanAkun] = useState<string | null>(null);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);

  async function simpanSandi(e: FormEvent) {
    e.preventDefault();
    setPesanAkun(null);
    if (sandiBaru.length < 6) {
      setPesanAkun('Kata sandi minimal 6 karakter.');
      return;
    }

    setSedangMenyimpan(true);
    try {
      const hasil = await gantiSandi(sandiBaru);
      if (!hasil.ok) setPesanAkun(hasil.pesan);
      else {
        setPesanAkun('Kata sandi berhasil diubah.');
        setSandiBaru('');
        setUbahSandi(false);
      }
    } catch {
      setPesanAkun('Kata sandi belum berhasil diubah. Coba lagi.');
    } finally {
      setSedangMenyimpan(false);
    }
  }

  async function keluarAkun() {
    setPesanAkun(null);
    setSedangMenyimpan(true);
    try {
      const hasil = await keluar();
      if (hasil?.error) setPesanAkun('Belum berhasil keluar. Coba lagi.');
    } catch {
      setPesanAkun('Belum berhasil keluar. Coba lagi.');
    } finally {
      setSedangMenyimpan(false);
    }
  }

  async function hapusAkun() {
    setPesanAkun(null);
    setSedangMenyimpan(true);
    try {
      const hasil = await hapusAkunSupabase();
      if (!hasil.ok) setPesanAkun(hasil.pesan);
    } catch {
      setPesanAkun('Akun belum berhasil dihapus. Coba lagi.');
    } finally {
      setSedangMenyimpan(false);
    }
  }

  if (sedangMemuat) return <p>Memuat...</p>;

  return (
    <>
      <h1>Profil</h1>
      <section>
        <h2>Huruf sering salah</h2>
        {lemah.length === 0 ? (
          <p>Belum ada data.</p>
        ) : (
          <ul>
            {lemah.map((s) => {
              const bab = hurufDariKode(s.letter)?.bab;
              return (
                <li key={s.letter}>
                  <Link to={`/belajar/materi/${bab}#${s.letter}`}>{s.letter}</Link> — salah {s.wrong} dari {s.correct + s.wrong}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2>Akun</h2>
        {!pengguna ? (
          <>
            <p>Anda sedang masuk sebagai tamu</p>
            <Link to="/masuk">Masuk / daftar</Link>
          </>
        ) : (
          <>
            <p>
              Halo, <strong>{pengguna.user_metadata?.full_name || pengguna.email}</strong>
            </p>
            <p>Email: {pengguna.email}</p>
            <button
              type="button"
              onClick={() => void keluarAkun()}
              disabled={sedangMenyimpan}
              style={{ padding: '0.5rem 1rem', marginTop: '0.5rem' }}
            >
              Keluar
            </button>
            <button
              type="button"
              onClick={() => {
                setUbahSandi((tampil) => !tampil);
                setPesanAkun(null);
              }}
              disabled={sedangMenyimpan}
            >
              Ubah Kata Sandi
            </button>
            {ubahSandi && (
              <form onSubmit={simpanSandi} noValidate>
                <label htmlFor="profil-sandi-baru">Kata sandi baru</label>
                <input
                  id="profil-sandi-baru"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={sandiBaru}
                  onChange={(e) => setSandiBaru(e.target.value)}
                />
                <button type="submit" disabled={sedangMenyimpan}>
                  Simpan Kata Sandi
                </button>
              </form>
            )}
            <section aria-labelledby="hapus-akun-judul">
              <h3 id="hapus-akun-judul">Hapus Akun</h3>
              {!konfirmasiHapus ? (
                <button
                  type="button"
                  onClick={() => setKonfirmasiHapus(true)}
                  disabled={sedangMenyimpan}
                  style={{ color: 'white', backgroundColor: '#b91c1c', padding: '0.5rem 1rem' }}
                >
                  Hapus Akun Saya
                </button>
              ) : (
                <div role="alertdialog" aria-labelledby="konfirmasi-hapus-akun">
                  <p id="konfirmasi-hapus-akun">
                    Yakin ingin menghapus akun? Semua data akan hilang dan tidak bisa dikembalikan.
                  </p>
                  <button type="button" onClick={() => void hapusAkun()} disabled={sedangMenyimpan}>
                    Ya, hapus akun
                  </button>
                  <button
                    type="button"
                    onClick={() => setKonfirmasiHapus(false)}
                    disabled={sedangMenyimpan}
                  >
                    Batal
                  </button>
                </div>
              )}
            </section>
            {pesanAkun && <p role="status">{pesanAkun}</p>}
          </>
        )}
      </section>
      <TentangSumber />
    </>
  );
}