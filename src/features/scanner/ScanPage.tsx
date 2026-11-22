import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { tampilDebug } from '../../ml/model2/debug';
import { MODE_DEMO, PENUH, bacaFoto, siapkanScanner, type Bingkai, type HasilScan } from '../../ml/model2/scanner';
import { bingkaiDariLayar, kePiksel } from '../../ml/model2/bingkai';
import { dariRGBA, ketajaman } from '../../ml/model2/gambar';
import { tautanMateri, urai, type SukuKata } from '../../aksara/urai';
import { gantiSuku, pilihanSuku } from '../../aksara/koreksi';
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

const IkonPutarKamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8 8 0 0 0-14.6-4.4M4 4v4h4" />
    <path d="M4 13a8 8 0 0 0 14.6 4.4M20 20v-4h-4" />
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

/** Hasil pratinjau untuk gambar Contoh ketika model ONNX lokal belum terpasang. */
function buatHasilPratinjauContoh(): HasilScan {
  const barisTeks = ['ꦧꦥꦏ꧀ꦠꦶꦤ꧀ꦝꦏ꧀', 'ꦥꦱꦂ'];
  return {
    baris: barisTeks.map((unicode) => ({
      unicode,
      keyakinan: 0.99,
      status: 'TERIMA' as const,
      sukuKata: urai(unicode),
    })),
    kurangYakin: false,
    diabaikan: 0,
    kualitas: 'baik',
    info: { waktuMs: 0, sudut: 0, kotak: [] },
  };
}

const FRAME_TANGKAP = 3; // frame yang diambil saat rana ditekan; yang paling tajam dibaca
const JEDA_FRAME_MS = 120;
const SISI_UJI_TAJAM = 320;

/** Ketajaman area `b` pada kanvas, diukur pada salinan kecil agar cepat. */
function nilaiTajam(k: HTMLCanvasElement, b: Bingkai): number {
  const [x0, y0, x1, y1] = kePiksel(b, k.width, k.height);
  const s = Math.min(1, SISI_UJI_TAJAM / Math.max(x1 - x0, y1 - y0));
  const w = Math.max(1, Math.round((x1 - x0) * s));
  const h = Math.max(1, Math.round((y1 - y0) * s));
  const kecil = document.createElement('canvas');
  kecil.width = w;
  kecil.height = h;
  const c = kecil.getContext('2d', { willReadFrequently: true })!;
  c.drawImage(k, x0, y0, x1 - x0, y1 - y0, 0, 0, w, h);
  return ketajaman(dariRGBA(c.getImageData(0, 0, w, h).data, w, h));
}

/**
 * Beberapa frame video berjarak pendek; yang paling tajam di area `b` dikembalikan sebagai JPEG
 * (sisi terpanjang dibatasi). Mengurangi foto buram karena ponsel bergoyang saat rana ditekan.
 */
async function tangkapVideo(v: HTMLVideoElement | null, maks: number, b: Bingkai = PENUH): Promise<Blob | null> {
  if (!v || !v.videoWidth) return null;
  const s = Math.min(1, maks / Math.max(v.videoWidth, v.videoHeight));
  let terbaik: HTMLCanvasElement | null = null;
  let nilaiTerbaik = -1;
  for (let i = 0; i < FRAME_TANGKAP; i++) {
    if (i) await new Promise((ok) => setTimeout(ok, JEDA_FRAME_MS));
    const k = document.createElement('canvas');
    k.width = Math.round(v.videoWidth * s);
    k.height = Math.round(v.videoHeight * s);
    k.getContext('2d')!.drawImage(v, 0, 0, k.width, k.height);
    const n = nilaiTajam(k, b);
    if (n > nilaiTerbaik) {
      nilaiTerbaik = n;
      terbaik = k;
    }
  }
  return new Promise((ok) => terbaik!.toBlob((hasil) => ok(hasil), 'image/jpeg', 0.9));
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
  const diperbaiki = h.baris.some((b) => b.diperbaiki) ? ' Sudah kamu perbaiki.' : '';
  const terpotong = h.baris.some((b) => b.terpotong) ? ' Ada tulisan terpotong di tepi bingkai: geser agar tulisan utuh di dalam bingkai.' : '';
  return `${bagian.join(' · ')}.${h.kurangYakin && !diperbaiki ? ' Hasil mungkin kurang tepat.' : ''}${terpotong}${diperbaiki}`;
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
  const terpasangRef = useRef(true);
  const permKameraRef = useRef(0);
  const menghadapRef = useRef<'environment' | 'user'>('environment');
  const modelStatusRef = useRef<'memuat' | 'siap' | 'gagal'>('memuat');
  const muatModelRef = useRef<Promise<boolean> | null>(null);

  const [modelStatus, setModelStatus] = useState<'memuat' | 'siap' | 'gagal'>('memuat');
  const [modelGalat, setModelGalat] = useState<string | null>(null);
  // Tombol ditekan sebelum model siap: tampilkan sibuk + pesan, bukan diam (pemuatan pertama bisa puluhan detik).
  const [menungguModel, setMenungguModel] = useState(false);
  const [kameraStatus, setKameraStatus] = useState<'membuka' | 'aktif' | 'gagal'>('membuka');
  const [kameraPesan, setKameraPesan] = useState<string | null>(null);
  const [menghadap, setMenghadap] = useState<'environment' | 'user'>('environment');
  const [videoSiap, setVideoSiap] = useState(false);
  const [streamTik, setStreamTik] = useState(0);

  const [foto, setFoto] = useState<File | Blob | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [adalahContoh, setAdalahContoh] = useState(false);
  const [pratinjauContoh, setPratinjauContoh] = useState(false);
  const [bingkai, setBingkai] = useState<Bingkai>(PENUH);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilScan | null>(null);
  const [detail, setDetail] = useState(false);
  const [terpilih, setTerpilih] = useState(0);
  // Mode koreksi: suku kata yang sedang dipilih untuk diganti (baris, indeks suku di baris itu).
  const [perbaiki, setPerbaiki] = useState(false);
  const [sasaran, setSasaran] = useState<{ b: number; s: number } | null>(null);

  const hentikanAliran = useCallback(() => {
    aliran.current?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    aliran.current = null;
  }, []);

  const bukaKamera = useCallback(
    async (arah?: 'environment' | 'user') => {
      const targetArah = arah ?? menghadapRef.current;
      menghadapRef.current = targetArah;
      const reqId = ++permKameraRef.current;

      // Browser hanya mengizinkan kamera di https atau localhost.
      if (!navigator.mediaDevices?.getUserMedia) {
        setKameraStatus('gagal');
        setVideoSiap(false);
        setKameraPesan('Browser atau alamat halaman belum mendukung kamera. Gunakan HTTPS/localhost atau pilih Galeri.');
        return;
      }

      setKameraStatus('membuka');
      setVideoSiap(false);
      setKameraPesan(null);

      const kandidat: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: targetArah }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
        { video: { facingMode: targetArah }, audio: false },
        { video: true, audio: false },
      ];

      let s: MediaStream | null = null;
      let errTerakhir: unknown = null;

      for (const constraints of kandidat) {
        try {
          s = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          errTerakhir = err;
          const nama = err instanceof DOMException ? err.name : '';
          if (nama === 'NotAllowedError' || nama === 'PermissionDeniedError' || nama === 'SecurityError') {
            break;
          }
        }
      }

      // Abaikan hasil lama bila efek sudah dibersihkan (mis. StrictMode) atau ada permintaan kamera lebih baru
      if (!terpasangRef.current || permKameraRef.current !== reqId) {
        s?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!s) {
        hentikanAliran();
        setKameraStatus('gagal');
        setVideoSiap(false);
        const nama = errTerakhir instanceof DOMException ? errTerakhir.name : '';
        if (nama === 'NotAllowedError' || nama === 'PermissionDeniedError') {
          setKameraPesan('Izin kamera ditolak. Aktifkan izin kamera di ikon gembok browser, lalu coba lagi.');
        } else if (nama === 'NotFoundError' || nama === 'DevicesNotFoundError') {
          setKameraPesan('Kamera tidak ditemukan pada perangkat ini. Gunakan Galeri atau Contoh di bawah.');
        } else if (nama === 'NotReadableError' || nama === 'TrackStartError') {
          setKameraPesan('Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu coba buka lagi.');
        } else {
          setKameraPesan('Izinkan akses kamera di browser, atau pilih foto dari galeri.');
        }
        return;
      }

      hentikanAliran();
      aliran.current = s;

      const track = s.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          if (terpasangRef.current && aliran.current === s) {
            aliran.current = null;
            setVideoSiap(false);
            setKameraStatus('gagal');
            setKameraPesan('Koneksi kamera terputus. Tekan Coba buka kamera untuk menyambung ulang.');
          }
        };
      }

      setKameraStatus('aktif');
      setStreamTik((n) => n + 1);
    },
    [hentikanAliran],
  );

  const pastikanModelSiap = useCallback(async (paksaUlang = false): Promise<boolean> => {
    if (modelStatusRef.current === 'siap') return true;
    if (!paksaUlang && muatModelRef.current) return muatModelRef.current;

    modelStatusRef.current = 'memuat';
    setModelStatus('memuat');
    setModelGalat(null);

    const tugas = siapkanScanner()
      .then(() => {
        modelStatusRef.current = 'siap';
        if (terpasangRef.current) {
          setModelStatus('siap');
          setModelGalat(null);
        }
        return true;
      })
      .catch((err) => {
        modelStatusRef.current = 'gagal';
        if (terpasangRef.current) {
          setModelStatus('gagal');
          const msg = err instanceof Error ? err.message : '';
          if (msg.includes('tidak ditemukan') || msg.includes('belum tersedia')) {
            setModelGalat('Model AI (.onnx) belum ada di public/models/. Foto & Contoh tetap bisa dipakai.');
          } else {
            setModelGalat('Model scanner gagal dimuat. Periksa koneksi lalu coba muat ulang.');
          }
        }
        return false;
      })
      .finally(() => {
        if (muatModelRef.current === tugas) muatModelRef.current = null;
      });

    muatModelRef.current = tugas;
    return tugas;
  }, []);

  useEffect(() => {
    terpasangRef.current = true;
    void pastikanModelSiap();
    void bukaKamera('environment');
    return () => {
      terpasangRef.current = false;
      permKameraRef.current += 1;
      hentikanAliran();
    };
  }, [bukaKamera, hentikanAliran, pastikanModelSiap]);

  const tampilKamera = kameraStatus === 'aktif' && !foto;

  useEffect(() => {
    if (!tampilKamera) {
      setVideoSiap(false);
      return;
    }
    const el = video.current;
    const s = aliran.current;
    if (!el || !s) return;

    if (el.srcObject !== s) {
      el.srcObject = s;
    }
    if (el.readyState >= 2 && el.videoWidth > 0) {
      setVideoSiap(true);
    }
    void el
      .play()
      .then(() => {
        if (terpasangRef.current && el.videoWidth > 0) setVideoSiap(true);
      })
      .catch(() => {
        // Beberapa browser butuh klik tombol sebelum play() diizinkan
      });
  }, [tampilKamera, streamTik]);

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
  const bacaGambar = async (gambar: Blob, area: Bingkai, mode?: 'foto' | 'area', longgar?: boolean) => {
    setMemproses(true);
    setGalat(null);
    setHasil(null);
    setDetail(false);
    setPerbaiki(false);
    setSasaran(null);
    setPratinjauContoh(false);
    setTerpilih(0);
    try {
      const h = await bacaFoto(gambar, area, mode, longgar);
      if (import.meta.env.DEV) console.info('[scanner]', h.info);
      if (new URLSearchParams(location.search).has('debug')) tampilDebug(h.info);
      simpanHasilSementara(h);
      if (h.baris.length === 0) setGalat(pesanKosong(h));
      else setHasil(h);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    } finally {
      setMemproses(false);
    }
  };

  const tungguModel = async (paksaUlang = false): Promise<boolean> => {
    if (modelStatus === 'siap') return true;
    setMenungguModel(true);
    try {
      return await pastikanModelSiap(paksaUlang);
    } finally {
      setMenungguModel(false);
    }
  };

  const tekanShutter = async () => {
    if (memproses || menungguModel) return;
    setGalat(null);

    if (foto) {
      const oke = await tungguModel(true);
      if (oke) {
        await bacaGambar(foto, bingkai);
      } else if (adalahContoh) {
        const h = buatHasilPratinjauContoh();
        simpanHasilSementara(h);
        setPratinjauContoh(true);
        setHasil(h);
      } else {
        setGalat('Model AI (.onnx) belum ada di public/models/, sehingga pembacaan otomatis belum aktif. Coba tombol Contoh.');
      }
      return;
    }

    if (tampilKamera) {
      const v = video.current;
      if (v && v.paused) {
        await v.play().catch(() => undefined);
      }
      const area = v ? areaBidik(v, bidik.current) : PENUH;
      const b = await tangkapVideo(v, 2048, area);
      if (!b || !v) {
        setGalat('Kamera masih bersiap. Tunggu sebentar atau pilih foto dari Galeri.');
        return;
      }
      const oke = await tungguModel();
      if (oke) {
        await bacaGambar(b, area, 'area', true);
      } else {
        setAdalahContoh(false);
        setPratinjauContoh(false);
        setBingkai(PENUH);
        setFoto(b);
        setGalat('Foto berhasil diambil! Pasang berkas model .onnx di public/models/ untuk memindai otomatis, atau tekan Contoh.');
      }
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
    setPratinjauContoh(false);
    setBingkai(PENUH);
    setAdalahContoh(false);
    setFoto(f);
  };

  const pakaiContoh = async () => {
    if (memproses || menungguModel) return;
    setGalat(null);
    setHasil(null);
    setDetail(false);
    setPerbaiki(false);
    setSasaran(null);
    setPratinjauContoh(false);
    setBingkai(PENUH);
    const b = await buatContoh();
    setAdalahContoh(true);
    setFoto(b);
    const oke = await tungguModel();
    if (oke) {
      await bacaGambar(b, PENUH, 'area');
    } else {
      const h = buatHasilPratinjauContoh();
      simpanHasilSementara(h);
      setPratinjauContoh(true);
      setTerpilih(0);
      setHasil(h);
    }
  };

  const kembaliKamera = () => {
    setFoto(null);
    setAdalahContoh(false);
    setPratinjauContoh(false);
    setBingkai(PENUH);
    setGalat(null);
    if (kameraStatus !== 'aktif') {
      void bukaKamera(menghadap);
    }
  };

  const tekanTombolKanan = () => {
    if (memproses) return;
    setGalat(null);
    setHasil(null);
    setDetail(false);
    setPerbaiki(false);
    setSasaran(null);
    setPratinjauContoh(false);
    if (foto) {
      kembaliKamera();
      return;
    }
    if (kameraStatus === 'aktif') {
      const arahBaru = menghadap === 'environment' ? 'user' : 'environment';
      setMenghadap(arahBaru);
      void bukaKamera(arahBaru);
    } else {
      void bukaKamera(menghadap);
    }
  };

  const tutupHasil = () => {
    setHasil(null);
    setDetail(false);
    setPerbaiki(false);
    setSasaran(null);
    setPratinjauContoh(false);
  };

  // Koreksi pengguna: ganti ('' = hapus) satu suku kata. Hanya di memori, sama seperti hasil scan.
  const ubahSuku = (bi: number, si: number, baru: string) => {
    if (!hasil) return;
    const baris = hasil.baris
      .map((b, k) => {
        if (k !== bi) return b;
        const unicode = gantiSuku(b.sukuKata, si, baru);
        return { ...b, unicode, sukuKata: urai(unicode), diperbaiki: true };
      })
      .filter((b) => b.unicode);
    const h = { ...hasil, baris };
    simpanHasilSementara(h);
    setHasil(h);
    setSasaran(null);
    setTerpilih(0);
  };

  const suku: SukuKata[] = hasil ? hasil.baris.flatMap((b) => b.sukuKata) : [];
  const barisSasaran = sasaran && hasil ? hasil.baris[sasaran.b] : null;
  const pilihan = sasaran && barisSasaran ? pilihanSuku(barisSasaran.unicode, barisSasaran.sukuKata, sasaran.s, barisSasaran.alternatif) : [];
  const dipilih = suku[terpilih] ?? suku[0];
  const tautan = dipilih?.komponen.map(tautanMateri).find(Boolean) ?? '/belajar/materi/1';
  const catatanBawah =
    galat ??
    (memproses
      ? 'Membaca aksara…'
      : menungguModel
        ? 'Menyiapkan scanner… Pemakaian pertama mengunduh model, bisa sampai 1 menit.'
        : foto
        ? 'Atur area bingkai, lalu tekan tombol untuk membaca'
        : modelStatus === 'memuat' && !tampilKamera
          ? 'Menyiapkan kamera dan scanner…'
          : tampilKamera
            ? modelStatus === 'gagal' && modelGalat
              ? modelGalat
              : modelStatus === 'memuat'
                ? 'Menyiapkan scanner… Kamu sudah bisa memotret; hasil muncul setelah siap.'
                : 'Tekan tombol bulat untuk memfoto dan membaca aksara'
            : modelGalat ?? 'Kamera belum aktif — gunakan Galeri, Contoh, atau Coba buka kamera');

  return (
    <div className="scan-page">
      {/* Pratinjau kamera live, tanpa gambar hasil jepretan */}
      {tampilKamera && (
        <>
          <video
            ref={video}
            className={`scan-video-bg ${menghadap === 'user' ? 'cermin' : ''}`}
            autoPlay
            playsInline
            muted
            aria-label="Pratinjau kamera"
            onLoadedData={(e) => {
              if (e.currentTarget.videoWidth > 0) setVideoSiap(true);
            }}
            onPlaying={(e) => {
              if (e.currentTarget.videoWidth > 0) setVideoSiap(true);
            }}
          />
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
        <button
          type="button"
          className="scan-circle-btn kanan"
          onClick={tekanTombolKanan}
          disabled={memproses}
          aria-label={foto ? 'Kembali ke kamera' : kameraStatus === 'aktif' ? 'Ganti kamera depan atau belakang' : 'Muat ulang kamera'}
          title={foto ? 'Kembali ke kamera' : kameraStatus === 'aktif' ? 'Ganti kamera depan/belakang' : 'Muat ulang kamera'}
        >
          <IkonPutarKamera />
        </button>
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
          ) : tampilKamera && videoSiap ? null : (
            <div className="scan-empty">
              <IkonKameraMati />
              <h2>{kameraStatus === 'gagal' ? 'Kamera belum aktif' : 'Menyiapkan kamera…'}</h2>
              <p>
                {kameraPesan ??
                  (kameraStatus === 'membuka' ? 'Meminta akses kamera browser…' : 'Menghubungkan tampilan kamera…')}
              </p>
              {(kameraStatus === 'gagal' || tampilKamera) && (
                <button type="button" className="scan-retry" onClick={() => void bukaKamera(menghadap)}>
                  {kameraStatus === 'gagal' ? 'Coba buka kamera' : 'Muat ulang kamera'}
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
            {foto && (
              <button type="button" className="scan-retry" onClick={kembaliKamera}>Kembali ke kamera</button>
            )}
          </div>

          <div className="scan-controls">
            <button
              type="button"
              className="scan-side-btn"
              onClick={() => inputGaleri.current?.click()}
              disabled={memproses}
            >
              <IkonGaleri />
              Galeri
            </button>
            <button
              type="button"
              className={`scan-shutter ${tampilKamera || foto ? 'siap' : ''} ${memproses || menungguModel ? 'sibuk' : ''}`}
              onClick={() => void tekanShutter()}
              disabled={memproses || menungguModel}
              aria-label={memproses ? 'Membaca aksara' : menungguModel ? 'Menyiapkan scanner' : foto ? 'Baca foto' : tampilKamera ? 'Ambil foto' : 'Pilih dari galeri'}
            >
              <span />
            </button>
            <button
              type="button"
              className="scan-side-btn"
              onClick={() => void pakaiContoh()}
              disabled={memproses || menungguModel}
            >
              <IkonBingkai size={24} />
              Contoh
            </button>
          </div>

          <div className="scan-note" role="status">
            <span>{catatanBawah}</span>
            {modelStatus === 'gagal' && !memproses && (
              <button type="button" className="scan-note-retry" onClick={() => void pastikanModelSiap(true)}>
                Coba muat model
              </button>
            )}
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

          {pratinjauContoh && (
            <p className="scan-sheet-note" role="note">
              Pratinjau Contoh · Model AI (.onnx) lokal belum terpasang di public/models/
            </p>
          )}

          <h2 className="scan-sheet-title">{judulLatin(hasil)}</h2>
          <p className="scan-sheet-sub">
            {detail ? 'Pilih suku kata untuk melihat komponennya.' : ringkasHasil(hasil)}
          </p>

          <button
            type="button"
            className="scan-bedah"
            onClick={() => {
              setDetail((d) => !d);
              setPerbaiki(false);
              setSasaran(null);
            }}
            aria-expanded={detail}
          >
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
                    <span className="aksara">{s.teksTampil}</span>
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

          {!pratinjauContoh && (
            <button
              type="button"
              className="scan-perbaiki"
              onClick={() => {
                setPerbaiki((p) => !p);
                setDetail(false);
                setSasaran(null);
              }}
              aria-expanded={perbaiki}
            >
              {perbaiki ? 'Selesai memperbaiki' : 'Perbaiki hasil'}
            </button>
          )}

          {perbaiki && hasil && (
            <div className="scan-koreksi">
              <p className="scan-koreksi-petunjuk">Ketuk suku kata yang keliru, lalu pilih bacaan yang sesuai dengan tulisan di foto.</p>
              {hasil.baris.map((b, bi) => (
                <div key={bi} className="scan-koreksi-baris" role="group" aria-label={`Baris ${bi + 1}`}>
                  {b.sukuKata.map((s, si) => {
                    const aktif = sasaran?.b === bi && sasaran.s === si;
                    return (
                      <button
                        key={`${s.teks}-${si}`}
                        type="button"
                        className={`scan-chip scan-kotak ${aktif ? 'aktif' : ''}`}
                        aria-pressed={aktif}
                        aria-label={`Suku kata ${s.latin}, ketuk untuk mengganti`}
                        onClick={() => setSasaran(aktif ? null : { b: bi, s: si })}
                      >
                        <span className="aksara">{s.teksTampil}</span>
                        <small>{s.latin}</small>
                      </button>
                    );
                  })}
                </div>
              ))}

              {sasaran && barisSasaran && (
                <div className="scan-pilihan" role="group" aria-label="Pilihan pengganti">
                  <p className="scan-koreksi-petunjuk">
                    Ganti <strong>{barisSasaran.sukuKata[sasaran.s]?.latin}</strong> dengan:
                  </p>
                  <div className="scan-pilihan-grid">
                    {pilihan.map((p) => (
                      <button key={p.teks} type="button" className="scan-chip" onClick={() => ubahSuku(sasaran.b, sasaran.s, p.teks)}>
                        <span className="aksara">{p.teks}</span>
                        <small>{p.latin}</small>
                      </button>
                    ))}
                  </div>
                  <div className="scan-pilihan-aksi">
                    <button type="button" onClick={() => ubahSuku(sasaran.b, sasaran.s, '')}>
                      Hapus suku kata
                    </button>
                    <button type="button" onClick={() => setSasaran(null)}>
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
