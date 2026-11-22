import { describe, expect, it } from 'vitest';
import { CHARSET, dekodeGreedy, keInputBaris, petaAlternatif } from './ctc';
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

describe('petaAlternatif', () => {
  const cs = ['', 'ꦏ', 'ꦶ', 'ꦺ', 'ꦒ', 'ꦸ'];
  // satu kolom: logit tiap kelas (peluang ~ exp)
  const kolom = (...nilai: number[]) => nilai;

  it('teks sama dengan dekodeGreedy, termasuk taling yang dipindah', () => {
    const l = [kolom(0, 0, 0, 5, 0, 0), kolom(5, 0, 0, 0, 0, 0), kolom(0, 5, 0, 0, 0, 0)].flat();
    expect(petaAlternatif(l, 6, cs).teks).toBe(dekodeGreedy(l, 6, cs).teks);
    expect(petaAlternatif(l, 6, cs).teks).toBe('ꦏꦺ');
  });

  it('menawarkan huruf lain di kolom puncak dan sandhangan samar di celah blank', () => {
    // ka (ga cukup mungkin), lalu blank dengan suku samar
    const l = [kolom(0, 5, 0, 0, 3, 0), kolom(5, 0, 0, 0, 0, 2.5)].flat();
    const { teks, alternatif } = petaAlternatif(l, 6, cs);
    expect(teks).toBe('ꦏ');
    expect(alternatif[0].ganti[0][0]).toBe('ꦒ');
    expect(alternatif[0].sisip[0][0]).toBe('ꦸ');
  });

  it('alternatif ikut berpindah ke urutan logis', () => {
    const l = [kolom(0, 0, 0, 5, 0, 0), kolom(0, 5, 0, 0, 3, 0)].flat();
    const { alternatif } = petaAlternatif(l, 6, cs);
    expect(alternatif[0].ganti[0][0]).toBe('ꦒ'); // ka di depan setelah taling dipindah
  });
});
