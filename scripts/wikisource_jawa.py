# Data baris nyata dari Wikisource bahasa Jawa: halaman buku cetak beraksara Jawa yang transkripsinya sudah dikoreksi manusia
# (Kaca berstatus Titiwaca/Absah). Transkripsi ditulis per halaman, bukan per baris, jadi baris dicari dengan detektor PP-OCRv5,
# dibaca pembaca B2, lalu bacaan itu dicocokkan ke teks halaman. Label = potongan teks manusia, bukan bacaan B2; baris hanya
# diterima bila cocoknya kuat dan kedua ujungnya sama persis (lihat cocok_baris).
# Gambar halaman: domain publik (dicek per berkas di `unduh`), teks: CC BY-SA (atribusi di atribusi.csv). Folder gitignored.
#
#   python -X utf8 scripts/wikisource_jawa.py buku  <jvwikisource-...-pages-articles.xml.bz2>   -> halaman.json + buku.tsv
#   python -X utf8 scripts/wikisource_jawa.py sampul                                            -> sampul/ (1 halaman per buku)
#   python -X utf8 scripts/wikisource_jawa.py unduh  <daftar_buku.txt> [lebar]                  -> hal/<id>/<n>.jpg
#   PEMBACA=<b2.onnx> python -X utf8 scripts/wikisource_jawa.py cocok [--buku id,...]           -> baris/ + baris.tsv
import argparse, bz2, csv, json, os, re, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
OUT = os.path.join(AKAR, 'docs/random/wikisource')
API = 'https://jv.wikisource.org/w/api.php'
UA = {'User-Agent': 'AksaraLensResearch/0.1 (student OCR project; github.com/farrelzaki/AksaraLens)'}
JAWA = re.compile('[ꦀ-꧟]')
PENGIKUT = set('ꦀꦁꦂꦃ꦳ꦴꦵꦶꦷꦸꦹꦻꦼꦽꦾꦿ꧀')  # tanda yang menempel pada aksara sebelumnya (taling ꦺ boleh di depan: urutan tampak)


# ---------- teks ----------
def teks_halaman(wikitext):
    """Wikitext Kaca -> deret karakter aksara Jawa (NFC, tanpa spasi/ZWNJ/tanda baca Latin), urutan Unicode (logis)."""
    t = re.sub(r'<noinclude>.*?</noinclude>', '', wikitext, flags=re.S)
    t = re.sub(r'<ref.*?</ref>', '', t, flags=re.S)
    t = unicodedata.normalize('NFC', t)
    return ''.join(JAWA.findall(t))


def ke_label(teks_logis):
    """Teks logis -> urutan tampak (taling di depan konsonan) tanpa karakter yang juga dibuang data Nusa (pada lain dsb.)."""
    import sintetis_nyata as sn
    from model_bahasa import ke_tampak
    return ke_tampak(''.join(c for c in teks_logis if c not in sn.BUANG))


# ---------- API ----------
def api(**p):
    p.update(format='json', maxlag=5)
    u = API + '?' + urllib.parse.urlencode(p)
    for i in range(6):
        try:
            time.sleep(1)
            return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            print('  ulang', getattr(e, 'code', e), flush=True)
            time.sleep(30 * (i + 1))
    raise SystemExit('API gagal terus')


def unduh_berkas(url, path):
    for i in range(6):
        try:
            time.sleep(1)
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
            open(path, 'wb').write(data)
            return True
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            if getattr(e, 'code', 0) == 404:
                return False
            print('  ulang', getattr(e, 'code', e), flush=True)
            time.sleep(30 * (i + 1))
    return False


def info_berkas(berkas, halaman=None, lebar=2000):
    p = dict(action='query', titles='File:' + berkas, prop='imageinfo', iiprop='url|size|extmetadata',
             iiextmetadatafilter='LicenseShortName|Artist|DateTimeOriginal')
    if halaman:
        p['iiurlparam'] = f'page{halaman}-{lebar}px'
    r = api(**p)
    pg = next(iter(r['query']['pages'].values()))
    return (pg.get('imageinfo') or [None])[0]


# ---------- perintah ----------
def cmd_buku(a):
    ns = '{http://www.mediawiki.org/xml/export-0.11/}'
    buku = {}
    for _, el in ET.iterparse(bz2.open(a.dump)):
        if not el.tag.endswith('page'):
            continue
        if el.findtext(ns + 'ns') == '250':
            s = el.findtext(f'{ns}revision/{ns}text') or ''
            m = re.search(r'<pagequality level="(\d)"', s)
            t = teks_halaman(s)
            latin = len(re.findall('[A-Za-z]', re.sub(r'\{\{.*?\}\}|<.*?>', '', re.sub(r'<noinclude>.*?</noinclude>', '', s, flags=re.S))))
            if m and int(m.group(1)) >= 3 and len(t) > 100 and len(t) > latin:
                judul = el.findtext(ns + 'title').split(':', 1)[1]
                b, n = judul.rsplit('/', 1)
                if n.isdigit():
                    buku.setdefault(b, {})[n] = t
        el.clear()
    os.makedirs(OUT, exist_ok=True)
    json.dump(buku, open(os.path.join(OUT, 'halaman.json'), 'w', encoding='utf8'), ensure_ascii=False)
    with open(os.path.join(OUT, 'buku.tsv'), 'w', encoding='utf8') as f:
        for i, (b, h) in enumerate(sorted(buku.items(), key=lambda x: -len(x[1]))):
            f.write(f'{i}\t{len(h)}\t{sum(map(len, h.values()))}\t{b}\n')
    print(len(buku), 'buku,', sum(map(len, buku.values())), 'halaman')


def daftar_buku():
    rows = [l.rstrip('\n').split('\t') for l in open(os.path.join(OUT, 'buku.tsv'), encoding='utf8')]
    return [(int(i), int(n), b) for i, n, _, b in rows]


def cmd_sampul(a):
    import cv2, numpy as np
    halaman = json.load(open(os.path.join(OUT, 'halaman.json'), encoding='utf8'))
    d = os.path.join(OUT, 'sampul'); os.makedirs(d, exist_ok=True)
    meta = {}
    for i, n, b in daftar_buku():
        if n < a.min:
            continue
        hs = sorted(halaman[b], key=int)
        h = hs[len(hs) // 2]
        p = os.path.join(d, f'{i:03d}.jpg')
        inf = info_berkas(b, int(h), 800)
        meta[i] = dict(buku=b, hal=h, lisensi=(inf or {}).get('extmetadata', {}).get('LicenseShortName', {}).get('value'),
                       tanggal=(inf or {}).get('extmetadata', {}).get('DateTimeOriginal', {}).get('value'))
        if inf and not os.path.exists(p):
            unduh_berkas(inf.get('thumburl') or inf['url'], p)
        print(i, n, meta[i]['lisensi'], b, flush=True)
    json.dump(meta, open(os.path.join(d, 'meta.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    # lembar kontak: 4 x 3 per lembar
    ids = sorted(meta, key=int)
    for k in range(0, len(ids), 12):
        sel = []
        for i in ids[k:k + 12]:
            g = cv2.imread(os.path.join(d, f'{int(i):03d}.jpg'))
            g = np.full((520, 380, 3), 200, np.uint8) if g is None else cv2.resize(g, (380, 520), interpolation=cv2.INTER_AREA)
            cv2.putText(g, str(i), (8, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (0, 0, 255), 3)
            sel.append(g)
        while len(sel) % 4:
            sel.append(np.full((520, 380, 3), 255, np.uint8))
        lembar = np.vstack([np.hstack(sel[r:r + 4]) for r in range(0, len(sel), 4)])
        cv2.imwrite(os.path.join(d, f'lembar_{k // 12:02d}.jpg'), lembar, [cv2.IMWRITE_JPEG_QUALITY, 85])


def cmd_unduh(a):
    halaman = json.load(open(os.path.join(OUT, 'halaman.json'), encoding='utf8'))
    nama = {i: b for i, _, b in daftar_buku()}
    pilih = [int(x.split()[0]) for x in open(a.daftar, encoding='utf8') if x.strip() and not x.startswith('#')]
    atrib = os.path.join(OUT, 'atribusi.csv')
    tulis = not os.path.exists(atrib)
    with open(atrib, 'a', newline='', encoding='utf8') as fa:
        w = csv.writer(fa)
        if tulis:
            w.writerow(['id', 'berkas', 'lisensi', 'pembuat', 'tanggal', 'teks'])
        for i in pilih:
            b = nama[i]
            inf = info_berkas(b)
            em = (inf or {}).get('extmetadata', {})
            lis = em.get('LicenseShortName', {}).get('value', '')
            if not re.search(r'public domain|pd|cc0', lis, re.I):
                print('LEWAT (lisensi)', i, lis, b, flush=True)
                continue
            w.writerow([i, b, lis, re.sub('<.*?>', '', em.get('Artist', {}).get('value', ''))[:200],
                        em.get('DateTimeOriginal', {}).get('value', ''), 'jv.wikisource.org, CC BY-SA 4.0'])
            fa.flush()
            # Berkas asli diunduh sekali lalu dirender sendiri: gambar kecil per halaman dibatasi keras (429) oleh Wikimedia.
            import pymupdf
            asli = os.path.join(OUT, 'berkas', f'{i:03d}.pdf'); os.makedirs(os.path.dirname(asli), exist_ok=True)
            if not os.path.exists(asli) and not unduh_berkas(inf['url'], asli):
                print('GAGAL unduh', i, b, flush=True)
                continue
            d = os.path.join(OUT, 'hal', f'{i:03d}'); os.makedirs(d, exist_ok=True)
            doc = pymupdf.open(asli)
            for h in sorted(halaman[b], key=int):
                p = os.path.join(d, f'{int(h):04d}.jpg')
                if os.path.exists(p) or int(h) > doc.page_count:
                    continue
                pg = doc[int(h) - 1]
                pix = pg.get_pixmap(matrix=pymupdf.Matrix(a.lebar / pg.rect.width, a.lebar / pg.rect.width),
                                    colorspace=pymupdf.csGRAY)
                pix.save(p, jpg_quality=90)
            print('selesai', i, len(os.listdir(d)), b, flush=True)


# ---------- pencocokan ----------
def jarak_sub(r, g):
    """Edit distance terkecil antara r dan suatu potongan g (semi-global). -> (jarak, awal, akhir). Vektor numpy per baris r."""
    import numpy as np
    G = np.frombuffer(g.encode('utf-32-le'), np.uint32)
    n = len(G)
    D = np.zeros(n + 1, np.int32)
    S = np.arange(n + 1, dtype=np.int32)
    idx = np.arange(n + 1, dtype=np.int32)
    for ch in r:
        c = ord(ch)
        diag = D[:-1] + (G != c)
        up = D + 1
        tmp = up.copy(); st = S.copy()
        m = diag < tmp[1:]
        tmp[1:][m] = diag[m]; st[1:][m] = S[:-1][m]
        # sisipan sepanjang baris: new[j] = min_k tmp[k] + (j - k)
        v = tmp - idx
        cm = np.minimum.accumulate(v)
        arg = np.maximum.accumulate(np.where(v == cm, idx, 0))
        D = cm + idx
        S = st[arg]
    j = int(np.argmin(D))
    return int(D[j]), int(S[j]), j


def cocok_baris(bacaan, teks, ambang=0.2):
    """-> potongan teks yang sesuai, atau None. Syarat: jarak/len <= ambang, 2 karakter pertama & terakhir sama persis,
    dan tidak ada potongan lain yang hampir sama baiknya (teks berulang, mis. tembang)."""
    if len(bacaan) < 6:
        return None
    d, i, j = jarak_sub(bacaan, teks)
    pot = teks[i:j]
    if not pot or d / max(len(pot), len(bacaan)) > ambang or pot[:2] != bacaan[:2] or pot[-2:] != bacaan[-2:]:
        return None
    if pot[0] in PENGIKUT:  # baris tidak mungkin diawali sandhangan/pangkon: batas potongan meleset
        return None
    sisa = teks[:max(0, i - 5)] + '\x00' * 10 + teks[j + 5:]
    if len(sisa) > len(bacaan) and jarak_sub(bacaan, sisa)[0] <= d + 1:
        return None
    return pot


def cmd_cocok(a):
    import cv2, numpy as np, onnxruntime as ort
    import b2_paddle as b2
    ort.set_default_logger_severity(3)
    model = os.environ.get('AKSARALENS_MODEL') or os.path.join(AKAR, 'public/models')
    det = ort.InferenceSession(os.path.join(model, 'aksaralens_detektor_pp.onnx'), providers=['CPUExecutionProvider'])
    pb = ort.InferenceSession(os.environ.get('PEMBACA') or os.path.join(model, 'aksaralens_pembaca_b2.onnx'),
                              providers=['CPUExecutionProvider'])
    cs = b2.charset(); ada = set(cs)
    MEAN = np.array([.485, .456, .406], np.float32)[:, None, None]; STD = np.array([.229, .224, .225], np.float32)[:, None, None]

    def kotak(gray):
        H, W = gray.shape
        k = a.panjang / max(H, W)
        h, w = max(32, round(H * k / 32) * 32), max(32, round(W * k / 32) * 32)
        x = cv2.resize(gray, (w, h), interpolation=cv2.INTER_AREA if k < 1 else cv2.INTER_LINEAR)
        x = (np.repeat(x[None], 3, 0).astype(np.float32) / 255 - MEAN) / STD
        p = det.run(None, {det.get_inputs()[0].name: x[None]})[0][0, 0]
        n, lab, st, _ = cv2.connectedComponentsWithStats((p > 0.3).astype(np.uint8), connectivity=4)
        fx, fy = W / p.shape[1], H / p.shape[0]
        for q in range(1, n):
            x0, y0, bw, bh, ar = st[q]
            if bh < 3 or bw < 8 or p[lab == q].mean() < 0.5:
                continue
            d = 1.5 * ar / (2 * (bw + bh))
            yield (max(0, (x0 - d) * fx), max(0, (y0 - d) * fy), min(W, (x0 + bw + d) * fx), min(H, (y0 + bh + d) * fy))

    def baca(c):
        p = pb.run(None, {pb.get_inputs()[0].name: b2.ke_masukan(c)})[0][0]
        ix = p.argmax(1); out = []; prev = 0
        for t in ix:
            if t != prev and t != 0:
                out.append(cs[t - 1])
            prev = t
        return ''.join(out)

    halaman = json.load(open(os.path.join(OUT, 'halaman.json'), encoding='utf8'))
    nama = {i: b for i, _, b in daftar_buku()}
    pilih = [int(x) for x in a.buku.split(',')] if a.buku else sorted(int(x) for x in os.listdir(os.path.join(OUT, 'hal')))
    dbar = os.path.join(OUT, 'baris'); os.makedirs(dbar, exist_ok=True)
    f = open(os.path.join(OUT, 'baris.tsv'), 'a', encoding='utf8')
    for i in pilih:
        b = nama[i]; dh = os.path.join(OUT, 'hal', f'{i:03d}')
        n_kotak = n_ok = n_luar = 0
        for fn in sorted(os.listdir(dh)):
            h = str(int(fn[:-4]))
            if h not in halaman[b]:
                continue
            teks = ke_label(halaman[b][h])
            g = cv2.imread(os.path.join(dh, fn), cv2.IMREAD_GRAYSCALE)
            if g is None:
                continue
            H, W = g.shape
            for k, (x0, y0, x1, y1) in enumerate(kotak(g)):
                hh = y1 - y0
                if hh < 12 or (x1 - x0) < 2 * hh:
                    continue
                Y0, Y1 = int(max(0, y0 - .05 * hh)), int(min(H, y1 + .05 * hh))
                X0, X1 = int(max(0, x0 - .3 * hh)), int(min(W, x1 + .3 * hh))
                c = g[Y0:Y1, X0:X1]
                n_kotak += 1
                pot = cocok_baris(baca(c), teks)
                if not pot:
                    continue
                luar = any(ch not in ada for ch in pot)
                n_luar += luar; n_ok += not luar
                nm = f'W{i:03d}_{int(h):04d}_{k:02d}.png'
                cv2.imwrite(os.path.join(dbar, nm), c)
                f.write(f'{nm}\t{pot}\t{int(luar)}\t{i}\t{h}\n')
        f.flush()
        print(f'buku {i}: {n_kotak} kotak, {n_ok} baris diterima, {n_luar} cocok tetapi memuat karakter di luar charset  {b}', flush=True)


def cmd_saring(a):
    """baris.tsv -> baris_saring.tsv: buang potongan dua baris (tinggi > 1,45 x median halaman), potongan pecahan
    (tinggi < 0,6 x median, lebar < 3,5 x tinggi, label < 8 karakter), dan baris yang labelnya juga ada di NusaAksara."""
    import cv2, numpy as np, statistics
    rows = [l.rstrip('\n').split('\t') for l in open(os.path.join(OUT, 'baris.tsv'), encoding='utf8')]
    uk = {}
    for r in rows:
        g = cv2.imread(os.path.join(OUT, 'baris', r[0]), cv2.IMREAD_GRAYSCALE)
        uk[r[0]] = g.shape if g is not None else (0, 0)
    med = {}
    for r in rows:
        med.setdefault((r[3], r[4]), []).append(uk[r[0]][0])
    med = {k: statistics.median(v) for k, v in med.items()}
    nusa = json.load(open(os.path.join(AKAR, 'docs/random/nusa/indeks.json'), encoding='utf8'))['ocr']
    kunci = {t[i:i + 12] for o in nusa for t in [ke_label(o['transcription'])] for i in range(0, max(1, len(t) - 11), 4)}
    alasan = {}
    with open(os.path.join(OUT, 'baris_saring.tsv'), 'w', encoding='utf8') as f:
        for r in rows:
            h, w = uk[r[0]]; m = med[(r[3], r[4])]
            sebab = ('dua_baris' if h > 1.45 * m else 'pecahan' if h < .6 * m or w < 3.5 * h or len(r[1]) < 8
                     else 'nusa' if any(r[1][i:i + 12] in kunci for i in range(max(1, len(r[1]) - 11))) else None)
            if sebab:
                alasan[sebab] = alasan.get(sebab, 0) + 1
                continue
            f.write('\t'.join(r) + '\n')
    lolos = sum(1 for _ in open(os.path.join(OUT, 'baris_saring.tsv'), encoding='utf8'))
    print('masuk', len(rows), 'lolos', lolos, 'dibuang', alasan)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('buku'); s.add_argument('dump')
    s = sub.add_parser('sampul'); s.add_argument('--min', type=int, default=5)
    s = sub.add_parser('unduh'); s.add_argument('daftar'); s.add_argument('lebar', nargs='?', type=int, default=2000)
    s = sub.add_parser('cocok'); s.add_argument('--buku', default=''); s.add_argument('--panjang', type=int, default=1600)
    sub.add_parser('saring')
    a = ap.parse_args()
    dict(buku=cmd_buku, sampul=cmd_sampul, unduh=cmd_unduh, cocok=cmd_cocok, saring=cmd_saring)[a.cmd](a)


if __name__ == '__main__':
    main()
