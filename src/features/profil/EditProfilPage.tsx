import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ICON_PROFIL } from './ModalGantiAvatar';
import { ModalGantiAvatar } from './ModalGantiAvatar';
import { useSesi } from '../../lib/sesi';
import { keluar, gantiSandi, masukEmail, perbaruiProfil } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export function EditProfilPage() {
  const navigate = useNavigate();
  const { pengguna } = useSesi();

  // Cek apakah akun terhubung via Google OAuth
  const isGoogleUser = Boolean(
    pengguna?.app_metadata?.provider === 'google' ||
    pengguna?.identities?.some((id) => id.provider === 'google'),
  );

  // Data profil dari localStorage / sesi
  const [namaUser, setNamaUser] = useState(() => {
    return (
      pengguna?.user_metadata?.full_name ||
      pengguna?.user_metadata?.name ||
      pengguna?.user_metadata?.display_name ||
      pengguna?.email?.split('@')[0] ||
      localStorage.getItem('namaUser') ||
      'Teman Belajar'
    );
  });
  const [emailUser, setEmailUser] = useState(() => {
    return pengguna?.email || localStorage.getItem('emailUser') || 'Belum diisi';
  });
  const [avatarId, setAvatarId] = useState(() => parseInt(localStorage.getItem('selectedAvatarId') || '1', 10));

  // Form edit informasi profil
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [inputNama, setInputNama] = useState(namaUser);
  const [inputEmail, setInputEmail] = useState(emailUser === 'Belum diisi' ? '' : emailUser);
  const [sedangSimpanInfo, setSedangSimpanInfo] = useState(false);

  // Sinkronkan nama & email ketika sesi aktif selesai dimuat atau diperbarui
  React.useEffect(() => {
    const nama =
      pengguna?.user_metadata?.full_name ||
      pengguna?.user_metadata?.name ||
      pengguna?.user_metadata?.display_name ||
      pengguna?.email?.split('@')[0] ||
      localStorage.getItem('namaUser') ||
      'Teman Belajar';
    const email = pengguna?.email || localStorage.getItem('emailUser') || 'Belum diisi';

    setNamaUser(nama);
    setEmailUser(email);
    if (!isEditingInfo) {
      setInputNama(nama);
      setInputEmail(email === 'Belum diisi' ? '' : email);
    }
  }, [pengguna, isEditingInfo]);

  // Form ganti kata sandi
  const [isPasswordOpen, setIsPasswordOpen] = useState(true);
  const [passSaatIni, setPassSaatIni] = useState('');
  const [passBaru, setPassBaru] = useState('');
  const [passUlang, setPassUlang] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sedangMemprosesSandi, setSedangMemprosesSandi] = useState(false);

  // Modal ganti avatar & pesan feedback
  const [modalAvatar, setModalAvatar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const avatarTerpilih = ICON_PROFIL.find((ic) => ic.id === avatarId) || ICON_PROFIL[0];
  const avatarDisplayName = avatarTerpilih.id === 1 ? 'Aksa' : avatarTerpilih.nama;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSimpanInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNama = inputNama.trim() || 'Teman Belajar';
    const finalEmail = pengguna?.email || inputEmail.trim() || 'Belum diisi';

    if (finalNama.length < 2) {
      showToast('Nama panggilan minimal 2 karakter.');
      return;
    }

    setSedangSimpanInfo(true);
    try {
      const hasil = await perbaruiProfil(finalNama);
      if (!hasil.ok) {
        showToast(hasil.pesan);
        return;
      }

      if (!pengguna) {
        if (finalEmail !== 'Belum diisi') {
          localStorage.setItem('emailUser', finalEmail);
        } else {
          localStorage.removeItem('emailUser');
        }
      }

      setNamaUser(finalNama);
      setEmailUser(finalEmail);
      setIsEditingInfo(false);
      showToast('Profil berhasil diperbarui!');
    } finally {
      setSedangSimpanInfo(false);
    }
  };

  const handleBatalInfo = () => {
    setInputNama(namaUser);
    setInputEmail(emailUser === 'Belum diisi' ? '' : emailUser);
    setIsEditingInfo(false);
  };

  const handlePeriksaPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isGoogleUser) {
      showToast('Akun Anda masuk menggunakan Google. Kata sandi dikelola oleh Google.');
      return;
    }

    if (!pengguna?.email) {
      showToast('Masuk atau daftar akun email terlebih dahulu untuk mengatur kata sandi.');
      return;
    }

    if (!passSaatIni) {
      showToast('Masukkan kata sandi saat ini.');
      return;
    }

    if (!passBaru) {
      showToast('Ketikkan kata sandi baru.');
      return;
    }

    // Validasi minimal 6 karakter
    if (passBaru.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (passBaru !== passUlang) {
      showToast('Ulangi kata sandi baru tidak cocok.');
      return;
    }

    setSedangMemprosesSandi(true);
    try {
      // Verifikasi kata sandi lama terlebih dahulu (berlaku untuk Supabase maupun mode lokal)
      const verif = await masukEmail(pengguna.email, passSaatIni);
      if (!verif.ok) {
        showToast('Kata sandi saat ini salah.');
        return;
      }

      const hasil = await gantiSandi(passBaru, pengguna.email);
      if (hasil.ok) {
        showToast('Kata sandi berhasil diperbarui!');
        setPassSaatIni('');
        setPassBaru('');
        setPassUlang('');
      } else {
        showToast(hasil.pesan);
      }
    } catch {
      showToast('Gagal mengubah kata sandi. Coba lagi.');
    } finally {
      setSedangMemprosesSandi(false);
    }
  };

  const [keluarSibuk, setKeluarSibuk] = useState(false);

  const handleLogout = async () => {
    if (keluarSibuk) return;
    setKeluarSibuk(true);
    await keluar('/masuk');
  };

  const handleSelectAvatar = (newId: number) => {
    setAvatarId(newId);
    localStorage.setItem('selectedAvatarId', String(newId));
    showToast('Avatar teman belajar diganti!');
  };

  return (
    <div className="profil-edit-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="edit-toast-banner" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Nav Bar: Tombol Kembali Bulat + Judul "Edit Profil" */}
      <div className="edit-nav-bar">
        <button
          type="button"
          className="btn-circle-nav-edit"
          onClick={() => navigate('/profil')}
          aria-label="Kembali ke profil"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="edit-page-title">Edit Profil</h1>
        <div style={{ width: '40px' }} aria-hidden="true" />
      </div>

      <div className="edit-scroll-body">
        {/* 2. Hero Avatar Card Berlatar Sage */}
        <div className="edit-avatar-sage-card">
          <div className="avatar-sage-center-wrapper">
            <button
              type="button"
              className="btn-avatar-ring-trigger"
              onClick={() => setModalAvatar(true)}
              aria-label="Ganti avatar"
              title="Klik untuk mengganti avatar"
            >
              <div className="avatar-circle-sage-ring avatar-sage-3d-stage">
                <img
                  key={avatarTerpilih.id}
                  src={avatarTerpilih.src}
                  alt={avatarTerpilih.nama}
                  className="avatar-sage-img avatar-sage-3d-img aksa-3d"
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/icon profile 1.svg';
                  }}
                />
              </div>

              {/* Badge Pensil Edit di Pojok Kanan Bawah Avatar */}
              <div className="avatar-edit-pencil-badge" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
            </button>
          </div>

          <h2 className="edit-user-name">{namaUser}</h2>
          <p className="edit-user-sub">{avatarDisplayName} · Teman belajar aksara Jawa</p>
        </div>

        {/* 3. Card Informasi Profil */}
        <div className="edit-card-white">
          <div className="edit-card-header">
            <h3 className="edit-card-title">Informasi profil</h3>
            {!isEditingInfo && (
              <button
                type="button"
                className="btn-edit-toggle"
                onClick={() => {
                  setInputNama(namaUser);
                  setInputEmail(emailUser === 'Belum diisi' ? '' : emailUser);
                  setIsEditingInfo(true);
                }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span>Edit</span>
              </button>
            )}
          </div>

          {!isEditingInfo ? (
            /* Mode Tampilan */
            <div className="info-display-fields">
              <div className="field-group">
                <span className="field-label-text">Nama panggilan</span>
                <span className="field-value-text">{namaUser}</span>
              </div>
              <div className="field-group">
                <span className="field-label-text">Email</span>
                <span className="field-value-text">{emailUser}</span>
              </div>
            </div>
          ) : (
            /* Mode Form Edit */
            <form onSubmit={handleSimpanInfo} className="info-edit-form">
              <div className="field-group">
                <label htmlFor="input-nama-panggilan" className="field-label-text">
                  Nama panggilan
                </label>
                <input
                  id="input-nama-panggilan"
                  type="text"
                  className="edit-text-input"
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  placeholder="Nama panggilanmu"
                  autoFocus
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="input-email-profil" className="field-label-text">
                  Email
                </label>
                <input
                  id="input-email-profil"
                  type="email"
                  className="edit-text-input"
                  value={pengguna?.email ?? inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="nama@email.com"
                  disabled={Boolean(pengguna?.email)}
                />
              </div>

              <p className="edit-form-note">
                {pengguna
                  ? 'Nama panggilan diperbarui pada profil akunmu. Email mengikuti akun masuk.'
                  : 'Mode tamu: perubahan tersimpan secara lokal di perangkat ini.'}
              </p>

              <div className="info-edit-actions">
                <button
                  type="button"
                  className="btn-batal-text"
                  onClick={handleBatalInfo}
                  disabled={sedangSimpanInfo}
                >
                  Batal
                </button>
                <button type="submit" className="btn-simpan-brown" disabled={sedangSimpanInfo}>
                  {sedangSimpanInfo ? 'Menyimpan...' : 'Simpan perubahan'}
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 4. Card Ganti Kata Sandi (Collapsible Accordion) */}
        <div className="edit-card-white">
          <button
            type="button"
            className="accordion-header-btn"
            onClick={() => setIsPasswordOpen(!isPasswordOpen)}
            aria-expanded={isPasswordOpen}
          >
            <div className="accordion-title-side">
              <div className="lock-badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#A15214" strokeWidth="2.2" width="20" height="20">
                  <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="lock-text-col">
                <span className="lock-title">Ganti kata sandi</span>
                <span className="lock-sub">
                  {isGoogleUser
                    ? 'Akun Google (kata sandi dikelola Google)'
                    : pengguna
                    ? 'Perbarui kata sandi akunmu'
                    : 'Masuk dengan akun email untuk menggunakan kata sandi'}
                </span>
              </div>
            </div>
            <div className={`accordion-chevron ${isPasswordOpen ? 'open' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7C7064" strokeWidth="2.5" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isPasswordOpen && (
            !pengguna ? (
              <div style={{ padding: '16px 0 6px', textAlign: 'left' }}>
                <div className="password-divider" />
                <div style={{
                  background: '#F3EFEA',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  color: '#685A4E',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}>
                  <span>
                    Kamu sedang belajar dalam <strong>Mode Tamu</strong>. Daftar atau masuk dengan akun email agar kata sandi dan progres belajarmu tersimpan aman.
                  </span>
                  <button
                    type="button"
                    className="btn-simpan-brown"
                    style={{ alignSelf: 'flex-start', padding: '8px 14px', fontSize: 12 }}
                    onClick={() => navigate('/masuk')}
                  >
                    Masuk / Daftar Akun →
                  </button>
                </div>
              </div>
            ) : isGoogleUser ? (
              <div style={{ padding: '16px 0 6px', textAlign: 'left' }}>
                <div className="password-divider" />
                <div style={{
                  background: '#F3EFEA',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#685A4E',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}>
                  <svg viewBox="0 0 20 20" fill="#A15214" width="18" height="18" style={{ flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Akun ini masuk menggunakan akun Google ({pengguna?.email}). Kata sandi dikelola langsung melalui pengaturan akun Google Anda.
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePeriksaPassword} className="password-form-body">
                <div className="password-divider" />

                <div className="field-group">
                  <label htmlFor="pass-saat-ini" className="field-label-text">
                    Kata sandi saat ini
                  </label>
                  <input
                    id="pass-saat-ini"
                    type={showPassword ? 'text' : 'password'}
                    className="edit-text-input"
                    value={passSaatIni}
                    onChange={(e) => setPassSaatIni(e.target.value)}
                    placeholder="Masukkan sandi saat ini"
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="pass-baru" className="field-label-text">
                    Kata sandi baru
                  </label>
                  <input
                    id="pass-baru"
                    type={showPassword ? 'text' : 'password'}
                    className="edit-text-input"
                    placeholder="Minimal 6 karakter"
                    value={passBaru}
                    onChange={(e) => setPassBaru(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="pass-ulang" className="field-label-text">
                    Ulangi kata sandi baru
                  </label>
                  <input
                    id="pass-ulang"
                    type={showPassword ? 'text' : 'password'}
                    className="edit-text-input"
                    placeholder="Minimal 6 karakter"
                    value={passUlang}
                    onChange={(e) => setPassUlang(e.target.value)}
                  />
                </div>

                {/* Toggle tampilkan kata sandi */}
                <button
                  type="button"
                  className="btn-toggle-eye-row"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}</span>
                </button>

                {!supabase && (
                  <p className="edit-form-note">
                    Mode lokal: kata sandi akun diperbarui di penyimpanan peramban ini.
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-periksa-perubahan-brown"
                  disabled={sedangMemprosesSandi}
                >
                  {sedangMemprosesSandi ? 'Memperbarui...' : 'Simpan kata sandi'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </button>
              </form>
            )
          )}
        </div>

        {/* 5. Tombol Aksi Akun di Bawah (Logout bila login, Masuk/Daftar bila tamu) */}
        {pengguna ? (
          <button
            type="button"
            className="btn-logout-peach"
            onClick={handleLogout}
            disabled={keluarSibuk}
            aria-label="Logout dari akun"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{keluarSibuk ? 'Keluar...' : 'Logout'}</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-periksa-perubahan-brown"
            onClick={() => navigate('/masuk')}
            aria-label="Masuk atau daftar akun"
          >
            <span>Masuk atau Daftar Akun</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* Modal Ganti Avatar */}
      <ModalGantiAvatar
        isOpen={modalAvatar}
        onClose={() => setModalAvatar(false)}
        activeAvatarId={avatarId}
        onSelectAvatar={handleSelectAvatar}
      />
    </div>
  );
}
