import { describe, expect, it } from 'vitest';
import { JALUR } from '../content';
import {
  catatJawaban,
  gabungProgres,
  hurufSeringSalah,
  kunciStat,
  pisahKunciStat,
  statusJalur,
  tandaiDikuasai,
  type StatHuruf,
} from './model';

const stat = (letter: string, correct: number, wrong: number, updated_at = '2026-10-01'): StatHuruf => ({
  letter, correct, wrong, updated_at,
});

describe('statusJalur', () => {
  it('membuka hanya titik pertama untuk pengguna baru', () => {
    const s = statusJalur(JALUR, new Set());
    expect(s.get('b1-p1')).toBe('terbuka');
    expect(s.get('b1-tulis1')).toBe('terkunci');
  });

  it('membuka titik berikutnya setelah titik sebelumnya selesai', () => {
    const s = statusJalur(JALUR, new Set(['b1-p1']));
    expect(s.get('b1-p1')).toBe('selesai');
    expect(s.get('b1-tulis1')).toBe('terbuka');
    expect(s.get('b1-p2')).toBe('terkunci');
  });
});

describe('hurufSeringSalah', () => {
  it('mengabaikan huruf dengan kurang dari 3 percobaan dan mengurutkan menurut rasio salah', () => {
    const hasil = hurufSeringSalah([stat('ha', 1, 1), stat('la', 1, 2), stat('ka', 3, 1), stat('na', 3, 0)]);
    expect(hasil.map((s) => s.letter)).toEqual(['la', 'ka']);
  });
});

describe('salah ditebak vs salah digambar', () => {
  it('kunci tulis memakai awalan dan bisa dipisah lagi', () => {
    expect(kunciStat('ka', 'tulis')).toBe('tulis:ka');
    expect(kunciStat('ka')).toBe('ka');
    expect(pisahKunciStat('tulis:ka')).toEqual({ jenis: 'tulis', letter: 'ka' });
    expect(pisahKunciStat('ki')).toEqual({ jenis: 'tebak', letter: 'ki' });
  });

  it('daftar tebak dan tulis terpisah, letter tanpa awalan', () => {
    const stats = [stat('ka', 1, 2), stat('tulis:ka', 3, 1), stat('tulis:ra', 0, 3)];
    expect(hurufSeringSalah(stats).map((s) => s.letter)).toEqual(['ka']);
    expect(hurufSeringSalah(stats, 5, 'tulis').map((s) => s.letter)).toEqual(['ra', 'ka']);
  });

  it('tandaiDikuasai mengosongkan salah hanya untuk jenis itu', () => {
    const stats = [stat('ka', 1, 2), stat('tulis:ka', 0, 3)];
    const hasil = tandaiDikuasai(stats, 'ka', 'tulis');
    expect(hasil.find((s) => s.letter === 'tulis:ka')).toMatchObject({ correct: 0, wrong: 0 });
    expect(hasil.find((s) => s.letter === 'ka')).toMatchObject({ correct: 1, wrong: 2 });
    expect(hurufSeringSalah(hasil, 5, 'tulis')).toEqual([]);
    expect(stats[1].wrong).toBe(3);
  });
});

describe('catatJawaban', () => {
  it('menambah benar/salah tanpa mengubah array asal', () => {
    const awal = [stat('ka', 1, 0)];
    const hasil = catatJawaban(awal, 'ka', false);
    expect(hasil.find((s) => s.letter === 'ka')).toMatchObject({ correct: 1, wrong: 1 });
    expect(awal[0].wrong).toBe(0);
  });
});

describe('gabungProgres', () => {
  it('menggabung titik selesai dan menjumlahkan statistik', () => {
    const hasil = gabungProgres(
      { progres: [{ lesson_id: 'b1-p1', status: 'completed', completed_at: '2026-10-02' }], stats: [stat('ka', 2, 1)] },
      {
        progres: [
          { lesson_id: 'b1-p1', status: 'completed', completed_at: '2026-10-01' },
          { lesson_id: 'b1-tulis1', status: 'completed', completed_at: '2026-10-03' },
        ],
        stats: [stat('ka', 1, 1), stat('ha', 0, 2)],
      },
    );
    expect(hasil.progres.map((p) => p.lesson_id).sort()).toEqual(['b1-p1', 'b1-tulis1']);
    expect(hasil.progres.find((p) => p.lesson_id === 'b1-p1')?.completed_at).toBe('2026-10-01');
    expect(hasil.stats.find((s) => s.letter === 'ka')).toMatchObject({ correct: 3, wrong: 2 });
    expect(hasil.stats.find((s) => s.letter === 'ha')).toMatchObject({ correct: 0, wrong: 2 });
  });
});
