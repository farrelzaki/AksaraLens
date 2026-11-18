import { describe, expect, it } from 'vitest';
import { statusTahap } from '../../progres/tahap';
import { detailAksara, detailPelajaran, kodeDariKunciStat, nilaiPenguasaan, ringkasAksara } from './dataProgres';

const stat = (letter: string, correct: number, wrong: number) => ({ letter, correct, wrong, updated_at: '2026-11-18T00:00:00.000Z' });

describe('penguasaan', () => {
  it('tingkat dari benar/salah', () => {
    expect(nilaiPenguasaan(0, 0)).toBe('belum-dicoba');
    expect(nilaiPenguasaan(1, 3)).toBe('perlu-latihan');
    expect(nilaiPenguasaan(2, 0)).toBe('berkembang');
    expect(nilaiPenguasaan(4, 1)).toBe('dikuasai');
    expect(nilaiPenguasaan(3, 2)).toBe('berkembang');
  });
});

describe('atribusi kunci statistik', () => {
  it('Bab 1 memakai kode huruf langsung', () => {
    expect(kodeDariKunciStat('ka')).toEqual(['ka']);
    expect(kodeDariKunciStat('tulis:ka')).toEqual(['ka']);
  });
  it('suku kata Bab 2–3 diatribusikan ke tandanya', () => {
    expect(kodeDariKunciStat('ki')).toEqual(['wulu']);
    expect(kodeDariKunciStat('kar')).toEqual(['layar']);
    expect(kodeDariKunciStat('t')).toEqual(['pangkon']);
  });
  it('kunci tak dikenal tidak dihitung', () => {
    expect(kodeDariKunciStat('xyz')).toEqual([]);
  });
});

describe('detail dari data nyata', () => {
  const status = statusTahap(new Set(['b1-kenali', 'b1-cocokkan']));

  it('pelajaran per bab mengikuti status tahap', () => {
    const bab = detailPelajaran(status);
    expect(bab[0].selesai).toBe(2);
    expect(bab[0].tahap[2].status).toBe('terbuka');
    expect(bab[1].tahap[0].status).toBe('terbuka');
    expect(bab[1].tahap[1].status).toBe('terkunci');
  });

  it('status belajar terpisah dari penguasaan', () => {
    const k = detailAksara(status, [stat('ka', 4, 0), stat('ki', 0, 2)]);
    const ka = k[0].aksara.find((a) => a.huruf.kode === 'ka')!;
    const ha = k[0].aksara.find((a) => a.huruf.kode === 'ha')!;
    const wulu = k[1].aksara.find((a) => a.huruf.kode === 'wulu')!;
    expect(ka).toMatchObject({ statusBelajar: 'sudah', penguasaan: 'dikuasai' });
    expect(ha).toMatchObject({ statusBelajar: 'sudah', penguasaan: 'belum-dicoba' });
    // Pernah dijawab tapi bab 2 belum dikenalkan: belum dipelajari, penguasaan tetap tercatat
    expect(wulu).toMatchObject({ statusBelajar: 'belum', penguasaan: 'perlu-latihan', salah: 2 });
    expect(ringkasAksara(k)).toEqual({ total: 29, dipelajari: 20, dikuasai: 1, perluLatihan: 1 });
  });

  it('tanpa progres semuanya nol (tidak ada data contoh)', () => {
    const r = ringkasAksara(detailAksara(statusTahap(new Set()), []));
    expect(r).toEqual({ total: 29, dipelajari: 0, dikuasai: 0, perluLatihan: 0 });
  });
});
