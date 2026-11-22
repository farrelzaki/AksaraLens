import { describe, expect, it } from 'vitest';
import { gantiSuku, pilihanSuku, rentangSuku, type AlternatifHuruf } from './koreksi';
import { urai } from './urai';

const kosong: AlternatifHuruf = { ganti: [], sisip: [] };

describe('rentangSuku', () => {
  it('memetakan suku kata ke rentang huruf baris', () => {
    const b = 'ꦫꦒꦸꦫꦒꦸ';
    expect(rentangSuku(b, urai(b))).toEqual([[0, 1], [1, 3], [3, 4], [4, 6]]);
  });
});

describe('pilihanSuku', () => {
  it('kasus ragaraga: suku "ga" menawarkan "gu" dari model lebih dulu', () => {
    const b = 'ꦫꦒꦫꦒ';
    const alt = [kosong, { ganti: [], sisip: [['ꦸ', 0.2]] } as AlternatifHuruf, kosong, kosong];
    const p = pilihanSuku(b, urai(b), 1, alt);
    expect(p[0]).toEqual({ teks: 'ꦒꦸ', latin: 'gu', sumber: 'model' });
  });

  it('tanpa alternatif model tetap ada variasi vokal dan aksara mirip', () => {
    const b = 'ꦫꦒ';
    const p = pilihanSuku(b, urai(b), 1);
    expect(p.map((x) => x.latin)).toEqual(expect.arrayContaining(['gi', 'gu', 'gé', 'gê', 'go']));
    expect(p.some((x) => x.sumber === 'mirip')).toBe(true);
    expect(p.find((x) => x.teks === 'ꦒ')).toBeUndefined(); // bacaan asli tidak ditawarkan lagi
    expect(p.length).toBeLessThanOrEqual(8);
  });

  it('suku dengan pangkon tidak diberi variasi vokal yang tidak sah', () => {
    const b = 'ꦤꦏ꧀';
    expect(pilihanSuku(b, urai(b), 0).every((x) => !x.latin.includes('?'))).toBe(true);
  });
});

describe('gantiSuku', () => {
  it('mengganti dan menghapus suku kata', () => {
    const s = urai('ꦫꦒꦫꦒ');
    expect(gantiSuku(s, 1, 'ꦒꦸ')).toBe('ꦫꦒꦸꦫꦒ');
    expect(gantiSuku(s, 3, '')).toBe('ꦫꦒꦫ');
  });
});
