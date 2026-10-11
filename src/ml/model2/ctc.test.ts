import { describe, expect, it } from 'vitest';
import { dekodeGreedy } from './ctc';

const charset = ['', 'ꦏ', 'ꦶ'];
const langkah = (...kelas: number[]) =>
  kelas.flatMap((k) => charset.map((_, c) => (c === k ? 0.9 : 0.05)));

describe('dekodeGreedy', () => {
  it('menggabung karakter berulang dan membuang blank', () => {
    expect(dekodeGreedy(langkah(1, 1, 0, 2, 2), 3, charset).teks).toBe('ꦏꦶ');
  });

  it('memisahkan karakter sama yang dipisah blank', () => {
    expect(dekodeGreedy(langkah(1, 0, 1), 3, charset).teks).toBe('ꦏꦏ');
  });

  it('menghitung rata-rata keyakinan', () => {
    expect(dekodeGreedy(langkah(1, 2), 3, charset).keyakinan).toBeCloseTo(0.9);
  });
});
