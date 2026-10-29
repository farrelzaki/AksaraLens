import { Link, Navigate } from 'react-router';
import { MODE_DEMO } from '../../ml/model2/scanner';
import { ambilHasilSementara } from './hasilScan';

// F5 langkah 4: per baris tampil Unicode + bacaan Latin per suku kata.
export function HasilPage() {
  const hasil = ambilHasilSementara();
  if (!hasil) return <Navigate to="/scan" replace />;

  if (hasil.baris.length === 0) {
    return <p>Tidak ada tulisan aksara terbaca. Coba foto lebih dekat dan terang. <Link to="/scan">Scan lagi</Link></p>;
  }

  return (
    <>
      {MODE_DEMO && <p role="note">Mode demo: hasil yang tampil adalah contoh, bukan hasil model.</p>}
      {hasil.kurangYakin && <p role="alert">Hasil mungkin kurang tepat</p>}
      {hasil.baris.map((b, i) => (
        <section key={i}>
          <p className="aksara" lang="jv">{b.unicode}</p>
          <p>
            {b.sukuKata.map((s, j) => (
              <span key={j} title={s.adaPasangan ? 'Belum ada di materi' : undefined}>
                {s.latin}{s.adaPasangan ? '*' : ''}{' '}
              </span>
            ))}
          </p>
        </section>
      ))}
      <Link to="/scan/kaji">Kaji lebih dalam</Link> · <Link to="/scan">Scan lagi</Link>
    </>
  );
}
