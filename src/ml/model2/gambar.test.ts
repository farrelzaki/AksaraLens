import { describe, expect, it } from 'vitest';
import { bulat, buatGray, cariSudut, komponenTerhubung, normalisasiPolaritas, otsu, persentil, putar, resize } from './gambar';
import { kotakDariLogit, potongBaris } from './detektor';

describe('bulat', () => {
  it('setengah ke genap seperti Python/cvRound', () => {
    expect([0.5, 1.5, 2.5, -0.5, 2.4, 2.6].map(bulat)).toEqual([0, 2, 2, -0, 2, 3]);
  });
});

describe('resize', () => {
  it('rata-rata luas saat mengecil 2×', () => {
    const g = buatGray(4, 2);
    g.d.set([0, 100, 200, 200, 0, 100, 200, 200]);
    expect(Array.from(resize(g, 2, 1).d)).toEqual([50, 200]);
  });

  it('menangani skala pecahan tanpa mengubah warna rata', () => {
    expect(Array.from(resize(buatGray(10, 7, 80), 3, 2).d)).toEqual([80, 80, 80, 80, 80, 80]);
    expect(Array.from(resize(buatGray(2, 2, 30), 5, 5).d).every((v) => v === 30)).toBe(true);
  });
});

describe('otsu & polaritas', () => {
  it('memisahkan dua kelompok nilai', () => {
    const g = buatGray(10, 1);
    g.d.set([10, 12, 11, 10, 200, 210, 205, 200, 199, 201]);
    const t = otsu(g);
    expect(t).toBeGreaterThanOrEqual(12);
    expect(t).toBeLessThan(199);
  });

  it('membalik gambar yang mayoritas gelap', () => {
    const g = buatGray(20, 20, 20);
    g.d[0] = 240;
    expect(normalisasiPolaritas(g).d[5]).toBe(235);
    expect(normalisasiPolaritas(buatGray(20, 20, 230)).d[5]).toBe(230);
  });
});

describe('putar & cariSudut', () => {
  it('rotasi 0° tidak mengubah gambar', () => {
    const g = buatGray(5, 4);
    g.d.forEach((_, i) => (g.d[i] = i * 10));
    expect(Array.from(putar(g, 0, 255).d)).toEqual(Array.from(g.d));
  });

  it('menemukan kemiringan garis teks', () => {
    const m = buatGray(200, 200);
    for (const base of [60, 100, 140])
      for (let x = 20; x < 180; x++)
        for (let t = 0; t < 4; t++) {
          const y = Math.round(base + (x - 100) * Math.tan((5 * Math.PI) / 180)) + t;
          m.d[y * 200 + x] = 255;
        }
    expect(Math.abs(cariSudut(m) - 5)).toBeLessThanOrEqual(0.5);
  });
});

describe('persentil', () => {
  it('sama dengan np.percentile linear', () => {
    expect(persentil([1, 2, 3, 4], 50)).toBe(2.5);
    expect(persentil([0, 10], 2)).toBeCloseTo(0.2);
  });
});

describe('komponenTerhubung', () => {
  it('menghitung komponen 8-tetangga dengan kotak dan luas', () => {
    const a = new Uint8Array([1, 0, 0, 0, 1, 0, 1, 0, 1, 1]); // (0,0)-(1,1) bersambung diagonal
    expect(komponenTerhubung(a, 5, 2)).toEqual([
      { x0: 0, y0: 0, w: 2, h: 2, luas: 2 },
      { x0: 3, y0: 0, w: 2, h: 2, luas: 3 },
    ]);
  });
});

describe('detektor', () => {
  it('mengubah inti baris menjadi kotak penuh dan membuang komponen kecil', () => {
    const w4 = 20;
    const h4 = 12;
    const logit = new Float32Array(w4 * h4).fill(-5);
    for (let y = 2; y < 4; y++) for (let x = 2; x < 18; x++) logit[y * w4 + x] = 5; // baris 1
    for (let y = 8; y < 10; y++) for (let x = 4; x < 16; x++) logit[y * w4 + x] = 5; // baris 2
    logit[11 * w4 + 0] = 5; // derau
    const kotak = kotakDariLogit(logit, h4, w4, 0.5);
    // inti y 2..4 (×4 = 8..16, pusat 12, tinggi 8/0,5 = 16) lalu ÷ skala 0,5
    expect(kotak).toEqual([
      [16, 8, 144, 40],
      [32, 56, 128, 88],
    ]);
  });

  it('memotong baris dengan margin dan membuang potongan < 8 px', () => {
    const g = buatGray(100, 50, 255);
    const hasil = potongBaris(g, [
      [20, 10, 80, 30],
      [0, 0, 5, 3],
    ]);
    expect(hasil).toHaveLength(1);
    expect([hasil[0].w, hasil[0].h]).toEqual([72, 22]);
  });
});
