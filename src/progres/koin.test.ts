import { describe, expect, it } from 'vitest';
import { TOKO } from '../content';
import {
  beliAvatar,
  beriHadiah,
  DOMPET_AWAL,
  gabungDompet,
  hadiahJawaban,
  hadiahTitik,
  kunciSoal,
  punyaAvatar,
  type Dompet,
} from './koin';

const dompet = (koin: number, avatar: number[] = [], hadiah: string[] = [], updated_at = ''): Dompet => ({
  koin, avatar, hadiah, updated_at,
});

describe('hadiahJawaban', () => {
  it('memberi koin untuk jawaban benar pertama pada satu soal', () => {
    const k = kunciSoal('b1-kenali', 0);
    const h = hadiahJawaban(DOMPET_AWAL, k, true);
    expect(h.diberi).toBe(TOKO.hadiah.soal);
    expect(h.dompet.koin).toBe(TOKO.hadiah.soal);
    expect(h.dompet.hadiah).toContain(k);
  });

  it('tidak memberi koin untuk jawaban salah dan tidak mengubah dompet', () => {
    const h = hadiahJawaban(DOMPET_AWAL, kunciSoal('b1-kenali', 0), false);
    expect(h.diberi).toBe(0);
    expect(h.dompet).toBe(DOMPET_AWAL);
  });

  it('tidak memberi koin lagi bila soal yang sama dijawab benar ulang', () => {
    const k = kunciSoal('b1-kenali', 0);
    const pertama = hadiahJawaban(DOMPET_AWAL, k, true).dompet;
    const kedua = hadiahJawaban(pertama, k, true);
    expect(kedua.diberi).toBe(0);
    expect(kedua.dompet.koin).toBe(TOKO.hadiah.soal);
  });

  it('soal berbeda memberi koin masing-masing', () => {
    const a = hadiahJawaban(DOMPET_AWAL, kunciSoal('b1-kenali', 0), true).dompet;
    const b = hadiahJawaban(a, kunciSoal('b1-kenali', 1), true).dompet;
    expect(b.koin).toBe(TOKO.hadiah.soal * 2);
  });
});

describe('hadiahTitik', () => {
  it('memberi koin saat tahap selesai pertama kali', () => {
    const h = hadiahTitik(DOMPET_AWAL, 'b1-kenali');
    expect(h.diberi).toBe(TOKO.hadiah.titik);
  });

  it('tidak memberi koin saat tahap diulang', () => {
    const pertama = hadiahTitik(DOMPET_AWAL, 'b1-kenali').dompet;
    expect(hadiahTitik(pertama, 'b1-kenali').diberi).toBe(0);
  });

  it('mengabaikan id jalur lama agar koin tidak dobel', () => {
    expect(hadiahTitik(DOMPET_AWAL, 'b1-p1').diberi).toBe(0);
    expect(hadiahTitik(DOMPET_AWAL, 'b1-tulis1').diberi).toBe(0);
  });
});

describe('beriHadiah', () => {
  it('menolak jumlah nol atau negatif', () => {
    expect(beriHadiah(DOMPET_AWAL, 'x', 0).diberi).toBe(0);
    expect(beriHadiah(DOMPET_AWAL, 'x', -5).dompet.koin).toBe(0);
  });

  it('tidak mengubah dompet asli', () => {
    const awal = dompet(10);
    beriHadiah(awal, 'x', 5);
    expect(awal).toEqual(dompet(10));
  });
});

describe('beliAvatar', () => {
  const gratis = TOKO.avatar.find((a) => a.harga === 0)!.id;
  const berbayar = TOKO.avatar.find((a) => a.harga > 0)!;

  it('karakter gratis dimiliki sejak awal', () => {
    expect(punyaAvatar(DOMPET_AWAL, gratis)).toBe(true);
    expect(punyaAvatar(DOMPET_AWAL, berbayar.id)).toBe(false);
  });

  it('membeli mengurangi koin dan menambah karakter', () => {
    const h = beliAvatar(dompet(berbayar.harga + 30), berbayar.id);
    expect(h.ok).toBe(true);
    if (h.ok) {
      expect(h.dompet.koin).toBe(30);
      expect(punyaAvatar(h.dompet, berbayar.id)).toBe(true);
    }
  });

  it('boleh membeli dengan koin pas dan saldo menjadi 0', () => {
    const h = beliAvatar(dompet(berbayar.harga), berbayar.id);
    expect(h.ok && h.dompet.koin).toBe(0);
  });

  it('menolak bila koin kurang dan saldo tidak negatif', () => {
    const awal = dompet(berbayar.harga - 1);
    expect(beliAvatar(awal, berbayar.id)).toEqual({ ok: false, alasan: 'koin_kurang' });
    expect(awal.koin).toBe(berbayar.harga - 1);
  });

  it('menolak membeli karakter yang sudah dimiliki (gratis maupun dibeli)', () => {
    expect(beliAvatar(dompet(999), gratis)).toEqual({ ok: false, alasan: 'sudah_dimiliki' });
    expect(beliAvatar(dompet(999, [berbayar.id]), berbayar.id)).toEqual({ ok: false, alasan: 'sudah_dimiliki' });
  });

  it('menolak id yang tidak ada di toko', () => {
    expect(beliAvatar(dompet(999), 999)).toEqual({ ok: false, alasan: 'tidak_ada' });
  });
});

describe('gabungDompet', () => {
  it('menjumlah koin dan menggabungkan karakter serta kunci hadiah tanpa duplikat', () => {
    const g = gabungDompet(
      dompet(30, [2], ['titik:b1-kenali'], '2026-11-01'),
      dompet(15, [2, 3], ['titik:b1-kenali', 'soal:b1-kenali:0'], '2026-11-10'),
    );
    expect(g.koin).toBe(45);
    expect(g.avatar.sort()).toEqual([2, 3]);
    expect(g.hadiah.sort()).toEqual(['soal:b1-kenali:0', 'titik:b1-kenali']);
    expect(g.updated_at).toBe('2026-11-10');
  });

  it('dompet tamu kosong tidak mengubah dompet akun', () => {
    const akun = dompet(40, [4], ['x'], '2026-11-05');
    expect(gabungDompet(akun, DOMPET_AWAL)).toEqual(akun);
  });
});

describe('TOKO (data statis)', () => {
  it('semua harga >= 0, id unik, dan ada karakter gratis', () => {
    const id = TOKO.avatar.map((a) => a.id);
    expect(new Set(id).size).toBe(id.length);
    expect(TOKO.avatar.every((a) => a.harga >= 0)).toBe(true);
    expect(TOKO.avatar.some((a) => a.harga === 0)).toBe(true);
    expect(TOKO.hadiah.soal).toBeGreaterThan(0);
    expect(TOKO.hadiah.titik).toBeGreaterThan(0);
  });
});
