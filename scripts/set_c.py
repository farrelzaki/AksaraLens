# Penjaga Set C: foto uji tidak boleh masuk data latih, latar sintetis, maupun label (docs/RENCANA_SCANNER_FINAL.md).
# Judul Commons ditulis berbeda-beda (spasi atau garis bawah, %-encoding, awalan "File:", URL thumbnail "1920px-"),
# jadi pembandingan selalu lewat kunci_judul(). Bug 4 Nov 2026: pembandingan mentah membuat 22 foto Set C ikut terunduh.
# Pakai: python -X utf8 scripts/set_c.py   -> periksa semua atribusi data latih; keluar 1 bila ada yang bocor.
# Tes:   python -X utf8 -m unittest scripts/test_set_c.py
import csv, os, re, sys, urllib.parse

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LABEL_SET_C = os.path.join(AKAR, 'docs/random/set_c/label_set_c.csv')
ATRIBUSI = ['docs/random/foto_nyata/atribusi.csv', 'data/label_nyata/atribusi.csv']


def kunci_judul(s):
    """Judul, URL halaman, atau URL thumbnail Commons -> nama berkas ternormalisasi (huruf kecil, spasi tunggal)."""
    s = urllib.parse.unquote(urllib.parse.unquote(s or '')).replace('_', ' ')
    m = re.search(r'File:([^/?#]+)', s)
    if m:
        s = m.group(1)
    else:
        s = s.rstrip('/').split('/')[-1]
        s = re.sub(r'^\d+px-', '', s)
    return re.sub(r'\s+', ' ', s).strip().lower()


def judul_set_c(path=LABEL_SET_C):
    """-> {kunci_judul: id Set C}. Kosong bila Set C tidak ada di mesin ini."""
    if not os.path.exists(path):
        return {}
    return {kunci_judul(r['sumber']): r['id'] for r in csv.DictReader(open(path, encoding='utf-8')) if r.get('sumber')}


def bocor(baris, set_c):
    """baris: [(berkas, judul_atau_url)] -> {berkas: id Set C} untuk yang sama dengan foto Set C."""
    return {b: set_c[kunci_judul(j)] for b, j in baris if kunci_judul(j) in set_c}


def main():
    set_c = judul_set_c()
    if not set_c:
        sys.exit('Set C tidak ditemukan; pemeriksaan tidak bisa dijalankan.')
    ada = False
    for rel in ATRIBUSI:
        p = os.path.join(AKAR, rel)
        if not os.path.exists(p):
            continue
        rows = list(csv.reader(open(p, encoding='utf-8')))
        b = bocor([(r[0], r[1]) for r in rows[1:] if len(r) > 1], set_c)
        print(f'{rel}: {len(rows) - 1} foto, bocor {len(b)}', dict(sorted(b.items())) if b else '')
        ada |= bool(b)
    sys.exit(1 if ada else 0)


if __name__ == '__main__':
    main()
