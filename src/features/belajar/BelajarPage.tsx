import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BAB, JALUR } from '../../content';
import { useProgres } from '../../progres/ProgresProvider';
import { ICON_PROFIL } from '../profil/ProfilPage';
import { ModalGantiAvatar } from '../profil/ModalGantiAvatar';

// F1: Homepage sesuai HOMEPAGE.png — kartu per bab dengan maskot & avatar terpilih
export function BelajarPage() {
  const { status } = useProgres();
  const navigate = useNavigate();
  const [pesan, setPesan] = useState<string | null>(null);

  // Ambil nama pengguna dan avatar dari localStorage (otomatis sinkron saat kembali dari halaman profil)
  const [namaUser, setNamaUser] = useState(() => localStorage.getItem('namaUser') || 'Kenji Morales');
  const [activeAvatarId, setActiveAvatarId] = useState(() => parseInt(localStorage.getItem('selectedAvatarId') || '1', 10));
  const [modalAvatar, setModalAvatar] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setNamaUser(localStorage.getItem('namaUser') || 'Kenji Morales');
      setActiveAvatarId(parseInt(localStorage.getItem('selectedAvatarId') || '1', 10));
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const avatarTerpilih = ICON_PROFIL.find((ic) => ic.id === activeAvatarId) || ICON_PROFIL[0];

  const handleSelectAvatar = (newId: number) => {
    setActiveAvatarId(newId);
    localStorage.setItem('selectedAvatarId', String(newId));
  };

  // Hitung progres per bab (5 tahap latihan sesuai HOMEPAGE.png)
  const progresBab = BAB.map((bab) => {
    const titikBab = JALUR.filter((t) => t.bab === bab.bab);
    const selesaiReal = titikBab.filter((t) => status.get(t.id) === 'selesai').length;
    const total = 5;
    const hasAnyProgress = Array.from(status.values()).some((s) => s === 'selesai');
    const selesai = hasAnyProgress ? Math.min(selesaiReal, total) : (bab.bab === 1 ? 5 : 0);
    const persenVal = total > 0 ? Math.round((selesai / total) * 100) : 0;
    const semua = selesai === total;
    return { ...bab, selesai, total, persen: persenVal, semua };
  });

  // Tema dan maskot kotak per bab (sesuai HOMEPAGE.png & aset design/assets-csv)
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
      {/* 1. Header: Avatar Icon Profil (klik menuju Profil) + Salam (klik menuju Profil) */}
      <header className="home-header">
        <button
          type="button"
          className="avatar-btn"
          onClick={() => navigate('/profil')}
          aria-label="Buka Profil Saya"
          title="Buka Profil Saya"
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
          style={{ cursor: 'pointer', textAlign: 'left' }}
          title="Buka profil saya"
          onKeyDown={(e) => e.key === 'Enter' && navigate('/profil')}
        >
          <span className="greeting-sub" style={{ textAlign: 'left' }}>Sugeng rawuh 👋</span>
          <span className="greeting-name" style={{ textAlign: 'left' }}>Halo, {namaUser}!</span>
        </div>
      </header>

      {/* 2. Hero Banner (HOMEPAGE.png) - Seluruh teks wajib Rata Kiri */}
      <div className="hero-banner">
        <div className="hero-content" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
          <p className="hero-eyebrow" style={{ textAlign: 'left' }}>
            <span className="dot">●</span>
            PERJALANANMU DIMULAI DI SINI
          </p>
          <h1 className="hero-title" style={{ textAlign: 'left' }}>Selangkah lagi,<br />lebih mengenal.</h1>
          <p className="hero-desc" style={{ textAlign: 'left' }}>Satu aksara baru menantimu.<br />Belajar singkat, cerita panjang.</p>
          <button
            type="button"
            className="hero-cta"
            onClick={() => navigate('/pelajaran/b1-p1')}
            style={{ textAlign: 'left' }}
          >
            <span>Mulai belajar</span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="hero-mascot">
          <img
            src="/assets/maskot homepage.svg"
            alt="Maskot AksaraLens"
            width={172}
            height={172}
            draggable={false}
          />
        </div>
      </div>

      {/* 3. Section: Pilih Bab - Rata Kiri */}
      <div className="section-title-bar" style={{ textAlign: 'left' }}>
        <h2 className="section-title" style={{ textAlign: 'left' }}>Pilih bab belajarmu</h2>
        <span className="badge-bab">
          <span>3 BAB</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </span>
      </div>

      {/* 4. Daftar Kartu Bab — Rata Kiri & Kotak Maskot Presisi */}
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
              style={{ textAlign: 'left' }}
            >
              {/* Maskot kotak per bab */}
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

              {/* Info bab — Wajib Rata Kiri */}
              <div className="bab-card-info" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                <p className="bab-number" style={{ textAlign: 'left' }}>BAB 0{bab.bab}</p>
                <h3 className="bab-title" style={{ textAlign: 'left' }}>{t.judul}</h3>
                <p className="bab-desc" style={{ textAlign: 'left' }}>{t.desc}</p>
                <div className="bab-progress-container" style={{ textAlign: 'left', width: '100%' }}>
                  <p className="progress-text" style={{ textAlign: 'left' }}>{bab.selesai} dari {bab.total} latihan selesai</p>
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
      <div className="home-footer-quote" style={{ textAlign: 'left' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22v-9M12 13a5 5 0 0 0 5-5c0-3-2-5-5-5s-5 2-5 5a5 5 0 0 0 5 5z"/>
        </svg>
        <span style={{ textAlign: 'left' }}>Pelan-pelan juga sampai. Yang penting mencoba.</span>
      </div>

      {/* Feedback Toast */}
      {pesan && (
        <div className="toast-bottom" role="status">
          {pesan}
        </div>
      )}

      {/* MODAL GANTI AVATAR (bisa dibuka kapan saja jika diinginkan) */}
      <ModalGantiAvatar
        isOpen={modalAvatar}
        onClose={() => setModalAvatar(false)}
        activeAvatarId={activeAvatarId}
        onSelectAvatar={handleSelectAvatar}
      />
    </div>
  );
}
