# Menambah usulan bacaan dari pembaca v2 ke data/label_nyata/draf.json agar pelabel cukup MEMERIKSA, bukan mengetik dari nol.
# Menambah field: model_aksara, model_latin (perkiraan Latin dari aksara bacaan model), model_yakin. Field lama tidak diubah.
# Pakai: python -X utf8 scripts/tambah_bacaan_model.py            Tes: python -X utf8 -m unittest scripts/test_aksara_ke_latin.py
import json, os, sys
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))

KONSONAN = {'ꦲ': 'h', 'ꦤ': 'n', 'ꦕ': 'c', 'ꦫ': 'r', 'ꦏ': 'k', 'ꦢ': 'd', 'ꦠ': 't', 'ꦱ': 's', 'ꦮ': 'w', 'ꦭ': 'l', 'ꦥ': 'p', 'ꦝ': 'dh', 'ꦗ': 'j',
            'ꦪ': 'y', 'ꦚ': 'ny', 'ꦩ': 'm', 'ꦒ': 'g', 'ꦧ': 'b', 'ꦛ': 'th', 'ꦔ': 'ng'}
PANYIGEG = {'ꦁ': 'ng', 'ꦂ': 'r', 'ꦃ': 'h'}
PANGKON = '꧀'
SANDHANGAN = {'ꦶ': 'i', 'ꦸ': 'u', 'ꦼ': 'ê', 'ꦺ': 'é'}
TARUNG = 'ꦴ'
PADA = {'꧈': ',', '꧉': '.'}


def ke_latin(aksara):
    """Aksara Jawa (urutan logis, hanya karakter charset) -> perkiraan bacaan Latin. Hanya untuk usulan; pelabel memeriksa."""
    out, i, n = [], 0, len(aksara)
    while i < n:
        c = aksara[i]
        if c in KONSONAN:
            k, i = KONSONAN[c], i + 1
            if i < n and aksara[i] == PANGKON:  # konsonan mati / penggandeng pasangan
                out.append(k)
                i += 1
                continue
            v = 'a'
            if i < n and aksara[i] in SANDHANGAN:
                v = SANDHANGAN[aksara[i]]
                i += 1
                if v == 'é' and i < n and aksara[i] == TARUNG:
                    v, i = 'o', i + 1
            elif i < n and aksara[i] == TARUNG:
                v, i = 'o', i + 1
            # "ha" + sandhangan di awal = vokal murni (ꦲꦶ -> i); selain itu tetap h+vokal
            out.append(k + v)
        elif c in PANYIGEG:
            out.append(PANYIGEG[c])
            i += 1
        elif c in PADA:
            out.append(' ')
            i += 1
        else:
            i += 1
    return ''.join(out).strip()


def main():
    import cv2, numpy as np
    import pipeline_cerdas as cerdas
    import onnxruntime as ort
    ort.set_default_logger_severity(3)
    d = os.path.join(AKAR, 'data/label_nyata')
    draf = json.load(open(os.path.join(d, 'draf.json'), encoding='utf8'))
    for r in draf:
        b = np.fromfile(os.path.join(d, 'potongan', r['berkas']), np.uint8)
        g = cv2.imdecode(b, cv2.IMREAD_GRAYSCALE)
        teks, yk = max(cerdas.baca_potongan(g), cerdas.baca_potongan(255 - g), key=lambda x: x[1])
        r.update(model_aksara=teks, model_latin=ke_latin(teks), model_yakin=round(yk, 3))
    json.dump(draf, open(os.path.join(d, 'draf.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    bagus = sum(1 for r in draf if r['model_yakin'] >= 0.8 and r['model_latin'])
    print('potongan', len(draf), '| bacaan model yakin >= 0,8:', bagus)


if __name__ == '__main__':
    main()
