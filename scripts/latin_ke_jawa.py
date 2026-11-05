# Pengubah Latin -> aksara Jawa (L2a, docs/RENCANA_SCANNER_FINAL.md). Dipakai untuk membuat DRAF label potongan foto nyata:
# teks Latin dari papan dwibahasa diubah ke aksara, lalu dicek pembaca (CTC paksa) dan manusia. Bukan penerjemah resmi.
# Keluaran memakai hanya karakter di src/ml/model2/scanner_charset.json, urutan LOGIS (taling dan tarung setelah klaster),
# tanpa spasi (aksara Jawa ditulis bersambung), pasangan = pangkon + konsonan berikutnya.
# Pakai: python -X utf8 scripts/latin_ke_jawa.py "jalan malioboro"      Tes: python -X utf8 -m unittest scripts/test_latin_ke_jawa.py
import re, sys

KONSONAN = {
    'h': 'ꦲ', 'n': 'ꦤ', 'c': 'ꦕ', 'r': 'ꦫ', 'k': 'ꦏ', 'd': 'ꦢ', 't': 'ꦠ', 's': 'ꦱ', 'w': 'ꦮ', 'l': 'ꦭ',
    'p': 'ꦥ', 'dh': 'ꦝ', 'j': 'ꦗ', 'y': 'ꦪ', 'ny': 'ꦚ', 'm': 'ꦩ', 'g': 'ꦒ', 'b': 'ꦧ', 'th': 'ꦛ', 'ng': 'ꦔ',
}
PANYIGEG = {'ng': 'ꦁ', 'r': 'ꦂ', 'h': 'ꦃ'}
PANGKON = '꧀'
TALING, TARUNG = 'ꦺ', 'ꦴ'
SANDHANGAN = {'a': '', 'i': 'ꦶ', 'u': 'ꦸ', 'é': TALING, 'ê': 'ꦼ', 'o': TALING + TARUNG}
# huruf asing -> padanan terdekat; hasilnya ditandai "diragukan"
ASING = {'f': 'p', 'v': 'w', 'z': 'j', 'q': 'k', 'x': 'ks', 'kh': 'k', 'sy': 's'}
VOKAL = set('aiueoéèê')
PENGHUBUNG = {'i': 'y', 'é': 'y', 'e': 'y', 'è': 'y', 'u': 'w', 'o': 'w'}  # vokal bertemu vokal: ꦪ setelah i/e, ꦮ setelah u/o, selain itu ꦲ


def _token(kata):
    """Kata Latin huruf kecil -> daftar (jenis, nilai): K konsonan berpenanda vokal, P panyigeg, V vokal. Kedua nilai bisa 'e' mentah."""
    for a, b in ASING.items():
        kata = kata.replace(a, b)
    out, i, n = [], 0, len(kata)
    while i < n:
        c = kata[i]
        d = kata[i:i + 2]
        sesudah = kata[i + 2] if i + 2 < n else ''
        if c in VOKAL:
            out.append(('V', c))
            i += 1
        elif d == 'ng':
            if sesudah and sesudah in VOKAL:
                out.append(('K', 'ng'))
            else:
                out.append(('P', 'ng'))
            i += 2
        elif d in ('ny', 'dh', 'th'):
            out.append(('K', d))
            i += 2
        elif c in PANYIGEG and not (i + 1 < n and kata[i + 1] in VOKAL):  # h/r tanpa vokal sesudahnya
            out.append(('P', c))
            i += 1
        elif c in KONSONAN:
            out.append(('K', c))
            i += 1
        else:
            raise ValueError(f'karakter tidak dikenal: {c!r}')
    return out


def _vokal_e(vokal, adalah_akhir):
    """'e' polos: pepet bila bukan suku kata terakhir, taling bila di akhir kata. 'é'/'è' = taling, 'ê' = pepet."""
    if vokal in ('é', 'è'):
        return 'é'
    if vokal == 'e':
        return 'é' if adalah_akhir else 'ê'
    return vokal


def kata_ke_jawa(kata):
    kata = kata.lower()
    tok = _token(kata)
    hasil, i, n = [], 0, len(tok)
    vokal_sebelum = None  # vokal yang baru ditulis (untuk penghubung ꦪ/ꦮ)
    while i < n:
        jenis, v = tok[i]
        adalah_akhir = not any(j == 'V' for j, _ in tok[i + 1:])
        if jenis == 'K':
            if i + 1 < n and tok[i + 1][0] == 'V':
                huruf = _vokal_e(tok[i + 1][1], not any(j == 'V' for j, _ in tok[i + 2:]))
                hasil.append(KONSONAN[v] + SANDHANGAN[huruf])
                vokal_sebelum = huruf
                i += 2
            else:
                hasil.append(KONSONAN[v] + PANGKON)  # tanpa vokal: pangkon (akhir kata) atau penghubung pasangan (sebelum konsonan lain)
                vokal_sebelum = None
                i += 1
        elif jenis == 'P':
            hasil.append(PANYIGEG[v])
            vokal_sebelum = None
            i += 1
        else:  # vokal tanpa konsonan di depannya
            huruf = _vokal_e(v, adalah_akhir)
            pangkal = PENGHUBUNG.get(vokal_sebelum, 'h') if vokal_sebelum else 'h'
            hasil.append(KONSONAN[pangkal] + SANDHANGAN[huruf])
            vokal_sebelum = huruf
            i += 1
    # pangkon di tengah kata menggandeng konsonan berikutnya (pasangan), jadi tetap dipakai apa adanya
    return ''.join(hasil)


def ke_jawa(teks):
    """Teks Latin (boleh beberapa kata) -> (aksara tanpa spasi, diragukan). diragukan = ada huruf asing, angka, atau tanda baca yang dibuang."""
    diragukan = False
    keluar = []
    for kata in re.split(r'\s+', teks.strip()):
        bersih = re.sub(r'[^a-zA-ZéèêÉÈÊ]', '', kata)
        if bersih != kata:
            diragukan = True
        if not bersih:
            continue
        if re.search(r'[fvzqx]|kh|sy', bersih.lower()):
            diragukan = True
        keluar.append(kata_ke_jawa(bersih))
    return ''.join(keluar), diragukan


if __name__ == '__main__':
    for t in sys.argv[1:]:
        print(t, '->', *ke_jawa(t))
