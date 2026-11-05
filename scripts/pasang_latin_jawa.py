# L2b/L2c (docs/RENCANA_SCANNER_FINAL.md): draf label teks untuk potongan foto nyata TANPA API.
# Papan dwibahasa: kotak aksara Jawa dipasangkan dengan kotak Latin terdekat (geometri), Latin dibaca OCR Latin terbuka
# (latin_PP-OCRv5_mobile_rec, Apache-2.0, hanya di laptop), diubah ke aksara (latin_ke_jawa.py), lalu diverifikasi pembaca v2
# dengan CTC paksa. Keluaran: docs/random/foto_nyata/draf/draf.json + potongan + lembar kontak. Semuanya DRAF untuk dikoreksi manusia.
# Pakai: python -X utf8 scripts/pasang_latin_jawa.py [--foto-maks N]
# Butuh: docs/random/latin_rec/latin.onnx + latin.yml (unduh dari Hugging Face PaddlePaddle/latin_PP-OCRv5_mobile_rec_onnx).
import argparse, json, os, re, sys
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
import cv2, numpy as np, onnxruntime as ort, torch, yaml
import bangku_v3 as bv
import rujukan_scanner as ruj
from latin_ke_jawa import ke_jawa

FOTO = os.path.join(AKAR, 'docs/random/foto_nyata/foto')
KELUAR = os.path.join(AKAR, 'docs/random/foto_nyata/draf')
_lat = ort.InferenceSession(os.path.join(AKAR, 'docs/random/latin_rec/latin.onnx'), providers=['CPUExecutionProvider'])
_kamus = ['<blank>'] + yaml.safe_load(open(os.path.join(AKAR, 'docs/random/latin_rec/latin.yml'), encoding='utf8'))['PostProcess']['character_dict'] + [' ']
TALING = 'ꦺ'
_visual = re.compile('(' + ruj._CL + ')' + TALING)


def ke_visual(s):
    """Urutan logis (taling setelah klaster) -> urutan tampak yang dipakai label pembaca."""
    return _visual.sub(TALING + r'\1', s)


def baca_latin(c):
    """Potongan abu-abu -> (teks, keyakinan) dari OCR Latin; dua polaritas, ambil yang lebih yakin."""
    def satu(g):
        h, w = g.shape
        W = min(960, max(32, int(48 * w / max(h, 1))))
        a = cv2.resize(g, (W, 48), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        x = (np.repeat(a[None], 3, 0) - .5) / .5
        p = _lat.run(None, {_lat.get_inputs()[0].name: x[None]})[0][0]
        b = p.argmax(-1)
        ids, prev = [], 0
        for t in b:
            if t != prev and t != 0:
                ids.append(int(t))
            prev = t
        m = b != 0
        return ''.join(_kamus[i] for i in ids), float(p.max(-1)[m].mean()) if m.any() else 0.0
    return max(satu(c), satu(255 - c), key=lambda r: r[1])


def skor_paksa(c, label_logis):
    """-log P(label | potongan) per karakter dengan CTC paksa terhadap pembaca v2; semakin kecil semakin cocok. Dua polaritas, ambil terbaik."""
    ids = [ruj.VOCAB.index(ch) + 1 for ch in ke_visual(label_logis) if ch in ruj.VOCAB]
    if not ids:
        return 99.0
    hasil = []
    for g in (c, 255 - c):
        lg = ruj.crnn.run(None, {'gambar': ruj.ke_input(g)[None, None]})[0][0]
        lp = torch.log_softmax(torch.from_numpy(lg), -1)[:, None]
        if lp.shape[0] < len(ids):
            continue
        l = torch.nn.functional.ctc_loss(lp, torch.tensor([ids]), torch.tensor([lp.shape[0]]), torch.tensor([len(ids)]), blank=0, reduction='sum', zero_infinity=True)
        hasil.append(float(l) / len(ids))
    return min(hasil) if hasil else 99.0


def pasangkan(j, lain, H):
    """Kotak Latin terbaik untuk kotak Jawa j: bertumpuk mendatar >= 40% lebar terkecil, jarak tegak <= 1,5 tinggi terbesar."""
    terbaik, skor = None, 1e9
    for l in lain:
        wj, wl = j[2] - j[0], l[2] - l[0]
        tumpuk = min(j[2], l[2]) - max(j[0], l[0])
        if tumpuk < 0.4 * min(wj, wl) or wl < 1.5 * (l[3] - l[1]):
            continue
        celah = max(l[1] - j[3], j[1] - l[3], 0)
        if celah > 1.5 * max(j[3] - j[1], l[3] - l[1]):
            continue
        if celah < skor:
            terbaik, skor = l, celah
    return terbaik


def potong(g, k, rel=0.05, lebar=0.3):
    H, W = g.shape
    h = k[3] - k[1]
    y0, y1, x0, x1 = int(max(0, k[1] - rel * h)), int(min(H, k[3] + rel * h)), int(max(0, k[0] - lebar * h)), int(min(W, k[2] + lebar * h))
    return g[y0:y1, x0:x1] if y1 - y0 >= 8 and x1 - x0 >= 8 else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--foto-maks', type=int, default=0)
    a = ap.parse_args()
    os.makedirs(KELUAR + '/potongan', exist_ok=True)
    bv.PANJANG = 960
    hasil = []
    for nama in sorted(os.listdir(FOTO))[:a.foto_maks or None]:
        b = np.fromfile(os.path.join(FOTO, nama), np.uint8)
        g = cv2.imdecode(b, cv2.IMREAD_GRAYSCALE) if b.size else None
        if g is None:
            continue
        s = 2048 / max(g.shape)
        g = cv2.resize(g, None, fx=s, fy=s, interpolation=cv2.INTER_AREA) if s < 1 else g
        jawa, lain = [], []
        for k in bv.kotak_pp(g):
            c = potong(g, k)
            if c is not None:
                (jawa if bv.jawa(c) >= bv.AMBANG_JAWA else lain).append(k)
        for n, j in enumerate(jawa):
            cj = potong(g, j)
            l = pasangkan(j, lain, g.shape[0])
            if cj is None:
                continue
            rek = dict(foto=nama, kotak=[round(float(v)) for v in j], berkas=f'{nama[:-4]}_{n:02d}.png', latin=None, yakin_latin=None, draf=None, skor_ctc=None, diragukan=None)
            if l is not None:
                cl = potong(g, l, 0.1, 0.1)
                teks, yk = baca_latin(cl)
                rek.update(latin=teks, yakin_latin=round(yk, 3))
                aksara, ragu = ke_jawa(teks) if re.search(r'[A-Za-z]{3}', teks) else ('', True)
                if aksara:
                    rek.update(draf=aksara, diragukan=ragu, skor_ctc=round(skor_paksa(cj, aksara), 3))
            cv2.imencode('.png', cj)[1].tofile(os.path.join(KELUAR, 'potongan', rek['berkas']))
            hasil.append(rek)
        print(nama, 'jawa', len(jawa), 'lain', len(lain), flush=True)
    json.dump(hasil, open(KELUAR + '/draf.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    ada = [r for r in hasil if r['draf']]
    print('kotak Jawa', len(hasil), '| berpasangan dan beraksara', len(ada))
    for r in ada[:40]:
        print(r['berkas'], repr(r['latin']), r['yakin_latin'], 'ctc', r['skor_ctc'])


if __name__ == '__main__':
    main()
