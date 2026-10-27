import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { hurufDariKode } from '../../aksara/huruf';
import { babDariNomor } from '../../content';

// F3: materi per bab, tidak terkunci. Anchor per huruf (#ka) adalah tujuan
// tautan Kaji lebih dalam; jangan ubah format id tanpa mengubah aksara/urai.ts.
export function MateriBabPage() {
  const { bab } = useParams();
  const { hash } = useLocation();
  const data = babDariNomor(Number(bab));

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

<<<<<<< HEAD
  if (!data) return <p>Bab tidak ditemukan. <Link to="/belajar">Kembali</Link></p>;

  return (
    <>
      <Link to="/belajar">← Kembali</Link>
      <h1>Bab {data.bab} · {data.judul}</h1>
      <p>{data.ringkasan}</p>
      <ul>
        {data.letters.map((kode) => {
          const h = hurufDariKode(kode);
          return (
            <li key={kode} id={kode}>
              <span className="aksara" lang="jv">{h?.unicode}</span> {kode}
            </li>
          );
        })}
      </ul>
    </>
=======
  if (!data) {
    return (
      <div className="materi-page">
        <p>Bab tidak ditemukan. <Link to="/belajar">Kembali ke Beranda</Link></p>
      </div>
    );
  }

  // Filter titik jalur untuk bab ini
  const titikBab = JALUR.filter((t) => t.bab === babNomor);
  const selesaiCount = titikBab.filter((t) => status.get(t.id) === 'selesai').length;
  const persen = titikBab.length > 0 ? Math.round((selesaiCount / titikBab.length) * 100) : 0;

  // Temukan titik terbuka pertama untuk CTA bawah
  const titikPertama = titikBab.find((t) => status.get(t.id) === 'terbuka') || titikBab[0];

  const themeClass = babNomor === 1 ? 'theme-bab1' : babNomor === 2 ? 'theme-bab2' : 'theme-bab3';

  // Subjudul kartu hero sesuai mockup Figma
  const heroSub =
    babNomor === 1
      ? 'Kenali 20 aksara dasar'
      : babNomor === 2
      ? 'Ubah bunyi dengan sandhangan'
      : 'Lengkapi bunyi akhir kata';

  // Warna garis lintasan S-curve per bab
  const pathStroke =
    babNomor === 1 ? '#D2DCC0' : babNomor === 2 ? '#DCD9C0' : '#D5C0DC';

  // 5 Tahapan perjalanan belajar dengan koordinat persis sesuai Figma
  const tahapan = [
    {
      id: 'kenali',
      title: babNomor === 1 ? 'Kenali aksara dasar' : babNomor === 2 ? 'Kenali sandhangan' : 'Kenali bunyi akhir',
      sub: 'Mengenali · 3 tantangan',
      icon: 'eye',
      cx: 118.4,
      cy: 72.0,
      titikRef: titikBab[0],
    },
    {
      id: 'temukan',
      title: babNomor === 1 ? 'Temukan bentuknya' : babNomor === 2 ? 'Temukan tandanya' : 'Temukan penandanya',
      sub: 'Mengenali · 3 tantangan',
      icon: 'search',
      cx: 238.9,
      cy: 202.0,
      titikRef: titikBab[1] || titikBab[0],
    },
    {
      id: 'ingat',
      title: babNomor === 1 ? 'Ingat bunyinya' : babNomor === 2 ? 'Ingat perubahan bunyi' : 'Ingat bunyi penutup',
      sub: 'Mengingat · 3 tantangan',
      icon: 'brain',
      cx: 118.4,
      cy: 332.0,
      titikRef: titikBab[2] || titikBab[0],
    },
    {
      id: 'tulis',
      title: babNomor === 1 ? 'Latihan menulis' : babNomor === 2 ? 'Tulis sandhangan' : 'Tulis bunyi akhir',
      sub: 'Menulis · 3 latihan',
      icon: 'pencil',
      cx: 238.9,
      cy: 462.0,
      titikRef: titikBab.find((t) => t.type === 'writing') || titikBab[1],
    },
    {
      id: 'kuis',
      title: babNomor === 1 ? 'Kuis aksara dasar' : babNomor === 2 ? 'Kuis sandhangan' : 'Kuis akhir',
      sub: 'Kuis · 5 pertanyaan',
      icon: 'sparkle',
      cx: 118.4,
      cy: 592.0,
      titikRef: titikBab[titikBab.length - 1],
    },
  ];

  // Cari apakah ada titik yang aktif saat ini
  const indexAktif = tahapan.findIndex((t) => {
    const s = t.titikRef ? status.get(t.titikRef.id) : undefined;
    return s === 'terbuka';
  });

  const handleKlikTitik = (titikId?: string, isLocked?: boolean) => {
    if (isLocked) return;
    if (!titikId) return;
    const t = JALUR.find((item) => item.id === titikId);
    if (t) {
      navigate(t.type === 'writing' ? `/latihan/${t.id}` : `/pelajaran/${t.id}`);
    }
  };

  return (
    <div className={`materi-page ${themeClass}`}>
      {/* 1. Header Top */}
      <header className="materi-header">
        <button className="btn-circle-nav" onClick={() => navigate('/belajar')} aria-label="Kembali ke Beranda">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="materi-header-title">Perjalanan belajar</h1>
        <button className="btn-circle-nav" onClick={() => navigate('/profil')} aria-label="Lihat Progres">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </button>
      </header>

      {/* 2. Hero Card Bab */}
      <section className="materi-hero-card">
        <span className="materi-badge-bab">BAB 0{data.bab}</span>
        <h2 className="materi-hero-title">
          {data.bab === 1 ? 'Aksara Nglegena' : data.bab === 2 ? 'Sandhangan Swara' : 'Panyigeg & Pangkon'}
        </h2>
        <p className="materi-hero-sub">{heroSub}</p>

        <div className="materi-hero-progress">
          <div className="progress-info">
            <span>Sedikit demi sedikit, kamu bisa.</span>
            <span className="percent">{persen}%</span>
          </div>
          <div className="progress-track-white">
            <div className="progress-fill-white" style={{ width: `${Math.max(persen, 4)}%` }} />
          </div>
        </div>
      </section>

      {/* 3. Winding Path S-Curve — koordinat presisi Figma 412px */}
      <section className="journey-path-container">
        {/* Garis lintasan S-Curve SVG presisi 366 × 650 */}
        <svg
          className="path-svg-canvas"
          viewBox="0 0 366 650"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M118.39 71.9989H238.932C281.983 71.9989 303.508 91.9986 303.508 131.998V141.998C303.508 181.997 281.983 201.997 238.932 201.997H118.39C75.3389 201.997 53.8135 221.997 53.8135 261.996V271.996C53.8135 311.995 75.3389 331.995 118.39 331.995H238.932C281.983 331.995 303.508 351.995 303.508 391.994V401.994C303.508 441.993 281.983 461.993 238.932 461.993H118.39C75.3389 461.993 53.8135 481.993 53.8135 521.992V531.992C53.8135 571.991 75.3389 591.991 118.39 591.991"
            stroke={pathStroke}
            strokeWidth="13.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Aksara Jawa dekoratif mengambang */}
        <span className="floating-aksara aksara" style={{ top: '65px', right: '16px' }} aria-hidden="true">ꦲꦤ</span>
        <span className="floating-aksara aksara" style={{ top: '250px', left: '16px', fontSize: '26px' }} aria-hidden="true">✦</span>
        <span className="floating-aksara aksara" style={{ top: '530px', right: '16px' }} aria-hidden="true">ꦲꦤ</span>

        {/* 5 Node Tahapan dengan penempatan presisi di titik S-curve */}
        {tahapan.map((tahap, idx) => {
          const titikStatus = tahap.titikRef ? status.get(tahap.titikRef.id) : idx === 0 ? 'terbuka' : 'terkunci';
          const isTerbuka = titikStatus === 'terbuka' || titikStatus === 'selesai';
          const isSelesai = titikStatus === 'selesai';
          // Tentukan node aktif: jika belum ada yang selesai, node 0 aktif; atau node pertama yang 'terbuka'
          const isCurrent = indexAktif === -1 ? idx === 0 : idx === indexAktif;

          return (
            <div
              key={tahap.id}
              className={`journey-node-spot ${isCurrent ? 'spot-active' : ''}`}
              style={{
                left: `${tahap.cx}px`,
                top: `${tahap.cy}px`,
              }}
            >
              {/* Tag "MULAI DI SINI" melayang di atas node aktif */}
              {isCurrent && (
                <div className="node-start-badge">
                  {idx === 0 ? 'MULAI DI SINI' : 'LANJUTKAN'}
                </div>
              )}

              {/* Lingkaran Tombol Node */}
              <button
                type="button"
                className={`node-button ${isCurrent ? 'current' : ''} ${isSelesai ? 'completed' : ''} ${!isTerbuka ? 'locked' : ''}`}
                onClick={() => handleKlikTitik(tahap.titikRef?.id, !isTerbuka)}
                disabled={!isTerbuka}
                aria-label={`${tahap.title} (${titikStatus})`}
              >
                <div className="node-icon-inner">
                  {tahap.icon === 'eye' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" width="30" height="30">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                  {tahap.icon === 'search' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" width="28" height="28">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  {tahap.icon === 'brain' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" width="28" height="28">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04zm5 0A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
                    </svg>
                  )}
                  {tahap.icon === 'pencil' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" width="28" height="28">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  )}
                  {tahap.icon === 'sparkle' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" width="28" height="28">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  )}
                </div>

                {/* Badge Putar (Play) untuk node aktif */}
                {isCurrent && (
                  <div className="node-status-badge play-custom">
                    <img
                      src="/assets/button play exercise.svg"
                      alt="Mulai"
                      width={28}
                      height={28}
                      draggable={false}
                    />
                  </div>
                )}

                {/* Badge Selesai (Checkmark) untuk node yang sudah tamat */}
                {isSelesai && !isCurrent && (
                  <div className="node-status-badge checkmark">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Badge Kunci (Lock) untuk node terkunci */}
                {!isTerbuka && (
                  <div className="node-status-badge lock">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Label Node tepat di bawah lingkaran */}
              <div className="node-label-box">
                <h3 className="node-title">{tahap.title}</h3>
                <p className="node-sub">{tahap.sub}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. Banner Informasi */}
      <div className="info-banner-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
          <path d="M12 22v-9" strokeLinecap="round" />
          <path d="M12 13a5 5 0 0 0 5-5c0-3-2-5-5-5s-5 2-5 5a5 5 0 0 0 5 5z" />
          <path d="M7 13a4 4 0 0 0-4-4c0-2.5 1.5-4 4-4" />
        </svg>
        <span>Selesaikan satu langkah untuk membuka langkah berikutnya.</span>
      </div>

      {/* 5. CTA Button Bawah (di akhir halaman yang dapat digulir) */}
      <div className="bottom-cta-container">
        <button
          type="button"
          className="btn-primary btn-materi-cta"
          onClick={() => handleKlikTitik(titikPertama?.id, false)}
        >
          <span>{selesaiCount > 0 ? 'Lanjutkan belajar' : 'Mulai pelajaran pertama'}</span>
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
>>>>>>> 3d50f8b (feat: add MateriBabPage component and corresponding CSS styling for chapter learning journey)
  );
}
