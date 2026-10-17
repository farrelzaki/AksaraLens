import { Link } from 'react-router';
import { hurufDariKode } from '../../aksara/huruf';
import { hurufSeringSalah } from '../../progres/model';
import { useProgres } from '../../progres/ProgresProvider';
import { TentangSumber } from './TentangSumber';

// F7: huruf sering salah, akun, tentang & sumber data. Tidak menampilkan progres per bab.
export function ProfilPage() {
  const { stats } = useProgres();
  const lemah = hurufSeringSalah(stats);

  return (
    <>
      <h1>Profil</h1>
      <section>
        <h2>Huruf sering salah</h2>
        {lemah.length === 0 ? (
          <p>Belum ada data.</p>
        ) : (
          <ul>
            {lemah.map((s) => {
              const bab = hurufDariKode(s.letter)?.bab;
              return (
                <li key={s.letter}>
                  <Link to={`/belajar/materi/${bab}#${s.letter}`}>{s.letter}</Link> — salah {s.wrong} dari {s.correct + s.wrong}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <h2>Akun</h2>
        {/* TODO(Emil): status masuk/tamu, nama, email, keluar, hapus akun. */}
        <Link to="/masuk">Masuk / daftar</Link>
      </section>
      <TentangSumber />
    </>
  );
}
