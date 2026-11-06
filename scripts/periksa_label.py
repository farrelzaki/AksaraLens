# Pemeriksa label teks potongan aksara (L2d, docs/RENCANA_SCANNER_FINAL.md) untuk tim yang TIDAK bisa membaca aksara Jawa.
# Tidak ada yang dipercaya begitu saja. Tiap label dikumpulkan buktinya dari sumber yang saling bebas:
#   decoy   : pembaca v2 lebih menyukai label ini daripada >= 95% label acak milik potongan lain (CTC paksa; bekerja walau pembaca lemah)
#   papan   : cocok dengan teks Latin papan yang dipasangkan otomatis (draf.json, yakin Latin >= 0,8), CER aksara <= 0,25
#   sumber2 : cocok (CER <= 0,2) dengan label dari pelabel/AI lain untuk potongan yang sama
#   visual  : pelabel mencocokkan BENTUK dengan periksa_visual.html (tidak perlu bisa membaca)
# Tingkat: terpercaya (>= 2 bukti) | periksa (1 bukti) | buang (0 bukti atau tidak sah). Hanya "terpercaya" dipakai melatih.
# Masukan: berkas JSON hasil alat_label.html ({berkas: {status, latin, aksara}}), atau {berkas: "bacaan latin"}, atau CSV berkas,latin.
# Pakai: python -X utf8 scripts/periksa_label.py data/label_nyata/hasil/*.json [--visual data/label_nyata/hasil/visual_*.json]
#        keluaran: data/label_nyata/hasil_diperiksa.json dan ringkasan di layar.  Tes: python -X utf8 -m unittest scripts/test_periksa_label.py
import argparse, csv, glob, json, os, random, re, sys
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
from latin_ke_jawa import ke_jawa

D = os.path.join(AKAR, 'data/label_nyata')
AMBANG_DECOY = 0.95  # label sebenarnya harus lebih baik dari sekian bagian label acak
AMBANG_PAPAN, AMBANG_SUMBER2 = 0.25, 0.2


def jarak(a, b):
    p = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        c = [i]
        for j, y in enumerate(b, 1):
            c.append(min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (x != y)))
        p = c
    return p[-1]


def cer(a, b):
    return jarak(a, b) / max(len(a), len(b), 1)


def tentukan_tier(bukti, sah):
    """bukti: daftar nama bukti yang lolos. Tidak sah = langsung buang."""
    if not sah:
        return 'buang'
    return 'terpercaya' if len(bukti) >= 2 else 'periksa' if len(bukti) == 1 else 'buang'


def muat_masukan(path):
    """-> {berkas: (latin, aksara)}; hanya yang berstatus ok."""
    if path.endswith('.csv'):
        d = {r['berkas']: r['latin'] for r in csv.DictReader(open(path, encoding='utf8'))}
    else:
        d = json.load(open(path, encoding='utf8'))
    out = {}
    for b, v in d.items():
        if isinstance(v, dict):
            if v.get('status', 'ok') != 'ok' or not v.get('latin'):
                continue
            latin = v['latin']
        else:
            latin = str(v)
        latin = re.sub(r'\s+', ' ', latin.strip().lower())
        if latin:
            try:
                out[b] = (latin, ke_jawa(latin)[0])
            except ValueError:
                pass
    return out


def main():
    import cv2, numpy as np, torch
    import onnxruntime as ort
    ort.set_default_logger_severity(3)
    import rujukan_scanner as ruj
    import pipeline_cerdas as cerdas
    ap = argparse.ArgumentParser()
    ap.add_argument('masukan', nargs='+')
    ap.add_argument('--visual', nargs='*', default=[])
    a = ap.parse_args()
    berkas = [f for pola in a.masukan for f in sorted(glob.glob(pola))]
    sumber = {os.path.splitext(os.path.basename(f))[0]: muat_masukan(f) for f in berkas}
    draf = {r['berkas']: r for r in json.load(open(os.path.join(D, 'draf.json'), encoding='utf8'))}
    visual = {}
    for f in a.visual:
        for pola in [f]:
            for g in glob.glob(pola):
                for b, v in json.load(open(g, encoding='utf8')).items():
                    if v == 'cocok':
                        visual[b] = visual.get(b, 0) + 1
    # satu label per potongan: bila ada beberapa sumber, pilih yang cocok dengan sumber lain, selain itu yang pertama
    semua = {}
    for nama, d in sumber.items():
        for b, (latin, aksara) in d.items():
            semua.setdefault(b, []).append((nama, latin, aksara))
    kolam = [x[2] for v in semua.values() for x in v]
    rng = random.Random(0)
    _visual = re.compile('(' + ruj._CL + ')ꦺ')

    def ke_visual(s):
        return _visual.sub(r'ꦺ\1', s)

    def loss(lp, ids):
        if lp.shape[0] < len(ids) + sum(1 for i in range(1, len(ids)) if ids[i] == ids[i - 1]):
            return None
        l = torch.nn.functional.ctc_loss(lp, torch.tensor([ids]), torch.tensor([lp.shape[0]]), torch.tensor([len(ids)]), blank=0, reduction='sum', zero_infinity=False)
        v = float(l) / len(ids)
        return v if np.isfinite(v) else None

    def ids_dari(teks):
        return [ruj.VOCAB.index(c) + 1 for c in ke_visual(teks) if c in ruj.VOCAB]

    hasil, ringkas = {}, {}
    for b, daftar in semua.items():
        pb = os.path.join(D, 'potongan', b)
        if not os.path.exists(pb):
            continue
        g = cv2.imdecode(np.fromfile(pb, np.uint8), cv2.IMREAD_GRAYSCALE)
        lps = []
        for x in (g, 255 - g):
            lg = ruj.crnn.run(None, {'gambar': ruj.ke_input(x)[None, None]})[0][0]
            lps.append(torch.log_softmax(torch.from_numpy(lg), -1)[:, None])
        for nama, latin, aksara in daftar:
            sah = bool(aksara) and cerdas.validitas(aksara) >= 0.85 and len(aksara) >= 2
            bukti = []
            ids = ids_dari(aksara)
            if ids:
                nilai = [loss(lp, ids) for lp in lps]
                nilai = [v for v in nilai if v is not None]
                if nilai:
                    mine = min(nilai)
                    pemanding = [t for t in kolam if t != aksara and 0.5 * len(aksara) <= len(t) <= 2 * len(aksara)]
                    rng.shuffle(pemanding)
                    lawan = []
                    for t in pemanding[:60]:
                        i2 = ids_dari(t)
                        v = [loss(lp, i2) for lp in lps] if i2 else []
                        v = [z for z in v if z is not None]
                        if v:
                            lawan.append(min(v))
                    if len(lawan) >= 10 and sum(mine < z for z in lawan) / len(lawan) >= AMBANG_DECOY:
                        bukti.append('decoy')
            d = draf.get(b)
            if d and d.get('draf') and (d.get('yakin_latin') or 0) >= 0.8 and cer(aksara, d['draf']) <= AMBANG_PAPAN:
                bukti.append('papan')
            if any(n2 != nama and cer(aksara, a2) <= AMBANG_SUMBER2 for n2, _, a2 in daftar):
                bukti.append('sumber2')
            if visual.get(b):
                bukti.append('visual')
            tier = tentukan_tier(bukti, sah)
            hasil.setdefault(b, dict(latin=latin, aksara=aksara, sumber=nama, bukti=bukti, tier=tier, sah=sah))
            ringkas.setdefault(nama, {'terpercaya': 0, 'periksa': 0, 'buang': 0})[tier] += 1
            if tier == 'terpercaya':
                hasil[b] = dict(latin=latin, aksara=aksara, sumber=nama, bukti=bukti, tier=tier, sah=sah)
    json.dump(hasil, open(os.path.join(D, 'hasil_diperiksa.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    n = len(hasil)
    t = {k: sum(1 for v in hasil.values() if v['tier'] == k) for k in ('terpercaya', 'periksa', 'buang')}
    print(f'label diperiksa: {n} | terpercaya {t["terpercaya"]} | perlu pencocokan bentuk {t["periksa"]} | dibuang {t["buang"]}')
    for nama, r in ringkas.items():
        tot = sum(r.values())
        print(f'  {nama}: {tot} label, lolos penuh {r["terpercaya"]} ({r["terpercaya"] / max(tot, 1):.0%}), perlu cek {r["periksa"]}, buang {r["buang"]}')
    bukti_hitung = {}
    for v in hasil.values():
        for k in v['bukti']:
            bukti_hitung[k] = bukti_hitung.get(k, 0) + 1
    print('bukti yang muncul:', bukti_hitung)
    print('hasil ->', os.path.join(D, 'hasil_diperiksa.json'))


if __name__ == '__main__':
    main()
