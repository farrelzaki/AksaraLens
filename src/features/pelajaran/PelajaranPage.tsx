import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { NGLEGENA } from '../../aksara/huruf';
import { titikDariId } from '../../content';
import { useProgres } from '../../progres/ProgresProvider';

// Daftar 3 tantangan mengenali aksara sesuai Kenali aksara dasar 1-4.png
const TANTANGAN_SOAL = [
  {
    aksara: 'ꦲ',
    jawaban: 'ha',
    pilihan: [
      { huruf: 'A', teks: 'ca' },
      { huruf: 'B', teks: 'ha' },
      { huruf: 'C', teks: 'na' },
      { huruf: 'D', teks: 'ra' },
    ],
  },
  {
    aksara: 'ꦤ',
    jawaban: 'na',
    pilihan: [
      { huruf: 'A', teks: 'da' },
      { huruf: 'B', teks: 'ta' },
      { huruf: 'C', teks: 'na' },
      { huruf: 'D', teks: 'sa' },
    ],
  },
  {
    aksara: 'ꦏ',
    jawaban: 'ka',
    pilihan: [
      { huruf: 'A', teks: 'ra' },
      { huruf: 'B', teks: 'ka' },
      { huruf: 'C', teks: 'la' },
      { huruf: 'D', teks: 'wa' },
    ],
  },
];

export function PelajaranPage() {
  const { id } = useParams();
  const titik = titikDariId(id ?? 'b1-p1');
  const { selesaikanTitik, catat } = useProgres();
  const navigate = useNavigate();

  // Mode: 'kenalan' (Kenali aksara dasar 1.png) -> 'kuis' (Kenali aksara dasar 2-4.png) -> 'selesai'
  const [mode, setMode] = useState<'kenalan' | 'kuis' | 'selesai'>('kenalan');

  // State Kenalan
  const [aksaraIndex, setAksaraIndex] = useState(0);
  const [animasiPulse, setAnimasiPulse] = useState(false);

  // State Kuis
  const [soalIndex, setSoalIndex] = useState(0);
  const [pilihanIndex, setPilihanIndex] = useState<number | null>(null);
  const [sudahDiperiksa, setSudahDiperiksa] = useState(false);
  const [apakahBenar, setApakahBenar] = useState<boolean | null>(null);

  // Timer: live timer sejak halaman dibuka
  const [detik, setDetik] = useState(1);
  useEffect(() => {
    const timerId = setInterval(() => {
      setDetik((d) => d + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTimer = (totalDetik: number) => {
    const m = Math.floor(totalDetik / 60);
    const s = totalDetik % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentAksara = NGLEGENA[aksaraIndex] || NGLEGENA[0];
  const currentSoal = TANTANGAN_SOAL[soalIndex] || TANTANGAN_SOAL[0];

  // Putar suara pelafalan aksara
  const handleContohBentuk = () => {
    setAnimasiPulse(true);
    setTimeout(() => setAnimasiPulse(false), 500);

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(currentAksara.latin);
        u.lang = 'id-ID';
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
      }
    } catch {}
  };

  const handlePilihOpsi = (idx: number) => {
    if (sudahDiperiksa && apakahBenar) return;
    setPilihanIndex(idx);
    setSudahDiperiksa(false);
    setApakahBenar(null);
  };

  const handlePeriksaJawaban = () => {
    if (pilihanIndex === null) return;
    const opsi = currentSoal.pilihan[pilihanIndex];
    const benar = opsi.teks.toLowerCase() === currentSoal.jawaban.toLowerCase();

    setSudahDiperiksa(true);
    setApakahBenar(benar);
    // Setiap jawaban dicatat ke statistik huruf (dipakai di Profil)
    catat(currentSoal.jawaban, benar);

    if (benar) {
      try {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(currentSoal.jawaban);
          u.lang = 'id-ID';
          window.speechSynthesis.speak(u);
        }
      } catch {}
    }
  };

  const handleLanjutSoal = () => {
    if (soalIndex < TANTANGAN_SOAL.length - 1) {
      setSoalIndex((prev) => prev + 1);
      setPilihanIndex(null);
      setSudahDiperiksa(false);
      setApakahBenar(null);
    } else {
      // Selesai semua 3 tantangan!
      if (titik) {
        selesaikanTitik(titik.id);
      }
      setMode('selesai');
    }
  };

  const handleKembali = () => {
    if (mode === 'kuis') {
      setMode('kenalan');
      setPilihanIndex(null);
      setSudahDiperiksa(false);
      setApakahBenar(null);
    } else {
      navigate('/belajar/materi/1');
    }
  };

  return (
    <div className="pelajaran-page-container">
      {/* 1. Header Top Bar (Back button, Title, Timer) */}
      <header className="pelajaran-nav-bar">
        <button
          type="button"
          className="pelajaran-btn-back"
          onClick={handleKembali}
          aria-label="Kembali"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="pelajaran-header-info">
          <span className="pelajaran-tag-bab">BAB 01 • KENALI</span>
          <span className="pelajaran-tag-tahap">Tahap 1 / 5</span>
        </div>

        <div className="pelajaran-timer-capsule" title="Waktu belajar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
          <span>{formatTimer(detik)}</span>
        </div>
      </header>

      {/* 2. Progress Bar Horizontal */}
      <div className="pelajaran-progress-row">
        <div className="pelajaran-progress-track">
          <div
            className="pelajaran-progress-fill"
            style={{
              width: mode === 'kenalan' ? '0%' : `${((soalIndex + (apakahBenar ? 1 : 0)) / 3) * 100}%`,
            }}
          />
        </div>
        <span className="pelajaran-progress-text">
          {mode === 'kenalan' ? '0 / 3' : `${soalIndex + (apakahBenar ? 1 : 0)} / 3`}
        </span>
      </div>

      {/* 3. Main White Card */}
      <main className="pelajaran-card-main">
        {mode === 'kenalan' && (
          <>
            {/* Header Card: Tag + Avatar Mascot */}
            <div className="pelajaran-card-header">
              <span className="chip-kenalan-dulu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                KENALAN DULU
              </span>
              <div className="pelajaran-card-mascot-head">
                <img
                  src="/assets/icon profile 1.svg"
                  alt="Aksa"
                  draggable={false}
                />
              </div>
            </div>

            <h1 className="pelajaran-card-title">Kenalan dulu, yuk.</h1>
            <p className="pelajaran-card-subtitle">
              Jelajahi semua aksara bab ini, lalu coba tiga tantangan mengenali.
            </p>

            {/* Kotak Besar Aksara */}
            <div className={`aksara-box-center ${animasiPulse ? 'pulse' : ''}`}>
              <span className="aksara-glyph-huge">{currentAksara.unicode}</span>
              <div className="aksara-latin-capsule">{currentAksara.latin}</div>
            </div>

            {/* Kontrol Navigasi Aksara */}
            <div className="aksara-stepper-row">
              <button
                type="button"
                className="btn-stepper-circle"
                disabled={aksaraIndex === 0}
                onClick={() => setAksaraIndex((i) => Math.max(0, i - 1))}
                aria-label="Aksara sebelumnya"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="stepper-info-col">
                <span className="stepper-counter-label">Aksara {aksaraIndex + 1} dari {NGLEGENA.length}</span>
                <button
                  type="button"
                  className="btn-contoh-bentuk"
                  onClick={handleContohBentuk}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Contoh bentuk
                </button>
              </div>

              <button
                type="button"
                className="btn-stepper-circle"
                disabled={aksaraIndex === NGLEGENA.length - 1}
                onClick={() => setAksaraIndex((i) => Math.min(NGLEGENA.length - 1, i + 1))}
                aria-label="Aksara berikutnya"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <p className="pelajaran-card-footnote">Animasi bentuk, bukan panduan urutan goresan.</p>
          </>
        )}

        {mode === 'kuis' && (
          <>
            {/* Header Card: Tag Soal + Avatar Mascot */}
            <div className="pelajaran-card-header">
              <span className="chip-kenalan-dulu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                SOAL 0{soalIndex + 1}
              </span>
              <div className="pelajaran-card-mascot-head">
                <img
                  src="/assets/icon profile 1.svg"
                  alt="Aksa"
                  draggable={false}
                />
              </div>
            </div>

            <h1 className="pelajaran-card-title">Aksara ini berbunyi apa?</h1>

            {/* Pesan Feedback (Error / Sukses) atau Subjudul */}
            {!sudahDiperiksa && (
              <p className="pelajaran-card-subtitle">Pilih bunyi yang sesuai dengan bentuk aksara.</p>
            )}
            {sudahDiperiksa && apakahBenar === false && (
              <div className="feedback-msg-row wrong">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1 4v6h6M23 20v-6h-6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                </svg>
                <span>Belum tepat. Pilih jawaban lain.</span>
              </div>
            )}
            {sudahDiperiksa && apakahBenar === true && (
              <div className="feedback-msg-row correct">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Tepat! Dibaca {currentSoal.jawaban}.</span>
              </div>
            )}

            {/* Kotak Aksara Soal */}
            <div className="aksara-box-center">
              <span className="aksara-glyph-huge">{currentSoal.aksara}</span>
            </div>

            {/* Daftar 4 Opsi Pilihan Ganda */}
            <div className="soal-options-list">
              {currentSoal.pilihan.map((opsi, idx) => {
                const isSelected = pilihanIndex === idx;
                const isWrong = isSelected && sudahDiperiksa && apakahBenar === false;
                const isCorrect = sudahDiperiksa && opsi.teks.toLowerCase() === currentSoal.jawaban.toLowerCase();

                let statusClass = '';
                if (isWrong) statusClass = 'wrong';
                else if (isCorrect) statusClass = 'correct';
                else if (isSelected) statusClass = 'selected';

                return (
                  <button
                    key={opsi.huruf}
                    type="button"
                    className={`soal-option-card ${statusClass}`}
                    onClick={() => handlePilihOpsi(idx)}
                    aria-label={`Pilihan ${opsi.huruf}: ${opsi.teks}`}
                  >
                    <div className="option-badge-circle">{opsi.huruf}</div>
                    <span className="option-latin-label">{opsi.teks}</span>

                    {/* Indikator status kanan */}
                    {isWrong ? (
                      <div className="option-feedback-icon wrong">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                    ) : isCorrect ? (
                      <div className="option-feedback-icon correct">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className={`option-radio-ring ${isSelected ? 'filled' : ''}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === 'selesai' && (
          <div style={{ textAlign: 'center', padding: '24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#E5EBD8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <img src="/assets/icon profile 1.svg" alt="Aksa" width={72} height={72} draggable={false} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: '#3A2315', marginBottom: '6px' }}>
              Luar biasa! 🎉
            </h2>
            <p style={{ fontSize: '13.5px', color: '#6B6159', lineHeight: 1.5, marginBottom: '20px', maxWidth: '280px' }}>
              Kamu telah menyelesaikan 3 tantangan mengenali aksara dengan baik.
            </p>
            <div style={{ background: '#F7F4F1', borderRadius: '16px', padding: '14px 20px', width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#8C827A', fontWeight: 600 }}>WAKTU</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#3A2315' }}>{formatTimer(detik)}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#8C827A', fontWeight: 600 }}>TANTANGAN</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#4E602B' }}>3 / 3 Tuntas</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Bottom Action Button & Quote */}
      <footer className="pelajaran-bottom-container">
        {mode === 'kenalan' && (
          <button
            type="button"
            className="btn-action-pelajaran"
            onClick={() => {
              setMode('kuis');
              setSoalIndex(0);
              setPilihanIndex(null);
              setSudahDiperiksa(false);
              setApakahBenar(null);
            }}
          >
            <span>Mulai 3 tantangan</span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {mode === 'kuis' && !apakahBenar && (
          <button
            type="button"
            className="btn-action-pelajaran"
            disabled={pilihanIndex === null}
            onClick={handlePeriksaJawaban}
          >
            <span>Periksa jawaban</span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {mode === 'kuis' && apakahBenar === true && (
          <button
            type="button"
            className="btn-action-pelajaran"
            onClick={handleLanjutSoal}
          >
            <span>{soalIndex < TANTANGAN_SOAL.length - 1 ? 'Tantangan berikutnya' : 'Tantangan berikutnya'}</span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {mode === 'selesai' && (
          <button
            type="button"
            className="btn-action-pelajaran"
            onClick={() => navigate('/belajar/materi/1')}
          >
            <span>Lanjut ke Perjalanan Belajar</span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <p className="pelajaran-bottom-quote">
          Belajar pelan-pelan, tidak perlu terburu-buru.
        </p>
      </footer>
    </div>
  );
}
