import { describe, expect, it } from 'vitest';
import { buatGray } from './gambar';
import { LEBAR_KL, TINGGI_KL, lolosJawa, masukanKlasifikator } from './klasifikator';

describe('masukanKlasifikator', () => {
  it('ukuran tetap 32 x 160 dan bernilai 0..1', () => {
    const g = buatGray(300, 60);
    for (let i = 0; i < g.d.length; i++) g.d[i] = (i % 300) % 40 < 20 ? 30 : 220;
    const x = masukanKlasifikator(g);
    expect(x.length).toBe(TINGGI_KL * LEBAR_KL);
    expect(Math.min(...x)).toBe(0);
    expect(Math.max(...x)).toBe(1);
  });
  it('gambar rata menjadi nol semua', () => {
    expect(Math.max(...masukanKlasifikator(buatGray(100, 40, 128)))).toBe(0);
  });
});

describe('lolosJawa', () => {
  it('ambang 0,5 berarti logit di atas nol', () => {
    expect(lolosJawa(0.1)).toBe(true);
    expect(lolosJawa(-0.1)).toBe(false);
  });
});
