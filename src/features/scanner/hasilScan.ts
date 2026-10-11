// Hasil scan hanya hidup di memori selama sesi halaman: tidak disimpan,
// tidak dikirim ke server (F5 langkah 6). Sengaja bukan localStorage.

import type { HasilScan } from '../../ml/model2/scan';

let terakhir: HasilScan | null = null;

export const simpanHasilSementara = (h: HasilScan) => {
  terakhir = h;
};
export const ambilHasilSementara = () => terakhir;
