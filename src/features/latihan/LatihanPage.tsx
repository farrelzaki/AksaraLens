import { useState, useRef, useEffect, type PointerEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { titikDariId } from '../../content';
import { useProgres } from '../../progres/ProgresProvider';
import { hurufDariKode } from '../../aksara/huruf';

export function LatihanPage() {
  const { id } = useParams();
  const titik = titikDariId(id ?? 'b1-tulis1');
  const { selesaikanTitik } = useProgres();
  const navigate = useNavigate();

  // Daftar huruf yang dilatih (default: ha, na, ca)
  const letters = titik?.letters ?? ['ha', 'na', 'ca'];
  const [hurufIndex, setHurufIndex] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Timer
  const [detik, setDetik] = useState(2);
  useEffect(() => {
    const t = setInterval(() => setDetik((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTimer = (totalDetik: number) => {
    const m = Math.floor(totalDetik / 60);
    const s = totalDetik % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const kodeHuruf = letters[hurufIndex] || 'ha';
  const hurufData = hurufDariKode(kodeHuruf);
  const unicodeChar = hurufData?.unicode ?? 'ꦲ';

  // Siapkan canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#3C2415';
    }
    setHasDrawn(false);
  }, [hurufIndex]);

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setHasDrawn(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDrawing(false);
  };

  const handleHapus = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleLanjut = () => {
    if (hurufIndex < letters.length - 1) {
      setHurufIndex((idx) => idx + 1);
    } else {
      if (titik) {
        selesaikanTitik(titik.id);
      }
      navigate('/belajar/materi/1');
    }
  };

  return (
    <div className="pelajaran-page-container">
      {/* 1. Header Top Bar */}
      <header className="pelajaran-nav-bar">
        <button
          type="button"
          className="pelajaran-btn-back"
          onClick={() => navigate('/belajar/materi/1')}
          aria-label="Kembali"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="pelajaran-header-info">
          <span className="pelajaran-tag-bab">BAB 01 • TULIS</span>
          <span className="pelajaran-tag-tahap">Tahap 4 / 5</span>
        </div>

        <div className="pelajaran-timer-capsule" title="Waktu belajar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
          <span>{formatTimer(detik)}</span>
        </div>
      </header>

      {/* 2. Progress Bar */}
      <div className="pelajaran-progress-row">
        <div className="pelajaran-progress-track">
          <div
            className="pelajaran-progress-fill"
            style={{ width: `${((hurufIndex + (hasDrawn ? 1 : 0)) / letters.length) * 100}%` }}
          />
        </div>
        <span className="pelajaran-progress-text">{hurufIndex + (hasDrawn ? 1 : 0)} / {letters.length}</span>
      </div>

      {/* 3. Main White Card */}
      <main className="pelajaran-card-main">
        {/* Header Tag + Avatar */}
        <div className="pelajaran-card-header">
          <span className="chip-kenalan-dulu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l7-7 3 3-7 7-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            </svg>
            LATIHAN 0{hurufIndex + 1}
          </span>
          <div className="pelajaran-card-mascot-head">
            <img src="/assets/icon profile 1.svg" alt="Aksa" draggable={false} />
          </div>
        </div>

        <h1 className="pelajaran-card-title">Giliran tanganmu bercerita.</h1>
        <p className="pelajaran-card-subtitle">
          Ikuti bentuk aksara {kodeHuruf} pada kanvas di bawah.
        </p>

        {/* Canvas Area with Watermark */}
        <div className="canvas-drawing-container">
          <div className="canvas-watermark-guide" aria-hidden="true">
            {unicodeChar}
          </div>
          <canvas
            ref={canvasRef}
            className="canvas-drawing-layer"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </div>

        {/* Controls bawah kanvas */}
        <div className="canvas-controls-row">
          <div>
            <p className="canvas-instruction-text">Gunakan jari atau mouse untuk menulis.</p>
            <p className="canvas-instruction-sub">Latihan mandiri · tulisan belum dinilai otomatis.</p>
          </div>
          <button
            type="button"
            className="btn-canvas-clear"
            onClick={handleHapus}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 4v6h6M23 20v-6h-6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
            </svg>
            Hapus
          </button>
        </div>
      </main>

      {/* 4. Bottom Action */}
      <footer className="pelajaran-bottom-container">
        <button
          type="button"
          className="btn-action-pelajaran"
          disabled={!hasDrawn}
          onClick={handleLanjut}
        >
          <span>{hurufIndex < letters.length - 1 ? 'Latihan berikutnya' : 'Selesai latihan'}</span>
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <p className="pelajaran-bottom-quote">
          {hasDrawn ? 'Bagus! Lanjutkan goresanmu.' : 'Buat goresan untuk melanjutkan.'}
        </p>
      </footer>
    </div>
  );
}
