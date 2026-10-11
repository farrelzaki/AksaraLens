import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { bacaFoto, siapkanScanner } from '../../ml/model2/scan';
import { simpanHasilSementara } from './hasilScan';

// F5 langkah 1–3: ambil/pilih foto -> atur area (bingkai potong) -> Baca.
// TODO(Choirun): bingkai potong. TODO(Farrel): pipeline di ml/model2/scan.ts.
export function ScanPage() {
  const [siap, setSiap] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    siapkanScanner().then(
      () => setSiap(true),
      () => setGalat('Model scanner belum tersedia.'),
    );
  }, []);

  const baca = async (berkas: File) => {
    try {
      simpanHasilSementara(await bacaFoto(await createImageBitmap(berkas)));
      navigate('/scan/hasil');
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <h1>Scanner</h1>
      <p>Foto tulisan cetak, lurus, terang, 1–3 baris.</p>
      <label>
        Kamera
        <input type="file" accept="image/*" capture="environment" disabled={!siap} onChange={(e) => e.target.files?.[0] && baca(e.target.files[0])} />
      </label>
      <label>
        Pilih dari galeri
        <input type="file" accept="image/*" disabled={!siap} onChange={(e) => e.target.files?.[0] && baca(e.target.files[0])} />
      </label>
      {!siap && !galat && <p role="status">Memuat model…</p>}
      {galat && <p role="alert">{galat}</p>}
    </>
  );
}
