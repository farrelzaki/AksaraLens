import { describe, expect, it } from 'vitest';
import { dapat, dekodeBeam, jarak, konteks, logSoftmax, pilihKoreksi, type ModelBahasa } from './bahasa';
import { CHARSET } from './ctc';
import modelAsli from './model_bahasa.json';
import fixture from './bahasa.fixture.json';

const model = modelAsli as unknown as ModelBahasa;

// Model mainan: setelah ꦏ hampir selalu ꦶ.
const mainan: ModelBahasa = { n: 2, seragam: Math.log(1 / 4), p: { 'ꦏ': -1, 'ꦶ': -1.5, 'ꦏꦶ': -0.05, 'ꦏꦺ': -4 }, b: { 'ꦏ': -2 } };
const cs = ['', 'ꦏ', 'ꦶ', 'ꦺ'];
const kolom = (...p: number[]) => p.map((v) => Math.log(v));

describe('model bahasa', () => {
  it('memakai n-gram terpanjang yang ada lalu mundur dengan bobotnya', () => {
    expect(dapat(mainan, 'ꦏ', 'ꦶ')).toBe(-0.05);
    expect(dapat(mainan, 'ꦏ', 'ꦏ')).toBe(-2 + -1); // tidak ada ꦏꦏ: bobot mundur ꦏ + unigram ꦏ
    expect(dapat(mainan, '', 'ꦴ')).toBeCloseTo(Math.log(1 / 4));
  });

  it('konteks diawali penanda awal baris', () => {
    expect(konteks(model, '')).toBe('^^');
    expect(konteks(model, 'ꦏꦶꦠ')).toBe('ꦶꦠ');
  });

  it('model asli kecil (≤ 500 KB) dan berorde 3', () => {
    expect(model.n).toBe(3);
    expect(JSON.stringify(modelAsli).length).toBeLessThan(500_000);
  });
});

describe('dekodeBeam', () => {
  it('model bahasa memenangkan sandhangan yang hampir seimbang', () => {
    // kolom 2: ꦶ 0,45 lawan ꦺ 0,55 -> greedy memilih ꦺ, model bahasa memilih ꦶ
    const lp = [...kolom(0.01, 0.97, 0.01, 0.01), ...kolom(0.01, 0.01, 0.45, 0.53)];
    expect(dekodeBeam(lp, 4, cs, mainan, { alfa: 0, beta: 0 })).toBe('ꦏꦺ');
    expect(dekodeBeam(lp, 4, cs, mainan, { alfa: 1, beta: 0 })).toBe('ꦏꦶ');
  });

  it('melipat ulangan dan memisahkan ulangan yang dibatasi blank', () => {
    const lp = [...kolom(0.01, 0.97, 0.01, 0.01), ...kolom(0.01, 0.97, 0.01, 0.01), ...kolom(0.97, 0.01, 0.01, 0.01), ...kolom(0.01, 0.97, 0.01, 0.01)];
    expect(dekodeBeam(lp, 4, cs, mainan, { alfa: 0, beta: 0 })).toBe('ꦏꦏ');
  });

  it('sama persis dengan scripts/model_bahasa.py (fixture paritas)', () => {
    expect(fixture.C).toBe(CHARSET.length);
    for (const k of fixture.kasus) expect(dekodeBeam(logSoftmax(k.logit, fixture.C), fixture.C, CHARSET, model)).toBe(k.teks);
  });
});

describe('pilihKoreksi', () => {
  it('menerima koreksi kecil yang tetap sah', () => {
    expect(pilihKoreksi('ꦕꦩꦫꦲꦭ꧀ꦧꦶꦂ', 'ꦕꦼꦩꦫꦲꦭ꧀ꦧꦶꦂ', 0.96)).toBe('ꦕꦼꦩꦫꦲꦭ꧀ꦧꦶꦂ');
  });

  it('menolak koreksi yang terlalu jauh dari bacaan', () => {
    expect(pilihKoreksi('ꦏꦭꦸꦫ', 'ꦱꦸꦒꦼꦁꦫꦮꦸꦃ', 0.96)).toBeNull();
    expect(pilihKoreksi('ꦏꦭꦸꦫ', 'ꦏꦭꦸꦫ', 0.96)).toBeNull();
  });

  it('jarak menghitung titik kode', () => {
    expect(jarak('ꦏꦶ', 'ꦏꦺ')).toBe(1);
    expect(jarak('', 'ꦏꦶ')).toBe(2);
  });
});
