import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { bacaFoto, siapkanScanner } from '../../ml/model2/scanner';
import { simpanHasilSementara } from './hasilScan';

// F5 langkah 1–3: ambil/pilih foto -> pratinjau -> Baca.
// TODO(Choirun): tampilan + bingkai potong (Atur area). Foto hanya hidup di memori halaman ini.
export function ScanPage() {
  const [siap, setSiap] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    siapkanScanner().then(
      () => setSiap(true),
      () => setGalat('Model scanner gagal dimuat. Periksa koneksi lalu muat ulang halaman.'),
    );
  }, []);

  useEffect(() => {
    if (!foto) return;
    const url = URL.createObjectURL(foto);
    setPratinjau(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const pilih = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGalat(null);
    setFoto(e.target.files?.[0] ?? null);
    e.target.value = '';
  };

  const baca = async () => {
    if (!foto) return;
    setMemproses(true);
    setGalat(null);
    try {
      const hasil = await bacaFoto(foto);
      if (import.meta.env.DEV) console.info('[scanner]', hasil.info);
      simpanHasilSementara(hasil);
      navigate('/scan/hasil');
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    } finally {
      setMemproses(false);
    }
  };

  return (
    <>
      <h1>Scanner</h1>
      <p>Foto tulisan cetak, lurus, terang, 1–3 baris.</p>
      <label>
        Kamera
        <input type="file" accept="image/*" capture="environment" onChange={pilih} />
      </label>
      <label>
        Pilih dari galeri
        <input type="file" accept="image/*" onChange={pilih} />
      </label>
      {pratinjau && <img src={pratinjau} alt="Pratinjau foto" style={{ maxWidth: '100%' }} />}
      {foto && (
        <button onClick={baca} disabled={!siap || memproses}>
          {memproses ? 'Membaca…' : 'Baca'}
        </button>
      )}
      {!siap && !galat && <p role="status">Memuat model…</p>}
      {galat && <p role="alert">{galat}</p>}
    </>
  );
}
