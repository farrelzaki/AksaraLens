// Klien scanner di thread utama: meneruskan permintaan ke scan.worker.ts.
// Halaman memakai modul ini, bukan scan.ts langsung.

import type { Bingkai } from './bingkai';
import type { HasilScan } from './scan';
import type { Jawaban, Pesan, Permintaan } from './scan.worker';
import { urai } from '../../aksara/urai';

export type { Bingkai, HasilScan };
export { PENUH } from './bingkai';

/**
 * Mode demo frontend: hasil contoh tanpa model. Hanya aktif bila VITE_SCANNER_DEMO=1 di .env.
 * Dipakai untuk mencoba alur halaman; halaman menampilkan label "Mode demo" selama aktif.
 */
export const MODE_DEMO = import.meta.env.VITE_SCANNER_DEMO === '1';


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
export const siapkanScanner = () => (MODE_DEMO ? Promise.resolve() : kirim<void>({ jenis: 'siapkan' }));

/** Hasil contoh untuk mode demo: tiga baris dari uji foto render (bukan hasil model). */
const UNICODE_DEMO = ['ꦥꦤꦺꦴꦫꦩꦗꦮ', 'ꦧꦸꦏꦸꦱꦼꦏꦺꦴꦭꦃ', 'ꦗꦭꦤ꧀ꦩꦭꦶꦪꦺꦴꦧꦺꦴꦫꦺꦴ'];

function hasilDemo(): HasilScan {
  const baris = UNICODE_DEMO.map((u) => ({ unicode: u, keyakinan: 0.95, sukuKata: urai(u) }));
  return { baris, kurangYakin: false, info: { waktuMs: 1500, sudut: 0, kotak: [] } };
}

/** Membaca foto (hanya area `bingkai`) di worker. Foto tidak disimpan dan tidak dikirim ke server. */
export const bacaFoto = (foto: Blob, bingkai?: Bingkai) =>
  MODE_DEMO
    ? new Promise<HasilScan>((selesai) => setTimeout(() => selesai(hasilDemo()), 1500))
    : kirim<HasilScan>({ jenis: 'baca', foto, bingkai });
