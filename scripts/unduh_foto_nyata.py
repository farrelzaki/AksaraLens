# Unduh foto nyata beraksara Jawa dari Wikimedia Commons (di luar Set C) untuk melatih klasifikator aksara dan pembaca.
# Foto, label, dan atribusi disimpan di docs/random/foto_nyata (gitignored); hanya skrip ini yang di-commit.
# Pakai: python -I -X utf8 scripts/unduh_foto_nyata.py docs/random/foto_nyata [maks]
# Gelombang kedua: KATEGORI="Kategori A|Kategori B" SUDAH=docs/random/foto_nyata/atribusi.csv AWALAN=G python -I -X utf8 scripts/unduh_foto_nyata.py docs/random/foto_nyata2 600
# (KATEGORI mengganti daftar bawaan, SUDAH = atribusi.csv yang judulnya dilewati, AWALAN = awalan nama berkas)
import csv, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

OUT = sys.argv[1]
MAKS = int(sys.argv[2]) if len(sys.argv) > 2 else 200
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KATEGORI = ['Javanese script in public usage', 'Javanese script in Yogyakarta', 'Javanese script in Surakarta', 'Bilingual Indonesian-Javanese signs',
            'Javanese script', 'Javanese script in Semarang', 'Javanese script in Magelang', 'Javanese script in Malang']
if os.environ.get('KATEGORI'):
    KATEGORI = os.environ['KATEGORI'].split('|')
AWALAN = os.environ.get('AWALAN', 'F')
os.makedirs(OUT + '/foto', exist_ok=True)
UA = {'User-Agent': 'AksaraLens-eval/1.0 (student project)'}


def api(**p):
    p['format'] = 'json'
    for coba in range(8):
        try:
            time.sleep(1.5)
            return json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p), headers=UA), timeout=60))
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(20 * (coba + 1))
    raise RuntimeError('API Commons membatasi permintaan')


def anggota(kat, kedalaman, lihat):
    if kat in lihat or kedalaman < 0:
        return []
    lihat.add(kat)
    m = api(action='query', list='categorymembers', cmtitle='Category:' + kat, cmlimit=500, cmtype='file|subcat').get('query', {}).get('categorymembers', [])
    out = [x['title'] for x in m if x['title'].startswith('File:')]
    for x in m:
        if x['title'].startswith('Category:'):
            out += anggota(x['title'][9:], kedalaman - 1, lihat)
    return out


sys.path.insert(0, os.path.join(AKAR, 'scripts'))
from set_c import judul_set_c, kunci_judul  # judul Commons dibandingkan setelah dinormalisasi (spasi/garis bawah/%-encoding)
set_c = judul_set_c()
if not set_c:
    sys.exit('Set C tidak ditemukan: unduhan dihentikan agar foto uji tidak ikut terunduh.')
judul = []
lihat = set()
for k in KATEGORI:
    judul += anggota(k, 2, lihat)
sudah = set()
if os.environ.get('SUDAH'):
    sudah = {r['judul'] for r in csv.DictReader(open(os.environ['SUDAH'], encoding='utf-8'))}
judul = [t for t in dict.fromkeys(judul) if re.search(r'\.jpe?g$', t, re.I) and kunci_judul(t) not in set_c and t not in sudah]
print('kandidat', len(judul))

baris = []
for i in range(0, len(judul), 40):
    d = api(action='query', titles='|'.join(judul[i:i + 40]), prop='imageinfo', iiprop='url|extmetadata|size', iiurlwidth=1600)
    for p in d.get('query', {}).get('pages', {}).values():
        ii = (p.get('imageinfo') or [None])[0]
        if not ii or ii['width'] < 900:
            continue
        em = ii.get('extmetadata', {})
        baris.append(dict(judul=p['title'], url=ii.get('thumburl') or ii['url'], lisensi=em.get('LicenseShortName', {}).get('value', ''),
                          pembuat=re.sub('<[^>]+>', '', em.get('Artist', {}).get('value', ''))[:80]))
baris = baris[:MAKS]
with open(OUT + '/atribusi.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, ['berkas', 'judul', 'lisensi', 'pembuat', 'url'])
    w.writeheader()
    for n, b in enumerate(baris):
        nama = f'{AWALAN}{n:03d}.jpg'
        p = f'{OUT}/foto/{nama}'
        if not os.path.exists(p):
            for coba in range(4):
                try:
                    open(p, 'wb').write(urllib.request.urlopen(urllib.request.Request(b['url'], headers=UA), timeout=90).read())
                    break
                except Exception as e:
                    time.sleep(3 * (coba + 1))
            time.sleep(0.5)
        w.writerow(dict(berkas=nama, **b))
print('unduh', len([x for x in os.listdir(OUT + '/foto')]))
