# L-B: set evaluasi tingkat baris di LUAR Set C (docs/RISET_RENCANA_28NOV.md).
# Positif (berlabel): Wikisource val (buku 9, 10, 24, 25 ditahan dari latihan B2r2), sintetis v4c val (latar foto nyata),
#   dan baris uji NusaAksara (halaman uji, 69 baris).
# Negatif: potongan aksara lain NusaAksara (Bali, Batak, Jawi, Lampung, Lontara, Pegon, Sunda) yang DITAHAN dari latihan
#   klasifikator (lain[:400], seed 0, sama dengan klasifikator_aksara.susun), plus teks Latin sintetis.
# Setiap baris dibaca seperti scan.ts membaca satu potongan: polaritas asli, lalu terbalik bila belum TERIMA, ambil yang
# lebih yakin. Keluaran: satu baris JSON per sampel berisi teks, CER, status (ambang sekarang), dan fitur verifikator.
#
# Pakai (dari akar repo):
#   PEMBACA=<onnx B2> AKSARALENS_MODEL=<folder model> python -X utf8 scripts/uji_baris.py \
#       --wiki <folder wiki_val> --v4c <folder v4c_val> --keluar hasil.jsonl
# Folder wiki_val: label.tsv (berkas \t label visual \t val \t buku) + gambar; v4c_val: label.json + terbalik.json + gambar.
import argparse, glob, json, os, random, sys
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
import cv2, numpy as np
import bangku_v3 as bk  # memasang pembaca (PEMBACA) dan klasifikator seperti bangku
import rujukan_scanner as ruj
import pipeline_cerdas as cerdas
from uji_set_c import jarak, suku_kata
from uji_nusa import baris_uji

NUSA = os.path.join(AKAR, 'docs/random/nusa')


def abu(p):
    return cv2.imdecode(np.fromfile(p, np.uint8), cv2.IMREAD_GRAYSCALE)


def baca(crop):
    """-> (teks logis, fitur) untuk satu polaritas. Fitur dihitung dari peluang per frame CTC."""
    lg = ruj.crnn.run(None, {'gambar': ruj.ke_input(crop)[None, None]})[0][0]
    e = np.exp(lg - lg.max(-1, keepdims=True))
    p = e / e.sum(-1, keepdims=True)
    best = p.argmax(-1)
    ids, prev, huruf = [], 0, []
    for t, b in enumerate(best):
        if b != prev and b != 0:
            ids.append(int(b))
            huruf.append([])
        if b != 0:
            huruf[-1].append(float(p[t, b]))
        prev = b
    nb = best != 0
    srt = np.sort(p, -1)
    f = {
        'yakin': float(p.max(-1)[nb].mean()) if nb.any() else 0.0,  # ukuran sekarang (ctc.ts dekodeGreedy)
        'min_huruf': float(min(max(h) for h in huruf)) if huruf else 0.0,  # huruf paling ragu
        'risiko_hapus': float(p[~nb, 1:].max()) if (~nb).any() else 0.0,  # huruf terbaik di frame blank
        'margin': float((srt[nb, -1] - srt[nb, -2]).mean()) if nb.any() else 0.0,
        'frame': int(len(best)),
    }
    return ruj.to_logical(''.join(ruj.IDX2CHAR[i] for i in ids)), f


def baca_dua_arah(crop):
    a = baca(crop)
    if cerdas.nilai_status(a[0], a[1]['yakin'], 'foto') == 'TERIMA':
        return a
    b = baca(255 - crop)
    return a if a[1]['yakin'] >= b[1]['yakin'] else b


def cer(p, t):
    return min(1.0, jarak(p, t) / max(len(t), 1)) if t else (0.0 if not p else 1.0)


def nusa_lain_tertahan(n=400):
    """Sama persis dengan klasifikator_aksara.susun(seed=0): lain[:400] tidak pernah dilatih."""
    rng = random.Random(0)
    jawa = sorted(glob.glob(f'{NUSA}/baris/*.png'))
    lain = sorted(glob.glob(f'{NUSA}/lain/*.png'))
    rng.shuffle(jawa)
    rng.shuffle(lain)
    return lain[:n]


def latin_sintetis(n, seed=7):
    """Teks Latin cetak sederhana (papan nama, plat, angka) sebagai negatif tambahan."""
    rng = random.Random(seed)
    kata = 'JALAN TOKO KANTOR DESA PASAR SEKOLAH MASJID RUMAH MAKAN APOTEK BANK HOTEL PARKIR DILARANG MASUK KELUAR 2026 RT 05 RW 03 BUKA TUTUP'.split()
    font = [cv2.FONT_HERSHEY_SIMPLEX, cv2.FONT_HERSHEY_DUPLEX, cv2.FONT_HERSHEY_COMPLEX, cv2.FONT_HERSHEY_TRIPLEX]
    out = []
    for i in range(n):
        teks = ' '.join(rng.choice(kata) for _ in range(rng.randint(1, 3)))
        s = rng.uniform(0.8, 1.6)
        f = rng.choice(font)
        (w, h), _ = cv2.getTextSize(teks, f, s, 2)
        g = np.full((h + 24, w + 24), rng.randint(170, 255), np.uint8)
        cv2.putText(g, teks, (12, h + 12), f, s, rng.randint(0, 80), rng.randint(1, 3), cv2.LINE_AA)
        if rng.random() < 0.5:
            g = 255 - g
        out.append((f'latin_{i}', g))
    return out


def sampel(a):
    if a.wiki:
        for baris in open(os.path.join(a.wiki, 'label.tsv'), encoding='utf-8').read().splitlines():
            f, lab, _, buku = baris.split('\t')
            yield 'wiki', os.path.basename(f), abu(os.path.join(a.wiki, os.path.basename(f))), ruj.to_logical(lab)
    if a.v4c:
        lab = json.load(open(os.path.join(a.v4c, 'label.json'), encoding='utf-8'))
        for f, t in lab.items():
            yield 'v4c', f, abu(os.path.join(a.v4c, f)), t
    for i, d in enumerate(baris_uji(json.load(open(f'{NUSA}/indeks.json', encoding='utf-8'))['ocr'], f'{NUSA}/baris')):
        yield 'nusa', f'nusa_{i}', d['gray'], d['teks']
    for p in nusa_lain_tertahan():
        yield 'lain', os.path.basename(p), abu(p), None
    for n, g in latin_sintetis(a.latin):
        yield 'latin', n, g, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--wiki')
    ap.add_argument('--v4c')
    ap.add_argument('--latin', type=int, default=200)
    ap.add_argument('--keluar', required=True)
    a = ap.parse_args()
    with open(a.keluar, 'w', encoding='utf-8') as out:
        for set_, nama, g, t in sampel(a):
            if g is None or min(g.shape) < 8:
                continue
            teks, f = baca_dua_arah(g)
            f.update(validitas=cerdas.validitas(teks), konsonan=cerdas.konsonan(teks), panjang=len(teks), jawa=float(bk.jawa(g)))
            r = dict(set=set_, nama=nama, teks=teks, label=t, fitur=f,
                     status_foto=cerdas.nilai_status(teks, f['yakin'], 'foto'), status_area=cerdas.nilai_status(teks, f['yakin'], 'area'))
            if t is not None:
                r['cer'] = cer(teks, t)
                s = suku_kata(t)
                r['suku_benar'], r['suku_n'] = max(0, len(s) - jarak(suku_kata(teks), s)), len(s)
            out.write(json.dumps(r, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
