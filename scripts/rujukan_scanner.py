# Pipeline scanner persis notebook Model 2 (sel 11, 14, 23, 36, 39), memakai ONNX yang sama.
# Pakai: python -I -X utf8 scripts/rujukan_scanner.py <akar-repo> <gambar>
# Butuh: numpy, opencv-python, onnxruntime. Keluaran JSON: sudut, kotak baris, teks + keyakinan.
import sys, os, json, re, cv2, numpy as np, onnxruntime as ort
# Bisa diimpor (scripts/uji_set_c.py); AKSARALENS_MODEL = folder ONNX lain untuk membandingkan versi model.
R = sys.argv[1] if __name__ == '__main__' else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.environ.get('AKSARALENS_MODEL') or R + '/public/models'
meta = json.load(open(R + '/src/ml/model2/scanner_charset.json', encoding='utf-8'))
VOCAB = meta['charset'][1:]; IDX2CHAR = {i + 1: c for i, c in enumerate(VOCAB)}
LINE_H = 64; DET_SISI = 1024; DET_SKALA = 4; INTI = 0.5
NG = 'ꦲꦤꦕꦫꦏꦢꦠꦱꦮꦭꦥꦝꦗꦪꦚꦩꦒꦧꦛꦔ'; TALING = 'ꦺ'; PANGKON = '꧀'
_C = '[' + NG + ']'; _CL = '(?:' + _C + ')(?:' + PANGKON + _C + ')*[ꦽꦾꦿ]*'
to_logical = lambda s: re.sub(TALING + '(' + _CL + ')', r'\1' + TALING, s)
def normalisasi_polaritas(gray):
    _, b = cv2.threshold(cv2.GaussianBlur(gray, (5, 5), 0), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return 255 - gray if (b == 0).mean() > 0.5 else gray
def masker_tinta(gray):
    h, w = gray.shape; blk = max(15, (min(h, w) // 20) | 1)
    m = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, blk, 12)
    return cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
def putar(img, ang, border):
    h, w = img.shape[:2]; M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderValue=border)
def cari_sudut(mask):
    s = 800 / max(mask.shape)
    small = cv2.resize(mask, None, fx=s, fy=s, interpolation=cv2.INTER_AREA) if s < 1 else mask
    best, best_a = -1, 0.0
    for a in np.arange(-10, 10.01, 0.5):
        v = putar(small, a, 0).sum(1).astype(np.float64).var()
        if v > best: best, best_a = v, a
    return best_a
det = ort.InferenceSession(MODEL + '/aksaralens_detektor_baris.onnx')
crnn = ort.InferenceSession(MODEL + '/aksaralens_scanner.onnx')
def kotak_detektor(gray, ambang=0.5):
    s = DET_SISI / max(gray.shape)
    g = cv2.resize(gray, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    H, W = g.shape; Hp, Wp = (H + 31) // 32 * 32, (W + 31) // 32 * 32
    g = cv2.copyMakeBorder(g, 0, Hp - H, 0, Wp - W, cv2.BORDER_CONSTANT, value=255)
    x = ((255 - g.astype(np.float32)) / 255.0)[None, None]
    p = 1 / (1 + np.exp(-det.run(None, {'halaman': x})[0][0, 0]))
    m = (p > ambang).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8); kotak = []
    for j in range(1, n):
        x0, y0, w, h = st[j, :4]
        if w < 3 or st[j, cv2.CC_STAT_AREA] < 6: continue
        cy, hh = (y0 + h / 2) * DET_SKALA, h * DET_SKALA / INTI
        kotak.append(((x0 * DET_SKALA) / s, (cy - hh / 2) / s, ((x0 + w) * DET_SKALA) / s, (cy + hh / 2) / s))
    return sorted(kotak, key=lambda k: (k[1], k[0]))
def ke_input(gray, max_w=4000):
    h, w = gray.shape; nw = max(8, min(max_w, int(round(w * LINE_H / h))))
    g = cv2.resize(gray, (nw, LINE_H), interpolation=cv2.INTER_AREA).astype(np.float32)
    lo, hi = np.percentile(g, 2), np.percentile(g, 98)
    return np.clip((hi - g) / max(hi - lo, 1.0), 0, 1).astype(np.float32)
if __name__ == '__main__':
    img = cv2.imread(sys.argv[2]); gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = normalisasi_polaritas(gray); ang = cari_sudut(masker_tinta(gray)); gray = putar(gray, ang, 255)
    kotak = kotak_detektor(gray); H, W = gray.shape; out = []
    for x0, y0, x1, y1 in kotak:
        h = y1 - y0; m = 0.05 * h
        a, b = int(max(0, y0 - m)), int(min(H, y1 + m)); c, d = int(max(0, x0 - h * 0.3)), int(min(W, x1 + h * 0.3))
        if b - a < 8 or d - c < 8: continue
        lg = crnn.run(None, {'gambar': ke_input(gray[a:b, c:d])[None, None]})[0][0]
        e = np.exp(lg - lg.max(-1, keepdims=True)); prob = e / e.sum(-1, keepdims=True); best = prob.argmax(-1)
        ids, prev = [], 0
        for t in best:
            if t != prev and t != 0: ids.append(int(t))
            prev = t
        yakin = float(prob.max(-1)[best != 0].mean()) if (best != 0).any() else 0.0
        out.append([to_logical(''.join(IDX2CHAR[i] for i in ids)), round(yakin, 3)])
    print(json.dumps(dict(sudut=float(ang), kotak=[[round(float(v)) for v in k] for k in kotak], baris=out), ensure_ascii=False, indent=1))
