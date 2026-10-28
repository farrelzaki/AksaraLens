import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BAB, JALUR } from '../../content';
import { useProgres } from '../../progres/ProgresProvider';
import { ICON_PROFIL } from '../profil/ProfilPage';

// F1: Homepage sesuai HOMEPAGE.png — kartu per bab dengan maskot & avatar terpilih
export function BelajarPage() {
  const { status } = useProgres();
  const navigate = useNavigate();
  const [pesan, setPesan] = useState<string | null>(null);

  // Ambil nama pengguna dari localStorage (default 'Kenji Morales' sesuai HOMEPAGE.png)
  const namaUser = localStorage.getItem('namaUser') || 'Kenji Morales';

  // Manajemen avatar: ambil dari localStorage (default ID = 1)
  const savedAvatarId = parseInt(localStorage.getItem('selectedAvatarId') || '1', 10);
  const [activeAvatarId, setActiveAvatarId] = useState(savedAvatarId);
  const [tempAvatarId, setTempAvatarId] = useState(savedAvatarId);
  const [modalAvatar, setModalAvatar] = useState(false);

  const avatarTerpilih = ICON_PROFIL.find((ic) => ic.id === activeAvatarId) || ICON_PROFIL[0];

  const handleSimpanAvatar = () => {
    setActiveAvatarId(tempAvatarId);
    localStorage.setItem('selectedAvatarId', String(tempAvatarId));
    setModalAvatar(false);
  };

  // Hitung progres per bab
  const progresBab = BAB.map((bab) => {
    const titikBab = JALUR.filter((t) => t.bab === bab.bab);
    const selesai = titikBab.filter((t) => status.get(t.id) === 'selesai').length;
    const total = titikBab.length;
    const persenVal = total > 0 ? Math.round((selesai / total) * 100) : 0;
    const semua = total > 0 && selesai === total;
    return { ...bab, selesai, total, persen: persenVal, semua };
  });

  // Tema dan maskot per bab
  const babTheme = [
    { theme: 'theme-bab1', maskot: '/assets/maskot homepage bab 1.svg', judul: 'Aksara Nglegena', desc: 'Kenali 20 aksara dasar' },
    { theme: 'theme-bab2', maskot: '/assets/maskot homepage bab 2.svg', judul: 'Sandhangan Swara', desc: 'Ubah bunyi dengan sandhangan' },
    { theme: 'theme-bab3', maskot: '/assets/maskot homepage bab 3.svg', judul: 'Panyigeg & Pangkon', desc: 'Lengkapi bunyi akhir kata' },
  ];

  const handleKlikBab = (babNomor: number) => {
    navigate(`/belajar/materi/${babNomor}`);
  };

  return (
    <div className="home-container">
      {/* 1. Header: Avatar Icon Profil (bisa diklik untuk ganti avatar) + Salam */}
      <header className="home-header">
        <button
          className="avatar-btn"
          onClick={() => {
            setTempAvatarId(activeAvatarId);
            setModalAvatar(true);
          }}
          aria-label="Pilih avatar teman belajar"
          title="Klik untuk memilih teman belajar"
        >
          <div className="avatar-profil-circle">
            <img
              src={avatarTerpilih.src}
              alt={avatarTerpilih.nama}
              className="avatar-profil-img"
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/icon profile 1.svg';
              }}
            />
          </div>
        </button>
        <div
          className="home-greeting"
          onClick={() => navigate('/profil')}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          title="Buka profil saya"
          onKeyDown={(e) => e.key === 'Enter' && navigate('/profil')}
        >
          <span className="greeting-sub">Sugeng rawuh 👋</span>
          <span className="greeting-name">Halo, {namaUser}!</span>
        </div>
      </header>

      {/* 2. Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <p className="hero-eyebrow">
            <span className="dot">●</span>
            PERJALANANMU DIMULAI DI SINI
          </p>
          <h1 className="hero-title">Selangkah lagi,<br />lebih mengenal.</h1>
          <p className="hero-desc">Satu aksara baru menantimu.<br />Belajar singkat, cerita panjang.</p>
          <button className="hero-cta" onClick={() => handleKlikBab(1)}>
            Mulai belajar
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="hero-mascot">
          <img
            src="/assets/maskot homepage.svg"
            alt="Maskot AksaraLens"
            width={148}
            height={148}
            draggable={false}
          />
        </div>
      </div>

      {/* 3. Section: Pilih Bab */}
      <div className="section-title-bar">
        <h2 className="section-title">Pilih bab belajarmu</h2>
        <span className="badge-bab">
          <span>3 BAB</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </span>
      </div>

      {/* 4. Daftar Kartu Bab */}
      <div className="bab-list">
        {progresBab.map((bab, i) => {
          const t = babTheme[i];
          const persenBar = Math.max(bab.persen, bab.selesai > 0 ? 4 : 0);
          return (
            <button
              key={bab.bab}
              type="button"
              className={`bab-card ${t.theme}`}
              onClick={() => handleKlikBab(bab.bab)}
              aria-label={`Bab ${bab.bab}: ${t.judul}`}
            >
              {/* Maskot per bab */}
              <div className="bab-card-media">
                <img
                  src={t.maskot}
                  alt={`Maskot Bab ${bab.bab}`}
                  className="bab-card-mascot-img"
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Info bab */}
              <div className="bab-card-info">
                <p className="bab-number">BAB 0{bab.bab}</p>
                <h3 className="bab-title">{t.judul}</h3>
                <p className="bab-desc">{t.desc}</p>
                <div className="bab-progress-container">
                  <p className="progress-text">{bab.selesai} dari {bab.total} latihan selesai</p>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${persenBar}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ikon aksi */}
              <div className="bab-card-action">
                {bab.semua ? (
                  <svg className="icon-completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. Footer Quote */}
      <div className="home-footer-quote">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22v-9M12 13a5 5 0 0 0 5-5c0-3-2-5-5-5s-5 2-5 5a5 5 0 0 0 5 5z"/>
        </svg>
        <span>Pelan-pelan juga sampai. Yang penting mencoba.</span>
      </div>

      {/* Toast Pesan */}
      {pesan && (
        <div className="toast-pesan" role="status" onClick={() => setPesan(null)}>
          {pesan}
        </div>
      )}

      {/* MODAL GANTI AVATAR (MODAL GANTI AVA.png) */}
      {modalAvatar && (
        <div className="modal-backdrop" onClick={() => setModalAvatar(false)}>
          <div className="modal-avatar-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-avatar-header">
              <div>
                <span className="modal-category-label">PILIH TEMAN BELAJARMU</span>
                <h3 className="modal-avatar-title">Avatar yang paling kamu.</h3>
              </div>
              <button
                type="button"
                className="btn-circle-close"
                onClick={() => setModalAvatar(false)}
                aria-label="Tutup"
              >✕</button>
            </div>

            {/* Preview avatar yang sedang dipilih */}
            <div className="avatar-preview-box">
              <div className="avatar-preview-img-wrap">
                <img
                  src={ICON_PROFIL.find((ic) => ic.id === tempAvatarId)?.src || ICON_PROFIL[0].src}
                  alt="Preview"
                  className="avatar-preview-img"
                  draggable={false}
                />
              </div>
              <div className="avatar-preview-info">
                <span className="avatar-preview-name">{ICON_PROFIL.find((ic) => ic.id === tempAvatarId)?.nama || 'Aksa'}</span>
                <span className="avatar-preview-sub">{ICON_PROFIL.find((ic) => ic.id === tempAvatarId)?.sub || 'Teman belajar setia'}</span>
              </div>
            </div>

            {/* Grid 8 Avatar Pilihan */}
            <div className="avatar-grid-8">
              {ICON_PROFIL.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  className={`avatar-choice-card ${tempAvatarId === ic.id ? 'selected' : ''}`}
                  onClick={() => setTempAvatarId(ic.id)}
                  aria-label={ic.nama}
                  aria-pressed={tempAvatarId === ic.id}
                >
                  {tempAvatarId === ic.id && (
                    <div className="avatar-check-badge">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 011.414 0l8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="avatar-thumb-wrap">
                    <img
                      src={ic.src}
                      alt={ic.nama}
                      className="avatar-thumb-img"
                      draggable={false}
                    />
                  </div>
                  <span className="avatar-choice-name">{ic.nama}</span>
                </button>
              ))}
            </div>

            {/* Aksi Modal */}
            <div className="modal-avatar-actions">
              <button
                type="button"
                className="btn-cancel-avatar"
                onClick={() => setModalAvatar(false)}
              >Batal</button>
              <button
                type="button"
                className="btn-save-avatar"
                onClick={handleSimpanAvatar}
              >
                Pakai avatar ini
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 011.414 0l8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
