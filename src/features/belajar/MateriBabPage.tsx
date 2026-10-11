import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { hurufDariKode } from '../../aksara/huruf';
import { babDariNomor } from '../../content';

// F3: materi per bab, tidak terkunci. Anchor per huruf (#ka) adalah tujuan
// tautan Kaji lebih dalam; jangan ubah format id tanpa mengubah aksara/urai.ts.
export function MateriBabPage() {
  const { bab } = useParams();
  const { hash } = useLocation();
  const data = babDariNomor(Number(bab));

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  if (!data) return <p>Bab tidak ditemukan. <Link to="/belajar">Kembali</Link></p>;

  return (
    <>
      <Link to="/belajar">← Kembali</Link>
      <h1>Bab {data.bab} · {data.judul}</h1>
      <p>{data.ringkasan}</p>
      <ul>
        {data.letters.map((kode) => {
          const h = hurufDariKode(kode);
          return (
            <li key={kode} id={kode}>
              <span className="aksara" lang="jv">{h?.unicode}</span> {kode}
            </li>
          );
        })}
      </ul>
    </>
  );
}
