import { useRef, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { JALUR, titikDariId } from '../../content';
import {
  LABEL_TAHAP,
  NAMA_TAHAP,
  tahapDariId,
  tahapDiBab,
  type Tahap,
} from '../../content/tahap';
import {
  cekKanvas,
  periksaTulisan,
  siapkanPemeriksa,
} from '../../ml/model1/periksa';
import { useProgres } from '../../progres/ProgresProvider';
import { MaskotSplash } from '../../app/MaskotAksa';
import { itemTulis } from '../pelajaran/bankSoal';
import { AnimasiCaraMenulis } from '../pelajaran/AnimasiCaraMenulis';
import { SelinganPelajaran } from '../pelajaran/SelinganPelajaran';
import { useSelingan } from '../pelajaran/useSelingan';

type StatusVerifikasi =
  | 'idle'
  | 'kosong'
  | 'terlalu_kecil'
  | 'belum_lengkap'
  | 'melenceng'
  | 'huruf_lain'
  | 'benar';

interface EvaluasiKanvas {
  benar: boolean;
  recall: number;
  precision: number;
  skor: number;
  alasan?: 'belum_lengkap' | 'melenceng';
}

function resolveTahapTulis(rawId?: string): Tahap {
  if (rawId) {
    const langsung = tahapDariId(rawId);
    if (langsung && langsung.jenis === 'tulis') return langsung;
    if (langsung) {
      return tahapDiBab(langsung.bab).find((t) => t.jenis === 'tulis') || langsung;
    }
    const lama = titikDariId(rawId);
    if (lama) {
      return (
        tahapDiBab(lama.bab).find((t) => t.jenis === 'tulis') ||
        tahapDariId('b1-tulis')!
      );
    }
  }
  return tahapDariId('b1-tulis')!;
}

interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function cariBBox(mask: Uint8Array, w: number, h: number): BBox | null {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

function dilasiMask(src: Uint8Array, w: number, h: number, rad: number): Uint8Array {
  const out = new Uint8Array(w * h);
  const r2 = rad * rad;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (src[y * w + x] === 0) continue;
      const y0 = Math.max(0, y - rad);
      const y1 = Math.min(h - 1, y + rad);
      const x0 = Math.max(0, x - rad);
      const x1 = Math.min(w - 1, x + rad);
      for (let ny = y0; ny <= y1; ny++) {
        for (let nx = x0; nx <= x1; nx++) {
          if ((nx - x) * (nx - x) + (ny - y) * (ny - y) <= r2) {
            out[ny * w + nx] = 1;
          }
        }
      }
    }
  }
  return out;
}

function ukurKecocokan(
  uMask: Uint8Array,
  tMask: Uint8Array,
  w: number,
  h: number,
  rad: number
): { recall: number; precision: number; f1: number } {
  let uCount = 0;
  let tCount = 0;
  for (let i = 0; i < w * h; i++) {
    if (uMask[i]) uCount++;
    if (tMask[i]) tCount++;
  }
  if (uCount === 0 || tCount === 0) {
    return { recall: 0, precision: 0, f1: 0 };
  }
  const uDil = dilasiMask(uMask, w, h, rad);
  const tDil = dilasiMask(tMask, w, h, rad);
  let tCovered = 0;
  let uOnTrack = 0;
  for (let i = 0; i < w * h; i++) {
    if (tMask[i] && uDil[i]) tCovered++;
    if (uMask[i] && tDil[i]) uOnTrack++;
  }
  const recall = tCovered / tCount;
  const precision = uOnTrack / uCount;
  const f1 = recall + precision > 0 ? (2 * recall * precision) / (recall + precision) : 0;
  return { recall, precision, f1 };
}

function normalisasiBBox(
  src: Uint8Array,
  sw: number,
  bbox: BBox,
  size: number,
  inner: number
): Uint8Array {
  const out = new Uint8Array(size * size);
  const bw = Math.max(1, bbox.x1 - bbox.x0);
  const bh = Math.max(1, bbox.y1 - bbox.y0);
  const scale = inner / Math.max(bw, bh);
  const dw = bw * scale;
  const dh = bh * scale;
  const ox = (size - dw) / 2;
  const oy = (size - dh) / 2;

  for (let y = 0; y < size; y++) {
    const sy = Math.floor((y - oy) / scale + bbox.y0);
    if (sy < bbox.y0 || sy >= bbox.y1) continue;
    for (let x = 0; x < size; x++) {
      const sx = Math.floor((x - ox) / scale + bbox.x0);
      if (sx < bbox.x0 || sx >= bbox.x1) continue;
      if (src[sy * sw + sx]) out[y * size + x] = 1;
    }
  }
  return out;
}

/**
 * Mengevaluasi tulisan pengguna pada kanvas terhadap bentuk aksara target.
 * Menggabungkan pencocokan posisi langsung di kanvas dan pencocokan bentuk yang
 * dinormalisasi ke bounding box agar adil untuk ukuran/posisi tangan, namun tetap
 * menolak coretan acak, garis lurus, atau aksara yang belum lengkap.
 */
function evaluasiGoresanKanvas(
  canvas: HTMLCanvasElement,
  unicodeChar: string
): EvaluasiKanvas {
  const W = 160;
  const H = 136;

  const userCan = document.createElement('canvas');
  userCan.width = W;
  userCan.height = H;
  const uCtx = userCan.getContext('2d');

  const tplCan = document.createElement('canvas');
  tplCan.width = W;
  tplCan.height = H;
  const tCtx = tplCan.getContext('2d');

  if (!uCtx || !tCtx) {
    return { benar: true, recall: 0.85, precision: 0.85, skor: 85 };
  }

  uCtx.drawImage(canvas, 0, 0, W, H);
  const uData = uCtx.getImageData(0, 0, W, H).data;

  const rect = canvas.getBoundingClientRect();
  const scaleRef = rect.height > 0 ? H / rect.height : H / 280;
  const fontPx = Math.round((unicodeChar.length > 2 ? 125 : 150) * scaleRef);

  tCtx.clearRect(0, 0, W, H);
  tCtx.fillStyle = '#000000';
  tCtx.textAlign = 'center';
  tCtx.textBaseline = 'middle';
  tCtx.font = `400 ${fontPx}px "Noto Sans Javanese", serif`;
  tCtx.fillText(unicodeChar, W / 2, H / 2);

  const tData = tCtx.getImageData(0, 0, W, H).data;

  const uMask = new Uint8Array(W * H);
  const tMask = new Uint8Array(W * H);

  for (let i = 0; i < W * H; i++) {
    const a = uData[i * 4 + 3];
    const r = uData[i * 4];
    const g = uData[i * 4 + 1];
    const b = uData[i * 4 + 2];
    const lum = (r + g + b) / 3;
    if (a > 60 && lum < 200) {
      uMask[i] = 1;
    }
    if (tData[i * 4 + 3] > 48) {
      tMask[i] = 1;
    }
  }

  const uBox = cariBBox(uMask, W, H);
  const tBox = cariBBox(tMask, W, H);

  if (!uBox || !tBox) {
    return {
      benar: false,
      recall: 0,
      precision: 0,
      skor: 0,
      alasan: 'belum_lengkap',
    };
  }

  // Tolak jika proporsi kotak tinta jauh berbeda (mis. hanya menarik 1 garis vertikal/horizontal)
  const uAspect = (uBox.x1 - uBox.x0) / Math.max(1, uBox.y1 - uBox.y0);
  const tAspect = (tBox.x1 - tBox.x0) / Math.max(1, tBox.y1 - tBox.y0);
  const rasioAspect = Math.max(uAspect / tAspect, tAspect / uAspect);
  if (rasioAspect > 2.35) {
    return {
      benar: false,
      recall: 0.25,
      precision: 0.3,
      skor: 28,
      alasan: 'belum_lengkap',
    };
  }

  // 1. Skor langsung sesuai letak watermark
  const langsung = ukurKecocokan(uMask, tMask, W, H, 13);

  // 2. Skor bentuk ternormalisasi 96x96 (bebas bias pergeseran font HTML vs canvas)
  const N = 96;
  const uNorm = normalisasiBBox(uMask, W, uBox, N, 72);
  const tNorm = normalisasiBBox(tMask, W, tBox, N, 72);
  const norm = ukurKecocokan(uNorm, tNorm, N, N, 9);

  const recall = Math.max(langsung.recall, norm.recall);
  const precision = Math.max(langsung.precision, norm.precision);
  const bestF1 = Math.max(langsung.f1, norm.f1);
  const skor = Math.min(99, Math.round(Math.min(1, bestF1 * 1.16) * 100));

  if (recall < 0.48) {
    return {
      benar: false,
      recall,
      precision,
      skor,
      alasan: 'belum_lengkap',
    };
  }

  if (precision < 0.44 || bestF1 < 0.5) {
    return {
      benar: false,
      recall,
      precision,
      skor,
      alasan: 'melenceng',
    };
  }

  return {
    benar: true,
    recall,
    precision,
    skor: Math.max(82, skor),
  };
}

export function LatihanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selesaikanTitik, catat } = useProgres();

  const tahap = useMemo(() => resolveTahapTulis(id), [id]);
  const babNomor = tahap.bab;
  const daftarItem = useMemo(() => itemTulis(babNomor), [babNomor]);

  const [itemIndex, setItemIndex] = useState(0);
  const [faseSelesai, setFaseSelesai] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const autoHideTimerRef = useRef<number | null>(null);

  const [hasDrawn, setHasDrawn] = useState(false);
  const [sedangMengecek, setSedangMengecek] = useState(false);
  const [statusCek, setStatusCek] = useState<StatusVerifikasi>('idle');
  const [pesanDetail, setPesanDetail] = useState<string | null>(null);
  const [skorAkurasi, setSkorAkurasi] = useState<number>(0);

  const [tampilCaraMenulis, setTampilCaraMenulis] = useState(false);
  const [putarKey, setPutarKey] = useState(0);

  const [detik, setDetik] = useState(0);

  // Catatan sesi untuk selingan penutup (menyesuaikan hasil belajar)
  const [salah, setSalah] = useState(0);
  const [kombo, setKombo] = useState(0);
  const [komboMaks, setKomboMaks] = useState(0);
  const selingan = useSelingan(tahap, faseSelesai);

  // Pra-muat Model 1 ONNX untuk evaluasi Bab 1
  useEffect(() => {
    siapkanPemeriksa().catch(() => {});
    return () => {
      if (autoHideTimerRef.current !== null) {
        window.clearTimeout(autoHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setItemIndex(0);
    setFaseSelesai(false);
    setDetik(0);
    setSalah(0);
    setKombo(0);
    setKomboMaks(0);
  }, [tahap.id]);

  useEffect(() => {
    if (faseSelesai) return;
    const interval = setInterval(() => {
      setDetik((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [faseSelesai]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentItem = daftarItem[itemIndex] || daftarItem[0];
  const totalLatihan = daftarItem.length;
  const unicodeChar = currentItem?.teks || 'ꦲ';
  const labelLatin = currentItem?.label || 'ha';
  const targetKode = currentItem?.kode;

  const siapkanKanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      // Latar transparan agar bayangan tipis panduan aksara terlihat jelas
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    setHasDrawn(false);
    setStatusCek('idle');
    setPesanDetail(null);
    setSkorAkurasi(0);
  };

  useEffect(() => {
    if (faseSelesai) return;
    siapkanKanvas();
    setTampilCaraMenulis(false);
    setPutarKey(0);
  }, [itemIndex, tahap.id, faseSelesai]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    if (tampilCaraMenulis) {
      setTampilCaraMenulis(false);
    }
    isDrawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    setHasDrawn(true);

    // Gambar titik awal langsung saat disentuh
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#3A2315';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (statusCek !== 'idle' && statusCek !== 'benar') {
      setStatusCek('idle');
      setPesanDetail(null);
    }
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getPos(e);
    ctx.strokeStyle = '#3A2315';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    lastPos.current = currentPos;
  };

  const endDraw = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const handleHapus = () => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    setTampilCaraMenulis(false);
    siapkanKanvas();
  };

  const handleCaraMenulis = () => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    setTampilCaraMenulis(true);
    setPutarKey((k) => k + 1);
  };

  const handleAnimasiSelesai = () => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = window.setTimeout(() => {
      setTampilCaraMenulis(false);
      autoHideTimerRef.current = null;
    }, 650);
  };

  const handleCek = async () => {
    const canvas = canvasRef.current;
    if (!canvas || sedangMengecek) return;

    setTampilCaraMenulis(false);
    setSedangMengecek(true);

    try {
      const statusUkuran = cekKanvas(canvas);
      if (statusUkuran !== 'siap') {
        setStatusCek(statusUkuran);
        setPesanDetail(
          statusUkuran === 'kosong'
            ? 'Kanvas masih kosong. Tuliskan aksara mengikuti panduan terlebih dahulu.'
            : 'Goresan masih terlalu kecil. Ikuti ukuran bayangan aksara agar lebih jelas.'
        );
        return;
      }

      // Evaluasi kesesuaian goresan terhadap template aksara target
      const evalKanvas = evaluasiGoresanKanvas(canvas, unicodeChar);

      // Dukungan Model 1 ONNX untuk 20 huruf dasar Bab 1
      let modelBenar = false;
      let terbacaHurufLain: string | null = null;
      if (targetKode) {
        try {
          const hasilModel = await periksaTulisan(canvas, targetKode);
          if (hasilModel?.jenis === 'benar' && evalKanvas.recall >= 0.36) {
            modelBenar = true;
          } else if (
            hasilModel?.jenis === 'terbaca_lain' &&
            hasilModel.keyakinan >= 0.78 &&
            evalKanvas.recall < 0.72
          ) {
            terbacaHurufLain = hasilModel.huruf;
          }
        } catch {
          // Model ONNX tidak wajib bila belum diunduh secara lokal
        }
      }

      if ((evalKanvas.benar && !terbacaHurufLain) || modelBenar) {
        setSkorAkurasi(Math.max(85, evalKanvas.skor || 92));
        setStatusCek('benar');
        setPesanDetail(
          `Goresan aksara “${labelLatin}” (${unicodeChar}) sudah tepat dan sesuai pola!`
        );
        catat(labelLatin, true, 'tulis');
        const k = kombo + 1;
        setKombo(k);
        setKomboMaks((m) => Math.max(m, k));
      } else if (terbacaHurufLain) {
        catat(labelLatin, false, 'tulis');
        setSalah((n) => n + 1);
        setKombo(0);
        setStatusCek('huruf_lain');
        setPesanDetail(
          `Tulisanmu terbaca seperti aksara “${terbacaHurufLain}”. Hapus lalu ikuti bentuk “${labelLatin}”.`
        );
      } else {
        catat(labelLatin, false, 'tulis');
        setSalah((n) => n + 1);
        setKombo(0);
        const alasan = evalKanvas.alasan || 'belum_lengkap';
        setStatusCek(alasan);
        if (alasan === 'belum_lengkap') {
          setPesanDetail(
            `Goresan masih kurang lengkap (${Math.round(
              evalKanvas.recall * 100
            )}% bagian aksara). Lengkapi semua lekukan aksara “${labelLatin}”.`
          );
        } else {
          setPesanDetail(
            `Bentuk tulisan belum sesuai aksara “${labelLatin}”. Tekan "Hapus" lalu ikuti bayangan panduan.`
          );
        }
      }
    } finally {
      setSedangMengecek(false);
    }
  };

  const sudahBenar = statusCek === 'benar';
  const adaError = statusCek !== 'idle' && statusCek !== 'benar';

  const handleLanjut = () => {
    if (!sudahBenar) {
      void handleCek();
      return;
    }

    if (itemIndex + 1 < totalLatihan) {
      setItemIndex((idx) => idx + 1);
    } else {
      selesaikanTitik(tahap.id);
      for (const t of JALUR.filter((x) => x.bab === babNomor && x.type === 'writing')) {
        selesaikanTitik(t.id);
      }
      setFaseSelesai(true);
      selingan.tampilkanPenutup();
    }
  };

  const nextTahap = useMemo(() => {
    return tahapDiBab(babNomor).find((t) => t.nomor === tahap.nomor + 1) || null;
  }, [babNomor, tahap.nomor]);

  const progressTotal = Math.max(totalLatihan, 1);
  const solvedCount = faseSelesai ? progressTotal : itemIndex + (sudahBenar ? 1 : 0);
  const progressPct = Math.round((solvedCount / progressTotal) * 100);
  const progressCountText = faseSelesai
    ? `${progressTotal} / ${progressTotal}`
    : `${itemIndex + 1} / ${progressTotal}`;

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

      {/* Main White Card */}
      <div className="pelajaran-card-main">
        {!faseSelesai ? (
          <>
            <div className="pelajaran-card-header">
              <div className="chip-kenalan-dulu">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>
                  LATIHAN {itemIndex + 1 < 10 ? `0${itemIndex + 1}` : itemIndex + 1}
                </span>
              </div>

              <div className="pelajaran-card-mascot-head">
                <MaskotSplash compact />
              </div>
            </div>

            <h2 className="pelajaran-card-title">Giliran tanganmu bercerita.</h2>
            <p className="pelajaran-card-subtitle">
              Ikuti bentuk aksara <strong>{labelLatin}</strong> pada kanvas di bawah.
            </p>

            {/* Canvas Drawing Area */}
            <div
              className={`canvas-drawing-container ${
                sudahBenar
                  ? 'is-verified-correct'
                  : adaError
                  ? 'is-verified-wrong'
                  : ''
              }`}
            >
              {/* Watermark Aksara Tipis di Tengah */}
              <div
                className="canvas-watermark-guide aksara"
                aria-hidden="true"
                style={{ opacity: tampilCaraMenulis ? 0 : undefined }}
              >
                {unicodeChar}
              </div>

              <canvas
                ref={canvasRef}
                className="canvas-drawing-layer"
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
              />

              {/* Overlay Animasi Cara Menulis saat tombol "Cara menulis" ditekan */}
              {tampilCaraMenulis && (
                <div
                  className="latihan-cara-menulis-overlay"
                  onClick={() => setTampilCaraMenulis(false)}
                >
                  <AnimasiCaraMenulis
                    aksara={unicodeChar}
                    putarKey={putarKey}
                    autoPlay
                    onSelesai={handleAnimasiSelesai}
                  />
                  <span className="latihan-cara-menulis-hint">
                    Sentuh kanvas untuk langsung menulis
                  </span>
                </div>
              )}

              {/* Ornamen perayaan konfeti & stempel saat tulisan terverifikasi benar */}
              {sudahBenar && (
                <div className="canvas-celebration-overlay" aria-hidden="true">
                  <span className="confetti-burst cb-1" />
                  <span className="confetti-burst cb-2" />
                  <span className="confetti-burst cb-3" />
                  <span className="confetti-burst cb-4" />
                  <span className="confetti-sparkle sp-1">✦</span>
                  <span className="confetti-sparkle sp-2">★</span>
                  <span className="confetti-sparkle sp-3">✦</span>
                  <span className="confetti-sparkle sp-4">●</span>
                  <div className="canvas-verified-stamp">
                    <span className="stamp-check">✓</span>
                    <span>SESUAI · {skorAkurasi}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Baris Kontrol Kanvas */}
            <div className="canvas-controls-row">
              <div className="canvas-instruction-col">
                <span className="canvas-instruction-text">
                  Gunakan jari atau mouse untuk menulis.
                </span>
              </div>

              <div className="latihan-controls-actions">
                <button
                  type="button"
                  className={`btn-canvas-clear ${tampilCaraMenulis ? 'is-active' : ''}`}
                  onClick={handleCaraMenulis}
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

                <button
                  type="button"
                  className="btn-canvas-clear"
                  onClick={handleHapus}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Hapus</span>
                </button>
              </div>
            </div>

            {/* Banner Perayaan Berhasil yang Jelas & Menonjol */}
            {sudahBenar && (
              <div className="latihan-celebration-card" role="status">
                <div className="celebration-icon-ring">
                  <span className="celebration-check-icon">✓</span>
                </div>
                <div className="celebration-text-col">
                  <div className="celebration-title-row">
                    <strong>Hore! Tulisanmu sudah tepat!</strong>
                    <span className="celebration-score-pill">{skorAkurasi}% sesuai</span>
                  </div>
                  <p className="celebration-desc">
                    {pesanDetail ||
                      `Bentuk aksara “${labelLatin}” sudah sesuai dengan panduan.`}
                  </p>
                </div>
              </div>
            )}

            {/* Banner Peringatan bila Goresan Belum Benar */}
            {adaError && (
              <div className="latihan-warning-card" role="alert">
                <div className="warning-icon-circle">!</div>
                <div className="warning-text-col">
                  <strong>Belum tepat, perbaiki dulu ya</strong>
                  <p>{pesanDetail}</p>
                </div>
                <button
                  type="button"
                  className="warning-retry-btn"
                  onClick={handleHapus}
                >
                  Ulangi
                </button>
              </div>
            )}

            {statusCek === 'idle' && (
              <p className="canvas-instruction-sub" style={{ marginTop: '8px' }}>
                Tulisan harus diperiksa dan sesuai aksara “{labelLatin}” sebelum lanjut.
              </p>
            )}
          </>
        ) : (
          /* Layar Tahap Selesai (result.png) */
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
              {totalLatihan} latihan menulis selesai. Progresmu tersimpan di perangkat ini.
            </p>

            <div className="pelajaran-selesai-stats">
              <div className="pelajaran-selesai-stat">
                <span className="pelajaran-selesai-stat-value">{totalLatihan}</span>
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

      {/* Bottom Sticky Action Area */}
      <footer className="pelajaran-bottom-container">
        {!faseSelesai ? (
          <>
            <button
              type="button"
              className={`btn-action-pelajaran ${sudahBenar ? 'is-verified' : ''}`}
              disabled={(!hasDrawn && !sudahBenar) || sedangMengecek}
              onClick={handleLanjut}
            >
              <span>
                {sudahBenar
                  ? itemIndex + 1 < totalLatihan
                    ? 'Latihan berikutnya'
                    : 'Selesaikan tahap'
                  : sedangMengecek
                  ? 'Memeriksa tulisan...'
                  : 'Periksa tulisan'}
              </span>
              <span>→</span>
            </button>
            <p className="pelajaran-bottom-quote">
              {sudahBenar
                ? 'Mantap! Sentuh tombol di atas untuk lanjut.'
                : 'Buat goresan lalu periksa tulisan untuk melanjutkan.'}
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-action-pelajaran"
              onClick={() =>
                nextTahap
                  ? navigate(`/pelajaran/${nextTahap.id}`)
                  : navigate(`/belajar/materi/${babNomor}`)
              }
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
      {selingan.tampil === 'pembuka' && (
        <SelinganPelajaran
          mode="pembuka"
          adegan={selingan.pembuka}
          bab={babNomor}
          label={selingan.label}
          hurufLemah={selingan.hurufLemah}
          onSelesai={selingan.tutup}
        />
      )}
      {selingan.tampil === 'penutup' && faseSelesai && (
        <SelinganPelajaran
          mode="penutup"
          adegan={selingan.buatPenutup({ total: totalLatihan, salah, komboMaks, detik })}
          bab={babNomor}
          label={selingan.label}
          onSelesai={selingan.tutup}
        />
      )}
    </div>
  );
}
