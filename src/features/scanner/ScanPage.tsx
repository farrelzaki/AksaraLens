import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { MODE_DEMO, PENUH, bacaFoto, siapkanScanner, type Bingkai, type HasilScan } from '../../ml/model2/scanner';
import { bingkaiDariLayar } from '../../ml/model2/bingkai';
import { tautanMateri, urai, type SukuKata } from '../../aksara/urai';
import { simpanHasilSementara } from './hasilScan';
import { BingkaiPotong } from './BingkaiPotong';
import './scan.css';

// Lensa Aksara — tampilan sesuai CAMERA 1–4.png (Choirun).
// Kamera live tampil terus. Tombol rana mengambil satu foto dan membaca isi bingkai bidik di latar
// belakang dengan garis pemindaian; foto jepretan tidak ditampilkan. Hasil muncul sebagai lembar di atas kamera.
// Galeri: gambar dipilih lalu bisa diatur area bacanya (bingkai potong).
// Foto tidak disimpan dan tidak dikirim ke server.

const IkonKembali = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IkonBingkai = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M8 12h8" />
  </svg>
);

const IkonKameraMati = () => (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#D5E6B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 2l20 20M9.5 4h5l1.5 2H20a2 2 0 0 1 2 2v9M17 18.6A2 2 0 0 1 16 19H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1" />
    <path d="M10 10.2a3 3 0 0 0 3.8 3.8" />
  </svg>
);

const IkonGaleri = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7M16 5h6M19 2v6" />
    <circle cx="9" cy="9" r="1.6" />
    <path d="M21 15l-4.5-4.5L6 21" />
  </svg>
);

const Panah = ({ atas }: { atas?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: atas ? 'rotate(180deg)' : undefined }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/** Gambar contoh catatan aksara Jawa (dibaca oleh model yang sama seperti foto lain). */
async function buatContoh(): Promise<Blob> {
  try {
    await document.fonts.load('64px "Noto Sans Javanese"');
  } catch {
    // font cadangan bila belum siap
  }
  const k = document.createElement('canvas');
  k.width = 1000;
  k.height = 900;
  const c = k.getContext('2d')!;
  c.fillStyle = '#F6EFDF';
  c.fillRect(0, 0, k.width, k.height);
  c.fillStyle = '#8A7C6C';
  c.font = '500 22px "Plus Jakarta Sans", sans-serif';
  c.fillText('CATATAN AKSARA JAWA', 80, 90);
  c.fillStyle = '#2B1D14';
  c.font = '96px "Noto Sans Javanese", serif';
  c.fillText('ꦧꦥꦏ꧀ꦠꦶꦤ꧀ꦝꦏ꧀', 80, 400);
  c.fillText('ꦥꦱꦂ', 80, 640);
  return new Promise((ok, gagal) => k.toBlob((b) => (b ? ok(b) : gagal(new Error('Gagal membuat contoh'))), 'image/png'));
}

/** Satu frame dari video sebagai JPEG (sisi terpanjang dibatasi). */
function tangkapVideo(v: HTMLVideoElement | null, maks: number): Promise<Blob | null> {
  return new Promise((ok) => {
    if (!v || !v.videoWidth) return ok(null);
    const s = Math.min(1, maks / Math.max(v.videoWidth, v.videoHeight));
    const k = document.createElement('canvas');
    k.width = Math.round(v.videoWidth * s);
    k.height = Math.round(v.videoHeight * s);
    k.getContext('2d')!.drawImage(v, 0, 0, k.width, k.height);
    k.toBlob((b) => ok(b), 'image/jpeg', 0.9);
  });
}

/** Area bingkai bidik pada video; seluruh video bila elemennya belum terukur. */
function areaBidik(v: HTMLVideoElement, bingkaiBidik: HTMLElement | null): Bingkai {
  const e = v.getBoundingClientRect();
  const r = bingkaiBidik?.getBoundingClientRect();
  if (!r || !e.width || !e.height) return PENUH;
  return bingkaiDariLayar(
    { w: v.videoWidth, h: v.videoHeight },
    { w: e.width, h: e.height },
    { x: r.left - e.left, y: r.top - e.top, w: r.width, h: r.height },
  );
}

/** Pesan saat tidak ada aksara Jawa yang terbaca (PRD F5). */
function pesanKosong(h: HasilScan): string {
  if (h.kualitas === 'gelap') return 'Foto terlalu gelap. Cari tempat lebih terang lalu coba lagi.';
  if (h.kualitas === 'silau') return 'Foto terlalu silau. Ubah sudut agar tidak memantul.';
  if (h.kualitas === 'buram') return 'Foto buram. Tahan kamera lebih stabil lalu coba lagi.';
  if (h.diabaikan > 0) return 'Tidak ada aksara Jawa yang terbaca jelas. Teks lain diabaikan.';
  return 'Tidak ada tulisan aksara terbaca. Coba foto lebih dekat dan terang.';
}

/** Ringkasan bawah judul hasil. */
function ringkasHasil(h: HasilScan): string {
  const bagian = [`${h.baris.length} baris terbaca`];
  if (h.diabaikan > 0) bagian.push(`${h.diabaikan} teks lain diabaikan`);
  return `${bagian.join(' · ')}.${h.kurangYakin ? ' Hasil mungkin kurang tepat.' : ''}`;
}

/** Teks Latin dari seluruh hasil, dipisah per kata. */
const judulLatin = (h: HasilScan) =>
  h.baris
    .map((b) =>
      b.unicode
        .split(/\s+/)
        .filter(Boolean)
        .map((kata) => urai(kata).map((s) => s.latin).join('').replace(/\?/g, ''))
        .join(' '),
    )
    .join(' ')
    .trim();

export function ScanPage() {
  const navigate = useNavigate();
  const video = useRef<HTMLVideoElement>(null);
  const aliran = useRef<MediaStream | null>(null);
  const inputGaleri = useRef<HTMLInputElement>(null);
  const bidik = useRef<HTMLDivElement>(null);

  const [siap, setSiap] = useState(false);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [kameraGagal, setKameraGagal] = useState(false);
  const [foto, setFoto] = useState<File | Blob | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [adalahContoh, setAdalahContoh] = useState(false);
  const [bingkai, setBingkai] = useState<Bingkai>(PENUH);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilScan | null>(null);
  const [detail, setDetail] = useState(false);
  const [terpilih, setTerpilih] = useState(0);

  const bukaKamera = useCallback(async () => {
    // Browser hanya mengizinkan kamera di https atau localhost.
    if (!navigator.mediaDevices?.getUserMedia) {
      setKameraGagal(true);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      aliran.current?.getTracks().forEach((t) => t.stop());
      aliran.current = s;
      setKameraGagal(false);
      setKameraAktif(true);
    } catch {
      setKameraGagal(true);
      setKameraAktif(false);
    }
  }, []);

  useEffect(() => {
    siapkanScanner().then(
      () => setSiap(true),
      () => setGalat('Model scanner gagal dimuat. Periksa koneksi lalu muat ulang halaman.'),
    );
    void bukaKamera();
    return () => {
      aliran.current?.getTracks().forEach((t) => t.stop());
      aliran.current = null;
    };
  }, [bukaKamera]);

  useEffect(() => {
    if (kameraAktif && video.current && aliran.current) {
      video.current.srcObject = aliran.current;
    }
  }, [kameraAktif]);

  useEffect(() => {
    if (!foto) {
      setPratinjau(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setPratinjau(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  // Membaca satu gambar di latar belakang, lalu menampilkan lembar hasil.
  const bacaGambar = async (gambar: Blob, area: Bingkai, mode?: 'foto' | 'area') => {
    setMemproses(true);
    setGalat(null);
    setHasil(null);
    setDetail(false);
    setTerpilih(0);
    try {
      const h = await bacaFoto(gambar, area, mode);
      if (import.meta.env.DEV) console.info('[scanner]', h.info);
      simpanHasilSementara(h);
      if (h.baris.length === 0) setGalat(pesanKosong(h));
      else setHasil(h);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    } finally {
      setMemproses(false);
    }
  };

  const tekanShutter = async () => {
    if (memproses || !siap) return;
    if (foto) {
      await bacaGambar(foto, bingkai);
      return;
    }
    if (kameraAktif) {
      const v = video.current;
      const b = await tangkapVideo(v, 2048);
      if (b && v) await bacaGambar(b, areaBidik(v, bidik.current), 'area');
      else setGalat('Kamera belum siap. Coba lagi.');
      return;
    }
    inputGaleri.current?.click();
  };

  const pilihGaleri = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!f) return;
    setGalat(null);
    setHasil(null);
    setBingkai(PENUH);
    setAdalahContoh(false);
    setFoto(f);
  };

  const pakaiContoh = async () => {
    if (memproses || !siap) return;
    setGalat(null);
    setHasil(null);
    setBingkai(PENUH);
    const b = await buatContoh();
    setAdalahContoh(true);
    setFoto(b);
    await bacaGambar(b, PENUH, 'area');
  };

  const kembaliKamera = () => {
    setFoto(null);
    setAdalahContoh(false);
    setBingkai(PENUH);
    setGalat(null);
  };

  const tutupHasil = () => {
    setHasil(null);
    setDetail(false);
  };

  const suku: SukuKata[] = hasil ? hasil.baris.flatMap((b) => b.sukuKata) : [];
  const dipilih = suku[terpilih] ?? suku[0];
  const tautan = dipilih?.komponen.map(tautanMateri).find(Boolean) ?? '/belajar/materi/1';
  const tampilKamera = kameraAktif && !foto;

  return (
    <div className="scan-page">
      {/* Pratinjau kamera live, tanpa gambar hasil jepretan */}
      {tampilKamera && (
        <>
          <video ref={video} className="scan-video-bg" autoPlay playsInline muted aria-label="Pratinjau kamera" />
          <div className="scan-video-scrim" aria-hidden="true" />
        </>
      )}

      {/* Header */}
      <header className={`scan-header ${hasil ? 'redup' : ''}`}>
        <button type="button" className="scan-circle-btn kiri" onClick={() => navigate('/belajar')} aria-label="Kembali">
          <IkonKembali />
        </button>
        <div className="scan-title">Lensa Aksara</div>
        <div className="scan-subtitle">Arahkan. Foto. Pahami.</div>
        <div className="scan-circle-btn kanan" aria-hidden="true">
          <IkonBingkai size={20} />
        </div>
      </header>

      {MODE_DEMO && (
        <p role="note" style={{ position: 'absolute', top: 92, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: '#D5E6B0', margin: 0 }}>
          Mode demo: hasil yang tampil adalah contoh, bukan hasil model.
        </p>
      )}

      {/* Bingkai bidik aksara */}
      <div className="scan-frame" ref={bidik}>
        <i className="scan-corner lt" />
        <i className="scan-corner rt" />
        <i className="scan-corner lb" />
        <i className="scan-corner rb" />
        <div className="scan-media">
          {foto && pratinjau ? (
            adalahContoh ? (
              <img src={pratinjau} alt="Contoh catatan aksara" className="contoh" draggable={false} />
            ) : (
              <BingkaiPotong src={pratinjau} nilai={bingkai} onUbah={setBingkai} />
            )
          ) : kameraAktif ? null : (
            <div className="scan-empty">
              <IkonKameraMati />
              <h2>Kamera belum aktif</h2>
              <p>{kameraGagal ? 'Izinkan akses kamera di browser, atau pilih dari galeri.' : 'Membuka kamera…'}</p>
              {kameraGagal && (
                <button type="button" className="scan-retry" onClick={() => void bukaKamera()}>
                  Coba buka kamera
                </button>
              )}
            </div>
          )}
          {memproses && <div className="scan-garis" aria-hidden="true" />}
        </div>
      </div>

      {/* Kontrol */}
      {!hasil && (
        <>
          <div className="scan-hint">
            <strong>Letakkan aksara di dalam bingkai</strong>
            <span>Pastikan cahaya cukup dan tulisan jelas.</span>
          </div>

          <div className="scan-controls">
            <button type="button" className="scan-side-btn" onClick={() => inputGaleri.current?.click()}>
              <IkonGaleri />
              Galeri
            </button>
            <button
              type="button"
              className={`scan-shutter ${foto || kameraAktif ? 'siap' : ''} ${memproses ? 'sibuk' : ''}`}
              onClick={() => void tekanShutter()}
              disabled={memproses || !siap}
              aria-label={memproses ? 'Membaca aksara' : foto ? 'Baca foto' : 'Ambil foto'}
            >
              <span />
            </button>
            <button type="button" className="scan-side-btn" onClick={() => void pakaiContoh()} disabled={memproses || !siap}>
              <IkonBingkai size={24} />
              Contoh
            </button>
          </div>

          {foto && (
            <div className="scan-hint">
              <button type="button" className="scan-retry" onClick={kembaliKamera}>Kembali ke kamera</button>
            </div>
          )}

          <div className="scan-note" role="status">
            {galat
              ? galat
              : memproses
                ? 'Membaca aksara…'
                : !siap
                  ? 'Menyiapkan scanner…'
                  : foto
                    ? 'Atur area bingkai, lalu tekan tombol untuk membaca'
                    : kameraAktif
                      ? 'Tekan tombol untuk memfoto dan membaca aksara'
                      : 'Kamera belum aktif'}
          </div>
        </>
      )}

      <input ref={inputGaleri} type="file" accept="image/*" hidden onChange={pilihGaleri} />

      {/* Lembar hasil di atas kamera */}
      {hasil && (
        <section className="scan-sheet" aria-label="Hasil bacaan aksara">
          <button type="button" className="scan-sheet-close" onClick={tutupHasil} aria-label="Tutup hasil">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <h2 className="scan-sheet-title">{judulLatin(hasil)}</h2>
          <p className="scan-sheet-sub">
            {detail ? 'Pilih suku kata untuk melihat komponennya.' : ringkasHasil(hasil)}
          </p>

          <button type="button" className="scan-bedah" onClick={() => setDetail((d) => !d)} aria-expanded={detail}>
            <span>{detail ? 'Sembunyikan detail' : 'Bedah suku kata'}</span>
            <Panah atas={detail} />
          </button>

          {detail && (
            <>
              <div className="scan-chips" role="tablist" aria-label="Daftar suku kata">
                {suku.map((s, i) => (
                  <button
                    key={`${s.latin}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={terpilih === i}
                    className={`scan-chip ${terpilih === i ? 'aktif' : ''}`}
                    onClick={() => setTerpilih(i)}
                  >
                    <span className="aksara">{s.teks}</span>
                    <small>{s.latin}</small>
                  </button>
                ))}
              </div>

              {dipilih && (
                <div className="scan-info">
                  <p>
                    Suku kata {dipilih.latin} terdiri dari {dipilih.komponen.map((k) => k.nama).join(' + ')}.
                  </p>
                </div>
              )}

              <div className="scan-materi">
                <Link to={tautan}>Pelajari di materi</Link>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
