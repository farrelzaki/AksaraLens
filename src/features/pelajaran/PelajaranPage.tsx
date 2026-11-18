import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { JALUR, titikDariId } from '../../content';
import {
  LABEL_TAHAP,
  NAMA_TAHAP,
  tahapDariId,
  tahapDiBab,
  type Tahap,
} from '../../content/tahap';
import { useProgres } from '../../progres/ProgresProvider';
import { MaskotSplash } from '../../app/MaskotAksa';
import {
  aksaraSoal,
  itemKenali,
  latinSoal,
  soalUntukTahap,
} from './bankSoal';
import { AnimasiCaraMenulis } from './AnimasiCaraMenulis';
import { SelinganPelajaran } from './SelinganPelajaran';
import { useSelingan } from './useSelingan';

type FasePelajaran = 'kenalan' | 'soal' | 'selesai';

function resolveTahapPelajaran(rawId?: string): Tahap {
  if (rawId) {
    const langsung = tahapDariId(rawId);
    if (langsung) return langsung;

    // Dukungan ID titik lama (misal b1-p1, b2-p5, b3-p7)
    const titikLama = titikDariId(rawId);
    if (titikLama) {
      const diBab = tahapDiBab(titikLama.bab);
      if (titikLama.type === 'writing') {
        return diBab.find((t) => t.jenis === 'tulis') || diBab[0];
      }
      return diBab[0];
    }
  }
  return tahapDariId('b1-kenali')!;
}

export function PelajaranPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selesaikanTitik, catat } = useProgres();

  const tahap = useMemo(() => resolveTahapPelajaran(id), [id]);
  const babNomor = tahap.bab;

  // Jika tahap bertipe tulis dibuka di route /pelajaran, arahkan ke /latihan
  useEffect(() => {
    if (tahap.jenis === 'tulis') {
      navigate(`/latihan/${tahap.id}`, { replace: true });
    }
  }, [tahap, navigate]);

  const daftarAksara = useMemo(() => itemKenali(babNomor), [babNomor]);
  const daftarSoal = useMemo(
    () => (tahap.jenis === 'tulis' ? [] : soalUntukTahap(babNomor, tahap.jenis)),
    [babNomor, tahap.jenis]
  );

  const [fase, setFase] = useState<FasePelajaran>(
    tahap.jenis === 'kenali' ? 'kenalan' : 'soal'
  );
  const [aksaraIndex, setAksaraIndex] = useState(0);
  const [putarKey, setPutarKey] = useState(0);
  const [sedangAnimasi, setSedangAnimasi] = useState(false);

  const [soalIndex, setSoalIndex] = useState(0);
  const [pilihanIndex, setPilihanIndex] = useState<number | null>(null);
  const [sudahDiperiksa, setSudahDiperiksa] = useState(false);
  const [apakahBenar, setApakahBenar] = useState<boolean | null>(null);
  const [tersembunyi, setTersembunyi] = useState(false);

  const [detik, setDetik] = useState(0);

  // Catatan sesi untuk selingan penutup (menyesuaikan hasil belajar)
  const [salah, setSalah] = useState(0);
  const [kombo, setKombo] = useState(0);
  const [komboMaks, setKomboMaks] = useState(0);
  const selingan = useSelingan(tahap, fase === 'selesai');

  // Reset state ketika berpindah tahap
  useEffect(() => {
    setFase(tahap.jenis === 'kenali' ? 'kenalan' : 'soal');
    setAksaraIndex(0);
    setPutarKey(0);
    setSedangAnimasi(false);
    setSoalIndex(0);
    setPilihanIndex(null);
    setSudahDiperiksa(false);
    setApakahBenar(null);
    setTersembunyi(false);
    setDetik(0);
    setSalah(0);
    setKombo(0);
    setKomboMaks(0);
  }, [tahap.id, tahap.jenis]);

  useEffect(() => {
    if (fase === 'selesai') return;
    const interval = setInterval(() => {
      setDetik((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [fase]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalAksara = daftarAksara.length;
  const currentAksara = daftarAksara[aksaraIndex] || daftarAksara[0];

  const totalSoal = daftarSoal.length;
  const currentSoal = daftarSoal[soalIndex];

  const handlePutarCaraMenulis = () => {
    setSedangAnimasi(true);
    setPutarKey((k) => k + 1);
  };

  const handleMulaiTantangan = () => {
    setFase('soal');
    setSoalIndex(0);
    setPilihanIndex(null);
    setSudahDiperiksa(false);
    setApakahBenar(null);
    setTersembunyi(false);
  };

  const handlePilihOpsi = (idx: number) => {
    if (sudahDiperiksa && apakahBenar) return;
    setPilihanIndex(idx);
    if (sudahDiperiksa && !apakahBenar) {
      setSudahDiperiksa(false);
      setApakahBenar(null);
    }
  };

  const handlePeriksaAtauLanjut = () => {
    if (!currentSoal || pilihanIndex === null) return;

    if (!sudahDiperiksa) {
      const opsiDipilih = currentSoal.pilihan[pilihanIndex];
      const benar = opsiDipilih === currentSoal.jawab;
      setSudahDiperiksa(true);
      setApakahBenar(benar);
      const latin = latinSoal(currentSoal);
      catat(latin, benar);
      if (benar) {
        const k = kombo + 1;
        setKombo(k);
        setKomboMaks((m) => Math.max(m, k));
      } else {
        setSalah((n) => n + 1);
        setKombo(0);
      }
      return;
    }

    if (apakahBenar) {
      if (soalIndex + 1 < totalSoal) {
        setSoalIndex((s) => s + 1);
        setPilihanIndex(null);
        setSudahDiperiksa(false);
        setApakahBenar(null);
        setTersembunyi(false);
      } else {
        selesaikanTitik(tahap.id);
        // Sinkronkan juga ID titik jalur lama pada bab terkait
        const titikBabLama = JALUR.filter((t) => t.bab === babNomor && t.type === 'lesson');
        const mapNomorKeIndex = Math.min(titikBabLama.length - 1, Math.max(0, tahap.nomor - 1));
        if (titikBabLama[mapNomorKeIndex]) {
          selesaikanTitik(titikBabLama[mapNomorKeIndex].id);
        }
        setFase('selesai');
        selingan.tampilkanPenutup();
      }
    }
  };

  const handleLihatLagiIngat = () => {
    setTersembunyi(false);
    setSudahDiperiksa(false);
    setApakahBenar(null);
    setPilihanIndex(null);
  };

  // Tahap berikutnya di dalam bab yang sama
  const nextTahap = useMemo(() => {
    const semuaDiBab = tahapDiBab(babNomor);
    return semuaDiBab.find((t) => t.nomor === tahap.nomor + 1) || null;
  }, [babNomor, tahap.nomor]);

  const handleLanjutTahapBerikutnya = () => {
    if (nextTahap) {
      if (nextTahap.jenis === 'tulis') {
        navigate(`/latihan/${nextTahap.id}`);
      } else {
        navigate(`/pelajaran/${nextTahap.id}`);
      }
    } else {
      navigate(`/belajar/materi/${babNomor}`);
    }
  };

  const progressTotal = Math.max(totalSoal, 1);
  const progressCountText =
    fase === 'kenalan'
      ? `0 / ${progressTotal}`
      : fase === 'soal'
      ? `${soalIndex + 1} / ${progressTotal}`
      : `${progressTotal} / ${progressTotal}`;
  const solvedCount =
    fase === 'kenalan'
      ? 0
      : fase === 'selesai'
      ? progressTotal
      : soalIndex + (sudahDiperiksa && apakahBenar ? 1 : 0);
  const progressPct = Math.min(100, Math.round((solvedCount / progressTotal) * 100));

  const latinTarget = currentSoal ? latinSoal(currentSoal) : '';
  const aksaraTarget = currentSoal ? aksaraSoal(currentSoal) : '';

  const chipLabel =
    fase === 'kenalan'
      ? 'KENALAN DULU'
      : `SOAL ${soalIndex + 1 < 10 ? `0${soalIndex + 1}` : soalIndex + 1}`;

  return (
    <div className="pelajaran-page-container">
      {/* Header Top Bar */}
      <header className="pelajaran-nav-bar">
        <button
          type="button"
          className="pelajaran-btn-back"
          onClick={() => navigate(`/belajar/materi/${babNomor}`)}
          aria-label="Kembali ke Perjalanan Belajar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 19L5 12L12 5"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="pelajaran-header-info">
          <span className="pelajaran-tag-bab">
            BAB 0{babNomor} • {LABEL_TAHAP[tahap.jenis]}
          </span>
          <span className="pelajaran-tag-tahap">Tahap {tahap.nomor} / 5</span>
        </div>

        <div className="pelajaran-timer-capsule">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.1" />
            <path
              d="M12 7V12L15 14"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
          </svg>
          <span>{formatTimer(detik)}</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="pelajaran-progress-row">
        <div className="pelajaran-progress-track">
          <div
            className="pelajaran-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="pelajaran-progress-text">{progressCountText}</span>
      </div>

      {/* Main White Card Container */}
      <div className="pelajaran-card-main">
        {fase === 'kenalan' && currentAksara && (
          <>
            <div className="pelajaran-card-header">
              <div className="chip-kenalan-dulu">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>{chipLabel}</span>
              </div>
              <div className="pelajaran-card-mascot-head">
                <MaskotSplash compact />
              </div>
            </div>

            <h2 className="pelajaran-card-title">Kenalan dulu, yuk.</h2>
            <p className="pelajaran-card-subtitle">
              Jelajahi semua aksara bab ini, lalu coba tiga tantangan mengenali.
            </p>

            {/* Aksara Box dengan Animasi Cara Menulis (Pensil + Fill Goresan) */}
            <div className="aksara-box-center">
              <AnimasiCaraMenulis
                aksara={currentAksara.teks}
                putarKey={putarKey}
                compact
                onSelesai={() => setSedangAnimasi(false)}
              />

              <div className="aksara-latin-capsule">
                <span>{currentAksara.latin}</span>
              </div>
            </div>

            {/* Stepper Bulat Kiri-Kanan + Counter + Cara Menulis */}
            <div className="aksara-stepper-row">
              <button
                type="button"
                className="btn-stepper-circle"
                disabled={aksaraIndex === 0}
                onClick={() => {
                  setAksaraIndex((i) => Math.max(0, i - 1));
                  setPutarKey(0);
                  setSedangAnimasi(false);
                }}
                aria-label="Aksara sebelumnya"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12H5M12 19L5 12L12 5"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="stepper-info-col">
                <span className="stepper-counter-label">
                  Aksara {aksaraIndex + 1} dari {totalAksara}
                </span>
                <button
                  type="button"
                  className={`btn-contoh-bentuk ${sedangAnimasi ? 'is-playing' : ''}`}
                  onClick={handlePutarCaraMenulis}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Cara menulis</span>
                </button>
              </div>

              <button
                type="button"
                className="btn-stepper-circle"
                disabled={aksaraIndex >= totalAksara - 1}
                onClick={() => {
                  setAksaraIndex((i) => Math.min(totalAksara - 1, i + 1));
                  setPutarKey(0);
                  setSedangAnimasi(false);
                }}
                aria-label="Aksara berikutnya"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12H19M12 5L19 12L12 19"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <p className="pelajaran-card-footnote">
              Sentuh &ldquo;Cara menulis&rdquo; untuk animasi pensil sesuai urutan goresan.
            </p>
          </>
        )}

        {fase === 'soal' && currentSoal && (
          <>
            <div className="pelajaran-card-header">
              <div className="chip-kenalan-dulu">
                {tahap.jenis === 'ingat' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M9.5 4a3.5 3.5 0 00-3.32 4.62A3.5 3.5 0 005 15.17V16a3 3 0 003 3h1.5V4zm5 0v15H16a3 3 0 003-3v-.83a3.5 3.5 0 00-1.18-6.55A3.5 3.5 0 0014.5 4z"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : tahap.jenis === 'kuis' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
                <span>{chipLabel}</span>
              </div>

              <div className="pelajaran-card-mascot-head">
                <MaskotSplash compact />
              </div>
            </div>

            {tahap.jenis === 'cocokkan' && (
              <>
                <h2 className="pelajaran-card-title">Temukan pasangan bunyinya.</h2>
                <p className="pelajaran-card-subtitle">
                  Pilih aksara yang dibaca &ldquo;{latinTarget}&rdquo;.
                </p>
              </>
            )}

            {tahap.jenis === 'ingat' && (
              <>
                <h2 className="pelajaran-card-title">Amati. Ingat. Tebak.</h2>
                <p className="pelajaran-card-subtitle">
                  {!tersembunyi
                    ? 'Perhatikan bentuk aksara. Saat siap, sembunyikan dan ingat bunyinya.'
                    : 'Bentuknya disembunyikan. Masih ingat bunyinya?'}
                </p>
              </>
            )}

            {tahap.jenis === 'kuis' && (
              <>
                <h2 className="pelajaran-card-title">Tunjukkan yang sudah kamu pelajari.</h2>
                <p className="pelajaran-card-subtitle">
                  {currentSoal.arah === 'latin-ke-aksara'
                    ? `Pilih aksara yang dibaca “${latinTarget}”.`
                    : 'Pilih bunyi yang sesuai dengan bentuk aksara.'}
                </p>
              </>
            )}

            {tahap.jenis === 'kenali' && (
              <>
                <h2 className="pelajaran-card-title">Aksara ini berbunyi apa?</h2>
                <p className="pelajaran-card-subtitle">
                  Pilih bunyi yang sesuai dengan bentuk aksara.
                </p>
              </>
            )}

            {/* Pesan Feedback Benar / Salah tepat di bawah subjudul (sesuai UI/UX Figma) */}
            {sudahDiperiksa && (
              <div className={`feedback-msg-row ${apakahBenar ? 'correct' : 'wrong'}`}>
                {apakahBenar ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Tepat! Dibaca {latinTarget}.</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 12a8 8 0 102.34-5.66L4 8.5M4 4v4.5h4.5"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Belum tepat. Pilih jawaban lain.</span>
                    {tahap.jenis === 'ingat' && (
                      <button
                        type="button"
                        className="btn-lihat-lagi"
                        onClick={handleLihatLagiIngat}
                      >
                        Lihat lagi
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Kotak Target Soal */}
            <div className="aksara-box-center soal-box">
              {tahap.jenis === 'ingat' && tersembunyi ? (
                <div className="ingat-brain-hidden" aria-label="Aksara disembunyikan">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9.5 3.5a3.8 3.8 0 00-3.65 4.86A3.8 3.8 0 004.5 15.2V16a3.5 3.5 0 003.5 3.5h1.5v-16zm5 0v16H16a3.5 3.5 0 003.5-3.5v-.8a3.8 3.8 0 00-1.35-6.84A3.8 3.8 0 0014.5 3.5z"
                      stroke="#4E602B"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.5 8.5c-1.2 0-2 .8-2 2M14.5 8.5c1.2 0 2 .8 2 2M9.5 13.5c-1 0-1.8.6-2 1.5M14.5 13.5c1 0 1.8.6 2 1.5"
                      stroke="#4E602B"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              ) : currentSoal.arah === 'latin-ke-aksara' ? (
                <div className="aksara-box-latin-quote">
                  &ldquo;{latinTarget}&rdquo;
                </div>
              ) : (
                <div className="aksara-glyph-huge aksara">{aksaraTarget}</div>
              )}
            </div>

            {/* Tahap Ingat Fase Amati: Tombol "Aku sudah ingat" */}
            {tahap.jenis === 'ingat' && !tersembunyi ? (
              <div className="ingat-action-wrap">
                <button
                  type="button"
                  className="btn-aku-sudah-ingat"
                  onClick={() => setTersembunyi(true)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M9.5 4a3.5 3.5 0 00-3.32 4.62A3.5 3.5 0 005 15.17V16a3 3 0 003 3h1.5V4zm5 0v15H16a3 3 0 003-3v-.83a3.5 3.5 0 00-1.18-6.55A3.5 3.5 0 0014.5 4z"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Aku sudah ingat</span>
                </button>
              </div>
            ) : (
              /* Opsi Pilihan Ganda List Vertikal 4 Baris */
              <div className="soal-options-list">
                {currentSoal.pilihan.map((opsi, idx) => {
                  const hurufLabel = ['A', 'B', 'C', 'D'][idx] || '';
                  const isSelected = pilihanIndex === idx;
                  const isAksaraOpsi = currentSoal.arah === 'latin-ke-aksara';

                  let statusClass = '';
                  if (sudahDiperiksa) {
                    if (apakahBenar && opsi === currentSoal.jawab) {
                      statusClass = 'correct locked';
                    } else if (!apakahBenar && isSelected) {
                      statusClass = 'wrong';
                    }
                  } else if (isSelected) {
                    statusClass = 'selected';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`soal-option-card ${statusClass}`}
                      onClick={() => handlePilihOpsi(idx)}
                    >
                      <span className="option-badge-circle">{hurufLabel}</span>
                      <span
                        className={`option-latin-label ${
                          isAksaraOpsi ? 'aksara soal-opt-aksara' : ''
                        }`}
                      >
                        {opsi}
                      </span>

                      {statusClass.includes('correct') ? (
                        <span className="option-feedback-icon correct" aria-label="Benar">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M5 13l4 4L19 7"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      ) : statusClass.includes('wrong') ? (
                        <span className="option-feedback-icon wrong" aria-label="Salah">
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M6 6l12 12M18 6L6 18"
                              stroke="currentColor"
                              strokeWidth="2.3"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className="option-radio-ring" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {fase === 'selesai' && (
          <div className="pelajaran-selesai-center">
            <div className="chip-kenalan-dulu" style={{ marginBottom: '18px' }}>
              <span>✓</span>
              <span>TAHAP SELESAI</span>
            </div>

            <div className="pelajaran-selesai-mascot-wrap">
              <div className="pelajaran-selesai-halo" />
              <div className="pelajaran-selesai-mascot-ring">
                <div className="pelajaran-selesai-mascot-box">
                  <MaskotSplash compact />
                </div>
              </div>
            </div>

            <h2 className="pelajaran-selesai-title">Selangkah lebih mengenal.</h2>
            <p className="pelajaran-selesai-desc">
              {totalSoal} tantangan selesai. Progresmu tersimpan di perangkat ini.
            </p>

            <div className="pelajaran-selesai-stats">
              <div className="pelajaran-selesai-stat">
                <span className="pelajaran-selesai-stat-value">{totalSoal}</span>
                <span className="pelajaran-selesai-stat-label">Latihan selesai</span>
              </div>
              <div className="pelajaran-selesai-stat-divider" />
              <div className="pelajaran-selesai-stat">
                <span className="pelajaran-selesai-stat-value">{formatTimer(detik)}</span>
                <span className="pelajaran-selesai-stat-label">Waktu belajar</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Area */}
      <footer className="pelajaran-bottom-container">
        {fase === 'kenalan' && (
          <>
            <button
              type="button"
              className="btn-action-pelajaran"
              onClick={handleMulaiTantangan}
            >
              <span>Mulai {totalSoal} tantangan</span>
              <span>→</span>
            </button>
            <p className="pelajaran-bottom-quote">
              Belajar pelan-pelan, tidak perlu terburu-buru.
            </p>
          </>
        )}

        {fase === 'soal' && (
          <>
            <button
              type="button"
              className="btn-action-pelajaran"
              disabled={
                pilihanIndex === null ||
                (tahap.jenis === 'ingat' && !tersembunyi) ||
                (sudahDiperiksa && !apakahBenar)
              }
              onClick={handlePeriksaAtauLanjut}
            >
              <span>
                {sudahDiperiksa && apakahBenar
                  ? soalIndex + 1 < totalSoal
                    ? 'Tantangan berikutnya'
                    : 'Selesaikan tahap'
                  : 'Periksa jawaban'}
              </span>
              <span>→</span>
            </button>
            <p className="pelajaran-bottom-quote">
              Belajar pelan-pelan, tidak perlu terburu-buru.
            </p>
          </>
        )}

        {fase === 'selesai' && (
          <>
            <button
              type="button"
              className="btn-action-pelajaran"
              onClick={handleLanjutTahapBerikutnya}
            >
              <span>
                {nextTahap
                  ? `Lanjut: ${NAMA_TAHAP[nextTahap.jenis]}`
                  : 'Kembali ke Perjalanan Belajar'}
              </span>
              <span>→</span>
            </button>
            <p className="pelajaran-bottom-quote">
              Progres tersimpan di perangkat ini.
            </p>
          </>
        )}
      </footer>

      {/* Selingan pembuka & penutup tahap (adegan menyesuaikan kondisi belajar) */}
      {tahap.jenis !== 'tulis' && selingan.tampil === 'pembuka' && (
        <SelinganPelajaran
          mode="pembuka"
          adegan={selingan.pembuka}
          bab={babNomor}
          label={selingan.label}
          hurufLemah={selingan.hurufLemah}
          onSelesai={selingan.tutup}
        />
      )}
      {selingan.tampil === 'penutup' && fase === 'selesai' && (
        <SelinganPelajaran
          mode="penutup"
          adegan={selingan.buatPenutup({ total: totalSoal, salah, komboMaks, detik })}
          bab={babNomor}
          label={selingan.label}
          onSelesai={selingan.tutup}
        />
      )}
    </div>
  );
}
