// F8 Koin & Toko Aksa. Bentuk dompet sama untuk tamu (localStorage) dan akun (Supabase),
// tanpa user_id. Fungsi di file ini murni dan wajib dites.

import { TOKO, type Toko } from '../content';
import { tahapDariId } from '../content/tahap';

export interface Dompet {
  koin: number;
  /** id karakter Aksa yang dimiliki selain yang gratis */
  avatar: number[];
  /** kunci hadiah yang sudah diberikan, agar mengulang tidak memberi koin lagi */
  hadiah: string[];
  updated_at: string;
}

export const DOMPET_AWAL: Dompet = { koin: 0, avatar: [], hadiah: [], updated_at: '' };

export const kunciSoal = (idTahap: string, indeks: number) => `soal:${idTahap}:${indeks}`;
export const kunciTitik = (idTahap: string) => `titik:${idTahap}`;

/**
 * Memberi `jumlah` koin sekali per `kunci`. Kunci yang sudah ada tidak memberi apa pun.
 * `diberi` = koin yang benar-benar ditambahkan (untuk animasi/pesan).
 */
export function beriHadiah(
  dompet: Dompet,
  kunci: string,
  jumlah: number,
  kini = new Date(),
): { dompet: Dompet; diberi: number } {
  if (jumlah <= 0 || dompet.hadiah.includes(kunci)) return { dompet, diberi: 0 };
  return {
    dompet: {
      ...dompet,
      koin: dompet.koin + jumlah,
      hadiah: [...dompet.hadiah, kunci],
      updated_at: kini.toISOString(),
    },
    diberi: jumlah,
  };
}

/** Hadiah satu jawaban: hanya jawaban benar, sekali per soal. */
export function hadiahJawaban(dompet: Dompet, kunci: string, benar: boolean, toko: Toko = TOKO, kini = new Date()) {
  return benar ? beriHadiah(dompet, kunci, toko.hadiah.soal, kini) : { dompet, diberi: 0 };
}

/**
 * Hadiah titik selesai pertama kali. Hanya id tahap belajar yang dihitung; id jalur lama
 * (yang ikut dicatat saat penyelesaian) diabaikan agar koin tidak diberikan dua kali.
 */
export function hadiahTitik(dompet: Dompet, idTitik: string, toko: Toko = TOKO, kini = new Date()) {
  if (!tahapDariId(idTitik)) return { dompet, diberi: 0 };
  return beriHadiah(dompet, kunciTitik(idTitik), toko.hadiah.titik, kini);
}

export const hargaAvatar = (id: number, toko: Toko = TOKO): number | undefined =>
  toko.avatar.find((a) => a.id === id)?.harga;

/** Karakter dimiliki bila gratis (harga 0) atau sudah dibeli. */
export function punyaAvatar(dompet: Dompet, id: number, toko: Toko = TOKO): boolean {
  const harga = hargaAvatar(id, toko);
  return harga !== undefined && (harga === 0 || dompet.avatar.includes(id));
}

export type HasilBeli =
  | { ok: true; dompet: Dompet }
  | { ok: false; alasan: 'tidak_ada' | 'sudah_dimiliki' | 'koin_kurang' };

/** Membeli karakter. Saldo tidak pernah negatif. */
export function beliAvatar(dompet: Dompet, id: number, toko: Toko = TOKO, kini = new Date()): HasilBeli {
  const harga = hargaAvatar(id, toko);
  if (harga === undefined) return { ok: false, alasan: 'tidak_ada' };
  if (punyaAvatar(dompet, id, toko)) return { ok: false, alasan: 'sudah_dimiliki' };
  if (dompet.koin < harga) return { ok: false, alasan: 'koin_kurang' };
  return {
    ok: true,
    dompet: { ...dompet, koin: dompet.koin - harga, avatar: [...dompet.avatar, id], updated_at: kini.toISOString() },
  };
}

/** F6: migrasi tamu -> akun. Koin dijumlah; karakter dan kunci hadiah digabung (himpunan). */
export function gabungDompet(server: Dompet, lokal: Dompet): Dompet {
  return {
    koin: server.koin + lokal.koin,
    avatar: [...new Set([...server.avatar, ...lokal.avatar])],
    hadiah: [...new Set([...server.hadiah, ...lokal.hadiah])],
    updated_at: server.updated_at > lokal.updated_at ? server.updated_at : lokal.updated_at,
  };
}
