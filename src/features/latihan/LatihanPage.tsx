import { Link, useParams } from 'react-router';
import { titikDariId } from '../../content';

// F4: animasi goresan (GORESAN) + kanvas Pointer Events + periksaTulisan() dari ml/model1.
// Model 1 dimuat saat halaman ini dibuka. Titik selesai setelah semua huruf dicoba.
// TODO(Choirun): kanvas & animasi. TODO(Farrel): integrasi periksaTulisan().
export function LatihanPage() {
  const { id } = useParams();
  const titik = titikDariId(id ?? '');

  if (!titik || titik.type !== 'writing') return <p>Latihan tidak ditemukan. <Link to="/belajar">Kembali</Link></p>;

  return (
    <>
      <Link to="/belajar">✕ Keluar</Link>
      <h1>{titik.title}</h1>
      <p>Huruf: {titik.letters.join(', ')}</p>
    </>
  );
}
