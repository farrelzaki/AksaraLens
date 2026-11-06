# Ekspor label nyata TERPERCAYA (hasil scripts/periksa_label.py) menjadi data latih notebook v4 (L4a, docs/RENCANA_SCANNER_FINAL.md).
# Hanya tier "terpercaya" yang ikut. Dibagi per FOTO sumber (85% latih, 15% val) supaya potongan dari foto yang sama tidak bocor.
# Polaritas tiap potongan dipilih dengan CTC paksa pembaca v2: arah (asli atau dibalik) yang paling cocok dengan labelnya, lalu
# disimpan sebagai tinta gelap di latar terang, sama dengan masukan pembaca.
# Pakai: python -X utf8 scripts/ekspor_label_latih.py      -> docs/random/data_nyata_v4.zip (unggah ke Drive aksaralens/)
# Tes:   python -X utf8 -m unittest scripts/test_ekspor_label_latih.py
import csv, io, json, os, random, re, sys, zipfile
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
D = os.path.join(AKAR, 'data/label_nyata')
KELUAR = os.path.join(AKAR, 'docs/random/data_nyata_v4.zip')
PORSI_VAL = 0.15


def foto_dari(berkas):
    """'F131_00.png' -> 'F131' (potongan dari foto yang sama berbagi awalan)."""
    return re.sub(r'_\d+\.png$', '', berkas)


def bagi_per_foto(berkas, porsi_val=PORSI_VAL, seed=0):
    """-> {berkas: 'latih'|'val'}; semua potongan satu foto berada di bagian yang sama. Minimal satu foto val bila ada >= 2 foto."""
    foto = sorted({foto_dari(b) for b in berkas})
    random.Random(seed).shuffle(foto)
    n_val = min(len(foto) - 1, max(1, round(len(foto) * porsi_val))) if len(foto) >= 2 else 0
    val = set(foto[:n_val])
    return {b: ('val' if foto_dari(b) in val else 'latih') for b in berkas}


def pilih_terpercaya(hasil):
    """hasil_diperiksa.json -> {berkas: aksara} hanya tier terpercaya dan sah."""
    return {b: v['aksara'] for b, v in hasil.items() if v.get('tier') == 'terpercaya' and v.get('sah') and v.get('aksara')}


def main():
    import cv2, numpy as np, torch
    import onnxruntime as ort
    ort.set_default_logger_severity(3)
    import rujukan_scanner as ruj
    hasil = json.load(open(os.path.join(D, 'hasil_diperiksa.json'), encoding='utf8'))
    label = pilih_terpercaya(hasil)
    if not label:
        sys.exit('Belum ada label terpercaya. Jalankan scripts/periksa_label.py dulu.')
    bagian = bagi_per_foto(list(label))
    _vis = re.compile('(' + ruj._CL + ')ꦺ')

    def skor(g, teks):
        ids = [ruj.VOCAB.index(c) + 1 for c in _vis.sub(r'ꦺ\1', teks) if c in ruj.VOCAB]
        lg = ruj.crnn.run(None, {'gambar': ruj.ke_input(g)[None, None]})[0][0]
        lp = torch.log_softmax(torch.from_numpy(lg), -1)[:, None]
        if lp.shape[0] < len(ids):
            return float('inf')
        return float(torch.nn.functional.ctc_loss(lp, torch.tensor([ids]), torch.tensor([lp.shape[0]]), torch.tensor([len(ids)]),
                                                  blank=0, reduction='sum', zero_infinity=True)) / max(len(ids), 1)

    baris, dibalik = [], 0
    with zipfile.ZipFile(KELUAR, 'w', zipfile.ZIP_DEFLATED) as z:
        for b in sorted(label):
            g = cv2.imdecode(np.fromfile(os.path.join(D, 'potongan', b), np.uint8), cv2.IMREAD_GRAYSCALE)
            if g is None:
                continue
            if skor(255 - g, label[b]) < skor(g, label[b]):
                g, dibalik = 255 - g, dibalik + 1
            z.writestr('gambar/' + b, cv2.imencode('.png', g)[1].tobytes())
            baris.append(dict(file='gambar/' + b, teks=label[b], bagian=bagian[b], foto=foto_dari(b)))
        s = io.StringIO()
        w = csv.DictWriter(s, ['file', 'teks', 'bagian', 'foto'])
        w.writeheader()
        w.writerows(baris)
        z.writestr('label.csv', s.getvalue())
    n_val = sum(r['bagian'] == 'val' for r in baris)
    print(f'{len(baris)} potongan terpercaya ({len(baris) - n_val} latih, {n_val} val, {dibalik} dibalik ke tinta gelap) -> {KELUAR}')


if __name__ == '__main__':
    main()
