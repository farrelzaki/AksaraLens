# Unduh set regresi NusaAksara ke folder gitignored: 30 halaman uji detektor (pembagian random.Random(0)
# seperti notebook) dan baris OCR Jawa. Butuh pyarrow; jalankan di venv terpisah.
# Pakai: python -I -X utf8 scripts/unduh_nusa.py docs/random/nusa
# Lisensi NusaAksara non-komersial, wajib sitasi; gambar tidak di-commit.
import concurrent.futures as cf, io, json, os, random, sys, urllib.request
from collections import defaultdict
import pyarrow.parquet as pq

OUT = sys.argv[1]
os.makedirs(OUT + '/hal', exist_ok=True)
os.makedirs(OUT + '/baris', exist_ok=True)
HF = 'https://huggingface.co/datasets/'


def ambil(url):
    r = urllib.request.Request(url, headers={'User-Agent': 'AksaraLens-eval'})
    return urllib.request.urlopen(r, timeout=60).read()


def simpan(url, p):
    if os.path.exists(p):
        return True
    try:
        d = ambil(url)
        open(p, 'wb').write(d)
        return True
    except Exception as e:
        print('gagal', url, e)
        return False


seg = pq.read_table(io.BytesIO(ambil(HF + 'Exqrch/NusaAksara-java/resolve/main/data/train-00000-of-00001-ca26e6577ffb55cf.parquet'))).to_pylist()
ocr = pq.read_table(io.BytesIO(ambil(HF + 'NusaAksara/NusaAksara/resolve/main/Image%20Transcription%20(OCR)/train-00000-of-00001.parquet'))).to_pylist()

per_hal, info = defaultdict(list), {}
for r in seg:
    p = r['segmentation_information'][0]
    xs, ys = p[0::2], p[1::2]
    per_hal[r['image_id']].append([float(min(xs)), float(min(ys)), float(max(xs)), float(max(ys))])
    info[r['image_id']] = r['image_url']
semua = sorted(per_hal)
random.Random(0).shuffle(semua)
hal_uji = semua[:30]


def ambil_hal(i):
    u = info[i]
    p = f"{OUT}/hal/{i}{os.path.splitext(u.split('?')[0])[1] or '.jpg'}"
    return i, p if simpan(u, p) else None


with cf.ThreadPoolExecutor(8) as ex:
    hasil = dict(ex.map(ambil_hal, hal_uji))

jawa = [r for r in ocr if r.get('script') == 'jawa']
with cf.ThreadPoolExecutor(16) as ex:
    n_baris = sum(ex.map(lambda r: simpan(r['image'], f"{OUT}/baris/{r['image'].split('/')[-1].split('?')[0]}"), jawa))

json.dump(dict(
    halaman={str(i): dict(file=hasil[i], kotak=per_hal[i]) for i in hal_uji if hasil[i]},
    ocr=[dict(image=r['image'], transcription=r['transcription']) for r in jawa],
), open(OUT + '/indeks.json', 'w', encoding='utf-8'), ensure_ascii=False)
ukuran = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
print(f'halaman {sum(1 for v in hasil.values() if v)}, baris {n_baris}/{len(jawa)}, total {ukuran / 1e6:.1f} MB')
