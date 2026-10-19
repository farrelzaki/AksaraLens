// Web Worker scanner: pipeline (scan.ts) dan sesi ONNX berjalan di sini agar halaman tetap
// responsif selama 1–3 detik pemrosesan. Foto hanya lewat memori worker; tidak disimpan/dikirim.

import { bacaFoto, siapkanScanner } from './scan';

export type Pesan = { jenis: 'siapkan' } | { jenis: 'baca'; foto: Blob };
export type Permintaan = Pesan & { id: number };
export type Jawaban = { id: number; ok: true; hasil?: unknown } | { id: number; ok: false; galat: string };

// tsconfig memakai lib DOM; cukup bentuk minimal cakupan worker yang dipakai di sini
const ctx = self as unknown as {
  onmessage: (e: MessageEvent<Permintaan>) => void;
  postMessage: (j: Jawaban) => void;
};

ctx.onmessage = async (e) => {
  const p = e.data;
  try {
    const hasil = p.jenis === 'siapkan' ? (await siapkanScanner(), undefined) : await bacaFoto(p.foto);
    ctx.postMessage({ id: p.id, ok: true, hasil });
  } catch (err) {
    ctx.postMessage({ id: p.id, ok: false, galat: err instanceof Error ? err.message : String(err) });
  }
};
