// Pembaca baris (Model 2a): pra-proses ke_input() dan dekode greedy CTC.
// Salinan dari notebook Model 2 (sel 14 & 20). Charset & tinggi baris dari scanner_charset.json.

import meta from './scanner_charset.json';
import { keLogis } from '../../aksara/urutan';
import { bulat, persentil, resize, type Gray } from './gambar';

/** Indeks = kelas keluaran ONNX; indeks 0 = blank. */
export const CHARSET: readonly string[] = meta.charset.map((c, i) => (i === meta.blank ? '' : c));
export const TINGGI_BARIS = meta.line_height;
export const LEBAR_MAKS = 4000; // max_w di baca_gambar()

/** ke_input: tinggi 64 (lebar proporsional, INTER_AREA), tinta=1 latar=0, normalisasi p2–p98. */
export function keInputBaris(crop: Gray): { data: Float32Array; lebar: number } {
  const nw = Math.max(8, Math.min(LEBAR_MAKS, bulat((crop.w * TINGGI_BARIS) / crop.h)));
  const g = resize(crop, nw, TINGGI_BARIS);
  const lo = persentil(g.d, 2);
  const hi = persentil(g.d, 98);
  const rentang = Math.max(hi - lo, 1);
  const data = new Float32Array(g.d.length);
  for (let i = 0; i < data.length; i++) data[i] = Math.min(1, Math.max(0, (hi - g.d[i]) / rentang));
  return { data, lebar: nw };
}

/**
 * Greedy CTC atas logit [T, C] yang diratakan. Teks dikembalikan ke urutan logis (keLogis).
 * Keyakinan = rata-rata peluang softmax tertinggi pada kolom yang bukan blank (seperti notebook).
 */
export function dekodeGreedy(
  logit: ArrayLike<number>,
  jumlahKelas: number,
  charset: readonly string[] = CHARSET,
): { teks: string; keyakinan: number } {
  const T = logit.length / jumlahKelas;
  let teks = '';
  let sebelum = 0;
  let total = 0;
  let n = 0;
  for (let t = 0; t < T; t++) {
    const o = t * jumlahKelas;
    let terbaik = 0;
    for (let c = 1; c < jumlahKelas; c++) if (logit[o + c] > logit[o + terbaik]) terbaik = c;
    if (terbaik !== 0) {
      let jumlah = 0;
      for (let c = 0; c < jumlahKelas; c++) jumlah += Math.exp(logit[o + c] - logit[o + terbaik]);
      total += 1 / jumlah;
      n++;
      if (terbaik !== sebelum) teks += charset[terbaik];
    }
    sebelum = terbaik;
  }
  return { teks: keLogis(teks), keyakinan: n ? total / n : 0 };
}

/** Pilihan pengganti satu huruf hasil baca: `ganti` = huruf lain di kolom yang sama, `sisip` = huruf yang mungkin terlewat sesudahnya. */
export interface AlternatifHuruf {
  ganti: [huruf: string, peluang: number][];
  sisip: [huruf: string, peluang: number][];
}

export const ALT_MIN = 0.03; // peluang minimal agar sebuah huruf ditawarkan sebagai pilihan koreksi
const ALT_MAKS = 3;

const TALING = 'ꦺ';
const PANGKON = '꧀';
const NGLEGENA = new Set('ꦲꦤꦕꦫꦏꦢꦠꦱꦮꦭꦥꦝꦗꦪꦚꦩꦒꦧꦛꦔ');

/**
 * Alternatif per huruf dari jalur greedy CTC (untuk pilihan koreksi hasil scan), dalam urutan logis seperti
 * dekodeGreedy. Huruf di kolom puncaknya -> kelas lain yang cukup mungkin; kolom blank sesudahnya -> huruf yang
 * mungkin terlewat (mis. suku yang samar). `teks` sama dengan dekodeGreedy(...).teks.
 */
export function petaAlternatif(logit: ArrayLike<number>, jumlahKelas: number, charset: readonly string[] = CHARSET): { teks: string; alternatif: AlternatifHuruf[] } {
  const T = logit.length / jumlahKelas;
  const peluang = (t: number) => {
    const o = t * jumlahKelas;
    let maks = -Infinity;
    for (let c = 0; c < jumlahKelas; c++) maks = Math.max(maks, logit[o + c]);
    const p = new Float64Array(jumlahKelas);
    let jumlah = 0;
    for (let c = 0; c < jumlahKelas; c++) jumlah += p[c] = Math.exp(logit[o + c] - maks);
    for (let c = 0; c < jumlahKelas; c++) p[c] /= jumlah;
    return p;
  };
  const teratas = (p: ArrayLike<number>, kecuali: number) => {
    const daftar: [string, number][] = [];
    for (let c = 1; c < jumlahKelas; c++) if (c !== kecuali && p[c] >= ALT_MIN) daftar.push([charset[c], p[c]]);
    return daftar.sort((a, b) => b[1] - a[1]).slice(0, ALT_MAKS);
  };

  // Jalur greedy: tiap huruf yang dipancarkan + kolom puncaknya; kolom blank sesudahnya dicatat sebagai celah.
  const huruf: { c: number; puncak: number; pPuncak: number; celah: Float64Array }[] = [];
  let sebelum = 0;
  for (let t = 0; t < T; t++) {
    const p = peluang(t);
    let terbaik = 0;
    for (let c = 1; c < jumlahKelas; c++) if (p[c] > p[terbaik]) terbaik = c;
    const akhir = huruf.at(-1);
    if (terbaik !== 0 && terbaik !== sebelum) huruf.push({ c: terbaik, puncak: t, pPuncak: p[terbaik], celah: new Float64Array(jumlahKelas) });
    else if (terbaik !== 0 && akhir && p[terbaik] > akhir.pPuncak) [akhir.puncak, akhir.pPuncak] = [t, p[terbaik]];
    else if (terbaik === 0 && akhir) for (let c = 1; c < jumlahKelas; c++) akhir.celah[c] = Math.max(akhir.celah[c], p[c]);
    sebelum = terbaik;
  }

  let token = huruf.map((h) => ({ huruf: charset[h.c], alt: { ganti: teratas(peluang(h.puncak), h.c), sisip: teratas(h.celah, 0) } as AlternatifHuruf }));
  // Urutan tampak -> logis (sama dengan keLogis): taling dipindah ke belakang klusternya.
  const logis: typeof token = [];
  for (let i = 0; i < token.length; i++) {
    if (token[i].huruf !== TALING || !NGLEGENA.has(token[i + 1]?.huruf ?? '')) {
      logis.push(token[i]);
      continue;
    }
    let j = i + 2;
    while (token[j]?.huruf === PANGKON && NGLEGENA.has(token[j + 1]?.huruf ?? '')) j += 2;
    logis.push(...token.slice(i + 1, j), token[i]);
    i = j - 1;
  }
  token = logis;
  return { teks: token.map((t) => t.huruf).join(''), alternatif: token.map((t) => t.alt) };
}
