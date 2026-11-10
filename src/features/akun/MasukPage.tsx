import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router';
import { supabase } from '../../lib/supabase';
import { daftarEmail, gantiSandi, lupaSandi, masukEmail, masukGoogle } from '../../lib/auth';
import { useSesi } from '../../lib/sesi';

interface MasukPageProps {
  modeDefault?: 'masuk' | 'daftar';
}

export function MasukPage({ modeDefault }: MasukPageProps) {
  const { pengguna } = useSesi();
  const navigate = useNavigate();
  const location = useLocation();

  const queryMode = new URLSearchParams(location.search).get('mode');
  const pathMode = location.pathname.includes('daftar') ? 'daftar' : 'masuk';
  const initialMode =
    queryMode === 'ganti-sandi'
      ? 'ganti-sandi'
      : queryMode === 'daftar'
      ? 'daftar'
      : modeDefault || pathMode;

  const [mode, setMode] = useState<'masuk' | 'daftar' | 'lupa' | 'ganti-sandi'>(initialMode);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [lihatSandi, setLihatSandi] = useState(false);
  const [setujuDemo, setSetujuDemo] = useState(true);

  const [pesan, setPesan] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  // Jika sudah login dan bukan mode ganti-sandi, arahkan ke beranda
  if (pengguna && (mode === 'masuk' || mode === 'daftar')) {
    return <Navigate to="/belajar" replace />;
  }

  const handleKembali = () => {
    if (mode === 'lupa' || mode === 'ganti-sandi') {
      setMode('masuk');
      setPesan(null);
      setInfo(null);
      return;
    }
    navigate('/intro');
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

    // Mode demo / offline tanpa Supabase
    if (!supabase) {
      if (!localStorage.getItem('namaUser')) {
        localStorage.setItem('namaUser', nama.trim() || 'Kenji Morales');
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
      navigate('/belajar', { replace: true });
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

  // ============================
  // DAFTAR (REGIST.png) — LIME
  // ============================
  if (isDaftar) {
    return (
      <div className="auth-page auth-page-regist">
        {/* Header */}
        <header className="auth-header">
          <button
            type="button"
            className="btn-circle-nav-auth btn-circle-nav-lime"
            onClick={handleKembali}
            aria-label="Kembali"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="auth-brand-lockup">
            <span className="brand-bold">Aksara</span>
            <span className="brand-regular">Lensa</span>
          </div>
        </header>

        {/* Maskot */}
        <div className="auth-mascot-container mascot-regist">
          <img
            src="/assets/maskot regist.svg"
            alt="Maskot Aksa mendaftar"
            className="auth-mascot-img"
            draggable={false}
          />
        </div>

        {/* Judul */}
        <div className="auth-title-container">
          <h1 className="auth-title auth-title-dark">Siap kenal aksa?</h1>
          <p className="auth-sub auth-sub-lime">Buat profilmu, mulai langkah pertamamu.</p>
        </div>

        {/* Google Button */}
        <button
          type="button"
          className="btn-google-auth btn-google-lime"
          onClick={denganGoogle}
          disabled={sibuk}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Daftar dengan Google</span>
        </button>

        <div className="auth-divider auth-divider-lime">
          <span>atau gunakan email</span>
        </div>

        {/* Form */}
        <form onSubmit={kirim} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="auth-nama" className="form-label-lime">Nama panggilan</label>
            <input
              id="auth-nama"
              type="text"
              autoComplete="name"
              placeholder="Siapa namamu?"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="auth-input auth-input-lime"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-email" className="form-label-lime">Email</label>
            <input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nama@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input auth-input-lime"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-sandi" className="form-label-lime">Kata sandi</label>
            <div className="password-input-wrapper">
              <input
                id="auth-sandi"
                type={lihatSandi ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                className="auth-input auth-input-lime"
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setLihatSandi(!lihatSandi)}
                aria-label={lihatSandi ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
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

          {!supabase && (
            <label className="checkbox-demo-row">
              <input
                type="checkbox"
                checked={setujuDemo}
                onChange={(e) => setSetujuDemo(e.target.checked)}
                className="checkbox-custom"
              />
              <span className="checkbox-label-text">
                Saya mengerti ini mode demo, bukan pendaftaran akun sungguhan.
              </span>
            </label>
          )}

          {pesan && (
            <div className="auth-alert error" role="alert">
              <div>{pesan}</div>
              {pesan.toLowerCase().includes('sudah terdaftar') && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="auth-link-bold"
                    style={{ textDecoration: 'underline', color: 'inherit' }}
                    onClick={denganGoogle}
                  >
                    Masuk dengan Google
                  </button>
                  <span>atau</span>
                  <button
                    type="button"
                    className="auth-link-bold"
                    style={{ textDecoration: 'underline', color: 'inherit' }}
                    onClick={() => {
                      setMode('masuk');
                      setPesan(null);
                    }}
                  >
                    Beralih ke Masuk
                  </button>
                </div>
              )}
            </div>
          )}
          {info && (
            <div className="auth-alert success" role="status">{info}</div>
          )}

          <button type="submit" className="btn-auth-submit btn-auth-submit-brown" disabled={sibuk}>
            {sibuk ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <footer className="auth-footer-switch">
          <p>
            Sudah punya akun?{' '}
            <button
              type="button"
              className="auth-link-bold auth-link-dark"
              onClick={() => {
                setMode('masuk');
                setPesan(null);
                setInfo(null);
              }}
            >
              Masuk
            </button>
          </p>
        </footer>
      </div>
    );
  }

  // ============================
  // MASUK (LOGIN.png) — MINT
  // ============================
  return (
    <div className="auth-page auth-page-masuk">
      {/* Header */}
      <header className="auth-header">
        <button
          type="button"
          className="btn-circle-nav-auth btn-circle-nav-mint"
          onClick={handleKembali}
          aria-label="Kembali"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="auth-brand-lockup">
          <span className="brand-bold">Aksara</span>
          <span className="brand-regular">Lensa</span>
        </div>
      </header>

      {/* Maskot */}
      <div className="auth-mascot-container mascot-login">
        <img
          src="/assets/maskot login.svg"
          alt="Maskot Aksa masuk"
          className="auth-mascot-img"
          draggable={false}
        />
      </div>

      {/* Judul */}
      <div className="auth-title-container">
        <h1 className="auth-title auth-title-brown">
          {mode === 'lupa'
            ? 'Lupa kata sandi?'
            : mode === 'ganti-sandi'
            ? 'Ubah kata sandi'
            : 'Lanjut cerita aksaramu.'}
        </h1>
        <p className="auth-sub auth-sub-mint">
          {mode === 'lupa'
            ? 'Masukkan email untuk menerima tautan pemulihan.'
            : mode === 'ganti-sandi'
            ? 'Ketikkan kata sandi baru untuk akunmu.'
            : 'Masuk dan teruskan perjalanan belajarmu.'}
        </p>
      </div>

      {/* Google Button */}
      {isMasuk && (
        <button
          type="button"
          className="btn-google-auth btn-google-white"
          onClick={denganGoogle}
          disabled={sibuk}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Masuk dengan Google</span>
        </button>
      )}

      {isMasuk && (
        <div className="auth-divider auth-divider-mint">
          <span>atau gunakan email</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={kirim} className="auth-form" noValidate>
        {mode !== 'ganti-sandi' && (
          <div className="form-group">
            <label htmlFor="auth-email-login" className="form-label-mint">Email</label>
            <input
              id="auth-email-login"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nama@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input auth-input-white"
            />
          </div>
        )}

        {mode !== 'lupa' && (
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="auth-sandi-login" className="form-label-mint">Kata sandi</label>
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
                id="auth-sandi-login"
                type={lihatSandi ? 'text' : 'password'}
                autoComplete={isMasuk ? 'current-password' : 'new-password'}
                placeholder={mode === 'ganti-sandi' ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
                required
                minLength={6}
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                className="auth-input auth-input-white"
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setLihatSandi(!lihatSandi)}
                aria-label={lihatSandi ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
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

        {pesan && (
          <div className="auth-alert error" role="alert">
            <div>{pesan}</div>
            {pesan.toLowerCase().includes('sudah terdaftar') && (
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="auth-link-bold"
                  style={{ textDecoration: 'underline', color: 'inherit' }}
                  onClick={denganGoogle}
                >
                  Masuk dengan Google
                </button>
              </div>
            )}
          </div>
        )}
        {info && (
          <div className="auth-alert success" role="status">{info}</div>
        )}

        <button type="submit" className="btn-auth-submit btn-auth-submit-brown" disabled={sibuk}>
          {sibuk
            ? 'Memproses...'
            : isMasuk
            ? 'Masuk'
            : mode === 'lupa'
            ? 'Kirim tautan reset'
            : 'Simpan kata sandi'}
        </button>
      </form>

      <footer className="auth-footer-switch">
        {isMasuk && (
          <p>
            Belum punya akun?{' '}
            <button
              type="button"
              className="auth-link-bold auth-link-dark-underline"
              onClick={() => {
                setMode('daftar');
                setPesan(null);
                setInfo(null);
              }}
            >
              Daftar sekarang
            </button>
          </p>
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
      </footer>
    </div>
  );
}
