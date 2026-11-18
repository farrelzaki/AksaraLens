import { describe, expect, it } from 'vitest';
import { pilihPembuka, pilihPenutup, waktuDariJam } from './selingan';

const pembuka = { jenis: 'cocokkan' as const, nomor: 2, sudahPernah: false, totalSelesaiSemua: 3, jam: 9, acak: 0 };
const penutup = { jenis: 'cocokkan' as const, nomor: 2, total: 6, salah: 0, komboMaks: 6, detik: 120, sudahPernah: false, acak: 0 };

describe('selingan pembuka', () => {
  it('waktu dari jam', () => {
    expect([5, 12, 16, 21, 2].map(waktuDariJam)).toEqual(['pagi', 'siang', 'sore', 'malam', 'malam']);
  });
  it('pengguna baru disambut', () => {
    expect(pilihPembuka({ ...pembuka, totalSelesaiSemua: 0 }).varian).toBe('sambut-pertama');
  });
  it('mengulang mengalahkan huruf lemah', () => {
    expect(pilihPembuka({ ...pembuka, sudahPernah: true, hurufLemah: 'ka' }).varian).toBe('ulang');
  });
  it('huruf lemah diperkuat kecuali tahap kenali', () => {
    const a = pilihPembuka({ ...pembuka, hurufLemah: 'ka' });
    expect(a.varian).toBe('perkuat');
    expect(a.judul).toContain('ka');
    expect(pilihPembuka({ ...pembuka, jenis: 'kenali', nomor: 1, hurufLemah: 'ka' }).varian).toBe('mulai-bab');
  });
  it('kuis = tantangan akhir; aktivitas maskot mengikuti jenis tahap', () => {
    const a = pilihPembuka({ ...pembuka, jenis: 'kuis', nomor: 5 });
    expect(a.varian).toBe('tantangan-akhir');
    expect(a.aktivitas).toBe('kuis');
  });
});

describe('selingan penutup', () => {
  it('bintang mengikuti jumlah salah', () => {
    expect(pilihPenutup(penutup).bintang).toBe(3);
    expect(pilihPenutup({ ...penutup, salah: 2 }).bintang).toBe(2);
    expect(pilihPenutup({ ...penutup, salah: 5 }).bintang).toBe(1);
  });
  it('varian sesuai kondisi', () => {
    expect(pilihPenutup(penutup).varian).toBe('sempurna');
    expect(pilihPenutup({ ...penutup, detik: 30 }).varian).toBe('kilat');
    expect(pilihPenutup({ ...penutup, salah: 1 }).varian).toBe('hebat');
    expect(pilihPenutup({ ...penutup, salah: 5 }).varian).toBe('bangkit');
    expect(pilihPenutup({ ...penutup, nomor: 5, salah: 5 }).varian).toBe('tamat-bab');
  });
  it('lencana kombo hanya bila kombo >= 3', () => {
    expect(pilihPenutup(penutup).lencana).toContain('6');
    expect(pilihPenutup({ ...penutup, komboMaks: 2 }).lencana).toBeUndefined();
  });
  it('acak mengubah kalimat tapi tidak varian', () => {
    const a = pilihPenutup({ ...penutup, acak: 0 });
    const b = pilihPenutup({ ...penutup, acak: 0.99 });
    expect(a.varian).toBe(b.varian);
    expect(a.judul).not.toBe(b.judul);
  });
});
