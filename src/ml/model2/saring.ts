// Penilai baris scanner: gabung kotak sebaris, nilai validitas tata aksara, dan putuskan
// TERIMA/RAGU/TOLAK. Padanan Python: scripts/pipeline_cerdas.py. Ambang dipilih dari kurva di split
// pengembangan Set C (docs/EVALUASI.md bagian 3).

import type { Kotak } from './detektor';

export type Mode = 'foto' | 'area'; // area = pengguna sudah menunjuk tulisannya sendiri
export type Status = 'TERIMA' | 'RAGU' | 'TOLAK';

export interface Calon {
  unicode: string;
  keyakinan: number;
  kotak: Kotak;
  status: Status;
}

const KONSONAN = new Set('ꦲꦤꦕꦫꦏꦢꦠꦱꦮꦭꦥꦝꦗꦪꦚꦩꦒꦧꦛꦔ');
const SANDHANGAN = new Set('ꦶꦸꦺꦴꦼꦁꦂꦃ');
const PADA = new Set('꧈꧉');
const PANGKON = '꧀';

const GABUNG_TINGGI = 0.5; // IoU tinggi minimal dua kotak sebaris
const GABUNG_CELAH = 3; // celah mendatar maksimal, kali tinggi baris
const GABUNG_TIMPA = 0.5; // tumpang mendatar maksimal, kali tinggi baris: baris bertumpuk bukan pecahan
const KECIL = 0.5; // kotak di bawah ini kali median tinggi dibuang
export const MAKS_KOTAK = 60; // per polaritas; halaman buku NusaAksara sampai 80 baris
export const BUKTI_FOTO = 2; // baris TERIMA minimal agar baris lain di foto dinilai longgar
const BUKTI_RASIO = 0.2; // dan minimal sebanyak ini dari semua calon: aksara mirip jarang mencapainya

const AMBANG: Record<Mode, { terima: number; ragu: number; valid: number; konsonan: number }> = {
  foto: { terima: 0.85, ragu: 0.75, valid: 1, konsonan: 3 },
  area: { terima: 0.85, ragu: 0.6, valid: 0.85, konsonan: 2 },
};

/** Kotak pecahan pada baris yang sama digabung, kotak kecil dibuang, maksimal `MAKS_KOTAK` terlebar, urut atas ke bawah. */
export function gabungBaris(kotak: readonly Kotak[]): Kotak[] {
  if (!kotak.length) return [];
  const tinggi = kotak.map((k) => k[3] - k[1]).sort((a, b) => a - b);
  const median = tinggi[Math.floor(tinggi.length / 2)];
  const baris: Kotak[] = [];
  const urut = kotak.filter((k) => k[3] - k[1] >= KECIL * median).sort((a, b) => a[0] - b[0]);
  for (const k of urut) {
    const r = baris.find((r) => {
      const hMin = Math.min(r[3] - r[1], k[3] - k[1]);
      const tumpang = Math.min(r[3], k[3]) - Math.max(r[1], k[1]);
      const gabungan = Math.max(r[3], k[3]) - Math.min(r[1], k[1]);
      const celah = k[0] - r[2];
      return tumpang / Math.max(gabungan, 1) >= GABUNG_TINGGI && celah > -GABUNG_TIMPA * hMin && celah < GABUNG_CELAH * hMin;
    });
    if (r) {
      r[0] = Math.min(r[0], k[0]);
      r[1] = Math.min(r[1], k[1]);
      r[2] = Math.max(r[2], k[2]);
      r[3] = Math.max(r[3], k[3]);
    } else baris.push([...k]);
  }
  return baris
    .sort((a, b) => b[2] - b[0] - (a[2] - a[0]))
    .slice(0, MAKS_KOTAK)
    .sort((a, b) => a[1] - b[1]);
}

/** Proporsi tanda yang sah: sandhangan/pangkon harus menempel pada huruf; pangkon diikuti huruf atau pada. */
export function validitas(teks: string): number {
  const c = [...teks];
  if (!c.length) return 0;
  let salah = 0;
  c.forEach((x, i) => {
    if (!SANDHANGAN.has(x) && x !== PANGKON) return;
    const s = c[i - 1];
    if (!(i > 0 && (KONSONAN.has(s) || (SANDHANGAN.has(s) && s !== x && x !== PANGKON)))) salah++;
    const n = c[i + 1];
    if (x === PANGKON && n !== undefined && !KONSONAN.has(n) && !PADA.has(n)) salah++;
  });
  return 1 - Math.min(1, salah / c.length);
}

export const jumlahKonsonan = (teks: string) => [...teks].filter((c) => KONSONAN.has(c)).length;

export function nilaiStatus(teks: string, keyakinan: number, mode: Mode): Status {
  const a = AMBANG[mode];
  if (jumlahKonsonan(teks) < a.konsonan || validitas(teks) < a.valid || keyakinan < a.ragu) return 'TOLAK';
  return keyakinan >= a.terima ? 'TERIMA' : 'RAGU';
}

export function iou(a: Kotak, b: Kotak): number {
  const lebar = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  const tinggi = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  if (lebar <= 0 || tinggi <= 0) return 0;
  return (lebar * tinggi) / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - lebar * tinggi);
}

/** Kotak sama dari dua polaritas: simpan yang terbaik. Hasil urut atas ke bawah. */
export function pilihBaris(calon: readonly Calon[]): Calon[] {
  const urut = [...calon].sort((a, b) => Number(b.status !== 'TOLAK') - Number(a.status !== 'TOLAK') || b.keyakinan - a.keyakinan);
  const hasil: Calon[] = [];
  for (const c of urut) if (hasil.every((h) => iou(c.kotak, h.kotak) < 0.3)) hasil.push(c);
  return hasil.sort((a, b) => a.kotak[1] - b.kotak[1]);
}

/**
 * Bukti tingkat foto: bila sudah ada beberapa baris yang jelas sah (halaman buku), baris lain tidak
 * ditolak hanya karena satu tanda keliru, cukup ditampilkan sebagai RAGU.
 */
export function terapkanBukti(calon: readonly Calon[]): Calon[] {
  const diterima = calon.filter((c) => c.status === 'TERIMA').length;
  if (diterima < BUKTI_FOTO || diterima < BUKTI_RASIO * calon.length) return [...calon];
  return calon.map((c) => (c.status === 'TOLAK' && nilaiStatus(c.unicode, c.keyakinan, 'area') !== 'TOLAK' ? { ...c, status: 'RAGU' } : c));
}

const skor = (c: { unicode: string; keyakinan: number }) => c.keyakinan * jumlahKonsonan(c.unicode);

/** Mode area: seluruh bingkai yang dibaca sebagai satu baris dipakai bila lebih meyakinkan dari hasil detektor. */
export function pilihArea(baris: Calon[], satuBaris: Calon | null): Calon[] {
  if (!satuBaris || satuBaris.status === 'TOLAK') return baris;
  const tampil = baris.filter((b) => b.status !== 'TOLAK').reduce((n, b) => n + skor(b), 0);
  return skor(satuBaris) > tampil ? [satuBaris] : baris;
}

export type Kualitas = 'gelap' | 'silau' | 'buram' | 'baik';

/** Petunjuk saat tidak ada yang terbaca: rata-rata terang dan ketajaman (varian Laplacian). */
export function nilaiKualitas(d: ArrayLike<number>, w: number, h: number): Kualitas {
  let total = 0;
  for (let i = 0; i < d.length; i++) total += d[i];
  const rata = total / d.length;
  if (rata < 45) return 'gelap';
  if (rata > 235) return 'silau';
  let n = 0;
  let jumlah = 0;
  let kuadrat = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const l = d[i - 1] + d[i + 1] + d[i - w] + d[i + w] - 4 * d[i];
      jumlah += l;
      kuadrat += l * l;
      n++;
    }
  }
  return n && kuadrat / n - (jumlah / n) ** 2 < 15 ? 'buram' : 'baik';
}
