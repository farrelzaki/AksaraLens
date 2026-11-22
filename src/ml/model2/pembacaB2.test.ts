import { describe, expect, it } from 'vitest';
import { buatGray, type Gray } from './gambar';
import { dekodeGreedy } from './ctc';
import { keInputB2, keLogPeluang } from './pembacaB2';
import fixture from './pembacaB2.fixture.json';

const keGray = (k: { w: number; h: number; crop: number[] }): Gray => ({ w: k.w, h: k.h, d: Float32Array.from(k.crop) });

describe('keInputB2', () => {
  // Kasus 0: potongan baris NusaAksara (mengecil) -> identik piksel demi piksel.
  // Kasus 1: derau acak yang diperbesar -> keInputBaris (v2, cabang linear INTER_AREA) sudah berbeda ±1-2 level dari cv2
  // pada masukan seperti ini; selisih itu warisan v2, bukan dari jalur B2.
  it('sama dengan bangku uji Python (ruj.ke_input -> adaptor PEMBACA -> b2_paddle.ke_masukan)', () => {
    fixture.kasus.forEach((k, j) => {
      const { data, lebar } = keInputB2(keGray(k));
      expect(lebar).toBe(k.lebar);
      const n = lebar * 48;
      expect(data).toHaveLength(3 * n);
      let beda = 0;
      for (let i = 0; i < n; i++) {
        const u = Math.round((data[i] * 0.5 + 0.5) * 255);
        expect(Math.abs(u - k.u[i])).toBeLessThanOrEqual(j === 0 ? 0 : 2);
        if (u !== k.u[i]) beda++;
        expect(data[n + i]).toBe(data[i]);
        expect(data[2 * n + i]).toBe(data[i]);
      }
      if (j > 0) expect(beda / n).toBeLessThan(0.05);
    });
  });

  it('tinggi 48, lebar kelipatan 8, tinta tetap gelap', () => {
    const crop = buatGray(200, 32, 255);
    for (let x = 50; x < 150; x++) for (let y = 8; y < 24; y++) crop.d[y * 200 + x] = 0;
    const { data, lebar } = keInputB2(crop);
    expect(lebar).toBe(304); // 64*200/32 = 400 -> 48*400/64/8 = 37.5 -> 38 (pembulatan genap) * 8
    expect(lebar % 8).toBe(0);
    expect(data[24 * lebar + 152]).toBeCloseTo(-1); // tengah tinta: hitam
    expect(data[0]).toBeCloseTo(1); // latar: putih
  });
});

describe('keLogPeluang', () => {
  it('dekode greedy atas log-peluang sama dengan atas peluang aslinya', () => {
    const p = [0.1, 0.8, 0.1, 0.7, 0.2, 0.1, 0.1, 0.8, 0.1];
    const r = dekodeGreedy(keLogPeluang(p), 3, ['', 'a', 'b']);
    expect(r.teks).toBe('aa');
    expect(r.keyakinan).toBeCloseTo(0.8);
  });
});
