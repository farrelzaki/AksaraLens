import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { MODE_DEMO, PENUH, bacaFoto, siapkanScanner, type Bingkai } from '../../ml/model2/scanner';
import { BingkaiPotong } from './BingkaiPotong';
import { simpanHasilSementara } from './hasilScan';

// F5 langkah 1–3: kamera live -> jepret satu foto -> baca di latar belakang.
// Alternatif: pilih dari galeri lalu atur area (bingkai potong).
// Foto jepretan tidak ditampilkan dan tidak disimpan; hanya dibaca di perangkat.
// TODO(Choirun): tampilan. Foto hanya hidup di memori halaman ini.
export function ScanPage() {
  const navigate = useNavigate();
  const [siap, setSiap] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const [kamera, setKamera] = useState<'mencoba' | 'aktif' | 'tidak'>('mencoba');
  const video = useRef<HTMLVideoElement>(null);
  const aliran = useRef<MediaStream | null>(null);

  const [foto, setFoto] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [bingkai, setBingkai] = useState<Bingkai>(PENUH);

  useEffect(() => {
    siapkanScanner().then(
      () => setSiap(true),
      () => setGalat('Model scanner gagal dimuat. Periksa koneksi lalu muat ulang halaman.'),
    );
  }, []);

  // Kamera live. Browser hanya mengizinkan ini di https atau localhost.
  useEffect(() => {
    let batal = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setKamera('tidak');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => {
        if (batal) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        aliran.current = s;
        setKamera('aktif');
      })
      .catch(() => {
        if (!batal) setKamera('tidak');
      });
    return () => {
      batal = true;
      aliran.current?.getTracks().forEach((t) => t.stop());
      aliran.current = null;
    };
  }, []);

  // Pasang aliran ke elemen video setelah elemen tampil.
  useEffect(() => {
    if (kamera === 'aktif' && video.current && aliran.current) {
      video.current.srcObject = aliran.current;
    }
  }, [kamera]);

  useEffect(() => {
    if (!foto) return;
    const url = URL.createObjectURL(foto);
    setPratinjau(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const pilih = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGalat(null);
    setFoto(e.target.files?.[0] ?? null);
    setBingkai(PENUH);
    e.target.value = '';
  };

  // Membaca satu gambar di latar belakang, lalu pindah ke halaman hasil.
  const prosesGambar = async (gambar: Blob, area: Bingkai) => {
    setMemproses(true);
    setGalat(null);
    try {
      const hasil = await bacaFoto(gambar, area);
      if (import.meta.env.DEV) console.info('[scanner]', hasil.info);
      simpanHasilSementara(hasil);
      navigate('/scan/hasil');
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    } finally {
      setMemproses(false);
    }
  };

  const jepret = async () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const kanvas = document.createElement('canvas');
    kanvas.width = v.videoWidth;
    kanvas.height = v.videoHeight;
    kanvas.getContext('2d')?.drawImage(v, 0, 0);
    const blob = await new Promise<Blob | null>((r) => kanvas.toBlob(r, 'image/jpeg', 0.92));
    if (blob) await prosesGambar(blob, PENUH);
  };

  const bacaGaleri = () => {
    if (foto) void prosesGambar(foto, bingkai);
  };

  const kameraAktif = kamera === 'aktif';

  return (
    <>
      <style>{`
        @keyframes pindai-garis { 0% { top: 0 } 50% { top: calc(100% - 3px) } 100% { top: 0 } }
      `}</style>
      <h1>Scanner</h1>
      {MODE_DEMO && <p role="note">Mode demo: hasil yang tampil adalah contoh, bukan hasil model.</p>}

      {kameraAktif && (
        <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#000', borderRadius: 12, overflow: 'hidden' }}>
          <video
            ref={video}
            autoPlay
            playsInline
            muted
            aria-label="Pratinjau kamera"
            style={{ display: 'block', width: '100%' }}
          />
          {memproses && (
            <div role="status" aria-live="polite" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }}>
              <div
                aria-hidden
                style={{
                  position: 'absolute', left: 0, right: 0, height: 3, background: '#7CFFB2',
                  boxShadow: '0 0 12px #7CFFB2', animation: 'pindai-garis 1.6s ease-in-out infinite',
                }}
              />
              <p style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', color: '#fff', margin: 0 }}>
                Membaca aksara…
              </p>
            </div>
          )}
        </div>
      )}

      {kameraAktif && (
        <button
          type="button"
          onClick={jepret}
          disabled={!siap || memproses}
          aria-label="Ambil foto dan baca"
          style={{ marginTop: 12, width: 64, height: 64, borderRadius: '50%', fontSize: 14 }}
        >
          {!siap || memproses ? '…' : 'Jepret'}
        </button>
      )}

      {kamera === 'tidak' && (
        <>
          <p role="note">Kamera langsung tidak tersedia di alamat ini (perlu https atau localhost). Gunakan tombol kamera di bawah.</p>
          <label>
            Kamera
            <input type="file" accept="image/*" capture="environment" onChange={pilih} />
          </label>
        </>
      )}
      <label>
        Pilih dari galeri
        <input type="file" accept="image/*" onChange={pilih} />
      </label>

      {pratinjau && <BingkaiPotong src={pratinjau} nilai={bingkai} onUbah={setBingkai} />}
      {foto && (
        <button onClick={bacaGaleri} disabled={!siap || memproses}>
          {memproses ? 'Membaca…' : 'Baca'}
        </button>
      )}

      {!siap && !galat && <p role="status">Memuat model…</p>}
      {galat && <p role="alert">{galat}</p>}
    </>
  );
}
