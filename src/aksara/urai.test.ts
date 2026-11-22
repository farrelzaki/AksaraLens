import { describe, expect, it } from 'vitest';
import { keLatin, tautanMateri, urai } from './urai';

describe('urai', () => {
  it('membaca ha di awal kata sebagai a', () => {
    expect(keLatin('ꦲꦤ')).toBe('a-na');
  });

  it('menguraikan ki menjadi ka + wulu', () => {
    const [ki] = urai('ꦏꦶ');
    expect(ki.latin).toBe('ki');
    expect(ki.komponen.map((k) => k.kode)).toEqual(['ka', 'wulu']);
  });

  it('membaca taling tarung sebagai o, satu komponen bertaut ke materi tarung', () => {
    const [ko] = urai('ꦏꦺꦴ');
    expect(ko.latin).toBe('ko');
    expect(ko.komponen.map((k) => k.nama)).toEqual(['ka', 'taling tarung']);
    expect(tautanMateri(ko.komponen[1])).toBe('/belajar/materi/2#tarung');
  });

  it('menggabung konsonan mati sebelum pasangan dan menandai pasangan', () => {
    const suku = urai('ꦲꦤꦏ꧀ꦏꦼꦕꦶꦭ꧀');
    expect(suku.map((s) => s.latin)).toEqual(['a', 'nak', 'kê', 'cil']);
    const ke = suku[2];
    expect(ke.adaPasangan).toBe(true);
    expect(ke.komponen[0]).toMatchObject({ kode: 'ka', nama: 'pasangan ka', peran: 'pasangan', bab: null });
    expect(suku[3].komponen.map((k) => k.kode)).toEqual(['ca', 'wulu', 'la', 'pangkon']);
  });

  it('teksTampil menjaga gugus pasangan seperti di tulisan aslinya (contoh scanner)', () => {
    const suku = urai('ꦧꦥꦏ꧀ꦠꦶꦤ꧀ꦝꦏ꧀');
    expect(suku.map((s) => s.latin)).toEqual(['ba', 'pak', 'tin', 'dhak']);
    expect(suku.map((s) => s.teks).join('')).toBe('ꦧꦥꦏ꧀ꦠꦶꦤ꧀ꦝꦏ꧀');
    const pak = suku.find((s) => s.latin === 'pak')!;
    expect(pak.teksTampil).toBe('ꦥꦏ꧀ꦠ');
    const ti = suku.find((s) => s.komponen[0]?.kode === 'ta')!;
    expect(ti.teksTampil.startsWith('ꦏ꧀ꦠꦶ')).toBe(true);
  });

  it('teksTampil sama dengan teks bila tanpa pasangan', () => {
    expect(urai('ꦏꦶꦭ').map((s) => s.teksTampil)).toEqual(['ꦏꦶ', 'ꦭ']);
  });

  it('membaca panyigeg', () => {
    expect(keLatin('ꦱꦼꦒꦂ')).toBe('sê-gar');
    expect(keLatin('ꦧꦁꦱ')).toBe('bang-sa');
  });

  it('memperlakukan pada sebagai tanda baca dan batas kata', () => {
    expect(keLatin('ꦲꦤ꧈ꦲꦤ꧉')).toBe('a-na, a-na.');
  });

  it('membuat tautan ke materi, kecuali pasangan', () => {
    const [, ke] = urai('ꦏ꧀ꦏꦼ');
    expect(tautanMateri(ke.komponen[0])).toBeNull();
    expect(tautanMateri(ke.komponen[1])).toBe('/belajar/materi/2#pepet');
  });
});
