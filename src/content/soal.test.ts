// Mengikat soal.json ke satu-satunya daftar karakter (src/aksara/huruf.ts) dan ke jalur.json,
// supaya isi soal tidak diam-diam menyimpang dari kode huruf.

import { describe, expect, it } from 'vitest';
import { JALUR, SOAL, materiDariKode } from './index';
import { hurufDariKode, konsonan } from '../aksara/huruf';

const lesson = JALUR.filter((t) => t.type === 'lesson');
const TALING = hurufDariKode('taling')!.unicode;

/** Aksara + bacaan yang seharusnya untuk dasar (nglegena) + penanda. */
function harapan(dasar: string, penanda: string): { aksara: string; latin: string } {
  const d = hurufDariKode(dasar)!;
  const p = hurufDariKode(penanda)!;
  if (penanda === 'tarung') return { aksara: d.unicode + TALING + p.unicode, latin: konsonan(d) + 'o' };
  if (p.jenis === 'pangkon') return { aksara: d.unicode + p.unicode, latin: konsonan(d) };
  if (p.jenis === 'panyigeg') return { aksara: d.unicode + p.unicode, latin: d.latin + p.latin };
  return { aksara: d.unicode + p.unicode, latin: konsonan(d) + p.latin };
}

/** Cari dasar nglegena dari aksara gabungan (karakter pertama). */
const dasarDari = (aksara: string) => {
  const kode = [...aksara][0];
  return ['ha','na','ca','ra','ka','da','ta','sa','wa','la','pa','dha','ja','ya','nya','ma','ga','ba','tha','nga']
    .find((k) => hurufDariKode(k)!.unicode === kode)!;
};

describe('soal.json', () => {
  it('punya soal untuk setiap titik lesson, dan hanya itu', () => {
    expect(Object.keys(SOAL).sort()).toEqual(lesson.map((t) => t.id).sort());
  });

  it.each(lesson.map((t) => [t.id]))('%s: 6 soal, 4 pilihan unik, jawaban ada di pilihan, dua arah', (id) => {
    const { pilihan } = SOAL[id];
    expect(pilihan).toHaveLength(6);
    for (const s of pilihan) {
      expect(s.pilihan).toHaveLength(4);
      expect(new Set(s.pilihan).size).toBe(4);
      expect(s.pilihan).toContain(s.jawab);
      expect(hurufDariKode(s.huruf)).toBeDefined();
      expect(materiDariKode(s.huruf)).toBeDefined();
    }
    expect(new Set(pilihan.map((s) => s.arah)).size).toBe(2);
  });

  it('soal dan jodoh Bab 1 cocok dengan huruf.ts', () => {
    for (const t of lesson.filter((x) => x.bab === 1)) {
      for (const s of SOAL[t.id].pilihan) {
        const h = hurufDariKode(s.huruf)!;
        expect(t.letters).toContain(s.huruf);
        expect(s.arah === 'aksara-ke-latin' ? [s.tanya, s.jawab] : [s.jawab, s.tanya]).toEqual([h.unicode, h.latin]);
      }
      expect(SOAL[t.id].jodoh.map((p) => p.huruf)).toEqual(t.letters);
      for (const p of SOAL[t.id].jodoh) {
        const h = hurufDariKode(p.huruf)!;
        expect([p.aksara, p.latin]).toEqual([h.unicode, h.latin]);
      }
    }
  });

  it('soal dan jodoh Bab 2–3 mengikuti aturan komposisi huruf.ts', () => {
    for (const t of lesson.filter((x) => x.bab !== 1)) {
      for (const s of SOAL[t.id].pilihan) {
        expect(t.letters).toContain(s.huruf);
        const [aksara, latin] = s.arah === 'aksara-ke-latin' ? [s.tanya, s.jawab] : [s.jawab, s.tanya];
        expect({ aksara, latin }).toEqual(harapan(dasarDari(aksara), s.huruf));
      }
      for (const p of SOAL[t.id].jodoh) {
        expect({ aksara: p.aksara, latin: p.latin }).toEqual(harapan(dasarDari(p.aksara), p.huruf));
      }
    }
  });

  it('jodoh tiap titik tidak punya aksara atau bacaan ganda', () => {
    for (const t of lesson) {
      const j = SOAL[t.id].jodoh;
      expect(new Set(j.map((p) => p.aksara)).size).toBe(j.length);
      expect(new Set(j.map((p) => p.latin)).size).toBe(j.length);
    }
  });
});