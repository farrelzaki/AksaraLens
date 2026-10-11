import { Link, Navigate } from 'react-router';
import { tautanMateri } from '../../aksara/urai';
import { ambilHasilSementara } from './hasilScan';

// F5 langkah 5: tiap suku kata diuraikan ke komponennya + tautan materi.
export function KajiPage() {
  const hasil = ambilHasilSementara();
  if (!hasil) return <Navigate to="/scan" replace />;

  return (
    <>
      <Link to="/scan/hasil">← Kembali</Link>
      <ul>
        {hasil.baris.flatMap((b) => b.sukuKata).map((s, i) => (
          <li key={i}>
            <span className="aksara" lang="jv">{s.teks}</span> <strong>{s.latin}</strong> ={' '}
            {s.komponen.map((k, j) => {
              const url = tautanMateri(k);
              const label = k.peran === 'pasangan' ? `pasangan ${k.kode}` : k.kode;
              return (
                <span key={j}>
                  {j > 0 && ' + '}
                  {url ? <Link to={url}>{label}</Link> : <span>{label} (belum ada di materi)</span>}
                </span>
              );
            })}
          </li>
        ))}
      </ul>
    </>
  );
}
