import { useProgres } from '../../progres/ProgresProvider';
import './koin.css';

/** Koin kecil bergambar aksara "ha" (tanpa aset gambar, hanya CSS). */
export function IkonKoin({ ukuran = 18 }: { ukuran?: number }) {
  return (
    <span className="koin-ikon aksara" lang="jv" aria-hidden="true" style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.62 }}>
      ꦲ
    </span>
  );
}

/** Saldo koin pengguna (F8). Hanya membaca dari useProgres(). */
export function LencanaKoin({ className = '' }: { className?: string }) {
  const { koin } = useProgres();
  return (
    <span className={`koin-lencana ${className}`} role="status" aria-label={`Saldo ${koin} koin`}>
      <IkonKoin />
      <span className="koin-jumlah">{koin}</span>
    </span>
  );
}

/** Baris "+N koin" untuk layar selesai; tidak tampil bila tidak ada koin baru. */
export function KoinDidapat({ jumlah }: { jumlah: number }) {
  if (jumlah <= 0) return null;
  return (
    <div className="koin-didapat" role="status">
      <IkonKoin ukuran={22} />
      <span>
        <strong>+{jumlah} koin</strong> untuk belajarmu
      </span>
    </div>
  );
}
