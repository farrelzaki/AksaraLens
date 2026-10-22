import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { daftarEmail, gantiSandi, lupaSandi, masukEmail, masukGoogle } from '../../lib/auth';
import { useSesi } from '../../lib/sesi';
// F6: email + kata sandi atau Google (Supabase Auth). Setelah masuk pertama kali:
// gabungProgres(server, tamu) -> upsert -> kosongkanTamu().
// Migrasi tamu -> akun dijalankan ProgresProvider (migrasiTamu) begitu sesi terbentuk,
// jadi halaman ini cukup mengurus masuk/daftar.

export function MasukPage() {
  const { pengguna, memuat } = useSesi();
  const modeAwal = new URLSearchParams(window.location.search).get('mode');
  const [mode, setMode] = useState<'masuk' | 'daftar' | 'lupa' | 'ganti-sandi'>(
    modeAwal === 'ganti-sandi' ? 'ganti-sandi' : 'masuk',
  );
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [pesan, setPesan] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  // Sudah masuk (email, atau kembali dari Google): tidak perlu di halaman ini.
  if (pengguna && (mode === 'masuk' || mode === 'daftar')) return <Navigate to="/profil" replace />;
  if (mode === 'ganti-sandi' && memuat) return <p>Memuat...</p>;
  if (mode === 'ganti-sandi' && !memuat && !pengguna && supabase) {
    return (
      <>
        <Link to="/profil">✕ Tutup</Link>
        <h1>Ubah kata sandi</h1>
        <p role="alert">Tautan reset sudah tidak berlaku. Minta tautan baru untuk mengatur ulang kata sandi.</p>
        <button type="button" onClick={() => setMode('lupa')}>
          Minta tautan reset baru
        </button>
      </>
    );
  }

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setPesan(null);
    setInfo(null);

    if (mode === 'lupa') {
      if (!email.trim()) {
        setPesan('Masukkan email akunmu.');
        return;
      }
      setSibuk(true);
      const hasil = await lupaSandi(email.trim());
      setSibuk(false);
      if (!hasil.ok) setPesan(hasil.pesan);
      else {
        setInfo('Tautan untuk mengatur ulang kata sandi sudah dikirim. Cek email kamu.');
        setMode('masuk');
      }
      return;
    }

    if (mode === 'ganti-sandi') {
      if (sandi.length < 6) {
        setPesan('Kata sandi minimal 6 karakter.');
        return;
      }
      setSibuk(true);
      const hasil = await gantiSandi(sandi);
      setSibuk(false);
      if (!hasil.ok) setPesan(hasil.pesan);
      else {
        setInfo('Kata sandi berhasil diubah.');
        setMode('masuk');
      }
      return;
    }

    if (sandi.length < 6) {
      setPesan('Kata sandi minimal 6 karakter.');
      return;
    }
    setSibuk(true);
    const hasil = mode === 'masuk' ? await masukEmail(email.trim(), sandi) : await daftarEmail(email.trim(), sandi);
    setSibuk(false);
    if (!hasil.ok) {
      setPesan(hasil.pesan);
    } else if (hasil.butuhKonfirmasi) {
      setInfo('Cek email kamu dan klik tautan konfirmasi, lalu masuk.');
      setMode('masuk');
    }
    // Berhasil tanpa konfirmasi: sesi terbentuk, useSesi memicu <Navigate> di atas.
  }

  async function denganGoogle() {
    setPesan(null);
    const { error } = await masukGoogle(); // berhasil = halaman dialihkan ke Google
    if (error) setPesan('Masuk dengan Google belum berhasil. Coba lagi.');
  }

  const masukMode = mode === 'masuk';
  const modeSandi = mode === 'ganti-sandi';
  const modeLupa = mode === 'lupa';
  const judul = {
    masuk: 'Masuk',
    daftar: 'Buat akun',
    lupa: 'Lupa kata sandi',
    'ganti-sandi': 'Ubah kata sandi',
  }[mode];
  const teksTombol = {
    masuk: 'Masuk',
    daftar: 'Daftar',
    lupa: 'Kirim tautan reset',
    'ganti-sandi': 'Simpan kata sandi',
  }[mode];

  return (
    <>
      <Link to="/profil">✕ Tutup</Link>
      <h1>{judul}</h1>
      {!supabase && <p role="alert">Supabase belum dikonfigurasi (.env).</p>}

      {supabase && (
        <>
          {!modeSandi && <p>Akun dipakai untuk menyimpan progres belajarmu. Tanpa akun pun kamu tetap bisa belajar.</p>}

          <form onSubmit={kirim} noValidate>
            {!modeSandi && (
              <>
                <label htmlFor="masuk-email">Email</label>
                <input
                  id="masuk-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </>
            )}

            {!modeLupa && (
              <>
                <label htmlFor="masuk-sandi">Kata sandi</label>
                <input
                  id="masuk-sandi"
                  type="password"
                  autoComplete={masukMode ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                />
              </>
            )}

            <p role="alert" hidden={!pesan}>
              {pesan}
            </p>
            <p role="status" hidden={!info}>
              {info}
            </p>

            <button type="submit" disabled={sibuk}>
              {teksTombol}
            </button>
          </form>

          {masukMode && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('lupa');
                  setPesan(null);
                  setInfo(null);
                }}
              >
                Lupa kata sandi?
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('daftar');
                  setPesan(null);
                  setInfo(null);
                }}
              >
                Belum punya akun? Daftar
              </button>
            </>
          )}

          {mode === 'daftar' && (
            <button
              type="button"
              onClick={() => {
                setMode('masuk');
                setPesan(null);
                setInfo(null);
              }}
            >
              Sudah punya akun? Masuk
            </button>
          )}

          {(modeLupa || modeSandi) && (
            <button
              type="button"
              onClick={() => {
                setMode('masuk');
                setPesan(null);
                setInfo(null);
              }}
            >
              Kembali ke Masuk
            </button>
          )}

          {(masukMode || mode === 'daftar') && (
            <button
              type="button"
              onClick={denganGoogle}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                marginTop: '1rem',
                cursor: 'pointer'
              }}
            >
              🔐 Masuk dengan Google
            </button>
          )}
        </>
      )}
    </>
  );
}