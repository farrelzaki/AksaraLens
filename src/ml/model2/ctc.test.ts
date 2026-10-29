import { describe, expect, it } from 'vitest';
import { CHARSET, dekodeGreedy, keInputBaris } from './ctc';
import { buatGray } from './gambar';

const charset = ['', 'ꦏ', 'ꦶ', 'ꦺ'];
const langkah = (...kelas: number[]) => kelas.flatMap((k) => charset.map((_, c) => (c === k ? 5 : 0)));

describe('CHARSET', () => {
  it('mengikuti scanner_charset.json: 31 karakter + blank, cecak sebelum layar', () => {
    expect(CHARSET).toHaveLength(32);
    expect(CHARSET[0]).toBe('');
    expect(CHARSET.indexOf('ꦁ')).toBeLessThan(CHARSET.indexOf('ꦂ'));
  });
});

describe('dekodeGreedy', () => {
  it('menggabung karakter berulang dan membuang blank', () => {
    expect(dekodeGreedy(langkah(1, 1, 0, 2, 2), 4, charset).teks).toBe('ꦏꦶ');
  });

  it('memisahkan karakter sama yang dipisah blank', () => {
    expect(dekodeGreedy(langkah(1, 0, 1), 4, charset).teks).toBe('ꦏꦏ');
  });

  it('mengembalikan taling ke urutan logis', () => {
    expect(dekodeGreedy(langkah(3, 0, 1), 4, charset).teks).toBe('ꦏꦺ');
  });

  it('keyakinan = rata-rata softmax maks pada kolom bukan blank', () => {
    const p = Math.exp(5) / (Math.exp(5) + 3);
    expect(dekodeGreedy(langkah(1, 0, 2), 4, charset).keyakinan).toBeCloseTo(p);
    expect(dekodeGreedy(langkah(0, 0), 4, charset).keyakinan).toBe(0);
  });
});

describe('keInputBaris', () => {
  it('mengubah tinggi ke 64, lebar proporsional, tinta gelap -> 1', () => {
    const crop = buatGray(200, 32, 255);
    for (let x = 50; x < 150; x++) for (let y = 8; y < 24; y++) crop.d[y * 200 + x] = 0;
    const { data, lebar } = keInputBaris(crop);
    expect(lebar).toBe(400);
    expect(data).toHaveLength(64 * 400);
    expect(data[32 * 400 + 200]).toBeCloseTo(1); // tengah tinta
    expect(data[0]).toBeCloseTo(0); // latar
  });
});
