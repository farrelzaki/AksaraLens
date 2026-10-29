import { describe, expect, it } from 'vitest';
import { catatJawaban, hurufSeringSalah, type StatHuruf } from './model';
import { catatanDariCek } from './tulisan';

describe('catatanDariCek', () => {
  it('mencatat hasil benar dan salah untuk huruf nglegena', () => {
    expect(catatanDariCek('ka', { benar: true })).toEqual({ letter: 'ka', benar: true });
    expect(catatanDariCek('nga', { benar: false })).toEqual({ letter: 'nga', benar: false });
  });

  it('cek yang tidak jalan (null/undefined) tidak dihitung salah', () => {
    expect(catatanDariCek('ka', null)).toBeNull();
    expect(catatanDariCek('ka', undefined)).toBeNull();
  });

  it('selain huruf nglegena tidak dicatat', () => {
    expect(catatanDariCek('wulu', { benar: false })).toBeNull();
    expect(catatanDariCek('lingsa', { benar: false })).toBeNull();
    expect(catatanDariCek('xyz', { benar: false })).toBeNull();
  });
});

describe('dari cek tulisan ke "huruf sering salah"', () => {
  it('tiga percobaan (2 salah, 1 benar) tercatat dan masuk daftar', () => {
    let stats: StatHuruf[] = [];
    for (const benar of [false, false, true]) {
      const c = catatanDariCek('ka', { benar });
      if (c) stats = catatJawaban(stats, c.letter, c.benar);
    }
    expect(stats.find((s) => s.letter === 'ka')).toMatchObject({ correct: 1, wrong: 2 });
    expect(hurufSeringSalah(stats).map((s) => s.letter)).toEqual(['ka']);
  });

  it('kurang dari 3 percobaan belum masuk daftar', () => {
    let stats: StatHuruf[] = [];
    for (const benar of [false, false]) {
      const c = catatanDariCek('ra', { benar });
      if (c) stats = catatJawaban(stats, c.letter, c.benar);
    }
    expect(hurufSeringSalah(stats)).toEqual([]);
  });
});