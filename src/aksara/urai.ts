// Mengurai satu baris Unicode Jawa (keluaran Model 2a) menjadi suku kata Latin
// beserta komponennya. Dipakai layar hasil scan (bacaan per suku kata) dan
// Kaji lebih dalam (komponen + tautan materi). Fungsi murni, wajib dites.

import { hurufDariUnicode, konsonan, type Huruf } from './huruf';

export type Peran = 'aksara' | 'pasangan' | 'sandhangan' | 'panyigeg' | 'pangkon' | 'pada';

export interface Komponen {
  kode: string;
  /** Nama untuk ditampilkan, mis. 'taling tarung', 'pasangan ka', 'pada lungsi'. */
  nama: string;
  unicode: string;
  peran: Peran;
  /** Bab materi tujuan tautan; null = "belum ada di materi" (pasangan, pada). */
  bab: 1 | 2 | 3 | null;
}

export interface SukuKata {
  teks: string; // potongan Unicode asli
  latin: string;
  komponen: Komponen[];
  adaPasangan: boolean;
}

interface Pembangun {
  teks: string;
  konsonan: string;
  vokal: string;
  akhiran: string;
  komponen: Komponen[];
  adaPasangan: boolean;
}

const VOKAL: Record<string, string> = { wulu: 'i', suku: 'u', pepet: 'ê', taling: 'é', tarung: 'o' };

const NAMA: Record<string, string> = { lingsa: 'pada lingsa', lungsi: 'pada lungsi' };

const komponenDari = (h: Huruf, peran: Peran): Komponen => ({
  kode: h.kode,
  nama: peran === 'pasangan' ? `pasangan ${h.kode}` : (NAMA[h.kode] ?? h.kode),
  unicode: h.unicode,
  peran,
  bab: peran === 'pasangan' ? null : h.bab,
});

const selesaikan = (b: Pembangun): SukuKata => ({
  teks: b.teks,
  latin: b.konsonan + b.vokal + b.akhiran,
  komponen: b.komponen,
  adaPasangan: b.adaPasangan,
});

export function urai(baris: string): SukuKata[] {
  const huruf = Array.from(baris);
  const hasil: Pembangun[] = [];
  let kini: Pembangun | null = null;
  let awalKata = true;

  const tutup = () => {
    if (kini) hasil.push(kini);
    kini = null;
  };

  // Konsonan mati tanpa vokal digabung ke suku kata sebelumnya dalam kata yang sama:
  // ꦤꦏ꧀ꦏꦼ dibaca "nak-ke", bukan "na-k-ke".
  const matikan = (b: Pembangun, sisaKata: boolean) => {
    b.vokal = '';
    const sebelum = hasil.at(-1);
    if (sebelum && sisaKata && b.akhiran === '') {
      sebelum.teks += b.teks;
      sebelum.akhiran += b.konsonan;
      sebelum.komponen.push(...b.komponen);
      sebelum.adaPasangan ||= b.adaPasangan;
      kini = null;
      return true;
    }
    return false;
  };

  for (let i = 0; i < huruf.length; i++) {
    const c = huruf[i];
    const h = hurufDariUnicode(c);

    if (!h) {
      tutup();
      if (c.trim() !== '') hasil.push({ teks: c, konsonan: '?', vokal: '', akhiran: '', komponen: [], adaPasangan: false });
      awalKata = true;
      continue;
    }

    switch (h.jenis) {
      case 'nglegena': {
        const pasangan = huruf[i - 1] === '꧀' && hurufDariUnicode(huruf[i - 2] ?? '')?.jenis === 'nglegena';
        tutup();
        kini = {
          teks: c,
          // PRD Transliterasi: ha di awal kata dibaca a.
          konsonan: h.kode === 'ha' && awalKata ? '' : konsonan(h),
          vokal: 'a',
          akhiran: '',
          komponen: [komponenDari(h, pasangan ? 'pasangan' : 'aksara')],
          adaPasangan: pasangan,
        };
        awalKata = false;
        break;
      }
      case 'sandhangan':
        if (kini) {
          kini.teks += c;
          kini.vokal = VOKAL[h.kode];
          const akhir = kini.komponen.at(-1);
          if (h.kode === 'tarung' && akhir?.kode === 'taling') {
            // taling + tarung = satu sandhangan "taling tarung" (materi Bab 2, kode 'tarung')
            kini.komponen[kini.komponen.length - 1] = { ...komponenDari(h, 'sandhangan'), nama: 'taling tarung', unicode: akhir.unicode + h.unicode };
          } else kini.komponen.push(komponenDari(h, 'sandhangan'));
        }
        break;
      case 'panyigeg':
        if (kini) {
          kini.teks += c;
          kini.akhiran += h.latin;
          kini.komponen.push(komponenDari(h, 'panyigeg'));
        }
        break;
      case 'pangkon':
        if (kini) {
          const b: Pembangun = kini;
          b.teks += c;
          const keKonsonan = hurufDariUnicode(huruf[i + 1] ?? '')?.jenis === 'nglegena';
          // Sebelum konsonan, ꧀ adalah penanda pasangan, bukan pangkon yang tampak.
          if (!keKonsonan) b.komponen.push(komponenDari(h, 'pangkon'));
          if (!matikan(b, true)) b.vokal = '';
          tutup();
        }
        break;
      case 'pada':
        tutup();
        hasil.push({ teks: c, konsonan: h.latin, vokal: '', akhiran: '', komponen: [komponenDari(h, 'pada')], adaPasangan: false });
        awalKata = true;
        break;
    }
  }
  tutup();
  return hasil.map(selesaikan);
}

/** Bacaan Latin satu baris, suku kata dipisah tanda hubung. */
export const keLatin = (baris: string): string =>
  urai(baris)
    .map((s) => s.latin)
    .join('-')
    .replace(/-?([,.])-?/g, '$1 ')
    .trim();

export const tautanMateri = (k: Komponen): string | null =>
  k.bab === null ? null : `/belajar/materi/${k.bab}#${k.kode}`;
