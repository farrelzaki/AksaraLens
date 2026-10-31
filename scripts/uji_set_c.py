# Bangku uji scanner pada foto nyata (Set C). Lihat docs/RENCANA_SCANNER_CERDAS.md.
# Pakai: python -X utf8 scripts/uji_set_c.py [--pipeline v2|cerdas] [--split pengembangan|uji|semua]
#        [--buka-uji] [--json keluaran.json] [--rinci]
# Foto ada di docs/random/set_c dan docs/random/set_c_negatif (gitignored). Split "uji" dikunci:
# hanya diukur dengan --buka-uji, di gerbang akhir. AKSARALENS_MODEL = folder ONNX versi lain.
import argparse, csv, json, os, re, sys, time
import cv2, numpy as np

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
import rujukan_scanner as ruj  # noqa: E402
import pipeline_cerdas as cerdas  # noqa: E402

SISI_MAKS = 2048  # sama dengan scan.ts

KONSONAN = set(ruj.NG)
PANYIGEG = set('ꦁꦂꦃ')


def jarak(a, b):
    p = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        c = [i]
        for j, y in enumerate(b, 1):
            c.append(min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (x != y)))
        p = c
    return p[-1]


def suku_kata(teks):
    # Satu suku = konsonan + tanda sesudahnya. Pangkon menempel ke suku sebelumnya, pasangan jadi suku baru.
    hasil = []
    for c in teks:
        if c in KONSONAN or not hasil:
            hasil.append(c)
        else:
            hasil[-1] += c
    return hasil


def muat_abu(meta):
    a = cv2.imdecode(np.fromfile(os.path.join(AKAR, 'docs/random', meta['folder'], meta['file']), np.uint8), 1)
    g = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY)
    s = SISI_MAKS / max(g.shape)
    return (cv2.resize(g, None, fx=s, fy=s, interpolation=cv2.INTER_AREA) if s < 1 else g), s


def baris_v2(gray):
    # Pipeline produksi sekarang (scan.ts): polaritas global -> deskew -> detektor -> baca tiap kotak.
    g = ruj.normalisasi_polaritas(gray)
    sudut = ruj.cari_sudut(ruj.masker_tinta(g))
    g = ruj.putar(g, sudut, 255)
    out = []
    for k in ruj.kotak_detektor(g):
        t, y = cerdas.baca_kotak(g, k)
        if t:
            out.append(dict(teks=t, yakin=y, kotak=list(k), status='TERIMA'))
    return out


def tumpang(a, b):
    # Aturan pemisahan baris notebook: tinggi dan lebar kebenaran tertutup >= 50%.
    th = min(a[3], b[3]) - max(a[1], b[1])
    tw = min(a[2], b[2]) - max(a[0], b[0])
    return th > 0 and tw > 0 and th / (b[3] - b[1]) >= 0.5 and tw / (b[2] - b[0]) >= 0.5


def nilai_foto(hasil, kebenaran):
    tampil = [b for b in hasil if b['status'] != 'TOLAK']
    gabung = ''.join(b['teks'] for b in tampil)
    return dict(
        cer=min(jarak(gabung, kebenaran) / len(kebenaran), 1.0),
        benar_suku=max(0, len(suku_kata(kebenaran)) - jarak(suku_kata(gabung), suku_kata(kebenaran))),
        n_suku=len(suku_kata(kebenaran)),
        tepat=gabung == kebenaran,
    )


def ringkas(rows):
    if not rows:
        return None
    n = len(rows)
    return dict(
        n=n,
        cer20=sum(r['cer'] <= 0.2 for r in rows) / n,
        cer50=sum(r['cer'] <= 0.5 for r in rows) / n,
        tepat=sum(r['tepat'] for r in rows) / n,
        akurasi_suku=sum(r['benar_suku'] for r in rows) / sum(r['n_suku'] for r in rows),
        cer_rata=sum(r['cer'] for r in rows) / n,
    )


def persen(x):
    return f'{x * 100:5.1f}%'


def cetak(judul, r):
    if r:
        print(f"{judul:<30} n={r['n']:<3} CER<=.2 {persen(r['cer20'])}  CER<=.5 {persen(r['cer50'])}  "
              f"tepat {persen(r['tepat'])}  suku {persen(r['akurasi_suku'])}  CER {r['cer_rata']:.2f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pipeline', default='cerdas', choices=['v2', 'cerdas'])
    ap.add_argument('--split', default='pengembangan', choices=['pengembangan', 'uji', 'semua'])
    ap.add_argument('--buka-uji', action='store_true')
    ap.add_argument('--json')
    ap.add_argument('--rinci', action='store_true')
    a = ap.parse_args()
    if a.split != 'pengembangan' and not a.buka_uji:
        sys.exit('Split uji dikunci. Pakai --buka-uji hanya di gerbang akhir atau untuk baseline.')

    META = json.load(open(os.path.join(AKAR, 'scripts/set_c_meta.json'), encoding='utf-8'))
    LABEL = {r['id']: r for r in csv.DictReader(open(os.path.join(AKAR, 'docs/random/set_c/label_set_c.csv'), encoding='utf-8'))}
    fungsi = baris_v2 if a.pipeline == 'v2' else cerdas.baca_foto

    foto, bingkai, negatif, per_foto = [], [], [], {}
    gt_total = gt_ketemu = keluar_total = keluar_sampah = 0
    waktu = []
    for i, m in META.items():
        if a.split != 'semua' and m['split'] != a.split:
            continue
        gray, s = muat_abu(m)
        t0 = time.time()
        hasil = fungsi(gray)
        waktu.append(time.time() - t0)
        tampil = [b for b in hasil if b['status'] != 'TOLAK']
        keluar_total += len(tampil)
        if m['jenis'] == 'negatif':
            lolos = not tampil
            negatif.append(lolos)
            keluar_sampah += len(tampil)
            per_foto[i] = dict(jenis='negatif', lolos=lolos, baris=[(b['teks'], round(b['yakin'], 2), b['status']) for b in hasil])
            if a.rinci:
                print(i, 'NEG', 'lolos' if lolos else 'GAGAL', [(b['teks'][:14], round(b['yakin'], 2), b['status'][0]) for b in hasil][:6])
            continue

        T = LABEL[i]['teks_unicode'].replace(' ', '')
        n = nilai_foto(hasil, T)
        n.update(jenis=m['jenis'], hias=m['hias'])
        foto.append(n)
        rinci_bingkai = None
        if m['kotak']:
            H, W = gray.shape
            gt = [(b[0] * W, b[1] * H, b[2] * W, b[3] * H) for b in m['kotak']]
            gt_total += len(gt)
            gt_ketemu += sum(any(tumpang(b['kotak'], g) for b in tampil) for g in gt)
            keluar_sampah += sum(not any(tumpang(g, b['kotak']) or tumpang(b['kotak'], g) for g in gt) for b in tampil)
            # Simulasi "Atur area": pengguna membingkai baris dengan kelonggaran 15%.
            x0 = min(g[0] for g in gt); y0 = min(g[1] for g in gt); x1 = max(g[2] for g in gt); y1 = max(g[3] for g in gt)
            mx, my = (x1 - x0) * 0.15, (y1 - y0) * 0.15
            pot = gray[int(max(0, y0 - my)):int(min(H, y1 + my)), int(max(0, x0 - mx)):int(min(W, x1 + mx))]
            if a.pipeline == 'v2':
                hb = baris_v2(pot)
            else:
                hb = cerdas.baca_foto(pot, area_dipilih=True)
            nb = nilai_foto(hb, T)
            nb.update(jenis=m['jenis'], hias=m['hias'])
            bingkai.append(nb)
            rinci_bingkai = ''.join(b['teks'] for b in hb if b['status'] != 'TOLAK')
        per_foto[i] = dict(n, kebenaran=T, baris=[(b['teks'], round(b['yakin'], 2), b['status']) for b in hasil], bingkai=rinci_bingkai)
        if a.rinci:
            print(i, m['jenis'][:3], f"CER {n['cer']:.2f}", 'T', T[:20], '|', ''.join(b['teks'] for b in tampil)[:30], '| area', (rinci_bingkai or '')[:26])

    print(f"\n== pipeline {a.pipeline} · split {a.split} ==")
    cetak('Foto utuh, semua positif', ringkas(foto))
    cetak('  adegan', ringkas([r for r in foto if r['jenis'] == 'adegan']))
    cetak('  rapat', ringkas([r for r in foto if r['jenis'] == 'rapat']))
    cetak('  font hias', ringkas([r for r in foto if r['hias']]))
    cetak('  font biasa', ringkas([r for r in foto if not r['hias']]))
    cetak('Dibingkai pengguna (Atur area)', ringkas(bingkai))
    if gt_total:
        print(f'Recall baris Jawa: {gt_ketemu}/{gt_total} = {persen(gt_ketemu / gt_total)}')
    if keluar_total:
        print(f'Baris sampah: {keluar_sampah}/{keluar_total} = {persen(keluar_sampah / keluar_total)}')
    if negatif:
        print(f'Foto tanpa aksara ditolak: {sum(negatif)}/{len(negatif)} = {persen(sum(negatif) / len(negatif))}')
    print(f'Waktu rata-rata (CPU komputer ini): {sum(waktu) / len(waktu):.2f} dtk')
    if a.json:
        json.dump(dict(pipeline=a.pipeline, split=a.split, foto=per_foto), open(a.json, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
