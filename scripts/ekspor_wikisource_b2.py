# Mengemas baris Wikisource (docs/random/wikisource/baris_saring.tsv, dari scripts/wikisource_jawa.py) untuk notebook B2 putaran 2.
# Hanya baris DALAM charset (kolom 'luar' = 0), label sudah urutan tampak. Pembagian per BUKU, bukan per baris, agar validasi
# benar-benar buku yang belum pernah dilihat (halaman satu buku punya gaya cetak dan kosakata yang sama).
# Pakai: python -X utf8 scripts/ekspor_wikisource_b2.py   -> docs/random/wikisource_b2.zip (unggah ke Drive aksaralens/)
import collections, json, os, random, sys, zipfile
import cv2

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(AKAR, 'scripts'))
WS = os.path.join(AKAR, 'docs/random/wikisource')
TUJUAN = os.path.join(AKAR, 'docs/random/wikisource_b2.zip')
TINGGI_MAKS = 96        # B2 memakai tinggi 48; sisanya ruang untuk augmentasi/skala di notebook
MAKS_PER_BUKU = 600     # supaya satu buku (maks 2137 baris) tidak mendominasi
N_BUKU_VAL, MIN_BARIS_VAL, VAL_MAKS_PER_BUKU = 4, 150, 100
PANJANG_MAKS = 100


def pilih(baris, seed=0):
    """baris: list [file, label, luar, buku, halaman] -> (latih, val), semua dalam charset dan <= PANJANG_MAKS."""
    ok = [r for r in baris if r[2] == '0' and 0 < len(r[1]) <= PANJANG_MAKS]
    per = collections.defaultdict(list)
    for r in ok:
        per[r[3]].append(r)
    rng = random.Random(seed)
    layak = sorted(b for b, v in per.items() if len(v) >= MIN_BARIS_VAL)
    buku_val = set(rng.sample(layak, min(N_BUKU_VAL, len(layak))))
    latih, val = [], []
    for b in sorted(per):
        v = sorted(per[b]); rng.shuffle(v)
        if b in buku_val:
            val += v[:VAL_MAKS_PER_BUKU]
        else:
            latih += v[:MAKS_PER_BUKU]
    return latih, val, buku_val


def main():
    baris = [l.rstrip('\n').split('\t') for l in open(os.path.join(WS, 'baris_saring.tsv'), encoding='utf8')]
    latih, val, buku_val = pilih(baris)
    daftar = [('latih', r) for r in latih] + [('val', r) for r in val]
    print(f'{len(baris)} baris saring -> latih {len(latih)} ({len({r[3] for r in latih})} buku), val {len(val)} (buku {sorted(buku_val, key=int)})')
    rows = []
    with zipfile.ZipFile(TUJUAN, 'w', zipfile.ZIP_STORED) as z:
        for k, (bagian, r) in enumerate(daftar):
            g = cv2.imread(os.path.join(WS, 'baris', r[0]), cv2.IMREAD_GRAYSCALE)
            if g is None or g.size == 0:
                continue
            if g.shape[0] > TINGGI_MAKS:
                s = TINGGI_MAKS / g.shape[0]
                g = cv2.resize(g, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
            nama = f'img/{bagian}_{k}.jpg'
            z.writestr(nama, cv2.imencode('.jpg', g, [cv2.IMWRITE_JPEG_QUALITY, 95])[1].tobytes())
            rows.append(f'{nama}\t{r[1]}\t{bagian}\t{r[3]}')
        z.writestr('label.tsv', '\n'.join(rows) + '\n')
        n = collections.Counter(x.split('	')[2] for x in rows)
        z.writestr('info.json', json.dumps(dict(sumber='Wikisource Jawa (domain publik), panen scripts/wikisource_jawa.py',
                                                 latih=n['latih'], val=n['val'], buku_val=sorted(buku_val, key=int)), ensure_ascii=False))
    print('Tersimpan', TUJUAN, os.path.getsize(TUJUAN) // 2**20, 'MB', len(rows), 'baris')


if __name__ == '__main__':
    main()
