// Padanan JavaScript dari scripts/latin_ke_jawa.py (dipakai alat_label.html). Aturan dan keluaran harus sama persis;
// kecocokan diperiksa oleh scripts/cocok_latin_ke_jawa.py.
const KONSONAN = { h: 'ꦲ', n: 'ꦤ', c: 'ꦕ', r: 'ꦫ', k: 'ꦏ', d: 'ꦢ', t: 'ꦠ', s: 'ꦱ', w: 'ꦮ', l: 'ꦭ', p: 'ꦥ', dh: 'ꦝ', j: 'ꦗ', y: 'ꦪ', ny: 'ꦚ', m: 'ꦩ', g: 'ꦒ', b: 'ꦧ', th: 'ꦛ', ng: 'ꦔ' };
const PANYIGEG = { ng: 'ꦁ', r: 'ꦂ', h: 'ꦃ' };
const PANGKON = '꧀';
const TALING = 'ꦺ';
const TARUNG = 'ꦴ';
const SANDHANGAN = { a: '', i: 'ꦶ', u: 'ꦸ', é: TALING, ê: 'ꦼ', o: TALING + TARUNG };
const ASING = [['f', 'p'], ['v', 'w'], ['z', 'j'], ['q', 'k'], ['x', 'ks'], ['kh', 'k'], ['sy', 's']];
const VOKAL = new Set('aiueoéèê');
const PENGHUBUNG = { i: 'y', é: 'y', e: 'y', è: 'y', u: 'w', o: 'w' };

function token(kata) {
  for (const [a, b] of ASING) kata = kata.split(a).join(b);
  const out = [];
  const n = kata.length;
  let i = 0;
  while (i < n) {
    const c = kata[i];
    const d = kata.slice(i, i + 2);
    const sesudah = i + 2 < n ? kata[i + 2] : '';
    if (VOKAL.has(c)) { out.push(['V', c]); i += 1; }
    else if (d === 'ng') { out.push([sesudah && VOKAL.has(sesudah) ? 'K' : 'P', 'ng']); i += 2; }
    else if (d === 'ny' || d === 'dh' || d === 'th') { out.push(['K', d]); i += 2; }
    else if (c in PANYIGEG && !(i + 1 < n && VOKAL.has(kata[i + 1]))) { out.push(['P', c]); i += 1; }
    else if (c in KONSONAN) { out.push(['K', c]); i += 1; }
    else throw new Error(`karakter tidak dikenal: ${c}`);
  }
  return out;
}

function vokalE(v, akhir) {
  if (v === 'é' || v === 'è') return 'é';
  if (v === 'e') return akhir ? 'é' : 'ê';
  return v;
}

const adaVokal = (tok, dari) => tok.slice(dari).some(([j]) => j === 'V');

export function kataKeJawa(kata) {
  const tok = token(kata.toLowerCase());
  const hasil = [];
  let vokalSebelum = null;
  let i = 0;
  while (i < tok.length) {
    const [jenis, v] = tok[i];
    if (jenis === 'K') {
      if (i + 1 < tok.length && tok[i + 1][0] === 'V') {
        const huruf = vokalE(tok[i + 1][1], !adaVokal(tok, i + 2));
        hasil.push(KONSONAN[v] + SANDHANGAN[huruf]);
        vokalSebelum = huruf;
        i += 2;
      } else { hasil.push(KONSONAN[v] + PANGKON); vokalSebelum = null; i += 1; }
    } else if (jenis === 'P') { hasil.push(PANYIGEG[v]); vokalSebelum = null; i += 1; }
    else {
      const huruf = vokalE(v, !adaVokal(tok, i + 1));
      const pangkal = vokalSebelum ? (PENGHUBUNG[vokalSebelum] ?? 'h') : 'h';
      hasil.push(KONSONAN[pangkal] + SANDHANGAN[huruf]);
      vokalSebelum = huruf;
      i += 1;
    }
  }
  return hasil.join('');
}

/** Teks Latin -> [aksara tanpa spasi, diragukan]. */
export function keJawa(teks) {
  let ragu = false;
  const keluar = [];
  for (const kata of teks.trim().split(/\s+/)) {
    const bersih = kata.replace(/[^a-zA-ZéèêÉÈÊ]/g, '');
    if (bersih !== kata) ragu = true;
    if (!bersih) continue;
    if (/[fvzqx]|kh|sy/.test(bersih.toLowerCase())) ragu = true;
    keluar.push(kataKeJawa(bersih));
  }
  return [keluar.join(''), ragu];
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('latin_ke_jawa.mjs')) {
  for (const t of process.argv.slice(2)) console.log(JSON.stringify([t, ...keJawa(t)]));
}
