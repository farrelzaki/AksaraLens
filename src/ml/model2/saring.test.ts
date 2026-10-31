import { describe, expect, it } from 'vitest';
import type { Kotak } from './detektor';
import { MAKS_KOTAK, gabungBaris, iou, jumlahKonsonan, nilaiKualitas, nilaiStatus, pilihArea, pilihBaris, terapkanBukti, validitas, type Calon } from './saring';

const calon = (unicode: string, keyakinan: number, kotak: Kotak, status: Calon['status'] = 'TERIMA'): Calon => ({ unicode, keyakinan, kotak, status });

describe('gabungBaris', () => {
  it('menggabung pecahan sebaris dan memisahkan baris berbeda', () => {
    const h = gabungBaris([[100, 0, 150, 40], [0, 2, 60, 42], [0, 100, 90, 140]]);
    expect(h).toEqual([[0, 0, 150, 42], [0, 100, 90, 140]]);
  });

  it('tidak menggabung kolom yang berjauhan', () => {
    expect(gabungBaris([[0, 0, 50, 40], [500, 0, 550, 40]])).toHaveLength(2);
  });

  it('membuang kotak kecil dan membatasi jumlah kotak', () => {
    expect(gabungBaris([[0, 0, 50, 40], [0, 100, 50, 140], [0, 200, 50, 240], [300, 300, 305, 305]])).toHaveLength(3);
    const banyak = Array.from({ length: MAKS_KOTAK + 5 }, (_, i): Kotak => [0, i * 100, 50 + i, i * 100 + 40]);
    expect(gabungBaris(banyak)).toHaveLength(MAKS_KOTAK);
  });

  it('tidak menggabung baris bertumpuk yang bertumpang mendatar', () => {
    expect(gabungBaris([[0, 0, 300, 40], [0, 15, 300, 55]])).toHaveLength(2);
  });

  it('tidak mengubah kotak masukan dan menerima daftar kosong', () => {
    const k: Kotak = [0, 0, 50, 40];
    gabungBaris([k, [40, 0, 90, 40]]);
    expect(k).toEqual([0, 0, 50, 40]);
    expect(gabungBaris([])).toEqual([]);
  });
});

describe('validitas', () => {
  it('menerima tata aksara yang sah', () => {
    for (const t of ['ꦫꦠꦤ꧀ꦒꦗꦃꦩꦢ', 'ꦠꦺꦴꦏꦺꦴꦧꦸꦏꦸ', 'ꦏꦼꦭꦸꦫꦲꦤ꧀ꦧꦭꦸꦮꦂꦠꦶ꧉', 'ꦩꦸꦁ', 'ꦏꦤ꧀']) expect(validitas(t)).toBe(1);
  });

  it('menurunkan nilai untuk tanda yatim', () => {
    expect(validitas('꧀ꦤ')).toBeLessThan(1);
    expect(validitas('ꦴꦴꦴꦩ')).toBeLessThan(1);
    expect(validitas('ꦫ꧀꧀꧀ꦩ')).toBeLessThan(1);
    expect(validitas('')).toBe(0);
  });
});

describe('nilaiStatus', () => {
  it('foto utuh ketat, area lebih longgar', () => {
    expect(nilaiStatus('ꦫꦫ', 0.9, 'foto')).toBe('TOLAK');
    expect(nilaiStatus('ꦫꦫ', 0.9, 'area')).toBe('TERIMA');
    expect(nilaiStatus('ꦫꦠꦤ', 0.7, 'foto')).toBe('TOLAK');
    expect(nilaiStatus('ꦫꦠꦤ', 0.7, 'area')).toBe('RAGU');
  });

  it('memberi tiga tingkat pada foto utuh', () => {
    expect(nilaiStatus('ꦫꦠꦤ꧀ꦒꦗ', 0.9, 'foto')).toBe('TERIMA');
    expect(nilaiStatus('ꦫꦠꦤ꧀ꦒꦗ', 0.8, 'foto')).toBe('RAGU');
    expect(nilaiStatus('꧀ꦫꦠꦤ', 0.99, 'foto')).toBe('TOLAK');
  });

  it('menghitung konsonan', () => {
    expect(jumlahKonsonan('ꦠꦺꦴꦏꦺꦴ')).toBe(2);
  });
});

describe('pilihBaris', () => {
  it('kotak yang sama: menang yang tidak ditolak, lalu yang lebih yakin', () => {
    const h = pilihBaris([
      calon('ꦏꦏꦏ', 0.95, [0, 0, 100, 40], 'TOLAK'),
      calon('ꦫꦠꦤ', 0.8, [0, 0, 100, 40], 'RAGU'),
      calon('ꦩꦢꦤ', 0.9, [0, 100, 100, 140]),
    ]);
    expect(h.map((b) => b.unicode)).toEqual(['ꦫꦠꦤ', 'ꦩꦢꦤ']);
  });

  it('menghitung IoU', () => {
    expect(iou([0, 0, 10, 10], [20, 20, 30, 30])).toBe(0);
    expect(iou([0, 0, 10, 10], [0, 0, 10, 10])).toBe(1);
  });
});

describe('terapkanBukti', () => {
  const ragu = calon('ꦏꦤꦩ', 0.7, [0, 200, 100, 240], 'TOLAK');
  const sampah = calon('ꦴꦴꦴꦴ', 0.3, [0, 300, 100, 340], 'TOLAK');
  const sah = (y: number) => calon('ꦫꦠꦤ', 0.9, [0, y, 100, y + 40]);

  it('baris tertolak yang masih masuk akal menjadi RAGU bila buktinya cukup', () => {
    const h = terapkanBukti([sah(0), sah(100), ragu, sampah]);
    expect(h.map((b) => b.status)).toEqual(['TERIMA', 'TERIMA', 'RAGU', 'TOLAK']);
    expect(ragu.status).toBe('TOLAK');
  });

  it('satu baris saja belum cukup menjadi bukti', () => {
    expect(terapkanBukti([sah(0), ragu]).map((b) => b.status)).toEqual(['TERIMA', 'TOLAK']);
  });

  it('beberapa baris sah di antara banyak baris tertolak bukan bukti', () => {
    const h = terapkanBukti([sah(0), sah(100), ...Array.from({ length: 12 }, () => ragu)]);
    expect(h.filter((b) => b.status === 'RAGU')).toHaveLength(0);
  });
});

describe('pilihArea', () => {
  const pendek = calon('ꦪꦩ꧀', 0.8, [0, 0, 50, 40]);
  it('memakai satu baris bila lebih meyakinkan', () => {
    const utuh = calon('ꦲꦢꦼꦩ꧀ꦲꦪꦼꦩ꧀', 0.88, [0, 0, 100, 40]);
    expect(pilihArea([pendek], utuh)).toEqual([utuh]);
  });
  it('mengabaikan satu baris yang ditolak atau kurang meyakinkan', () => {
    expect(pilihArea([pendek], calon('ꦪꦪꦪ', 0.9, [0, 0, 1, 1], 'TOLAK'))).toEqual([pendek]);
    expect(pilihArea([calon('ꦫꦠꦤꦏꦩ', 0.9, [0, 0, 9, 9])], calon('ꦪꦪ', 0.7, [0, 0, 1, 1], 'RAGU'))).toHaveLength(1);
    expect(pilihArea([pendek], null)).toEqual([pendek]);
  });
});

describe('nilaiKualitas', () => {
  const papan = (f: (x: number, y: number) => number) => Float32Array.from({ length: 400 }, (_, i) => f(i % 20, Math.floor(i / 20)));
  it('mengenali gelap, silau, buram, dan baik', () => {
    expect(nilaiKualitas(papan(() => 10), 20, 20)).toBe('gelap');
    expect(nilaiKualitas(papan(() => 250), 20, 20)).toBe('silau');
    expect(nilaiKualitas(papan(() => 128), 20, 20)).toBe('buram');
    expect(nilaiKualitas(papan((x, y) => ((x + y) % 2 ? 40 : 220)), 20, 20)).toBe('baik');
  });
});
