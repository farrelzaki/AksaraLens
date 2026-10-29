// Peta kode huruf/sandhangan -> tautan materi (PRD F3: /belajar/materi/:bab#kode).
// Dipakai "Huruf sering salah" (Profil) dan "Kaji lebih dalam" (Scanner).
// Fungsi murni: tidak menyentuh DOM atau jaringan.

import { hurufDariKode, hurufDariUnicode } from '../aksara/huruf';
import { babDariNomor } from './index';

/** Nama lain yang dipakai tampilan; kuncinya sudah huruf kecil. */
const ALIAS: Record<string, string> = {
  'taling tarung': 'tarung',
  'taling-tarung': 'tarung',
};

/**
 * Tautan materi untuk satu kode (mis. 'ka', 'wulu', 'tarung') atau nama 'taling tarung'.
 * null bila tidak ada di materi: kode tak dikenal, tanda baca (lingsa, lungsi), atau
 * huruf yang belum tercantum di bab.json. UI menampilkannya sebagai "belum ada di materi" (F5).
 */
export function tautanMateri(kode: string): string | null {
  const nama = kode.trim().toLowerCase();
  const huruf = hurufDariKode(ALIAS[nama] ?? nama);
  if (!huruf || huruf.bab === null) return null;
  const bab = babDariNomor(huruf.bab);
  if (!bab || !bab.letters.includes(huruf.kode)) return null;
  return `/belajar/materi/${huruf.bab}#${huruf.kode}`;
}

/** Sama seperti tautanMateri, tetapi dari satu karakter Unicode Jawa. */
export function tautanDariUnicode(karakter: string): string | null {
  const huruf = hurufDariUnicode(karakter);
  return huruf ? tautanMateri(huruf.kode) : null;
}