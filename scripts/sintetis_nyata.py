# Data sintetis v4 (L3, docs/RENCANA_SCANNER_FINAL.md): baris aksara Jawa ASLI dari NusaAksara (bentuk huruf nyata, label benar)
# ditempel ke LATAR FOTO NYATA (teks aslinya dihapus dengan cv2.inpaint), dengan ketebalan goresan, polaritas, kontras, bayangan timbul,
# perspektif, blur, derau, dan JPEG yang bervariasi. Jalan di laptop (tanpa perenderan font Jawa, jadi tidak butuh raqm).
# Pakai:
#   python -X utf8 scripts/sintetis_nyata.py latar            # perpustakaan latar dari docs/random/foto_nyata/foto
#   python -X utf8 scripts/sintetis_nyata.py buat --n 6000    # sampel + label.json di docs/random/sintetis_v4/
#   python -X utf8 scripts/sintetis_nyata.py lembar           # lembar kontak 48 sampel
#   python -X utf8 scripts/sintetis_nyata.py ukur             # CER pembaca v2 pada sampel vs baris bersih
# Label disimpan dalam urutan LOGIS (taling setelah klaster), hanya karakter charset; ubah ke urutan tampak dengan ke_visual() bila melatih.
# 80 baris Nusa ditahan (heldout.json) untuk validasi; foto Set C tidak dipakai (hanya foto_nyata/foto).
import argparse, glob, json, os, random, sys, unicodedata
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
import cv2, numpy as np
import olah_goresan as og

NUSA = os.path.join(AKAR, 'docs/random/nusa')
FOTO = os.path.join(AKAR, 'docs/random/foto_nyata/foto')
LATAR = os.path.join(AKAR, 'docs/random/foto_nyata/latar')
KELUAR = os.path.join(AKAR, 'docs/random/sintetis_v4')
# Sebaran lebar goresan foto nyata (px pada tinggi 64): p10 2,1 / median 3,2 / p90 6,4 (diukur 5 Nov 2026), jauh lebih lebar dari buku (2,8-4,6)
GORESAN = [2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.3, 5.0, 5.8, 6.6]


def baca(p):
    b = np.fromfile(p, np.uint8)
    return cv2.imdecode(b, cv2.IMREAD_GRAYSCALE) if b.size else None


def tulis(p, g):
    cv2.imencode('.png', g)[1].tofile(p)


def label_bersih():
    """nama berkas baris -> transkripsi (NFC, hanya karakter charset)."""
    meta = json.load(open(os.path.join(AKAR, 'src/ml/model2/scanner_charset.json'), encoding='utf8'))
    ada = set(meta['charset'][1:])
    ind = json.load(open(os.path.join(NUSA, 'indeks.json'), encoding='utf8'))
    out = {}
    for r in ind['ocr']:
        t = ''.join(c for c in unicodedata.normalize('NFC', r['transcription']) if c in ada)
        if t:
            out[r['image'].split('/')[-1].split('?')[0]] = t
    return out


def split_nusa():
    """80 baris ditahan untuk validasi (urutan tetap), sisanya dipakai membuat sampel."""
    lab = label_bersih()
    nama = sorted(n for n in lab if os.path.exists(os.path.join(NUSA, 'baris', n)))
    random.Random(0).shuffle(nama)
    return nama[80:], nama[:80], lab


# ---------- latar ----------
def buat_latar(args):
    import bangku_v3 as bv  # detektor PP untuk menemukan teks yang dihapus
    bv.PANJANG = 960
    os.makedirs(LATAR, exist_ok=True)
    rng = random.Random(1)
    n = 0
    for nama in sorted(os.listdir(FOTO)):
        g = baca(os.path.join(FOTO, nama))
        if g is None:
            continue
        s = 1600 / max(g.shape)
        g = cv2.resize(g, None, fx=s, fy=s, interpolation=cv2.INTER_AREA) if s < 1 else g
        mask = np.zeros_like(g)
        for k in bv.kotak_pp(g, ambang=0.2, skor=0.3):
            h = k[3] - k[1]
            cv2.rectangle(mask, (int(k[0] - .4 * h), int(k[1] - .3 * h)), (int(k[2] + .4 * h), int(k[3] + .3 * h)), 255, -1)
        bersih = cv2.inpaint(g, mask, 5, cv2.INPAINT_TELEA)
        H, W = bersih.shape
        for _ in range(args.per_foto):
            h = rng.randint(70, 180)
            w = int(h * rng.uniform(2.5, 7))
            if h >= H or w >= W:
                continue
            y, x = rng.randint(0, H - h), rng.randint(0, W - w)
            # buang tempelan yang masih dominan bekas inpaint (hampir seluruhnya tertutup topeng)
            if (mask[y:y + h, x:x + w] > 0).mean() > 0.6:
                continue
            tulis(os.path.join(LATAR, f'{nama[:-4]}_{n:05d}.png'), bersih[y:y + h, x:x + w])
            n += 1
    print('tempelan latar', n, '->', LATAR)


# ---------- sampel ----------
def topeng_tinta(g):
    """Baris bersih (tinta gelap) -> topeng lunak 0..1 dan potong ke tinta."""
    lo, hi = np.percentile(g, 2), np.percentile(g, 98)
    m = np.clip((hi - g.astype(np.float32)) / max(hi - lo, 1.0), 0, 1)
    ys, xs = np.where(m > 0.35)
    if not len(xs):
        return None
    return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def atur_goresan(m, target):
    """Tebalkan atau tipiskan topeng sampai lebar goresannya mendekati target (px pada tinggi 64)."""
    kecil = cv2.resize(m, (max(8, round(m.shape[1] * 64 / m.shape[0])), 64), interpolation=cv2.INTER_AREA)
    sekarang = og.lebar_goresan(np.uint8(255 - kecil * 255))
    if sekarang is None:
        return m
    selisih = target - sekarang
    r = int(round(abs(selisih) / 1.6))  # tiap langkah dilasi/erosi 3x3 mengubah lebar ~2 px; 1,6 agar konservatif
    if r < 1:
        return m
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    kecil = cv2.dilate(kecil, k, iterations=r) if selisih > 0 else cv2.erode(kecil, k, iterations=min(r, 2))
    return cv2.resize(kecil, (m.shape[1], m.shape[0]), interpolation=cv2.INTER_LINEAR)


def efek_foto(a, rng):
    h, w = a.shape
    if rng.random() < 0.5:
        g = 0.025
        src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
        dst = src + np.float32([[rng.uniform(-g, g) * w, rng.uniform(-g, g) * h * 2] for _ in range(4)])
        a = cv2.warpPerspective(a, cv2.getPerspectiveTransform(src, dst), (w, h), borderMode=cv2.BORDER_REPLICATE)
    if rng.random() < 0.25:  # silau
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        xx, yy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
        a = a + rng.uniform(0.1, 0.35) * np.exp(-((xx - cx) ** 2 / (2 * (rng.uniform(0.1, 0.4) * w) ** 2) + (yy - cy) ** 2 / (2 * (rng.uniform(0.3, 1) * h) ** 2)))
    r = rng.random()
    if r < 0.35:
        k = rng.choice([3, 5])
        a = cv2.GaussianBlur(a, (k, k), 0)
    elif r < 0.5:
        a = cv2.blur(a, (rng.choice([3, 5, 7]), 1))
    if rng.random() < 0.6:
        a = a + np.random.default_rng(rng.randrange(1 << 30)).normal(0, rng.uniform(0.005, 0.04), a.shape).astype(np.float32)
    out = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    if rng.random() < 0.6:
        out = cv2.imdecode(cv2.imencode('.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, rng.randint(30, 90)])[1], cv2.IMREAD_GRAYSCALE)
    return out


def satu_sampel(g_bersih, latar_g, rng):
    m = topeng_tinta(g_bersih)
    if m is None:
        return None
    m = atur_goresan(m, rng.choice(GORESAN))
    tinggi = rng.choice([36, 48, 60, 80, 100, 130])
    lebar = max(16, int(m.shape[1] * tinggi / m.shape[0]))
    if lebar > 2400:
        return None
    m = cv2.resize(m, (lebar, tinggi), interpolation=cv2.INTER_AREA)
    ka, ki = int(tinggi * rng.uniform(0.05, 0.9)), int(tinggi * rng.uniform(0.05, 0.9))
    at, ba = int(tinggi * rng.uniform(0.08, 0.35)), int(tinggi * rng.uniform(0.08, 0.35))
    m = cv2.copyMakeBorder(m, at, ba, ka, ki, cv2.BORDER_CONSTANT, value=0)
    H, W = m.shape
    # latar: tempelan nyata diskalakan menutup H x W lalu dipotong acak
    s = max(H / latar_g.shape[0], W / latar_g.shape[1]) * rng.uniform(1.0, 1.6)
    L = cv2.resize(latar_g, None, fx=s, fy=s, interpolation=cv2.INTER_LINEAR if s > 1 else cv2.INTER_AREA).astype(np.float32) / 255
    y, x = rng.randint(0, L.shape[0] - H), rng.randint(0, L.shape[1] - W)
    L = L[y:y + H, x:x + W]
    if rng.random() < 0.5:
        L = L[:, ::-1]
    bg = float(np.median(L))
    # warna tinta: lawan latar dengan kontras acak; polaritas mengikuti latar, sering terbalik dari buku (terang di gelap)
    delta = rng.uniform(0.3, 0.8) if rng.random() > 0.15 else rng.uniform(0.14, 0.3)
    ink = bg + delta if (bg < 0.5 and rng.random() < 0.85) or bg < 0.2 else bg - delta
    ink = float(np.clip(ink, 0.0, 1.0))
    if abs(ink - bg) < 0.12:
        ink = 1.0 if bg < 0.5 else 0.0
    if rng.random() < 0.3:  # huruf timbul: bayangan bergeser
        dx, dy = rng.randint(-4, 4), rng.randint(1, 4)
        sh = cv2.GaussianBlur(cv2.warpAffine(m, np.float32([[1, 0, dx], [0, 1, dy]]), (W, H)), (3, 3), 0) * rng.uniform(0.3, 0.7)
        L = L * (1 - sh) + bg * 0.35 * sh
    tinta = ink + rng.uniform(0, 0.05) * cv2.resize(np.random.default_rng(rng.randrange(1 << 30)).normal(0, 1, (max(2, H // 8), max(2, W // 8))).astype(np.float32), (W, H))
    a = L * (1 - m) + tinta * m
    return efek_foto(a, rng)


def buat(args):
    train, _, lab = split_nusa()
    pecahan = sorted(glob.glob(os.path.join(LATAR, '*.png')))
    if not pecahan:
        sys.exit('jalankan "latar" dulu')
    rng = random.Random(args.seed)
    os.makedirs(KELUAR + '/gambar', exist_ok=True)
    cache = {}
    label, n, gagal = {}, 0, 0
    while n < args.n and gagal < 5 * args.n:
        nama = rng.choice(train)
        if nama not in cache:
            cache[nama] = baca(os.path.join(NUSA, 'baris', nama))
            if len(cache) > 300:
                cache.pop(next(iter(cache)))
        g = cache[nama]
        lt = baca(rng.choice(pecahan))
        if g is None or lt is None:
            gagal += 1
            continue
        s = satu_sampel(g, lt, rng)
        if s is None:
            gagal += 1
            continue
        f = f'v4_{n:06d}.png'
        tulis(os.path.join(KELUAR, 'gambar', f), s)
        label[f] = lab[nama]
        n += 1
    json.dump(label, open(KELUAR + '/label.json', 'w', encoding='utf8'), ensure_ascii=False)
    json.dump(split_nusa()[1], open(KELUAR + '/heldout.json', 'w'))
    print('sampel', n, '->', KELUAR)


def lembar(args):
    label = json.load(open(KELUAR + '/label.json', encoding='utf8'))
    nama = sorted(label)[:48]
    baris = []
    for i in range(0, len(nama), 2):
        sel = []
        for f in nama[i:i + 2]:
            g = baca(os.path.join(KELUAR, 'gambar', f))
            g = cv2.resize(g, (640, max(24, int(g.shape[0] * 640 / g.shape[1]))), interpolation=cv2.INTER_AREA)
            kanvas = np.full((70, 640), 128, np.uint8)
            kanvas[:min(70, g.shape[0])] = g[:70]
            sel.append(kanvas)
        baris.append(np.hstack(sel + [np.full((70, 640), 128, np.uint8)] * (2 - len(sel))))
    tulis(KELUAR + '/lembar.png', np.vstack(baris))
    print('lembar ->', KELUAR + '/lembar.png')


def ukur(args):
    import pipeline_cerdas as cerdas
    import uji_set_c as uc
    import rujukan_scanner as ruj  # noqa: F401
    train, held, lab = split_nusa()
    label = json.load(open(KELUAR + '/label.json', encoding='utf8'))
    rng = random.Random(7)

    def cer(g, ref):
        hasil = max(cerdas.baca_potongan(g), cerdas.baca_potongan(255 - g), key=lambda r: r[1])[0]
        return uc.jarak(hasil, ref) / max(len(ref), 1)

    bersih = [cer(baca(os.path.join(NUSA, 'baris', n)), lab[n]) for n in held[:args.n]]
    sint = [cer(baca(os.path.join(KELUAR, 'gambar', f)), label[f]) for f in rng.sample(sorted(label), args.n)]
    print(f'CER pembaca v2 (n={args.n}): baris buku bersih (ditahan) {np.mean(bersih):.3f} | sampel sintetis v4 {np.mean(sint):.3f} | foto nyata Cp ~0,56-0,71 (utuh)')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('perintah', choices=['latar', 'buat', 'lembar', 'ukur'])
    ap.add_argument('--n', type=int, default=6000)
    ap.add_argument('--per-foto', type=int, default=8)
    ap.add_argument('--seed', type=int, default=0)
    a = ap.parse_args()
    dict(latar=buat_latar, buat=buat, lembar=lembar, ukur=ukur)[a.perintah](a)
