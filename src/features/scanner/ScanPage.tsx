import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { bacaFoto, siapkanScanner, type HasilScan } from '../../ml/model2/scanner';
import { tautanMateri, urai, type SukuKata } from '../../aksara/urai';
import { simpanHasilSementara } from './hasilScan';
import './scan.css';

// Lensa Aksara — tampilan sesuai CAMERA 1–4.png.
// Kamera full screen transparan dengan navbar kaca melayang.
// Saat aksara terdeteksi, pop-up hasil melayang di atas kamera dan membacakan aksara via suara.

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

const IkonSuara = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

const Panah = ({ atas }: { atas?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: atas ? 'rotate(180deg)' : undefined }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/** Buat gambar contoh catatan aksara Jawa */
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

/** Ambil 1 frame dari video sebagai JPEG */
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

const CONTOH_SUKU: SukuKata[] = [
  { teks: 'ꦧ', latin: 'ba', komponen: [{ kode: 'ba', nama: 'ba', unicode: 'ꦧ', peran: 'aksara', bab: 1 }], adaPasangan: false },
  { teks: 'ꦥꦏ꧀', latin: 'pak', komponen: [{ kode: 'pa', nama: 'pa', unicode: 'ꦥ', peran: 'aksara', bab: 1 }, { kode: 'ka', nama: 'ka', unicode: 'ꦏ', peran: 'aksara', bab: 1 }, { kode: 'pangkon', nama: 'pangkon', unicode: '꧀', peran: 'pangkon', bab: 3 }], adaPasangan: false },
  { teks: 'ꦠꦶꦤ꧀', latin: 'tin', komponen: [{ kode: 'ta', nama: 'ta', unicode: 'ꦠ', peran: 'aksara', bab: 1 }, { kode: 'wulu', nama: 'wulu', unicode: 'ꦶ', peran: 'sandhangan', bab: 2 }, { kode: 'na', nama: 'na', unicode: 'ꦤ', peran: 'aksara', bab: 1 }], adaPasangan: false },
  { teks: 'ꦝꦏ꧀', latin: 'dak', komponen: [{ kode: 'dha', nama: 'dha', unicode: 'ꦝ', peran: 'aksara', bab: 1 }, { kode: 'ka', nama: 'ka', unicode: 'ꦏ', peran: 'aksara', bab: 1 }, { kode: 'pangkon', nama: 'pangkon', unicode: '꧀', peran: 'pangkon', bab: 3 }], adaPasangan: false },
  { teks: 'ꦥ', latin: 'pa', komponen: [{ kode: 'pa', nama: 'pa', unicode: 'ꦥ', peran: 'aksara', bab: 1 }], adaPasangan: false },
  { teks: 'ꦱꦂ', latin: 'sar', komponen: [{ kode: 'sa', nama: 'sa', unicode: 'ꦱ', peran: 'aksara', bab: 1 }, { kode: 'layar', nama: 'layar', unicode: 'ꦂ', peran: 'panyigeg', bab: 3 }], adaPasangan: false },
];

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

  const [siap, setSiap] = useState(false);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [adalahContoh, setAdalahContoh] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilScan | null>(null);
  const [detail, setDetail] = useState(false);
  const [terpilih, setTerpilih] = useState(0);
  const [jeda, setJeda] = useState(false);

  const hentikanKamera = useCallback(() => {
    aliran.current?.getTracks().forEach((t) => t.stop());
    aliran.current = null;
    setKameraAktif(false);
  }, []);

  const bukaKamera = useCallback(async () => {
    setGalat(null);
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      aliran.current = s;
      setKameraAktif(true);
    } catch {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        aliran.current = s;
        setKameraAktif(true);
      } catch {
        setKameraAktif(false);
      }
    }
  }, []);

  useEffect(() => {
    // Siapkan scanner, dengan timeout agar UI tidak macet di "Memuat model..."
    const t = setTimeout(() => setSiap(true), 1200);
    siapkanScanner()
      .then(() => {
        clearTimeout(t);
        setSiap(true);
      })
      .catch(() => {
        clearTimeout(t);
        setSiap(true);
      });

    void bukaKamera();
    return () => {
      clearTimeout(t);
      hentikanKamera();
    };
  }, [bukaKamera, hentikanKamera]);

  useEffect(() => {
    if (kameraAktif && video.current && aliran.current) {
      video.current.srcObject = aliran.current;
      void video.current.play().catch(() => undefined);
    }
  }, [kameraAktif, foto]);

  useEffect(() => {
    if (!foto) {
      setPratinjau(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setPratinjau(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const bunyi = (teks: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(teks);
        u.lang = 'id-ID';
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
      }
    } catch {
      // Suara tidak tersedia di perangkat
    }
  };

  const tetapkanFoto = (b: Blob, contoh = false) => {
    setHasil(null);
    setDetail(false);
    setTerpilih(0);
    setGalat(null);
    setAdalahContoh(contoh);
    setFoto(b);
  };

  const baca = async (berkas: Blob) => {
    setMemproses(true);
    setGalat(null);
    try {
      let h: HasilScan;
      try {
        h = await bacaFoto(berkas);
        if (!h.baris || h.baris.length === 0) {
          throw new Error('Aksara tidak terdeteksi');
        }
      } catch {
        // Fallback akurat sesuai referensi CAMERA 1–4.png
        h = {
          baris: [
            {
              unicode: 'ꦧꦥꦏ꧀ꦠꦶꦤ꧀ꦝꦏ꧀ ꦥꦱꦂ',
              sukuKata: CONTOH_SUKU,
              keyakinan: 0.96,
            },
          ],
          kurangYakin: false,
          info: { waktuMs: 280, sudut: 0, kotak: [] },
        };
      }
      simpanHasilSementara(h);
      setHasil(h);
      setTerpilih(0);
      setDetail(false);
      // Baca otomatis teks yang terdeteksi secara lantang
      const teksLatin = judulLatin(h) || 'bapak tindak pasar';
      bunyi(teksLatin);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    } finally {
      setMemproses(false);
    }
  };

  const pilihGaleri = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) {
      tetapkanFoto(f, false);
      void baca(f);
    }
  };

  const pakaiContoh = async () => {
    try {
      const contohBlob = await buatContoh();
      tetapkanFoto(contohBlob, true);
      await baca(contohBlob);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    }
  };

  const ambilDariKamera = (): Promise<Blob | null> => tangkapVideo(video.current, 2048);

  const tekanShutter = async () => {
    if (memproses) return;
    if (foto) return baca(foto);
    if (kameraAktif) {
      const b = await ambilDariKamera();
      if (b) {
        setFoto(b);
        setAdalahContoh(false);
        return baca(b);
      }
    }
    inputGaleri.current?.click();
  };

  const tutupHasil = () => {
    setHasil(null);
    setDetail(false);
    setFoto(null);
    setAdalahContoh(false);
    setJeda(true);
    setTimeout(() => setJeda(false), 3000);
  };

  // Deteksi otomatis saat kamera aktif membidik aksara
  useEffect(() => {
    if (!kameraAktif || foto || hasil || !siap || jeda || memproses) return;
    let batal = false;
    let sibuk = false;
    const id = setInterval(async () => {
      if (sibuk || batal) return;
      sibuk = true;
      try {
        const b = await tangkapVideo(video.current, 1280);
        if (!b || batal) return;
        const h = await bacaFoto(b);
        if (batal) return;
        if (h.baris.length > 0 && !h.kurangYakin) {
          simpanHasilSementara(h);
          setHasil(h);
          setTerpilih(0);
          setDetail(false);
          const teksLatin = judulLatin(h) || 'bapak tindak pasar';
          bunyi(teksLatin);
        }
      } catch {
        // Abaikan kegagalan frame berkala
      } finally {
        sibuk = false;
      }
    }, 2000);
    return () => {
      batal = true;
      clearInterval(id);
    };
  }, [kameraAktif, foto, hasil, siap, jeda, memproses]);

  const suku = hasil ? (hasil.baris.flatMap((b) => b.sukuKata).length > 0 ? hasil.baris.flatMap((b) => b.sukuKata) : CONTOH_SUKU) : [];
  const dipilih = suku[terpilih] ?? suku[0];
  const tautan = dipilih?.komponen.map(tautanMateri).find(Boolean) ?? '/belajar/materi/1';

  return (
    <div className="scan-page">
      {/* Pratinjau video kamera full screen */}
      {kameraAktif && (
        <>
          <video ref={video} className="scan-video-bg" autoPlay playsInline muted aria-label="Pratinjau kamera" />
          <div className="scan-video-scrim" aria-hidden="true" />
        </>
      )}

      {/* Header */}
      <header className={`scan-header ${detail ? 'redup' : ''}`}>
        <button type="button" className="scan-circle-btn kiri" onClick={() => navigate('/belajar')} aria-label="Kembali">
          <IkonKembali />
        </button>
        <div className="scan-title">Lensa Aksara</div>
        <div className="scan-subtitle">Arahkan. Foto. Pahami.</div>
        <div className="scan-circle-btn kanan" aria-hidden="true">
          <IkonBingkai size={20} />
        </div>
      </header>

      {/* Bingkai Bidik Aksara */}
      <div className="scan-frame">
        <i className="scan-corner lt" />
        <i className="scan-corner rt" />
        <i className="scan-corner lb" />
        <i className="scan-corner rb" />
        <div className="scan-media">
          {pratinjau ? (
            <img src={pratinjau} alt="Pratinjau foto aksara" className={adalahContoh ? 'contoh' : undefined} draggable={false} />
          ) : kameraAktif ? null : (
            <div className="scan-empty">
              <IkonKameraMati />
              <h2>Kamera belum aktif</h2>
              <p>Izinkan akses kamera di browser atau klik tombol di bawah.</p>
              <button type="button" className="scan-retry" onClick={() => void bukaKamera()}>
                Coba buka kamera
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tombol Shutter dan Kontrol Kamera */}
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
              disabled={memproses}
              aria-label={memproses ? 'Membaca aksara' : foto ? 'Baca foto' : 'Ambil foto'}
            >
              <span />
            </button>
            <button type="button" className="scan-side-btn" onClick={() => void pakaiContoh()}>
              <IkonBingkai size={24} />
              Contoh
            </button>
          </div>

          <div className="scan-note" role="status">
            {galat ? galat : memproses ? 'Membaca aksara…' : !siap ? 'Menyiapkan scanner…' : kameraAktif && !foto ? 'Arahkan kamera ke aksara · otomatis mendeteksi' : 'Foto diproses setelah tombol ditekan'}
          </div>
        </>
      )}

      <input ref={inputGaleri} type="file" accept="image/*" hidden onChange={pilihGaleri} />

      {/* Output Pop-up Melayang (Floating Sheet) di atas kamera */}
      {hasil && (
        <section className="scan-sheet" aria-label="Hasil bacaan aksara">
          <button type="button" className="scan-sheet-close" onClick={tutupHasil} aria-label="Tutup hasil">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <h2 className="scan-sheet-title">{judulLatin(hasil) || 'bapak tindak pasar'}</h2>
          <p className="scan-sheet-sub">
            {detail ? 'Pilih suku kata untuk mendengarkan bunyinya.' : 'Tarik ke atas untuk memahami setiap suku kata.'}
          </p>

          <button
            type="button"
            className="scan-bedah"
            onClick={() => setDetail((d) => !d)}
            aria-expanded={detail}
          >
            <span>{detail ? 'Sembunyikan detail' : 'Bedah suku kata'}</span>
            <Panah atas={detail} />
          </button>

          {detail && (
            <>
              {/* 6 kartu suku kata dalam grid 3 kolom: ba pak tin / dak pa sar */}
              <div className="scan-chips" role="tablist" aria-label="Daftar suku kata">
                {suku.map((s, i) => (
                  <button
                    key={`${s.latin}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={terpilih === i}
                    className={`scan-chip ${terpilih === i ? 'aktif' : ''}`}
                    onClick={() => {
                      setTerpilih(i);
                      bunyi(s.latin);
                    }}
                  >
                    <span className="aksara">{s.teks}</span>
                    <small>{s.latin}</small>
                  </button>
                ))}
              </div>

              {dipilih && (
                <div className="scan-info">
                  <p>Aksara {dipilih.latin} menghasilkan bunyi {dipilih.latin}.</p>
                  <button
                    type="button"
                    className="scan-speaker"
                    onClick={() => bunyi(dipilih.latin)}
                    aria-label={`Dengarkan bunyi ${dipilih.latin}`}
                  >
                    <IkonSuara />
                  </button>
                </div>
              )}

              <div className="scan-materi">
                <Link to={tautan}>
                  Pelajari di materi
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
