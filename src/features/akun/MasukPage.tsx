import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { daftarEmail, gantiSandi, lupaSandi, masukEmail, masukGoogle } from '../../lib/auth';
import { useSesi } from '../../lib/sesi';

export function MasukPage() {
  const { pengguna } = useSesi();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const modeAwal = searchParams.get('mode') || (window.location.pathname.includes('daftar') ? 'daftar' : 'masuk');

  const [mode, setMode] = useState<'masuk' | 'daftar' | 'lupa' | 'ganti-sandi'>(
    modeAwal === 'ganti-sandi' ? 'ganti-sandi' : modeAwal === 'daftar' ? 'daftar' : 'masuk',
  );
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [lihatSandi, setLihatSandi] = useState(false);
  const [setujuDemo, setSetujuDemo] = useState(true);
  const [pesan, setPesan] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  // Jika sudah login, arahkan ke beranda aplikasi (/belajar)
  if (pengguna && (mode === 'masuk' || mode === 'daftar')) {
    return <Navigate to="/belajar" replace />;
  }

  const handleKembali = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/intro');
    }
  };

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

    if (mode === 'daftar' && nama.trim()) {
      localStorage.setItem('namaUser', nama.trim());
    }

    // Mode demo / offline tanpa Supabase: simpan identitas dan lanjutkan ke beranda
    if (!supabase) {
      if (!localStorage.getItem('namaUser')) {
        localStorage.setItem('namaUser', 'Kenji Morales');
      }
      navigate('/belajar');
      return;
    }

    setSibuk(true);
    const hasil =
      mode === 'masuk'
        ? await masukEmail(email.trim(), sandi)
        : await daftarEmail(email.trim(), sandi);
    setSibuk(false);

    if (!hasil.ok) {
      setPesan(hasil.pesan);
    } else if (hasil.butuhKonfirmasi) {
      setInfo('Cek email kamu dan klik tautan konfirmasi, lalu masuk.');
      setMode('masuk');
    } else {
      navigate('/belajar');
    }
  }

  async function denganGoogle() {
    setPesan(null);
    if (!supabase) {
      if (!localStorage.getItem('namaUser')) {
        localStorage.setItem('namaUser', 'Kenji Morales');
      }
      navigate('/belajar');
      return;
    }
    const { error } = await masukGoogle();
    if (error) setPesan('Masuk dengan Google belum berhasil. Coba lagi.');
  }

  const isDaftar = mode === 'daftar';
  const isMasuk = mode === 'masuk';

  return (
    <div className={`auth-page ${isDaftar ? 'auth-page-regist' : 'auth-page-masuk'}`}>
      {/* 1. Header: Back Arrow + Logo AksaraLensa */}
      <header className="auth-header">
        <button
          type="button"
          className={`btn-circle-nav-auth ${isDaftar ? 'btn-circle-nav-lime' : 'btn-circle-nav-mint'}`}
          onClick={handleKembali}
          aria-label="Kembali"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="auth-brand-lockup">
          <span className="brand-bold">Aksara</span>
          <span className="brand-regular">lensa</span>
        </span>
      </header>

      {/* 2. Maskot Header */}
      <div className={`auth-mascot-container ${isDaftar ? 'mascot-regist' : 'mascot-login'}`}>
        <img
          src={isDaftar ? '/assets/maskot regist.svg' : '/assets/maskot login.svg'}
          alt={isDaftar ? 'Maskot Registrasi' : 'Maskot Masuk'}
          className="auth-mascot-img"
          draggable={false}
        />
      </div>

      {/* 3. Judul & Subjudul */}
      <div className="auth-title-container">
        <h1 className={`auth-title ${isDaftar ? 'auth-title-dark' : 'auth-title-brown'}`}>
          {isDaftar
            ? 'Siap kenal aksa?'
            : mode === 'masuk'
            ? 'Lanjut cerita aksaramu.'
            : mode === 'lupa'
            ? 'Lupa kata sandi?'
            : 'Ubah kata sandi'}
        </h1>
        <p className={`auth-sub ${isDaftar ? 'auth-sub-lime' : 'auth-sub-mint'}`}>
          {isDaftar
            ? 'Buat profilmu, mulai langkah pertamamu.'
            : mode === 'masuk'
            ? 'Masuk dan teruskan perjalanan belajarmu.'
            : mode === 'lupa'
            ? 'Masukkan email untuk menerima tautan pemulihan.'
            : 'Ketikkan kata sandi baru untuk akunmu.'}
        </p>
      </div>

      {/* 4. Google Auth Button (Daftar / Masuk) */}
      {(isMasuk || isDaftar) && (
        <button
          type="button"
          className={`btn-google-auth ${isDaftar ? 'btn-google-lime' : 'btn-google-white'}`}
          onClick={denganGoogle}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.27-2.09 3.645-5.18 3.645-9.15z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.73-2.09-6.67-4.9H1.28v3.15C3.27 21.35 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.33 14.3c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3V6.55H1.28C.46 8.18 0 10.03 0 12s.46 3.82 1.28 5.45l4.05-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.65 1.28 6.55l4.05 3.15c.94-2.81 3.57-4.95 6.67-4.95z"/>
          </svg>
          <span>{isDaftar ? 'Daftar dengan Google' : 'Masuk dengan Google'}</span>
        </button>
      )}

      {/* Divider */}
      {(isMasuk || isDaftar) && (
        <div className={`auth-divider ${isDaftar ? 'auth-divider-lime' : 'auth-divider-mint'}`}>
          <span>atau gunakan email</span>
        </div>
      )}

      {/* 5. Form Input */}
      <form className="auth-form" onSubmit={kirim} noValidate>
        {isDaftar && (
          <div className="form-group">
            <label className="form-label-lime" htmlFor="daftar-nama">Nama panggilan</label>
            <input
              id="daftar-nama"
              type="text"
              className="auth-input auth-input-lime"
              placeholder="Siapa namamu?"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}

        {mode !== 'ganti-sandi' && (
          <div className="form-group">
            <label className={isDaftar ? 'form-label-lime' : 'form-label-mint'} htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              className={`auth-input ${isDaftar ? 'auth-input-lime' : 'auth-input-white'}`}
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        {mode !== 'lupa' && (
          <div className="form-group">
            <div className="label-row">
              <label className={isDaftar ? 'form-label-lime' : 'form-label-mint'} htmlFor="auth-sandi">
                Kata sandi
              </label>
              {isMasuk && (
                <button
                  type="button"
                  className="link-btn-text"
                  onClick={() => {
                    setMode('lupa');
                    setPesan(null);
                    setInfo(null);
                  }}
                >
                  Lupa kata sandi?
                </button>
              )}
            </div>
            <div className="password-input-wrapper">
              <input
                id="auth-sandi"
                type={lihatSandi ? 'text' : 'password'}
                autoComplete={isMasuk ? 'current-password' : 'new-password'}
                required
                minLength={6}
                className={`auth-input ${isDaftar ? 'auth-input-lime' : 'auth-input-white'}`}
                placeholder={isDaftar ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setLihatSandi(!lihatSandi)}
                aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {lihatSandi ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {isDaftar && (
          <label className="checkbox-demo-row">
            <input
              type="checkbox"
              className="checkbox-custom"
              checked={setujuDemo}
              onChange={(e) => setSetujuDemo(e.target.checked)}
            />
            <span className="checkbox-label-text">
              Saya mengerti ini mode demo, bukan pendaftaran akun sungguhan.
            </span>
          </label>
        )}

        {/* Status Pesan / Error */}
        {pesan && <div className="auth-alert error" role="alert">{pesan}</div>}
        {info && <div className="auth-alert success" role="status">{info}</div>}

        {/* Tombol Aksi Utama */}
        <button
          type="submit"
          className="btn-auth-submit btn-auth-submit-brown"
          disabled={sibuk}
        >
          {sibuk
            ? 'Memproses...'
            : isDaftar
            ? 'Daftar'
            : isMasuk
            ? 'Masuk'
            : mode === 'lupa'
            ? 'Kirim tautan reset'
            : 'Simpan kata sandi'}
        </button>
      </form>

      {/* 6. Footer Switch */}
      <div className="auth-footer-switch">
        {isMasuk && (
          <span>
            Belum punya akun?{' '}
            <button
              type="button"
              className="auth-link-bold"
              onClick={() => {
                setMode('daftar');
                setPesan(null);
                setInfo(null);
              }}
            >
              Daftar sekarang
            </button>
          </span>
        )}
        {isDaftar && (
          <span>
            Sudah punya akun?{' '}
            <button
              type="button"
              className="auth-link-bold"
              onClick={() => {
                setMode('masuk');
                setPesan(null);
                setInfo(null);
              }}
            >
              Masuk
            </button>
          </span>
        )}
        {(mode === 'lupa' || mode === 'ganti-sandi') && (
          <button
            type="button"
            className="auth-link-bold"
            onClick={() => {
              setMode('masuk');
              setPesan(null);
              setInfo(null);
            }}
          >
            Kembali ke Masuk
          </button>
        )}
      </div>
    </div>
  );
}