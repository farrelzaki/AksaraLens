import { describe, expect, it } from 'vitest';
import { LABEL_MODEL1, nilaiTulisan } from './keputusan';

const prob = (huruf: string, p: number) => {
  const v = new Array(LABEL_MODEL1.length).fill((1 - p) / (LABEL_MODEL1.length - 1));
  v[LABEL_MODEL1.indexOf(huruf as never)] = p;
  return v;
};

describe('nilaiTulisan', () => {
  it('benar bila prediksi teratas = target dan yakin', () => {
    expect(nilaiTulisan(prob('ka', 0.9), 'ka')).toMatchObject({ jenis: 'benar' });
  });

  it('terbaca sebagai huruf lain bila yakin pada huruf lain', () => {
    expect(nilaiTulisan(prob('la', 0.8), 'ha')).toEqual({ jenis: 'terbaca_lain', huruf: 'la', keyakinan: 0.8 });
  });

  it('belum terbaca bila keyakinan rendah atau kelas bukan huruf', () => {
    expect(nilaiTulisan(prob('ka', 0.4), 'ka')).toEqual({ jenis: 'belum_terbaca' });
    expect(nilaiTulisan(prob('bukan_huruf', 0.95), 'ka')).toEqual({ jenis: 'belum_terbaca' });
  });
});
