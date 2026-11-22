// Koreksi hasil scan oleh pengguna (PRD F5): tiap suku kata hasil baca bisa diganti dengan pilihan yang mendekati.
// Pilihan = (1) alternatif model untuk huruf-huruf suku itu, (2) suku yang sama dengan sandhangan vokal lain,
// (3) aksara yang mirip bentuk (src/aksara/mirip.json, dari scripts/aksara_mirip.cjs). Fungsi murni.
// Koreksi hanya mengubah hasil di memori; tidak disimpan dan tidak dikirim.

import mirip from './mirip.json';
import { urai, type SukuKata } from './urai';

/** Bentuk sama dengan AlternatifHuruf di src/ml/model2/ctc.ts (ditulis ulang agar modul aksara tidak bergantung ke ml). */
export interface AlternatifHuruf {
  ganti: [huruf: string, peluang: number][];
  sisip: [huruf: string, peluang: number][];
}

export interface Pilihan {
  teks: string;
  latin: string;
  sumber: 'model' | 'sandhangan' | 'mirip';
}

const NGLEGENA = new Set('ꦲꦤꦕꦫꦏꦢꦠꦱꦮꦭꦥꦝꦗꦪꦚꦩꦒꦧꦛꦔ');
const PANGKON = '꧀';
const TANDA_VOKAL = new Set('ꦶꦸꦺꦼꦴ');
/** Vokal yang ditawarkan: a (tanpa tanda), i, u, é, ê, o. */
const VOKAL = ['', 'ꦶ', 'ꦸ', 'ꦺ', 'ꦼ', 'ꦺꦴ'];
const MAKS_MODEL = 4;
const MAKS_PILIHAN = 8;

export const latinDari = (teks: string) => urai(teks).map((s) => s.latin).join('');

/** Rentang huruf (indeks titik kode) tiap suku kata di baris; null bila suku kata tidak menyusun baris utuh. */
export function rentangSuku(baris: string, suku: readonly SukuKata[]): [number, number][] | null {
  if (suku.map((s) => s.teks).join('') !== baris) return null;
  let awal = 0;
  return suku.map((s) => {
    const n = Array.from(s.teks).length;
    awal += n;
    return [awal - n, awal];
  });
}

/** Kepala suku kata: konsonan (+ pasangan) di depan; sisanya ekor (sandhangan, panyigeg, pangkon). */
function pecah(teks: string): { kepala: string; ekor: string } {
  const h = Array.from(teks);
  if (!NGLEGENA.has(h[0])) return { kepala: '', ekor: teks };
  let i = 1;
  while (h[i] === PANGKON && NGLEGENA.has(h[i + 1])) i += 2;
  return { kepala: h.slice(0, i).join(''), ekor: h.slice(i).join('') };
}

function dariModel(baris: string, [p, q]: [number, number], alt: readonly AlternatifHuruf[]): string[] {
  const h = Array.from(baris);
  const calon: [string, number][] = [];
  for (let j = p; j < q; j++) {
    const a = alt[j];
    if (!a) continue;
    for (const [c, pel] of a.ganti) calon.push([[...h.slice(p, j), c, ...h.slice(j + 1, q)].join(''), pel]);
    for (const [c, pel] of a.sisip) calon.push([[...h.slice(p, j + 1), c, ...h.slice(j + 1, q)].join(''), pel]);
  }
  return calon.sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

function variasiVokal(teks: string): string[] {
  const { kepala, ekor } = pecah(teks);
  if (!kepala || ekor.includes(PANGKON)) return [];
  const sisa = Array.from(ekor).filter((c) => !TANDA_VOKAL.has(c)).join('');
  return VOKAL.map((v) => kepala + v + sisa);
}

function variasiMirip(teks: string): string[] {
  const h = Array.from(teks);
  const daftar = (mirip as Record<string, string[]>)[h[0]] ?? [];
  return daftar.map((c) => c + h.slice(1).join(''));
}

/** Pilihan pengganti untuk suku kata ke-`i`. `alternatif` = per huruf baris (dari pembaca), bila ada. */
export function pilihanSuku(baris: string, suku: readonly SukuKata[], i: number, alternatif?: readonly AlternatifHuruf[]): Pilihan[] {
  const asli = suku[i]?.teks;
  if (asli === undefined) return [];
  const rentang = alternatif && alternatif.length === Array.from(baris).length ? rentangSuku(baris, suku) : null;
  const hasil: Pilihan[] = [];
  const tambah = (teks: string, sumber: Pilihan['sumber']) => {
    if (hasil.length >= MAKS_PILIHAN || teks === asli || hasil.some((p) => p.teks === teks)) return;
    const latin = latinDari(teks);
    if (!latin || latin.includes('?')) return; // tanda tanpa aksara, dsb.
    hasil.push({ teks, latin, sumber });
  };
  if (rentang && alternatif) for (const t of dariModel(baris, rentang[i], alternatif).slice(0, MAKS_MODEL)) tambah(t, 'model');
  for (const t of variasiVokal(asli)) tambah(t, 'sandhangan');
  for (const t of variasiMirip(asli)) tambah(t, 'mirip');
  return hasil;
}

/** Baris baru setelah suku kata ke-`i` diganti `baru` ('' = dihapus). */
export const gantiSuku = (suku: readonly SukuKata[], i: number, baru: string) => suku.map((s, k) => (k === i ? baru : s.teks)).join('');
