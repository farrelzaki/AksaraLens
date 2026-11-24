import { describe, expect, it } from 'vitest';
import { AMBANG_AWAL, AMBANG_TARGET, LABEL_MODEL1, RASIO_ASPEK_MAKS, RECALL_MIN_TEMPLAT, nilaiTulisan, putuskanLatihan } from './keputusan';

const prob = (huruf: string, p: number) => {
  const v = new Array(LABEL_MODEL1.length).fill((1 - p) / (LABEL_MODEL1.length - 1));
  v[LABEL_MODEL1.indexOf(huruf)] = p;
  return v;
};

describe('nilaiTulisan', () => {
  it('benar bila prediksi teratas = target dan yakin', () => {
    expect(nilaiTulisan(prob('ka', 0.9), 'ka')).toMatchObject({ jenis: 'benar' });
  });

  it('terbaca sebagai huruf lain bila yakin pada huruf lain', () => {
    expect(nilaiTulisan(prob('la', 0.8), 'ha')).toEqual({ jenis: 'terbaca_lain', huruf: 'la', keyakinan: 0.8 });
  });

  it('target cukup AMBANG_TARGET, huruf lain butuh AMBANG_AWAL', () => {
    expect(nilaiTulisan(prob('ka', AMBANG_TARGET), 'ka')).toMatchObject({ jenis: 'benar' });
    expect(nilaiTulisan(prob('la', 0.6), 'ka')).toEqual({ jenis: 'belum_terbaca' });
  });

  it('belum terbaca bila keyakinan rendah atau kelas bukan huruf', () => {
    expect(nilaiTulisan(prob('ka', 0.4), 'ka')).toEqual({ jenis: 'belum_terbaca' });
    expect(nilaiTulisan(prob('bukan', 0.95), 'ka')).toEqual({ jenis: 'belum_terbaca' });
  });
});

describe('AMBANG_AWAL', () => {
  it('0,7 sesuai keputusan tim', () => {
    expect(AMBANG_AWAL).toBe(0.7);
  });
});

describe('putuskanLatihan', () => {
  const benar = { jenis: 'benar', keyakinan: 0.934 } as const;

  it('lulus hanya bila CNN membaca huruf target, skor = keyakinan CNN', () => {
    expect(putuskanLatihan(benar, 0.8)).toEqual({ status: 'benar', skor: 93 });
  });

  it('coretan yang ditolak CNN tidak pernah lulus walau templat tinggi (regresi garis diagonal/silang)', () => {
    for (const recall of [0.5, 0.9, 1]) {
      expect(putuskanLatihan({ jenis: 'belum_terbaca' }, recall)).toEqual({ status: 'belum_terbaca' });
    }
  });

  it('terbaca huruf lain tetap gagal walau templat tinggi', () => {
    expect(putuskanLatihan({ jenis: 'terbaca_lain', huruf: 'la', keyakinan: 0.75 }, 1)).toEqual({ status: 'huruf_lain', huruf: 'la' });
  });

  it('CNN benar tetapi tinta jauh dari panduan -> melenceng', () => {
    expect(putuskanLatihan(benar, RECALL_MIN_TEMPLAT - 0.01)).toEqual({ status: 'melenceng' });
    expect(putuskanLatihan(benar, RECALL_MIN_TEMPLAT)).toMatchObject({ status: 'benar' });
  });

  it('huruf setengah jadi (proporsi beda dari panduan) -> belum utuh walau CNN membaca target', () => {
    expect(putuskanLatihan(benar, 0.9, 1.65)).toEqual({ status: 'belum_utuh' });
    expect(putuskanLatihan(benar, 0.9, RASIO_ASPEK_MAKS)).toMatchObject({ status: 'benar' });
  });

  it('model gagal tidak meluluskan', () => {
    expect(putuskanLatihan(null, 1)).toEqual({ status: 'model_gagal' });
  });
});
