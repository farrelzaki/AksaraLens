// Klien scanner di thread utama: meneruskan permintaan ke scan.worker.ts.
// Halaman memakai modul ini, bukan scan.ts langsung.

import type { Bingkai } from './bingkai';
import type { HasilScan } from './scan';
import type { Jawaban, Pesan, Permintaan } from './scan.worker';

export type { Bingkai, HasilScan };
export { PENUH } from './bingkai';

type Tunggu = { selesai: (v: unknown) => void; gagal: (e: Error) => void };

let worker: Worker | null = null;
let idBerikut = 0;
const menunggu = new Map<number, Tunggu>();

function dapatkanWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./scan.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<Jawaban>) => {
    const j = e.data;
    const t = menunggu.get(j.id);
    if (!t) return;
    menunggu.delete(j.id);
    if (j.ok) t.selesai(j.hasil);
    else t.gagal(new Error(j.galat));
  };
  worker.onerror = (e) => {
    // worker rusak (mis. gagal dimuat): gagalkan semua permintaan, buat ulang saat dipanggil lagi
    for (const t of menunggu.values()) t.gagal(new Error(e.message || 'Scanner gagal berjalan'));
    menunggu.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function kirim<T>(p: Pesan): Promise<T> {
  const id = idBerikut++;
  return new Promise<T>((selesai, gagal) => {
    menunggu.set(id, { selesai: selesai as (v: unknown) => void, gagal });
    dapatkanWorker().postMessage({ ...p, id } satisfies Permintaan);
  });
}

/** Memanaskan model di worker saat tab Scanner dibuka (tombol Baca nonaktif sampai selesai). */
export const siapkanScanner = () => kirim<void>({ jenis: 'siapkan' });

/** Membaca foto (hanya area `bingkai`) di worker. Foto tidak disimpan dan tidak dikirim ke server. */
export const bacaFoto = (foto: Blob, bingkai?: Bingkai) => kirim<HasilScan>({ jenis: 'baca', foto, bingkai });
