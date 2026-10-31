# Rujukan Python untuk pipeline scanner cerdas (Tahap 1 RENCANA_SCANNER_CERDAS). Padanan web: src/ml/model2/.
# Dipakai scripts/uji_set_c.py untuk menyetel ambang sebelum logikanya dipindah ke TypeScript.
import numpy as np, cv2
import rujukan_scanner as ruj

SANDHANGAN = set('ꦶꦸꦺꦴꦼꦁꦂꦃ')
PANGKON = '꧀'
PADA = set('꧈꧉')
KONSONAN = set(ruj.NG)

GABUNG_TINGGI = 0.5   # IoU tinggi minimal dua kotak sebaris
GABUNG_CELAH = 3.0    # celah mendatar maksimal, kali tinggi baris
GABUNG_TIMPA = 0.5    # tumpang mendatar maksimal, kali tinggi baris: baris bertumpuk bukan pecahan
KECIL = 0.5           # kotak di bawah ini kali median tinggi dibuang
MAKS_KOTAK = 60       # per polaritas; halaman buku NusaAksara sampai 80 baris
BUKTI_FOTO = 2        # baris TERIMA minimal agar baris lain di foto dinilai longgar
BUKTI_RASIO = 0.2     # dan minimal sebanyak ini dari semua calon: aksara mirip jarang mencapainya
SAMA_KOTAK = 0.7      # IoU dua kotak yang dianggap baris yang sama
SISI_SUDUT = 800      # sisi panjang saat mencari sudut halaman
# Ambang dipilih dari kurva di split pengembangan Set C (scripts/uji_set_c.py).
# Foto utuh lebih ketat; "area" = pengguna sudah menunjuk tulisannya sendiri.
AMBANG = {
    'foto': dict(terima=0.85, ragu=0.75, valid=1.0, konsonan=3),
    'area': dict(terima=0.85, ragu=0.60, valid=0.85, konsonan=2),
}


def potong(gray, k):
    H, W = gray.shape
    x0, y0, x1, y1 = k
    h = y1 - y0
    m = 0.05 * h
    a, b = int(max(0, y0 - m)), int(min(H, y1 + m))
    c, d = int(max(0, x0 - h * 0.3)), int(min(W, x1 + h * 0.3))
    return gray[a:b, c:d] if b - a >= 8 and d - c >= 8 else None


def baca_potongan(crop):
    lg = ruj.crnn.run(None, {'gambar': ruj.ke_input(crop)[None, None]})[0][0]
    e = np.exp(lg - lg.max(-1, keepdims=True))
    p = e / e.sum(-1, keepdims=True)
    best = p.argmax(-1)
    ids, prev = [], 0
    for t in best:
        if t != prev and t != 0:
            ids.append(int(t))
        prev = t
    yakin = float(p.max(-1)[best != 0].mean()) if (best != 0).any() else 0.0
    return ruj.to_logical(''.join(ruj.IDX2CHAR[i] for i in ids)), yakin


def baca_kotak(gray, k):
    c = potong(gray, k)
    return baca_potongan(c) if c is not None else ('', 0.0)


def gabung_baris(kotak):
    """Kotak pecahan pada baris yang sama digabung; kotak kecil dibuang; urut atas ke bawah."""
    if not kotak:
        return []
    tinggi = sorted(k[3] - k[1] for k in kotak)
    med = tinggi[len(tinggi) // 2]
    baris = []
    for k in sorted((k for k in kotak if k[3] - k[1] >= KECIL * med), key=lambda k: k[0]):
        for r in baris:
            h_min = min(r[3] - r[1], k[3] - k[1])
            th = min(r[3], k[3]) - max(r[1], k[1])
            gabungan = max(r[3], k[3]) - min(r[1], k[1])
            celah = k[0] - r[2]
            if th / max(gabungan, 1) >= GABUNG_TINGGI and -GABUNG_TIMPA * h_min < celah < GABUNG_CELAH * h_min:
                r[:] = [min(r[0], k[0]), min(r[1], k[1]), max(r[2], k[2]), max(r[3], k[3])]
                break
        else:
            baris.append(list(k))
    baris = sorted(baris, key=lambda r: r[2] - r[0], reverse=True)[:MAKS_KOTAK]
    return sorted(baris, key=lambda r: r[1])


def validitas(teks):
    """Proporsi tanda yang sah: sandhangan/pangkon harus menempel pada konsonan, tanpa tanda berulang."""
    if not teks:
        return 0.0
    salah = 0
    sebelum = ''
    for i, c in enumerate(teks):
        if c in SANDHANGAN or c == PANGKON:
            ada_dasar = i > 0 and (sebelum in KONSONAN or (sebelum in SANDHANGAN and sebelum != c and c != PANGKON))
            if not ada_dasar:
                salah += 1
            if c == PANGKON and i + 1 < len(teks) and teks[i + 1] not in KONSONAN and teks[i + 1] not in PADA:
                salah += 1
        sebelum = c
    return 1 - min(1.0, salah / len(teks))


def konsonan(teks):
    return sum(c in KONSONAN for c in teks)


def nilai_status(teks, yakin, mode='foto'):
    a = AMBANG[mode]
    if konsonan(teks) < a['konsonan'] or validitas(teks) < a['valid'] or yakin < a['ragu']:
        return 'TOLAK'
    return 'TERIMA' if yakin >= a['terima'] else 'RAGU'


def luruskan(crop):
    """Deskew lokal: papan miring tidak ikut sudut global halaman."""
    s = ruj.cari_sudut(ruj.masker_tinta(crop))
    return ruj.putar(crop, s, int(np.median(crop))) if s else crop


def baca_dua_arah(gray, k, lurus=True, mode='foto'):
    c = potong(gray, k)
    if c is None:
        return ('', 0.0)
    if lurus:
        c = luruskan(c)
    a = baca_potongan(c)
    if nilai_status(a[0], a[1], mode) == 'TERIMA':
        return a
    b = baca_potongan(255 - c)
    return a if a[1] >= b[1] else b


def iou(a, b):
    tw = min(a[2], b[2]) - max(a[0], b[0])
    th = min(a[3], b[3]) - max(a[1], b[1])
    if tw <= 0 or th <= 0:
        return 0.0
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - tw * th
    return tw * th / u


def baca_foto(gray, area_dipilih=False):
    mode = 'area' if area_dipilih else 'foto'
    g = ruj.normalisasi_polaritas(gray)
    sk = min(1, SISI_SUDUT / max(g.shape))  # sama dengan scan.ts
    kecil = cv2.resize(g, None, fx=sk, fy=sk, interpolation=cv2.INTER_AREA) if sk < 1 else g
    sudut = ruj.cari_sudut(ruj.masker_tinta(kecil))
    if sudut:
        g = ruj.putar(g, sudut, 255)
    calon = []
    dibaca = []
    for sumber in (g, 255 - g):
        if any(b['status'] == 'TERIMA' for b in calon):
            break
        for k in gabung_baris(ruj.kotak_detektor(sumber)):
            if any(iou(k, x) >= SAMA_KOTAK for x in dibaca):
                continue
            dibaca.append(k)
            t, y = baca_dua_arah(g, k, lurus=area_dipilih, mode=mode)
            if t:
                calon.append(dict(teks=t, yakin=y, kotak=list(k), status=nilai_status(t, y, mode)))
    # Kotak yang sama dari dua polaritas: simpan yang terbaik.
    calon.sort(key=lambda b: (b['status'] != 'TOLAK', b['yakin']), reverse=True)
    hasil = []
    for b in calon:
        if all(iou(b['kotak'], h['kotak']) < 0.3 for h in hasil):
            hasil.append(b)
    if area_dipilih:
        # Pengguna sudah membingkai: seluruh area dibaca sebagai satu baris, dipakai bila lebih meyakinkan.
        c = luruskan(g)
        x, y_ = baca_potongan(c), baca_potongan(255 - c)
        t, y = x if x[1] >= y_[1] else y_
        skor = lambda b: b['yakin'] * konsonan(b['teks'])
        tampil = sum(skor(b) for b in hasil if b['status'] != 'TOLAK')
        if t and nilai_status(t, y, mode) != 'TOLAK' and y * konsonan(t) > tampil:
            hasil = [dict(teks=t, yakin=y, kotak=[0, 0, g.shape[1], g.shape[0]], status=nilai_status(t, y, mode))]
    elif sum(b['status'] == 'TERIMA' for b in hasil) >= max(BUKTI_FOTO, BUKTI_RASIO * len(hasil)):
        # Bukti tingkat foto: baris lain tidak ditolak hanya karena satu tanda keliru.
        for b in hasil:
            if b['status'] == 'TOLAK' and nilai_status(b['teks'], b['yakin'], 'area') != 'TOLAK':
                b['status'] = 'RAGU'
    return sorted(hasil, key=lambda b: b['kotak'][1])
