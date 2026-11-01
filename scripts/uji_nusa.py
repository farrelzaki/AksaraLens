# Penjaga regresi NusaAksara: pembagian dan penilaian sama dengan notebook Model 2 (sel 27, 28, 34).
# Pakai: python -X utf8 scripts/uji_nusa.py [--nusa docs/random/nusa]
# Data dari scripts/unduh_nusa.py (gitignored). AKSARALENS_MODEL = folder ONNX versi lain.
import argparse, json, os, random, re, sys, time, unicodedata
import cv2, numpy as np

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
import rujukan_scanner as ruj  # noqa: E402
import pipeline_cerdas as cerdas  # noqa: E402
from uji_set_c import jarak, suku_kata  # noqa: E402

PADA_LAIN = set('꧁꧂꧃꧄꧅꧆꧇꧊꧋꧌꧍ꧏ꧞꧟')
BUANG = set('  ​‌‍-.,:;"\'()!?') | PADA_LAIN
DIKENAL = set(ruj.IDX2CHAR.values()) if isinstance(ruj.IDX2CHAR, dict) else set(ruj.IDX2CHAR)


def nilai_ketat(gt_list, det_list):
    ok = 0
    dipakai = set()
    for gx0, gy0, gx1, gy1 in gt_list:
        terbaik, j_best = 0, None
        for j, (dx0, dy0, dx1, dy1) in enumerate(det_list):
            lebar = max(0, min(gx1, dx1) - max(gx0, dx0)) / max(gx1 - gx0, 1)
            if lebar < 0.5:
                continue
            inter = max(0, min(gy1, dy1) - max(gy0, dy0))
            union = max(gy1, dy1) - min(gy0, dy0)
            v = inter / max(union, 1)
            if v > terbaik:
                terbaik, j_best = v, j
        if terbaik >= 0.5:
            ok += 1
            dipakai.add(j_best)
    return ok, len(dipakai)


def baca_abu(p):
    return cv2.imdecode(np.fromfile(p, np.uint8), cv2.IMREAD_GRAYSCALE)


def uji_halaman(hal, fungsi):
    ok = n = det = cocok = 0
    t0 = time.time()
    for h in hal:
        d = fungsi(baca_abu(h['file']))
        a, b = nilai_ketat(h['kotak'], d)
        ok += a
        n += len(h['kotak'])
        det += len(d)
        cocok += b
    return ok / max(n, 1), cocok / max(det, 1), n, det, (time.time() - t0) / len(hal)


def baris_uji(indeks, folder):
    """Baris uji notebook: dibagi per halaman, 25% terakhir setelah acak random.Random(0)."""
    data = []
    for r in indeks:
        t = ''.join(c for c in unicodedata.normalize('NFC', r['transcription']) if c not in BUANG)
        nama = r['image'].split('/')[-1].split('?')[0]
        p = os.path.join(folder, nama)
        if not t or any(c not in DIKENAL for c in t) or not os.path.exists(p):
            continue
        g = baca_abu(p)
        if g is None:
            continue
        g = ruj.normalisasi_polaritas(g)
        lebar = ruj.ke_input(g).shape[1] // 4
        kembar = sum(a == b for a, b in zip(t, t[1:]))
        if lebar < len(t) + kembar:
            continue
        m = re.search(r'_(\d+)_(\d+)\.', nama)
        data.append(dict(gray=g, teks=t, halaman=int(m.group(1)) if m else len(data) // 8))
    hal = sorted({d['halaman'] for d in data})
    random.Random(0).shuffle(hal)
    uji = {h for i, h in enumerate(hal) if i >= 0.75 * len(hal)}
    return [d for d in data if d['halaman'] in uji]


def akurasi(pasangan):
    benar = total = 0
    for p, t in pasangan:
        s = suku_kata(t)
        total += len(s)
        benar += max(0, len(s) - jarak(suku_kata(p), s))
    return benar / max(total, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--nusa', default=os.path.join(AKAR, 'docs/random/nusa'))
    a = ap.parse_args()
    indeks = json.load(open(os.path.join(a.nusa, 'indeks.json'), encoding='utf-8'))
    hal = [dict(h, file=os.path.join(AKAR, h['file']) if not os.path.isabs(h['file']) else h['file']) for h in indeks['halaman'].values()]

    print(f'{"":<28}{"terpisah benar":>15}{"presisi":>10}{"deteksi":>9}{"dtk/hal":>9}')
    def tampil(judul, r):
        print(f'{judul:<28}{r[0]:>15.1%}{r[1]:>10.1%}{r[3]:>9}{r[4]:>9.2f}')
    tampil('v2 (detektor saja)', uji_halaman(hal, lambda g: ruj.kotak_detektor(ruj.normalisasi_polaritas(g))))
    tampil('cerdas (baris ditampilkan)', uji_halaman(hal, lambda g: [b['kotak'] for b in cerdas.baca_foto(g) if b['status'] != 'TOLAK']))
    print(f'({len(hal)} halaman, {sum(len(h["kotak"]) for h in hal)} baris; notebook: 82,8% / 86,9%)')

    uji = baris_uji(indeks['ocr'], os.path.join(a.nusa, 'baris'))
    tunggal = [cerdas.baca_potongan(d['gray']) for d in uji]
    status = [cerdas.nilai_status(t, y, 'foto') for t, y in tunggal]
    print(f'\nBaris uji: {len(uji)} (notebook: 69)')
    print(f'Akurasi suku, pembaca saja: {akurasi([(t, d["teks"]) for (t, _), d in zip(tunggal, uji)]):.1%} (notebook: 89,0%)')
    print(f'Akurasi suku, baris TOLAK dihitung kosong: {akurasi([(t if s != "TOLAK" else "", d["teks"]) for (t, _), s, d in zip(tunggal, status, uji)]):.1%}')
    print('Status foto:', {k: status.count(k) for k in ('TERIMA', 'RAGU', 'TOLAK')})
    alasan = dict(valid=0, yakin=0, pendek=0)
    for (t, y), s in zip(tunggal, status):
        if s == 'TOLAK':
            alasan['valid'] += cerdas.validitas(t) < cerdas.AMBANG['foto']['valid']
            alasan['yakin'] += y < cerdas.AMBANG['foto']['ragu']
            alasan['pendek'] += cerdas.konsonan(t) < cerdas.AMBANG['foto']['konsonan']
    print('Alasan TOLAK (boleh tumpang):', alasan)


if __name__ == '__main__':
    main()
