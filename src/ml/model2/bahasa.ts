// L5 dekoder bahasa: model bahasa karakter n-gram + beam search CTC (docs/RENCANA_SCANNER_FINAL.md).
// Kembaran dari scripts/model_bahasa.py; keduanya membaca model_bahasa.json yang sama (urutan TAMPAK, sama dengan CTC).
// Uji paritas: bahasa.fixture.json dibuat oleh `python -X utf8 scripts/model_bahasa.py fixture`.

import { nilaiStatus } from './saring';

export interface ModelBahasa {
  n: number;
  seragam: number;
  /** konteks + karakter -> log peluang (sudah terinterpolasi) */
  p: Record<string, number>;
  /** konteks -> log bobot mundur */
  b: Record<string, number>;
}

export const AWAL = '^';
export const LEBAR = 8;
export const ALFA = 0.4;
export const BETA = 1.2;
export const PANGKAS = -8.0;
export const JAGA = 0.25;

/** log P(c | ctx) dengan mundur ke konteks lebih pendek. */
export function dapat(model: ModelBahasa, ctx: string, c: string): number {
  let tambah = 0;
  for (;;) {
    const v = model.p[ctx + c];
    if (v !== undefined) return tambah + v;
    if (ctx === '') return tambah + model.seragam;
    tambah += model.b[ctx] ?? 0;
    ctx = ctx.slice(1);
  }
}

export function konteks(model: ModelBahasa, awalan: string): string {
  const s = AWAL.repeat(model.n - 1) + awalan;
  return s.slice(s.length - (model.n - 1));
}

function lse(a: number, b: number): number {
  if (a === -Infinity) return b;
  if (b === -Infinity) return a;
  return Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b)));
}

/** Logit datar [T*C] -> log-peluang datar [T*C]. */
export function logSoftmax(logit: ArrayLike<number>, C: number): Float64Array {
  const T = logit.length / C;
  const out = new Float64Array(logit.length);
  for (let t = 0; t < T; t++) {
    const o = t * C;
    let m = -Infinity;
    for (let c = 0; c < C; c++) m = Math.max(m, logit[o + c]);
    let s = 0;
    for (let c = 0; c < C; c++) s += Math.exp(logit[o + c] - m);
    const z = m + Math.log(s);
    for (let c = 0; c < C; c++) out[o + c] = logit[o + c] - z;
  }
  return out;
}

type Sinar = [pb: number, pnb: number, lm: number];
const skor = (s: Sinar) => lse(s[0], s[1]) + s[2];
const urutSinar = (a: [string, Sinar], b: [string, Sinar]) => skor(b[1]) - skor(a[1]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

/**
 * Prefix beam search CTC atas log-peluang datar [T*C] (indeks 0 = blank). -> teks urutan TAMPAK.
 * Skor = log P_ctc + alfa * log P_lm + beta * panjang.
 */
export function dekodeBeam(
  lp: ArrayLike<number>,
  C: number,
  charset: readonly string[],
  model: ModelBahasa,
  { lebar = LEBAR, alfa = ALFA, beta = BETA, pangkas = PANGKAS } = {},
): string {
  const T = lp.length / C;
  let beam = new Map<string, Sinar>([['', [0, -Infinity, 0]]]);
  for (let t = 0; t < T; t++) {
    const o = t * C;
    const baru = new Map<string, Sinar>();
    const tambah = (k: string, pb: number, pnb: number, lm: number) => {
      const ada = baru.get(k);
      if (ada) baru.set(k, [lse(ada[0], pb), lse(ada[1], pnb), lm]);
      else baru.set(k, [pb, pnb, lm]);
    };
    const calon: number[] = [];
    for (let c = 1; c < C; c++) if (lp[o + c] >= pangkas) calon.push(c);
    for (const [awalan, [pb, pnb, lm]] of beam) {
      const tot = lse(pb, pnb);
      tambah(awalan, tot + lp[o], -Infinity, lm);
      const akhir = awalan ? awalan[awalan.length - 1] : null;
      for (const c of calon) {
        const ch = charset[c];
        let sumber: number;
        if (ch === akhir) {
          tambah(awalan, -Infinity, pnb + lp[o + c], lm); // ulangan dilipat
          sumber = pb;
        } else sumber = tot;
        if (sumber === -Infinity) continue;
        const k = awalan + ch;
        const ada = baru.get(k);
        const lm2 = ada ? ada[2] : lm + alfa * dapat(model, konteks(model, awalan), ch) + beta;
        tambah(k, -Infinity, sumber + lp[o + c], lm2);
      }
    }
    beam = new Map([...baru].sort(urutSinar).slice(0, lebar));
  }
  return [...beam].sort(urutSinar)[0][0];
}

export function jarak(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  let p = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const c = [i];
    for (let j = 1; j <= y.length; j++) c.push(Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (x[i - 1] !== y[j - 1] ? 1 : 0)));
    p = c;
  }
  return p[y.length];
}

/**
 * Penjaga: status baris tetap dari bacaan greedy (penolakan tidak berubah). Bacaan model bahasa hanya menggantikan
 * teks yang tampil bila perubahannya kecil dan tetap sah menurut penilai mode area. -> teks koreksi atau null.
 */
export function pilihKoreksi(greedy: string, beam: string, keyakinan: number): string | null {
  if (!beam || beam === greedy || jarak(beam, greedy) > Math.max(1, Math.floor(JAGA * [...greedy].length + 0.5))) return null;
  return nilaiStatus(beam, keyakinan, 'area') !== 'TOLAK' ? beam : null;
}
