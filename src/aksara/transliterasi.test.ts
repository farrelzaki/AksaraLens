// Uji kata transliterasi aksara -> Latin (Fase 2, "Uji kata transliterasi").
// Hasil yang diharapkan diturunkan dari BR-04 (ha di awal kata dibaca a, keluaran per suku kata)
// dan ejaan Jawa, BUKAN dari keluaran urai.ts. Bila tes di sini merah, itu temuan untuk Farrel
// (pemilik src/aksara/): laporkan, jangan sesuaikan tesnya agar hijau.
//
// Pelengkap urai.test.ts; sengaja tidak mengulang kasus yang sudah ada di sana.

import { describe, expect, it } from 'vitest';
import { keLatin, urai } from './urai';

describe('transliterasi kata (BR-04)', () => {
  it('"aksara": ha di awal kata dibaca a, konsonan mati menempel ke suku kata sebelumnya', () => {
    expect(keLatin('ꦲꦏ꧀ꦱꦫ')).toBe('ak-sa-ra');
    expect(urai('ꦲꦏ꧀ꦱꦫ').map((s) => s.latin)).toEqual(['ak', 'sa', 'ra']);
  });

  it('"omah": ha + taling tarung di awal kata dibaca o, bukan ho', () => {
    expect(keLatin('ꦲꦺꦴꦩꦃ')).toBe('o-mah');
    expect(urai('ꦲꦺꦴꦩꦃ').map((s) => s.latin)).toEqual(['o', 'mah']);
  });

  it('ha di tengah kata tetap dibaca ha', () => {
    expect(keLatin('ꦩꦲꦭ꧀')).toBe('ma-hal'); // mahal
    expect(keLatin('ꦫꦲꦪꦸ')).toBe('ra-ha-yu'); // rahayu
  });
});

describe('transliterasi dengan spasi', () => {
  it('ha di awal kata setelah spasi tetap dibaca a/o, bukan ha/ho (BR-04)', () => {
    expect(keLatin('ꦲꦤ ꦲꦤ')).not.toContain('ha');
    expect(keLatin('ꦲꦏ꧀ꦱꦫ ꦲꦺꦴꦩꦃ')).not.toContain('ho');
  });

  // TEMUAN untuk Farrel (2026-10-25): keLatin membuang spasi sehingga dua kata tersambung,
  // 'ꦲꦤ ꦲꦤ' -> 'a-na-a-na'. Format yang diharapkan di bawah ('a-na a-na') adalah asumsi yang
  // meniru penanganan tanda baca ('a-na, a-na.'); PRD/BR-04 belum mengatur format spasi.
  // Tes ditandai `fails` sampai Farrel memutuskan. Setelah diperbaiki tes ini akan merah:
  // hapus `.fails` (atau sesuaikan format yang disepakati).
  it.fails('spasi memisahkan kata dan tidak hilang', () => {
    expect(keLatin('ꦲꦤ ꦲꦤ')).toBe('a-na a-na');
  });

  it.fails('dua kata dengan spasi tetap terpisah', () => {
    expect(keLatin('ꦲꦏ꧀ꦱꦫ ꦲꦺꦴꦩꦃ')).toBe('ak-sa-ra o-mah');
  });
});

describe('transliterasi kata dari materi', () => {
  it.each([
    ['sawah', 'ꦱꦮꦃ', 'sa-wah'], // wignyan
    ['wayang', 'ꦮꦪꦁ', 'wa-yang'], // cecak
    ['banyu', 'ꦧꦚꦸ', 'ba-nyu'], // nya + suku
    ['nandur', 'ꦤꦤ꧀ꦢꦸꦂ', 'nan-dur'], // pangkon + suku + layar pada satu aksara
  ])('%s', (_kata, aksara, latin) => {
    expect(keLatin(aksara)).toBe(latin);
  });
});