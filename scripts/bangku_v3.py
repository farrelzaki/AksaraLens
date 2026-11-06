# Bangku uji untuk pipeline scanner v3+ (detektor PP-OCRv5 + klasifikator aksara + pembaca v2), memasang komponen itu ke
# scripts/rujukan_scanner.py lalu menjalankan skrip uji apa adanya. Meniru src/ml/model2/scan.ts.
# Pakai:  python -X utf8 scripts/bangku_v3.py uji_set_c.py [argumen skrip uji]
#         python -X utf8 scripts/bangku_v3.py uji_nusa.py
# Variabel lingkungan:
#   PANJANG=640        sisi panjang masukan detektor (produksi: 640)
#   AMBANG_JAWA=0.5    ambang klasifikator per kotak
#   VARIAN=            daftar varian pembacaan L1 dipisah koma, dicoba hanya bila bacaan pertama belum TERIMA:
#                      goresan, clahe, sauvola  (kosong = perilaku produksi v3)
#   ESKALASI=          terima|pakai|ada: bila hasil pada PANJANG belum punya baris TERIMA (terima) / baris non-TOLAK (pakai),
#                      ulangi pada ESKALASI_PANJANG (bawaan 960) dan ambil hasil yang lebih meyakinkan
#   TARGET_GORESAN=    lebar goresan sasaran (piksel pada tinggi 64) untuk varian "goresan"
#   BAHASA=1           dekoder bahasa L5 (model_bahasa.py, sama dengan bahasa.ts): teks baris yang lolos dibetulkan
#                      beam search + model bahasa; status tetap dari bacaan greedy. BAHASA=0 mematikan.
# Model dibaca dari public/models (atau AKSARALENS_MODEL) dan docs/random/klasifikator.
import os, runpy, sys
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
import cv2, numpy as np, onnxruntime as ort
ort.set_default_logger_severity(3)
import rujukan_scanner as ruj, pipeline_cerdas as cerdas, olah_goresan as og

MODEL = os.environ.get('AKSARALENS_MODEL') or os.path.join(AKAR, 'public/models')
PANJANG = int(os.environ.get('PANJANG', '640'))
AMBANG_JAWA = float(os.environ.get('AMBANG_JAWA', '0.5'))
VARIAN = [v for v in os.environ.get('VARIAN', '').split(',') if v]
TARGET = float(os.environ['TARGET_GORESAN']) if os.environ.get('TARGET_GORESAN') else None
_prov = ['CPUExecutionProvider']
_det = ort.InferenceSession(os.path.join(MODEL, 'aksaralens_detektor_pp.onnx'), providers=_prov)
_kl = ort.InferenceSession(os.path.join(MODEL, 'aksaralens_klasifikator.onnx'), providers=_prov)
MEAN = np.array([.485, .456, .406], np.float32)[:, None, None]
STD = np.array([.229, .224, .225], np.float32)[:, None, None]


def kotak_pp(gray, ambang=0.3, skor=0.5):
    H, W = gray.shape
    k = PANJANG / max(H, W)
    h, w = max(32, round(H * k / 32) * 32), max(32, round(W * k / 32) * 32)
    a = cv2.resize(gray, (w, h), interpolation=cv2.INTER_AREA if k < 1 else cv2.INTER_LINEAR)
    x = (np.repeat(a[None], 3, 0).astype(np.float32) / 255 - MEAN) / STD
    p = _det.run(None, {_det.get_inputs()[0].name: x[None]})[0][0, 0]
    n, lab, st, _ = cv2.connectedComponentsWithStats((p > ambang).astype(np.uint8), connectivity=4)
    out = []
    fx, fy = W / p.shape[1], H / p.shape[0]
    for i in range(1, n):
        x0, y0, bw, bh, ar = st[i]
        if bh < 3 or bw < 3 or p[lab == i].mean() < skor:
            continue
        d = 1.5 * ar / (2 * (bw + bh))
        out.append((max(0, (x0 - d) * fx), max(0, (y0 - d) * fy), min(W, (x0 + bw + d) * fx), min(H, (y0 + bh + d) * fy)))
    return out


def ke_input_kl(c):
    g = cv2.resize(np.asarray(c, np.float32), (160, 32), interpolation=cv2.INTER_AREA)
    lo, hi = np.percentile(g, 2), np.percentile(g, 98)
    return (np.clip((g - lo) / max(hi - lo, 1.0), 0, 1) * 255).round().astype(np.uint8)


def jawa(c):
    x = ke_input_kl(c).astype(np.float32)[None, None] / 255
    return 1 / (1 + np.exp(-_kl.run(None, {'potongan': x})[0][0]))


def kotak_detektor(g, *a, **kw):
    H, W = g.shape
    out = []
    for b in kotak_pp(g):
        h = b[3] - b[1]
        y0, y1 = int(max(0, b[1] - .05 * h)), int(min(H, b[3] + .05 * h))
        x0, x1 = int(max(0, b[0] - .3 * h)), int(min(W, b[2] + .3 * h))
        if y1 - y0 < 8 or x1 - x0 < 8:
            continue
        if jawa(g[y0:y1, x0:x1]) >= AMBANG_JAWA:
            out.append(b)
    return out


def terang_di_gelap(c):
    c8 = np.clip(c, 0, 255).astype(np.uint8)
    t, _ = cv2.threshold(c8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    m = c8 > t
    if m.all() or not m.any():
        return False
    ink = m if m.mean() < 0.5 else ~m
    return float(c8[ink].mean()) > float(c8[~ink].mean())


def buat_varian(nama, c):
    if nama == 'goresan':
        return og.samakan_goresan(c, TARGET) if TARGET else c
    if nama == 'clahe':
        return og.clahe(c)
    if nama == 'sauvola':
        return og.sauvola(c)
    raise ValueError(nama)


JUMLAH = [0]


def baca_dua_arah(gray, k, lurus=True, mode='foto'):
    c = cerdas.potong(gray, k)
    if c is None:
        return ('', 0.0)
    if lurus:
        c = cerdas.luruskan(c)
    if terang_di_gelap(c):
        c = 255 - c  # tinta gelap di latar terang
    hasil = [cerdas.baca_potongan(c)]
    JUMLAH[0] += 1
    if cerdas.nilai_status(hasil[0][0], hasil[0][1], mode) == 'TERIMA':
        return hasil[0]
    for nama in VARIAN:
        v = buat_varian(nama, c)
        if v is not c:
            hasil.append(cerdas.baca_potongan(v))
            JUMLAH[0] += 1
    hasil.append(cerdas.baca_potongan(255 - c))
    JUMLAH[0] += 1
    return max(hasil, key=lambda r: r[1])


ESKALASI = os.environ.get('ESKALASI', '')
ESKALASI_PANJANG = int(os.environ.get('ESKALASI_PANJANG', '960'))
_baca_foto_asli = cerdas.baca_foto


def skor_hasil(h):
    return sum(b['yakin'] * cerdas.konsonan(b['teks']) for b in h if b['status'] != 'TOLAK')


def baca_foto(gray, area_dipilih=False):
    global PANJANG
    h = _baca_foto_asli(gray, area_dipilih)
    if not ESKALASI or area_dipilih:
        return h
    if ESKALASI == 'ada':  # eskalasi hanya bila ada kotak Jawa yang terbaca tetapi belum ada TERIMA
        cukup = not h or any(b['status'] == 'TERIMA' for b in h)
    else:
        cukup = any(b['status'] == 'TERIMA' for b in h) if ESKALASI == 'terima' else any(b['status'] != 'TOLAK' for b in h)
    if cukup:
        return h
    asli, PANJANG = PANJANG, ESKALASI_PANJANG
    try:
        h2 = _baca_foto_asli(gray, area_dipilih)
    finally:
        PANJANG = asli
    return h2 if skor_hasil(h2) > skor_hasil(h) else h


ruj.kotak_detektor = kotak_detektor
cerdas.baca_dua_arah = baca_dua_arah
cerdas.baca_foto = baca_foto

# ---------- L5 dekoder bahasa (meniru scan.ts: baca() + rakitHasil) ----------
if os.environ.get('BAHASA', '1') != '0':
    import json as _json
    import model_bahasa as _mb
    _MODEL = _json.load(open(_mb.JSON_MODEL, encoding='utf8'))
    _CS = [''] + ruj.VOCAB
    _KOREKSI = {}  # bacaan greedy -> koreksi (kunci teks: cukup untuk bangku uji)
    _baca_potongan_asli = cerdas.baca_potongan

    def _baca_potongan(crop):
        teks, yakin = _baca_potongan_asli(crop)
        if cerdas.nilai_status(teks, yakin, 'area') != 'TOLAK':
            lg = ruj.crnn.run(None, {'gambar': ruj.ke_input(crop)[None, None]})[0][0]
            beam = _mb.dekode_beam(_mb.log_softmax(lg.astype(float).ravel().tolist(), lg.shape[1]), _CS, _MODEL)
            _KOREKSI[teks] = _mb.pilih_koreksi(teks, ruj.to_logical(beam), yakin, cerdas.nilai_status)
        return teks, yakin

    _baca_foto_l5 = cerdas.baca_foto

    def _baca_foto_bahasa(gray, area_dipilih=False):
        h = _baca_foto_l5(gray, area_dipilih)
        for b in h:
            if b['status'] != 'TOLAK' and _KOREKSI.get(b['teks']):
                b['teks'] = _KOREKSI[b['teks']]
        return h

    cerdas.baca_potongan = _baca_potongan
    cerdas.baca_foto = _baca_foto_bahasa
    cerdas.koreksi_bahasa = _KOREKSI.get  # dipakai uji_nusa.py

if __name__ == '__main__':
    skrip = sys.argv[1]
    sys.argv = [skrip] + sys.argv[2:]
    import atexit
    atexit.register(lambda: print('PEMBACAAN CRNN:', JUMLAH[0], '| VARIAN:', VARIAN or '-', '| TARGET_GORESAN:', TARGET))
    runpy.run_path(os.path.join(AKAR, 'scripts', skrip), run_name='__main__')
