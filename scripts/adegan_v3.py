# Generator data adegan untuk model v3 (Tahap 2 RENCANA_SCANNER_CERDAS). Isi file ini ditempel menjadi satu sel
# notebook oleh scripts/buat_notebook_v3.py, jadi memakai nama dari sel sebelumnya: acak_teks, PAKAI_WYANJANA, NGLEGENA.
import math, os, urllib.request
import numpy as np, cv2, matplotlib
from PIL import Image, ImageDraw, ImageFont

LATIN_TTF = os.path.join(matplotlib.get_data_path(), 'fonts/ttf/DejaVuSans.ttf')
LATIN_TEBAL = os.path.join(matplotlib.get_data_path(), 'fonts/ttf/DejaVuSans-Bold.ttf')
KATA_PAPAN = ('JL JALAN KANTOR KELURAHAN KECAMATAN PEMERINTAH KOTA PASAR HOTEL TOKO BANK MUSEUM SEKOLAH Selamat Datang '
              'Yogyakarta Surakarta Malioboro Kraton ha na ca ra ka da ta sa wa la pa dha ja ya nya ma ga ba tha nga').split()
FONT_LAIN = {
    'sunda': ('fonts/NotoSansSundanese.ttf', 'notosanssundanese/NotoSansSundanese%5Bwght%5D.ttf', (0x1B83, 0x1BA0)),
    'bali': ('fonts/NotoSansBalinese.ttf', 'notosansbalinese/NotoSansBalinese%5Bwght%5D.ttf', (0x1B13, 0x1B33)),
}
_KONSONAN_ADEGAN = set(NGLEGENA.values())


def siapkan_font_lain():
    for path, url, _ in FONT_LAIN.values():
        if not os.path.exists(path):
            urllib.request.urlretrieve('https://raw.githubusercontent.com/google/fonts/main/ofl/' + url, path)


def _derau(h, w, rng, skala):
    """Derau halus [-1, 1]: tekstur batu, goresan, dan peta distorsi."""
    n = np.random.default_rng(rng.randrange(1 << 30)).normal(0, 1, (max(2, h // skala), max(2, w // skala))).astype(np.float32)
    n = cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
    return n / max(float(np.abs(n).max()), 1e-6)


def latar(h, w, rng, nada):
    """Latar [0, 1] di sekitar `nada`: plat, batu, kaca toko, layar, atau kertas."""
    jenis = rng.choice(['plat', 'plat', 'batu', 'kaca', 'layar', 'kertas'])
    a = np.full((h, w), nada, np.float32)
    a = a + np.linspace(rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), w, dtype=np.float32)[None, :]
    if jenis == 'batu':
        a = a + rng.uniform(0.05, 0.16) * _derau(h, w, rng, 40) + rng.uniform(0.02, 0.08) * _derau(h, w, rng, 3)
    elif jenis == 'kaca':
        s = np.zeros((h, w), np.float32)
        for _ in range(rng.randint(1, 3)):
            x, lebar = rng.randint(0, w), rng.randint(w // 20 + 1, w // 5 + 2)
            cv2.line(s, (x, 0), (x + rng.randint(-h, h), h), 1.0, lebar)
        a = a + rng.uniform(0.08, 0.25) * cv2.GaussianBlur(s, (0, 0), max(2, w / 60))
    elif jenis == 'layar':
        p = rng.uniform(2.5, 7)
        y = np.arange(h, dtype=np.float32)[:, None]
        x = np.arange(w, dtype=np.float32)[None, :]
        a = a + rng.uniform(0.01, 0.05) * np.sin(2 * math.pi * y / p) + rng.uniform(0.0, 0.03) * np.sin(2 * math.pi * x / (p * rng.uniform(0.8, 1.2)))
    elif jenis == 'kertas':
        a = a + rng.uniform(0.01, 0.04) * _derau(h, w, rng, 2)
    return a.astype(np.float32)


def gaya_tinta(m, rng):
    """m: float32 potongan baris, tinta=1. Tebal-tipis, miring, dan distorsi goresan untuk meniru font hias."""
    h, w = m.shape
    r = rng.random()
    t = max(2, round(h / rng.uniform(25, 60)))
    if r < 0.2:
        m = cv2.dilate(m, np.ones((t, t), np.uint8))
    elif r < 0.35:
        m = cv2.erode(m, np.ones((2, 2), np.uint8))
    if rng.random() < 0.35:
        c = rng.uniform(-0.22, 0.22)
        m = cv2.warpAffine(m, np.float32([[1, c, -c * h / 2], [0, 1, 0]]), (w, h), borderValue=0)
    if rng.random() < 0.45:
        d = rng.uniform(0.008, 0.03) * h
        skala = max(3, h // rng.randint(4, 12))
        xx, yy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
        m = cv2.remap(m, xx + d * _derau(h, w, rng, skala), yy + d * _derau(h, w, rng, skala), cv2.INTER_LINEAR, borderValue=0)
    if rng.random() < 0.08:
        k = np.ones((t + 1, t + 1), np.uint8)
        m = np.clip(cv2.dilate(m, k) - cv2.erode(m, k), 0, 1)  # huruf berongga
    return m


def tempel_tinta(m, rng):
    """Tinta ke atas latar, dua polaritas seimbang. Kembalikan float32 [0, 1]."""
    h, w = m.shape
    gelap = rng.random() < 0.5
    bg = rng.uniform(0.06, 0.38) if gelap else rng.uniform(0.58, 0.98)
    selisih = rng.uniform(0.3, 0.8) if rng.random() > 0.15 else rng.uniform(0.14, 0.3)  # kadang kontras rendah
    ink = min(1.0, bg + selisih) if gelap else max(0.0, bg - selisih)
    a = latar(h, w, rng, bg)
    if rng.random() < 0.3:  # huruf timbul: bayangan bergeser
        dx, dy = rng.randint(-5, 5), rng.randint(1, 5)
        s = cv2.warpAffine(m, np.float32([[1, 0, dx], [0, 1, dy]]), (w, h))
        s = cv2.GaussianBlur(s, (3, 3), 0) * rng.uniform(0.3, 0.7)
        a = a * (1 - s) + (bg * 0.35) * s
    tinta = ink + rng.uniform(0, 0.06) * _derau(h, w, rng, 8)
    return a * (1 - m) + tinta * m


def efek_foto(a, rng, geser=0.03):
    """a: float32. Perspektif kecil, silau, blur, derau, dan JPEG."""
    h, w = a.shape
    if geser and rng.random() < 0.6:
        src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
        dst = src + np.float32([[rng.uniform(-geser, geser) * w, rng.uniform(-geser, geser) * h * 2] for _ in range(4)])
        a = cv2.warpPerspective(a, cv2.getPerspectiveTransform(src, dst), (w, h), borderMode=cv2.BORDER_REPLICATE)
    if rng.random() < 0.25:
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        xx, yy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
        sx, sy = rng.uniform(0.1, 0.4) * w, rng.uniform(0.3, 1) * h
        a = a + rng.uniform(0.1, 0.4) * np.exp(-((xx - cx) ** 2 / (2 * sx ** 2) + (yy - cy) ** 2 / (2 * sy ** 2)))
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
        _, buf = cv2.imencode('.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, rng.randint(30, 90)])
        out = cv2.imdecode(buf, cv2.IMREAD_GRAYSCALE)
    return out


def regangkan(teks, rng):
    """Celah antarhuruf untuk gambar saja (label tetap tanpa spasi), sampai selebar tabel."""
    ruang = rng.choice([0, 0, 1, 1, 2, 3, 5])
    if not ruang:
        return teks
    p = rng.choice([0.5, 1.0, 1.0])
    out = []
    for i, ch in enumerate(teks):
        if i > 0 and ch in _KONSONAN_ADEGAN and teks[i - 1] != PANGKON and rng.random() < p:
            out.append(' ' * ruang)
        out.append(ch)
    return ''.join(out)


def _font_latin(ukuran, rng):
    return ImageFont.truetype(rng.choice([LATIN_TTF, LATIN_TEBAL]), max(8, int(ukuran)))


def _teks_latin(rng, n_min=1, n_max=4):
    return ' '.join(rng.choice(KATA_PAPAN) for _ in range(rng.randint(n_min, n_max)))


def _kanvas_teks(teks, font, tepi):
    """Teks ke kanvas 'L' tinta=255 dengan tepi; kembalikan array uint8."""
    x0, y0, x1, y1 = font.getbbox(teks)
    W, H = int(x1 - x0 + 2 * tepi), int(y1 - y0 + 2 * tepi)
    im = Image.new('L', (max(W, 8), max(H, 8)), 0)
    ImageDraw.Draw(im).text((tepi - x0, tepi - y0), teks, font=font, fill=255)
    return np.array(im)


def baris_adegan(rng, per):
    """Satu potongan baris seperti keluaran detektor atau baris proyeksi. Kembalikan (gray uint8, teks) atau None."""
    teks = acak_teks(rng, 1, 10, PAKAI_WYANJANA)
    size = rng.choice([44, 52, 60, 68, 76])
    f = per.font(rng.randrange(len(per.specs)), size, rng.choice([400, 500, 600, 700]))
    a = _kanvas_teks(regangkan(teks, rng), f, 2)
    ys, xs = np.where(a > 128)
    if not len(xs):
        return None
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h = a.shape[0]
    ka, ki = int(h * rng.uniform(0.05, 1.2)), int(h * rng.uniform(0.05, 1.2))
    at, ba = int(h * rng.uniform(0.03, 0.2)), int(h * rng.uniform(0.03, 0.2))
    a = cv2.copyMakeBorder(a, at, ba, ka, ki, cv2.BORDER_CONSTANT, value=0)
    r = rng.random()
    if r < 0.3:  # ujung teks Latin tetangga di atas atau bawah potongan
        W = a.shape[1]
        tinggi = max(2, int(h * rng.uniform(0.2, 0.45)))
        sisa = _kanvas_teks(_teks_latin(rng, 3, 8), _font_latin(h * rng.uniform(0.4, 0.8), rng), 0)
        ambil = sisa[-tinggi:, :W] if rng.random() < 0.5 else sisa[:tinggi, :W]
        pita = np.zeros((tinggi, W), np.uint8)
        pita[:ambil.shape[0], :ambil.shape[1]] = ambil
        a = np.vstack([pita, a]) if rng.random() < 0.5 else np.vstack([a, pita])
    elif r < 0.4:  # garis tepi papan atau tabel
        y = rng.choice([rng.randint(0, 3), a.shape[0] - rng.randint(1, 4)])
        cv2.line(a, (0, y), (a.shape[1], y), 255, rng.randint(1, 3))
    return efek_foto(tempel_tinta(gaya_tinta(a.astype(np.float32) / 255, rng), rng), rng), teks


def negatif_adegan(rng):
    """Potongan tanpa aksara Jawa, berlabel kosong: Latin, angka, tekstur, aksara Sunda, atau Bali."""
    jenis = rng.choice(['latin', 'latin', 'angka', 'tekstur', 'sunda', 'bali'])
    size = rng.choice([40, 52, 64, 76])
    if jenis == 'tekstur':
        h, w = rng.randint(50, 120), rng.randint(120, 700)
        m = np.zeros((h, w), np.float32)
        for _ in range(rng.randint(0, 6)):  # coretan, tepi papan, dan bentuk acak
            cv2.line(m, (rng.randint(0, w), rng.randint(0, h)), (rng.randint(0, w), rng.randint(0, h)), 1.0, rng.randint(1, 6))
    else:
        if jenis == 'latin':
            teks, f = _teks_latin(rng), _font_latin(size, rng)
        elif jenis == 'angka':
            teks, f = ' '.join(str(rng.randint(0, 9999)) for _ in range(rng.randint(1, 3))), _font_latin(size, rng)
        else:
            path, _, (a, b) = FONT_LAIN[jenis]
            if not os.path.exists(path):
                return negatif_adegan(rng)
            teks = ''.join(chr(rng.randint(a, b)) for _ in range(rng.randint(3, 12)))
            f = ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.RAQM)
        m = _kanvas_teks(teks, f, int(size * rng.uniform(0.1, 0.5))).astype(np.float32) / 255
        m = gaya_tinta(m, rng)
    return efek_foto(tempel_tinta(m, rng), rng), ''


def halaman_adegan(rng, per):
    """Foto utuh untuk detektor: papan atau tabel, Latin berdampingan, foto negatif tanpa kotak. Kembalikan (gray, kotak)."""
    W, H = rng.choice([(1400, 1000), (1000, 1400), (1200, 1200), (1500, 800)])
    bentuk = rng.choices(['papan', 'tabel', 'negatif'], [0.6, 0.25, 0.15])[0]
    # Papan menempati sebagian foto, sisanya latar adegan.
    px0, py0 = rng.randint(0, W // 5), rng.randint(0, H // 5)
    px1, py1 = W - rng.randint(0, W // 5), H - rng.randint(0, H // 5)
    im = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(im)
    kotak = []
    tepi = rng.randint(20, 60)
    y = py0 + tepi
    lebar = px1 - px0 - 2 * tepi

    def tulis_latin(ukuran):
        nonlocal y
        f = _font_latin(ukuran, rng)
        t = _teks_latin(rng, 2, 6)
        while f.getbbox(t)[2] > lebar and ' ' in t:
            t = t.rsplit(' ', 1)[0]
        bb = f.getbbox(t)
        d.text((px0 + tepi - bb[0], y - bb[1]), t, font=f, fill=255)
        y += (bb[3] - bb[1]) * rng.uniform(1.2, 1.9)

    def tulis_jawa(ukuran, n_max):
        nonlocal y
        f = per.font(rng.randrange(len(per.specs)), ukuran, rng.choice([400, 500, 700]))
        t = regangkan(acak_teks(rng, 2, n_max, PAKAI_WYANJANA), rng)
        while f.getbbox(t)[2] - f.getbbox(t)[0] > lebar and len(t) > 3:
            t = t[:-2].rstrip()
        bb = f.getbbox(t)
        x = px0 + tepi + rng.randint(0, max(0, lebar - (bb[2] - bb[0])))
        d.text((x - bb[0], y - bb[1]), t, font=f, fill=255)
        kotak.append((x, y, x + bb[2] - bb[0], y + bb[3] - bb[1]))
        y += (bb[3] - bb[1]) * rng.uniform(1.15, 1.7)

    ukuran = rng.choice([44, 56, 70, 90, 120])
    if bentuk == 'tabel':  # baris Jawa berjarak lebar berselang dengan baris Latin
        ukuran = rng.choice([44, 56, 70])
        while y < py1 - 3 * ukuran:
            tulis_jawa(ukuran, 6)
            if y < py1 - 2 * ukuran:
                tulis_latin(ukuran * rng.uniform(0.5, 0.8))
    else:
        while y < py1 - 2 * ukuran:
            if bentuk == 'negatif' or rng.random() < 0.35:
                tulis_latin(ukuran * rng.uniform(0.5, 1.1))
            else:
                tulis_jawa(ukuran, 14)
    if rng.random() < 0.4:
        d.rectangle((px0 + 4, py0 + 4, px1 - 4, py1 - 4), outline=255, width=rng.randint(2, 8))
    m = np.array(im, np.float32) / 255
    if rng.random() < 0.25:  # tebal saja: miring dan distorsi akan menggeser kotak
        m = cv2.dilate(m, np.ones((rng.randint(2, 3),) * 2, np.uint8))
    a = tempel_tinta(m, rng)
    # Di luar papan: latar adegan yang lain.
    if rng.random() < 0.8:
        luar = latar(H, W, rng, rng.uniform(0.15, 0.85))
        topeng = np.zeros((H, W), np.float32)
        topeng[py0:py1, px0:px1] = 1
        a = a * topeng + luar * (1 - topeng)
    # Perspektif seluruh foto; kotak mengikuti.
    d0 = 0.05
    src = np.float32([[0, 0], [W, 0], [W, H], [0, H]])
    dst = src + np.float32([[rng.uniform(-d0, d0) * W, rng.uniform(-d0, d0) * H] for _ in range(4)])
    M = cv2.getPerspectiveTransform(src, dst)
    a = cv2.warpPerspective(a, M, (W, H), borderMode=cv2.BORDER_REPLICATE)
    hasil = []
    for x0, y0, x1, y1 in kotak:
        p = cv2.perspectiveTransform(np.float32([[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]]), M)[0]
        hasil.append((float(p[:, 0].min()), float(p[:, 1].min()), float(p[:, 0].max()), float(p[:, 1].max())))
    return efek_foto(a, rng, geser=0), hasil


def potong_acak_adegan(gray, kotak, rng, ukuran=512):
    """Sama dengan potong_acak, tetapi pengisi tepinya mengikuti latar agar dua polaritas tetap wajar."""
    s = DET_SISI / max(gray.shape) * rng.uniform(0.6, 1.4)
    g = cv2.resize(gray, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    k = [(x0 * s, y0 * s, x1 * s, y1 * s) for x0, y0, x1, y1 in kotak]
    m = masker_inti(g.shape, k)
    H, W = g.shape
    if H < ukuran or W < ukuran:
        isi = int(np.median(g))
        g = cv2.copyMakeBorder(g, 0, max(0, ukuran - H), 0, max(0, ukuran - W), cv2.BORDER_CONSTANT, value=isi)
        m = cv2.copyMakeBorder(m, 0, max(0, ukuran - H), 0, max(0, ukuran - W), cv2.BORDER_CONSTANT, value=0)
        H, W = g.shape
    y, x = rng.randint(0, H - ukuran), rng.randint(0, W - ukuran)
    g, m = g[y:y + ukuran, x:x + ukuran], m[y:y + ukuran, x:x + ukuran]
    x_in = (255 - g.astype(np.float32)) / 255.0
    m_out = cv2.resize(m, (ukuran // DET_SKALA, ukuran // DET_SKALA), interpolation=cv2.INTER_AREA)
    return x_in, (m_out > 0.5).astype(np.float32)
