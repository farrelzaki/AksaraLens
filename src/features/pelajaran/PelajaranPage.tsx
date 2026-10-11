import { Link, useNavigate, useParams } from 'react-router';
import { titikDariId } from '../../content';
import { useProgres } from '../../progres/ProgresProvider';

// F2: kenalan huruf -> pilihan ganda (±6 soal) -> menjodohkan.
// Keluar di tengah = progres pelajaran tidak disimpan.
// TODO(Choirun + Emil): tiga tahap; setiap jawaban -> catat(letter, benar).
export function PelajaranPage() {
  const { id } = useParams();
  const titik = titikDariId(id ?? '');
  const { selesaikanTitik } = useProgres();
  const navigate = useNavigate();

  if (!titik || titik.type !== 'lesson') return <p>Pelajaran tidak ditemukan. <Link to="/belajar">Kembali</Link></p>;

  return (
    <>
      <Link to="/belajar">✕ Keluar</Link>
      <h1>{titik.title}</h1>
      <button
        onClick={() => {
          selesaikanTitik(titik.id);
          navigate('/belajar');
        }}
      >
        Selesai (sementara)
      </button>
    </>
  );
}
