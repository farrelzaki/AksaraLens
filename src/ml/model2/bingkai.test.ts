import { describe, expect, it } from 'vitest';
import { PENUH, SISI_MIN, bingkaiDariLayar, kePiksel, ubahBingkai } from './bingkai';

const dekat = (b: { x: number; y: number; w: number; h: number }) => [b.x, b.y, b.w, b.h].map((v) => +v.toFixed(6));

describe('ubahBingkai', () => {
  it('menggeser tanpa keluar dari foto', () => {
    const b = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 };
    expect(dekat(ubahBingkai(b, 'geser', 0.1, -0.05))).toEqual([0.3, 0.15, 0.5, 0.5]);
    expect(dekat(ubahBingkai(b, 'geser', 0.9, 0.9))).toEqual([0.5, 0.5, 0.5, 0.5]);
  });

  it('menarik sudut kiri-atas dan kanan-bawah', () => {
    expect(dekat(ubahBingkai(PENUH, 'kiri-atas', 0.1, 0.2))).toEqual([0.1, 0.2, 0.9, 0.8]);
    expect(dekat(ubahBingkai(PENUH, 'kanan-bawah', -0.3, -0.1))).toEqual([0, 0, 0.7, 0.9]);
  });

  it('tidak bisa diperkecil di bawah sisi minimal atau ditarik keluar foto', () => {
    const b = ubahBingkai(PENUH, 'kanan-atas', -2, 2);
    expect(b.w).toBeCloseTo(SISI_MIN);
    expect(b.h).toBeCloseTo(SISI_MIN);
    expect(dekat(ubahBingkai(PENUH, 'kiri-bawah', -1, 1))).toEqual([0, 0, 1, 1]);
  });
});

describe('kePiksel', () => {
  it('mengubah bingkai relatif ke kotak piksel', () => {
    expect(kePiksel({ x: 0.1, y: 0.25, w: 0.5, h: 0.5 }, 200, 100)).toEqual([20, 25, 120, 75]);
    expect(kePiksel(PENUH, 640, 480)).toEqual([0, 0, 640, 480]);
  });

  it('selalu minimal 1 piksel', () => {
    expect(kePiksel({ x: 1, y: 1, w: 0, h: 0 }, 10, 10)).toEqual([9, 9, 10, 10]);
  });
});

describe('bingkaiDariLayar', () => {
  it('memperhitungkan bagian video yang terpotong object-fit: cover', () => {
    // video 1000×1000 di elemen 500×1000: skala 1, 250 px terpotong di kiri dan kanan
    const b = bingkaiDariLayar({ w: 1000, h: 1000 }, { w: 500, h: 1000 }, { x: 50, y: 100, w: 400, h: 200 });
    expect(dekat(b)).toEqual([0.3, 0.1, 0.4, 0.2]);
  });

  it('bingkai selebar elemen pada video yang pas tidak berubah', () => {
    const b = bingkaiDariLayar({ w: 400, h: 800 }, { w: 400, h: 800 }, { x: 0, y: 0, w: 400, h: 800 });
    expect(dekat(b)).toEqual([0, 0, 1, 1]);
  });

  it('tidak keluar dari video', () => {
    const b = bingkaiDariLayar({ w: 100, h: 100 }, { w: 100, h: 100 }, { x: -10, y: -10, w: 200, h: 200 });
    expect(dekat(b)).toEqual([0, 0, 1, 1]);
  });
});
