import { describe, expect, it } from 'vitest';
import { buatGray } from '../model2/gambar';
import { dilasiElips5, grayDariKanvas, praproses, skeleton, statusKanvas } from './praproses';

const kanvas = (w: number, h: number, gambar: (x: number, y: number) => boolean) => {
  const g = buatGray(w, h, 255);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (gambar(x, y)) g.d[y * w + x] = 0;
  return g;
};

describe('grayDariKanvas', () => {
  it('menempel piksel transparan di latar putih', () => {
    const g = grayDariKanvas([0, 0, 0, 0, 0, 0, 0, 255], 2, 1);
    expect(Array.from(g.d)).toEqual([255, 0]);
  });
});

describe('skeleton', () => {
  it('menipiskan garis tebal menjadi 1 piksel', () => {
    const w = 30;
    const m = new Uint8Array(w * w);
    for (let y = 10; y < 17; y++) for (let x = 3; x < 27; x++) m[y * w + x] = 1;
    const s = skeleton(m, w, w);
    for (let x = 6; x < 24; x++) {
      let kolom = 0;
      for (let y = 0; y < w; y++) kolom += s[y * w + x];
      expect(kolom).toBe(1);
    }
  });

  it('tidak mengubah garis yang sudah setebal 1 piksel', () => {
    const m = new Uint8Array(25);
    for (let x = 0; x < 5; x++) m[2 * 5 + x] = 1;
    expect(Array.from(skeleton(m, 5, 5))).toEqual(Array.from(m));
  });
});

describe('dilasiElips5', () => {
  it('menebalkan satu piksel menjadi elips 5×5 cv2 (17 piksel)', () => {
    const m = new Uint8Array(81);
    m[4 * 9 + 4] = 1;
    expect(dilasiElips5(m, 9, 9).reduce((a, b) => a + b, 0)).toBe(17);
  });
});

describe('praproses', () => {
  it('kanvas kosong -> null', () => {
    expect(praproses(buatGray(100, 100, 255))).toBeNull();
  });

  it('menghasilkan 64×64 bernilai 0..1 dengan tinta di tengah', () => {
    const x = praproses(kanvas(200, 200, (x, y) => Math.abs(x - y) < 6 && x > 40 && x < 160))!;
    expect(x).toHaveLength(64 * 64);
    expect(Math.max(...x)).toBeLessThanOrEqual(1);
    expect(x[32 * 64 + 32]).toBeGreaterThan(0);
    expect(x[0]).toBe(0);
  });
});

describe('statusKanvas', () => {
  it('membedakan kosong, terlalu kecil, dan siap', () => {
    expect(statusKanvas(buatGray(300, 300, 255))).toBe('kosong');
    expect(statusKanvas(kanvas(300, 300, (x, y) => x > 140 && x < 160 && y > 145 && y < 150))).toBe('terlalu_kecil');
    expect(statusKanvas(kanvas(300, 300, (x, y) => x > 60 && x < 240 && y > 145 && y < 155))).toBe('siap');
  });
});
