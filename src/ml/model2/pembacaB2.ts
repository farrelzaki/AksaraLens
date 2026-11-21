// Pembaca baris B2 (PP-OCRv5_server_rec di-fine-tune, int8). Padanan Python: adaptor PEMBACA di scripts/bangku_v3.py
// + ke_masukan() di scripts/b2_paddle.py. Kelas keluaran sama dengan pembaca v2 (blank + 31, urutan scanner_charset.json),
// jadi dekodeGreedy, L5, dan penilai status tidak berubah.
// Masukan dibentuk dari keluaran keInputBaris (tinggi 64, tinta=1, kontras p2-p98 dinormalkan) agar sama persis dengan
// bangku uji: dibalik ke abu-abu tinta gelap, diubah ke tinggi 48 (INTER_LINEAR), 3 kanal sama, (x/255 - 0.5)/0.5.

import { keInputBaris, TINGGI_BARIS } from './ctc';
import { bulat, resizeBilinear, type Gray } from './gambar';

export const TINGGI_B2 = 48;
export const LEBAR_MAKS_B2 = 3200;

/** Potongan baris -> tensor [1, 3, 48, W] (W kelipatan 8). */
export function keInputB2(crop: Gray): { data: Float32Array; lebar: number } {
  const v2 = keInputBaris(crop);
  const lebarV2 = v2.lebar;
  // (255 * (1 - x)).clip(0, 255).astype(uint8) dalam float32: pemotongan, bukan pembulatan
  const g: Gray = { w: lebarV2, h: TINGGI_BARIS, d: new Float32Array(v2.data.length) };
  for (let i = 0; i < g.d.length; i++) {
    const v = Math.fround(255 * Math.fround(1 - v2.data[i]));
    g.d[i] = Math.floor(Math.min(255, Math.max(0, v)));
  }
  const lebar = Math.min(LEBAR_MAKS_B2, Math.max(8, bulat((TINGGI_B2 * lebarV2) / TINGGI_BARIS / 8) * 8));
  const r = resizeBilinear(g, lebar, TINGGI_B2);
  const n = lebar * TINGGI_B2;
  const data = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    const v = (r.d[i] / 255 - 0.5) / 0.5;
    data[i] = v;
    data[n + i] = v;
    data[2 * n + i] = v;
  }
  return { data, lebar };
}

/** Keluaran ONNX B2 adalah peluang softmax; dekoder hilir memakai logit, jadi diubah ke log-peluang (softmax-nya sama). */
export function keLogPeluang(p: ArrayLike<number>): Float32Array {
  const out = new Float32Array(p.length);
  for (let i = 0; i < p.length; i++) out[i] = Math.log(Math.max(p[i], 1e-9));
  return out;
}
