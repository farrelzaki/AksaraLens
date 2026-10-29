import { describe, expect, it } from 'vitest';
import { BAB } from './index';
import { tautanDariUnicode, tautanMateri } from './peta';
import { hurufDariKode } from '../aksara/huruf';

describe('tautanMateri', () => {
  it('setiap huruf di bab.json menaut ke babnya sendiri dengan anchor kode', () => {
    for (const b of BAB) {
      for (const kode of b.letters) {
        expect(tautanMateri(kode)).toBe(`/belajar/materi/${b.bab}#${kode}`);
      }
    }
  });

  it('contoh tiap bab', () => {
    expect(tautanMateri('ka')).toBe('/belajar/materi/1#ka');
    expect(tautanMateri('wulu')).toBe('/belajar/materi/2#wulu');
    expect(tautanMateri('pangkon')).toBe('/belajar/materi/3#pangkon');
  });

  it('tanda baca di luar materi dan kode tak dikenal -> null', () => {
    expect(tautanMateri('lingsa')).toBeNull();
    expect(tautanMateri('lungsi')).toBeNull();
    expect(tautanMateri('xyz')).toBeNull();
    expect(tautanMateri('')).toBeNull();
  });

  it('menerima "taling tarung", huruf besar, dan spasi di tepi', () => {
    expect(tautanMateri('taling tarung')).toBe('/belajar/materi/2#tarung');
    expect(tautanMateri(' Taling Tarung ')).toBe('/belajar/materi/2#tarung');
    expect(tautanMateri(' KA ')).toBe('/belajar/materi/1#ka');
  });
});

describe('tautanDariUnicode', () => {
  it('karakter Jawa menaut ke materi kodenya', () => {
    const u = (kode: string) => hurufDariKode(kode)!.unicode;
    expect(tautanDariUnicode(u('ka'))).toBe('/belajar/materi/1#ka');
    expect(tautanDariUnicode(u('tarung'))).toBe('/belajar/materi/2#tarung');
    expect(tautanDariUnicode(u('layar'))).toBe('/belajar/materi/3#layar');
    expect(tautanDariUnicode(u('pangkon'))).toBe('/belajar/materi/3#pangkon');
  });

  it('tanda baca dan karakter bukan aksara -> null', () => {
    expect(tautanDariUnicode(hurufDariKode('lungsi')!.unicode)).toBeNull();
    expect(tautanDariUnicode('a')).toBeNull();
  });
});