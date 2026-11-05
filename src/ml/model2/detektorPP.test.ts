import { describe, expect, it } from 'vitest';
import { buatGray } from './gambar';
import { SISI_ESKALASI, kotakDariPeta, masukanPP } from './detektorPP';

describe('masukanPP', () => {
  it('sisi terpanjang 640, kelipatan 32, 3 kanal ternormalisasi ImageNet', () => {
    const m = masukanPP(buatGray(2000, 1000, 255));
    expect([m.W, m.H]).toEqual([640, 320]);
    expect(m.data.length).toBe(3 * 640 * 320);
    expect(m.data[0]).toBeCloseTo((1 - 0.485) / 0.229, 4);
    expect(m.data[640 * 320]).toBeCloseTo((1 - 0.456) / 0.224, 4);
    expect(m.fx).toBeCloseTo(2000 / 640, 6);
  });
  it('gambar sangat sempit tetap minimal 32', () => {
    const m = masukanPP(buatGray(2000, 5, 0));
    expect(m.H).toBe(32);
  });
});

describe('kotakDariPeta', () => {
  const peta = (isi: (x: number, y: number) => number, w = 40, h = 20) =>
    Float32Array.from({ length: w * h }, (_, i) => isi(i % w, Math.floor(i / w)));
  it('satu komponen jadi satu kotak dengan pelebaran, dalam koordinat asli', () => {
    const p = peta((x, y) => (x >= 10 && x < 30 && y >= 5 && y < 11 ? 0.9 : 0));
    const [k] = kotakDariPeta(p, 20, 40, 2, 2, 80, 40);
    const d = (1.5 * 120) / (2 * (20 + 6));
    expect(k[0]).toBeCloseTo((10 - d) * 2, 4);
    expect(k[3]).toBeCloseTo((11 + d) * 2, 4);
  });
  it('membuang yang terlalu kecil atau skornya rendah', () => {
    const kecil = peta((x, y) => (x < 2 && y < 2 ? 0.9 : 0));
    expect(kotakDariPeta(kecil, 20, 40, 1, 1, 40, 20)).toHaveLength(0);
    const lemah = peta((x, y) => (x >= 5 && x < 20 && y >= 5 && y < 10 ? (x === 5 ? 0.9 : 0.31) : 0));
    expect(kotakDariPeta(lemah, 20, 40, 1, 1, 40, 20)).toHaveLength(0);
  });
  it('diagonal tidak menyambung (4-tetangga) dan urut atas ke bawah', () => {
    const p = peta((x, y) => ((x >= 20 && x < 30 && y >= 12 && y < 17) || (x >= 5 && x < 15 && y >= 2 && y < 7) ? 0.9 : 0));
    const k = kotakDariPeta(p, 20, 40, 1, 1, 40, 20);
    expect(k).toHaveLength(2);
    expect(k[0][1]).toBeLessThan(k[1][1]);
  });
});

describe('masukanPP dengan sisi berbeda', () => {
  it('960 px memberi masukan 1,5 kali lebih besar dari 640 px', () => {
    const g = buatGray(1280, 640, 255);
    const a = masukanPP(g);
    const b = masukanPP(g, SISI_ESKALASI);
    expect([a.W, a.H]).toEqual([640, 320]);
    expect([b.W, b.H]).toEqual([960, 480]);
  });
});
