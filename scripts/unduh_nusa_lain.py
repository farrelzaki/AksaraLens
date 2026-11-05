# Unduh baris OCR NusaAksara untuk aksara selain Jawa (Sunda, Bali, Batak, Lampung, Lontara, Jawi, Pegon):
# contoh negatif nyata untuk klasifikator aksara. Folder gitignored; lisensi NusaAksara non-komersial, wajib sitasi.
# Pakai: python -I -X utf8 scripts/unduh_nusa_lain.py docs/random/nusa [lokasi_pyarrow]
import concurrent.futures as cf, io, json, os, sys, urllib.request

OUT = sys.argv[1]
if len(sys.argv) > 2:
    sys.path.insert(0, sys.argv[2])
import pyarrow.parquet as pq

os.makedirs(OUT + '/lain', exist_ok=True)
URL = 'https://huggingface.co/datasets/NusaAksara/NusaAksara/resolve/main/Image%20Transcription%20(OCR)/train-00000-of-00001.parquet'


def ambil(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'AksaraLens-eval'}), timeout=120).read()


def simpan(r):
    p = f"{OUT}/lain/{r['image'].split('/')[-1].split('?')[0]}"
    if os.path.exists(p):
        return True
    try:
        open(p, 'wb').write(ambil(r['image']))
        return True
    except Exception as e:
        print('gagal', r['image'], e)
        return False


baris = [r for r in pq.read_table(io.BytesIO(ambil(URL))).to_pylist() if r.get('script') != 'jawa']
with cf.ThreadPoolExecutor(16) as ex:
    n = sum(ex.map(simpan, baris))
json.dump({r['image'].split('/')[-1].split('?')[0]: r['script'] for r in baris}, open(OUT + '/lain/skrip.json', 'w'))
print(f'{n}/{len(baris)} baris')
