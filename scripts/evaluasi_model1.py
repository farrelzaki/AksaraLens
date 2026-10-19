# Evaluasi Model 1: penolakan "bukan huruf" & pengaruh ambang keyakinan (hasil di docs/EVALUASI.md).
# Pra-proses = notebook Model 1 (terbukti sama dengan src/ml/model1/praproses.ts).
# Pakai: python -I -X utf8 scripts/evaluasi_model1.py <akar-repo> <folder-roboflow-yolov8> <font.ttf> <keluaran.json>
#   <folder-roboflow-yolov8>: hasil unzip dataset Roboflow (berisi test/images, test/labels).
# Butuh: numpy, opencv-python, onnxruntime, scikit-image, pillow.
import sys, glob, json, cv2, numpy as np, onnxruntime as ort
from PIL import Image, ImageDraw, ImageFont
from skimage.morphology import skeletonize
repo, real, font, out = sys.argv[1:5]
KELAS = json.load(open(repo + '/src/ml/model1/huruf_label.json', encoding='utf-8'))['kelas']
sess = ort.InferenceSession(repo + '/public/models/aksaralens_huruf.onnx')
E5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
def praproses(g0):
    g = cv2.GaussianBlur(g0, (3, 3), 0)
    _, m = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    if (m > 0).mean() > 0.5: m = 255 - m
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = st[:, cv2.CC_STAT_AREA] >= max(4, 0.0005 * m.size); keep[0] = False
    m = np.where(keep[lab], 255, 0).astype(np.uint8)
    ys, xs = np.where(m > 0)
    if len(xs) == 0: return None
    m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = m.shape; s = max(h, w); pad = int(round(s * 0.12)); S = s + 2 * pad
    sq = np.zeros((S, S), np.uint8); sq[(S - h) // 2:(S - h) // 2 + h, (S - w) // 2:(S - w) // 2 + w] = m
    k = cv2.resize(sq, (128, 128), interpolation=cv2.INTER_AREA) > 30
    k = cv2.dilate(skeletonize(k).astype(np.uint8), E5)
    return cv2.resize(k.astype(np.float32), (64, 64), interpolation=cv2.INTER_AREA)
def prob(g):
    x = praproses(g)
    if x is None: return None
    l = sess.run(None, {'gambar': x[None, None]})[0][0]; e = np.exp(l - l.max()); return e / e.sum()
rng = np.random.default_rng(2026)
# --- positif: potongan huruf dari split test Roboflow
NAMES = ['ba','ca','da','dha','ga','ha','ja','ka','la','ma','na','nga','nya','pa','ra','sa','ta','tha','wa','ya']
pos = []
for f in sorted(glob.glob(real + '/test/images/*')):
    img = cv2.imread(f); H, W = img.shape[:2]
    for ln in open(f.replace('images', 'labels').rsplit('.', 1)[0] + '.txt'):
        c, cx, cy, bw, bh = map(float, ln.split()[:5])
        x0, y0 = int(max(0, (cx - bw / 2) * W)), int(max(0, (cy - bh / 2) * H)); x1, y1 = int(min(W, (cx + bw / 2) * W)), int(min(H, (cy + bh / 2) * H))
        g = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
        if g.shape[0] >= 8 and g.shape[1] >= 8: pos.append((g, NAMES[int(c)]))
# --- negatif 1: coretan acak (gaya kanvas, tebal & jumlah goresan acak)
neg = {'coretan acak': [], 'sandhangan': [], 'setengah jadi': []}
for _ in range(300):
    W = H = 300; g = np.full((H, W), 255, np.uint8)
    for _ in range(int(rng.integers(1, 4))):
        pts = np.cumsum(rng.normal(0, 30, (int(rng.integers(2, 8)), 2)), 0) + 150
        cv2.polylines(g, [pts.astype(np.int32)], False, 0, int(rng.integers(4, 14)), cv2.LINE_AA)
    neg['coretan acak'].append(g)
# --- negatif 2: sandhangan / panyigeg / pangkon dirender dari font
SAND = ['ꦶ', 'ꦸ', 'ꦺ', 'ꦴ', 'ꦼ', 'ꦁ', 'ꦂ', 'ꦃ', '꧀']
for i in range(270):
    c = SAND[i % len(SAND)]; uk = int(rng.integers(120, 260))
    im = Image.new('L', (400, 400), 255); d = ImageDraw.Draw(im); fnt = ImageFont.truetype(font, uk)
    d.text((200, 200), c, font=fnt, fill=0, anchor='mm')
    g = np.array(im)
    if not (g < 128).any(): continue
    g = cv2.erode(g, np.ones((3, 3), np.uint8), iterations=int(rng.integers(0, 3)))
    M = cv2.getRotationMatrix2D((200, 200), float(rng.uniform(-15, 15)), 1.0); g = cv2.warpAffine(g, M, (400, 400), borderValue=255)
    neg['sandhangan'].append(g)
# --- negatif 3: huruf setengah jadi (separuh tinta potongan positif dihapus)
for g, _ in pos:
    g2 = g.copy(); h, w = g2.shape; sisi = int(rng.integers(0, 4))
    if sisi == 0: g2[:, w // 2:] = 255
    elif sisi == 1: g2[:, :w // 2] = 255
    elif sisi == 2: g2[h // 2:, :] = 255
    else: g2[:h // 2, :] = 255
    neg['setengah jadi'].append(g2)
P = [(prob(g), t) for g, t in pos]
N = {k: [p for p in (prob(g) for g in v) if p is not None] for k, v in neg.items()}
hasil = {'n_pos': len(P), 'n_neg': {k: len(v) for k, v in N.items()}, 'ambang': []}
for amb in [0.4, 0.5, 0.6, 0.7, 0.8, 0.9]:
    benar = np.mean([KELAS[p.argmax()] == t and p.max() >= amb for p, t in P])
    tolak = np.mean([KELAS[p.argmax()] == 'bukan' or p.max() < amb for p, _ in P])
    salah = 1 - benar - tolak
    r = {k: float(np.mean([KELAS[p.argmax()] == 'bukan' or p.max() < amb for p in v])) for k, v in N.items()}
    hasil['ambang'].append(dict(ambang=amb, benar=float(benar), ditolak=float(tolak), salah_huruf=float(salah), penolakan=r,
                                penolakan_semua=float(np.mean([KELAS[p.argmax()] == 'bukan' or p.max() < amb for v in N.values() for p in v]))))
# huruf apa yang diberikan model saat gagal menolak (ambang 0.6)
lolos = {}
for k, v in N.items():
    for p in v:
        if KELAS[p.argmax()] != 'bukan' and p.max() >= 0.6: lolos.setdefault(k, {}).setdefault(KELAS[p.argmax()], 0); lolos[k][KELAS[p.argmax()]] += 1
hasil['lolos_0_6'] = {k: dict(sorted(v.items(), key=lambda x: -x[1])[:5]) for k, v in lolos.items()}
json.dump(hasil, open(out, 'w'), indent=1)
for a in hasil['ambang']:
    print(f"ambang {a['ambang']:.1f} | positif: benar {a['benar']:.1%} ditolak {a['ditolak']:.1%} salah {a['salah_huruf']:.1%} | penolakan: " + ', '.join(f"{k} {v:.1%}" for k, v in a['penolakan'].items()) + f" | semua {a['penolakan_semua']:.1%}")
print('n', hasil['n_pos'], hasil['n_neg']); print('lolos@0.6', hasil['lolos_0_6'])
