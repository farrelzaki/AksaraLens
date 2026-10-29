// Satu-satunya daftar karakter yang dikenal AksaraLens: 31 karakter Unicode Jawa
// sesuai rancangan 3 bab (PRD, Spesifikasi AI, Model 2a). Konten, soal, statistik
// huruf, dan uraian Kaji lebih dalam semuanya merujuk ke `kode` di sini.

export type JenisHuruf = 'nglegena' | 'sandhangan' | 'panyigeg' | 'pangkon' | 'pada';

export interface Huruf {
  kode: string; // dipakai di konten, letter_stats, dan anchor materi (#ka)
  unicode: string;
  latin: string; // bacaan: konsonan + 'a' untuk nglegena, bunyi untuk sandhangan
  jenis: JenisHuruf;
  bab: 1 | 2 | 3 | null; // null = tidak ada di materi (pada)
}

const nglegena: [string, string][] = [
  ['ha', 'ꦲ'], ['na', 'ꦤ'], ['ca', 'ꦕ'], ['ra', 'ꦫ'], ['ka', 'ꦏ'],
  ['da', 'ꦢ'], ['ta', 'ꦠ'], ['sa', 'ꦱ'], ['wa', 'ꦮ'], ['la', 'ꦭ'],
  ['pa', 'ꦥ'], ['dha', 'ꦝ'], ['ja', 'ꦗ'], ['ya', 'ꦪ'], ['nya', 'ꦚ'],
  ['ma', 'ꦩ'], ['ga', 'ꦒ'], ['ba', 'ꦧ'], ['tha', 'ꦛ'], ['nga', 'ꦔ'],
];

export const HURUF: readonly Huruf[] = [
  ...nglegena.map(([kode, unicode]): Huruf => ({ kode, unicode, latin: kode, jenis: 'nglegena', bab: 1 })),
  { kode: 'wulu', unicode: 'ꦶ', latin: 'i', jenis: 'sandhangan', bab: 2 },
  { kode: 'suku', unicode: 'ꦸ', latin: 'u', jenis: 'sandhangan', bab: 2 },
  { kode: 'taling', unicode: 'ꦺ', latin: 'é', jenis: 'sandhangan', bab: 2 },
  { kode: 'tarung', unicode: 'ꦴ', latin: 'o', jenis: 'sandhangan', bab: 2 },
  { kode: 'pepet', unicode: 'ꦼ', latin: 'ê', jenis: 'sandhangan', bab: 2 },
  { kode: 'layar', unicode: 'ꦂ', latin: 'r', jenis: 'panyigeg', bab: 3 },
  { kode: 'cecak', unicode: 'ꦁ', latin: 'ng', jenis: 'panyigeg', bab: 3 },
  { kode: 'wignyan', unicode: 'ꦃ', latin: 'h', jenis: 'panyigeg', bab: 3 },
  { kode: 'pangkon', unicode: '꧀', latin: '', jenis: 'pangkon', bab: 3 },
  { kode: 'lingsa', unicode: '꧈', latin: ',', jenis: 'pada', bab: null },
  { kode: 'lungsi', unicode: '꧉', latin: '.', jenis: 'pada', bab: null },
];

export const NGLEGENA = HURUF.filter((h) => h.jenis === 'nglegena');

const perUnicode = new Map(HURUF.map((h) => [h.unicode, h]));
const perKode = new Map(HURUF.map((h) => [h.kode, h]));

export const hurufDariUnicode = (c: string): Huruf | undefined => perUnicode.get(c);
export const hurufDariKode = (kode: string): Huruf | undefined => perKode.get(kode);

/** Konsonan nglegena tanpa vokal bawaan, mis. 'nya' -> 'ny'. */
export const konsonan = (h: Huruf): string => h.latin.slice(0, -1);
