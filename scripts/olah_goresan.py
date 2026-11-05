# Pengolahan citra untuk pembaca (L1, docs/RENCANA_SCANNER_FINAL.md): ukur dan samakan ketebalan goresan, varian kontras.
# Semua fungsi menerima potongan abu-abu uint8 dengan TINTA GELAP di latar terang, dan mengembalikan potongan yang sama bentuknya.
import cv2, numpy as np

TINGGI = 64  # satuan ukur: tinggi masukan pembaca


def ke_tinggi(c, tinggi=TINGGI):
    h, w = c.shape
    return cv2.resize(c, (max(8, round(w * tinggi / h)), tinggi), interpolation=cv2.INTER_AREA)


def lebar_goresan(c):
    """Lebar goresan rata-rata dalam piksel pada tinggi 64: 2 * luas tinta / keliling tinta. None bila tinta tak terdeteksi."""
    g = ke_tinggi(c)
    t, m = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    luas = float((m > 0).sum())
    if luas < 30 or luas > 0.7 * m.size:
        return None
    kontur, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    keliling = sum(len(k) for k in kontur)
    return 2.0 * luas / max(keliling, 1)


def samakan_goresan(c, target, jauh=1.25):
    """Tebalkan/tipiskan tinta gelap agar lebar goresannya mendekati `target` (piksel pada tinggi 64).
    Bekerja pada abu-abu: erosi intensitas (min) menebalkan tinta gelap, dilasi (max) menipiskannya."""
    w = lebar_goresan(c)
    if w is None or w <= 0:
        return c
    rasio = w / target
    if 1 / jauh <= rasio <= jauh:
        return c
    g = ke_tinggi(c)
    langkah = int(min(3, round(abs(w - target) / 2.0 + 0.01)))
    if langkah < 1:
        return c
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * langkah + 1, 2 * langkah + 1))
    g = cv2.dilate(g, k) if rasio > 1 else cv2.erode(g, k)  # tinta gelap terlalu tebal -> dilasi abu-abu menipiskan
    return cv2.resize(g, (c.shape[1], c.shape[0]), interpolation=cv2.INTER_AREA)


def clahe(c, klip=2.0, ubin=8):
    return cv2.createCLAHE(clipLimit=klip, tileGridSize=(ubin, ubin)).apply(c)


def sauvola(c, jendela=25, k=0.2):
    """Binarisasi Sauvola yang dihaluskan ringan; hasil tinta gelap di latar putih."""
    g = c.astype(np.float32)
    rata = cv2.boxFilter(g, -1, (jendela, jendela))
    kuad = cv2.boxFilter(g * g, -1, (jendela, jendela))
    sd = np.sqrt(np.maximum(kuad - rata * rata, 0))
    ambang = rata * (1 + k * (sd / 128.0 - 1))
    b = np.where(g > ambang, 255, 0).astype(np.uint8)
    return cv2.GaussianBlur(b, (3, 3), 0)
