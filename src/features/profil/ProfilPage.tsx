import { useState } from 'react';
import { useNavigate } from 'react-router';
import { hurufDariKode } from '../../aksara/huruf';
import { hurufSeringSalah } from '../../progres/model';
import { useProgres } from '../../progres/ProgresProvider';
import { BAB, JALUR } from '../../content';
import { useSesi } from '../../lib/sesi';
import { keluar } from '../../lib/auth';

// Daftar icon profil (8 pilihan sesuai MODAL GANTI AVA.png)
export const ICON_PROFIL = [
  { id: 1, src: '/assets/icon profile 1.svg', nama: 'Lensa', sub: 'Teman belajar setia' },
  { id: 2, src: '/assets/icon profile 2.svg', nama: 'Si Pembaca', sub: 'Suka membaca cerita aksara' },
  { id: 3, src: '/assets/icon profile 3.svg', nama: 'Si Penulis', sub: 'Giat melatih goresan aksara' },
  { id: 4, src: '/assets/icon profile 4.png', nama: 'Si Penjelajah', sub: 'Menemukan aksara di sekitar' },
  { id: 5, src: '/assets/icon profile 5.svg', nama: 'Si Cendekia', sub: 'Cerdas dan berpengetahuan' },
  { id: 6, src: '/assets/icon profile 6.svg', nama: 'Si Ceria', sub: 'Belajar dengan penuh semangat' },
  { id: 7, src: '/assets/icon profile 7.svg', nama: 'Si Perintis', sub: 'Tumbuh perlahan tapi pasti' },
  { id: 8, src: '/assets/icon profile 8.svg', nama: 'Si Ahli', sub: 'Menguasai seluk-beluk aksara' },
];

export function ProfilPage() {
  const { stats, status } = useProgres();
  const { pengguna } = useSesi();
  const navigate = useNavigate();
  const namaUser = localStorage.getItem('namaUser') || 'Kenji Morales';
  const lemah = hurufSeringSalah(stats);
  const [modalLogout, setModalLogout] = useState(false);
  const [modalAvatar, setModalAvatar] = useState(false);

  // Manajemen avatar: baca dari localStorage, simpan saat konfirmasi
  const savedAvatarId = parseInt(localStorage.getItem('selectedAvatarId') || '1', 10);
  const [tempAvatarId, setTempAvatarId] = useState(savedAvatarId);
  const [activeAvatarId, setActiveAvatarId] = useState(savedAvatarId);
  const avatarTerpilih = ICON_PROFIL.find((ic) => ic.id === activeAvatarId) || ICON_PROFIL[0];

  const handleSimpanAvatar = () => {
    setActiveAvatarId(tempAvatarId);
    localStorage.setItem('selectedAvatarId', String(tempAvatarId));
    setModalAvatar(false);
  };



  // Hitung total pelajaran selesai
  const totalTitik = JALUR.length;
  const selesaiCount = JALUR.filter((t) => status.get(t.id) === 'selesai').length;
  const totalPersen = totalTitik > 0 ? Math.round((selesaiCount / totalTitik) * 100) : 0;

  // Hitung bab tuntas
  const babSelesaiCount = BAB.filter((b) => {
    const titik = JALUR.filter((t) => t.bab === b.bab);
    return titik.length > 0 && titik.every((t) => status.get(t.id) === 'selesai');
  }).length;

  const profilBabMascots = [
    '/assets/maskot profil bab 1.svg',
    '/assets/maskot profil bab 2.svg',
    '/assets/maskot profil bab 3.svg',
  ];

  return (
    <div className="home-container" style={{ paddingBottom: '32px' }}>
      {/* 1. Hero Lanskap Profil (PROFIL 1.png) */}
      <div className="profil-hero-art" style={{ height: '340px', position: 'relative', overflow: 'hidden' }}>
        <img
          src="/assets/background profil page.svg"
          alt="Lanskap latar belakang"
          className="profil-bg-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
          onError={(e) => {
            // fallback gradien hangat jika berkas svg tidak ada
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Tombol Pengaturan Bulat Kanan Atas */}
        <button
          type="button"
          className="btn-circle-nav profil-settings-btn"
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}
          onClick={() => setModalLogout(true)}
          aria-label="Pengaturan Akun"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Teks Nama & Subjudul di Atas Avatar */}
        <div style={{ position: 'absolute', top: '24px', left: 0, right: 0, textAlign: 'center', zIndex: 5 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: '#43281C', margin: 0 }}>
            {namaUser}
          </h1>
          <p style={{ fontSize: '13px', color: '#685A4E', margin: '2px 0 0' }}>
            Teman belajar aksara Jawa
          </p>
        </div>

        {/* Avatar Besar di Tengah — icon profil yang dipilih */}
        <div className="profil-avatar-big" style={{ bottom: '16px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <button
            type="button"
            aria-label="Ganti avatar"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'block',
            }}
            onClick={() => { setTempAvatarId(activeAvatarId); setModalAvatar(true); }}
          >
            <div
              style={{
                width: '148px',
                height: '148px',
                borderRadius: '50%',
                backgroundColor: '#B9EC00',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                boxShadow: '0 0 0 10px rgba(255, 255, 255, 0.45)',
                overflow: 'hidden',
                transition: 'transform 0.2s ease',
              }}
            >
              <img
                src={avatarTerpilih.src}
                alt={avatarTerpilih.nama}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center bottom' }}
                draggable={false}
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/icon profile 1.svg'; }}
              />
            </div>
            {/* Badge edit kecil di pojok kanan bawah avatar */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '-2px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#43281C',
              border: '3px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" style={{ color: '#fff' }}>
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </button>

          {/* Balon Ucapan Maskot */}
          <div className="speech-bubble-aksa" style={{ marginTop: '10px', whiteSpace: 'nowrap' }}>
            Aku temani setiap langkahmu.
          </div>
        </div>
      </div>


      {/* 2. Card Motivasi & Progres Total */}
      <div className="card-motivasi">
        <p className="motivasi-text">
          Setiap aksara yang kamu pelajari adalah langkah untuk mengenal warisan kita. Teruskan perjalananmu, sedikit demi sedikit.
        </p>
        <div className="motivasi-divider" />
        <div className="motivasi-progress-row">
          <div className="book-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#46612E" strokeWidth="2.2" width="22" height="22">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="motivasi-progress-details">
            <div className="progress-numbers">
              <span>{selesaiCount} / {totalTitik}</span>
              <span className="percent-label">{totalPersen}%</span>
            </div>
            <div className="progress-track-gray">
              <div
                className="progress-fill-green"
                style={{ width: `${Math.max(totalPersen, 4)}%` }}
              />
            </div>
            <span className="progress-caption">Pelajaran selesai</span>
          </div>
        </div>
      </div>

      {/* 3. Grid 3 Statistik (PROFIL 1.png) */}
      <div className="stats-grid">
        <div className="stat-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="#7D6B5E" strokeWidth="2" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="stat-val">{selesaiCount}</span>
          <span className="stat-desc">Pelajaran selesai</span>
        </div>

        <div className="stat-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="#9CAF6C" strokeWidth="2.5" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="stat-val">{babSelesaiCount} / {BAB.length}</span>
          <span className="stat-desc">Bab tuntas</span>
        </div>

        <div className="stat-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="#46612E" strokeWidth="2.2" width="20" height="20">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          <span className="stat-val">{totalPersen}%</span>
          <span className="stat-desc">Progres belajar</span>
        </div>
      </div>

      {/* 4. Section Perjalanan Belajarmu */}
      <div className="section-perjalanan">
        <div className="perjalanan-title-bar">
          <h2 className="section-title">Perjalanan belajarmu</h2>
          <span className="perjalanan-count">{selesaiCount} / {totalTitik} pelajaran</span>
        </div>

        <div className="bab-list">
          {BAB.map((bab, i) => {
            const titikBab = JALUR.filter((t) => t.bab === bab.bab);
            const selesaiBab = titikBab.filter((t) => status.get(t.id) === 'selesai').length;
            const semuaSelesai = titikBab.length > 0 && selesaiBab === titikBab.length;
            const persen = Math.round((selesaiBab / titikBab.length) * 100);

            return (
              <button
                key={bab.bab}
                type="button"
                className="bab-card"
                onClick={() => navigate(`/belajar/materi/${bab.bab}`)}
                aria-label={`Bab ${bab.bab}: ${bab.judul}`}
              >
                <div className="bab-card-media">
                  <img
                    src={profilBabMascots[i] || '/assets/maskot profil bab 1.svg'}
                    alt={`Maskot Bab ${bab.bab}`}
                    className="bab-card-mascot-img"
                    draggable={false}
                  />
                </div>

                <div className="bab-card-info">
                  <p className="bab-number">BAB 0{bab.bab}</p>
                  <h3 className="bab-title">{bab.judul}</h3>
                  <div className="bab-progress-container" style={{ marginTop: '8px' }}>
                    <p className="progress-text">{selesaiBab} dari {titikBab.length} pelajaran selesai</p>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.max(persen, selesaiBab > 0 ? 5 : 0)}%`,
                          background: i === 0 ? '#46612E' : i === 1 ? '#F5C451' : '#B49FE6',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bab-card-action">
                  {semuaSelesai ? (
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
      </div>

      {/* 5. Huruf Sering Salah (jika ada) */}
      {lemah.length > 0 && (
        <div className="card-lemah" style={{ marginTop: '20px' }}>
          <h3 className="lemah-title">Huruf sering salah</h3>
          <p className="lemah-sub">Latih lagi aksara berikut untuk memperkuat ingatanmu:</p>
          <div className="lemah-tags">
            {lemah.map((s) => {
              const infoHuruf = hurufDariKode(s.letter);
              return (
                <span key={s.letter} className="lemah-tag-item">
                  <span className="aksara">{infoHuruf?.aksara ?? s.letter}</span>
                  <span className="latin">({s.letter})</span>
                  <span className="ratio">{s.wrong}x salah</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Banner Motivasi Bawah */}
      <div className="info-banner-card" style={{ marginTop: '20px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
          <path d="M12 22v-9" strokeLinecap="round" />
          <path d="M12 13a5 5 0 0 0 5-5c0-3-2-5-5-5s-5 2-5 5a5 5 0 0 0 5 5z" />
          <path d="M7 13a4 4 0 0 0-4-4c0-2.5 1.5-4 4-4" />
        </svg>
        <div>
          <strong style={{ display: 'block', fontSize: '13px' }}>Langkah pertamamu menunggu.</strong>
          <span style={{ fontSize: '12px', opacity: 0.85 }}>Mulai satu pelajaran dan lihat progresmu tumbuh.</span>
        </div>
      </div>

      {/* Modal Pengaturan / Akun */}
      {modalLogout && (
        <div className="modal-backdrop" onClick={() => setModalLogout(false)}>
          <div className="modal-avatar-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-avatar-header">
              <div>
                <span className="modal-category-label">PENGATURAN AKUN</span>
                <h3 className="modal-avatar-title">Kelola Akunmu</h3>
              </div>
              <button
                type="button"
                className="btn-circle-close"
                onClick={() => setModalLogout(false)}
                aria-label="Tutup modal"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13.5px', color: '#685A4E' }}>
                {pengguna ? `Masuk sebagai ${pengguna.email}` : 'Saat ini kamu sedang menggunakan mode tamu.'}
              </p>

              {pengguna ? (
                <button
                  type="button"
                  className="btn-auth-submit btn-auth-submit-brown"
                  onClick={async () => {
                    await keluar();
                    setModalLogout(false);
                  }}
                >
                  Keluar dari akun
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-auth-submit btn-auth-submit-brown"
                  onClick={() => {
                    setModalLogout(false);
                    navigate('/masuk');
                  }}
                >
                  Masuk atau Daftar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilih Avatar (sesuai MODAL GANTI AVA.png) */}
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
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}