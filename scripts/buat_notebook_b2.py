# Membuat docs/random/AksaraLens_Model2_B2.ipynb (Plan B2, docs/RENCANA_SCANNER_FINAL.md): fine-tune pembaca pra-latih
# PP-OCRv5_server_rec (PaddleOCR) dengan charset AksaraLens. Bagian data disalin dari notebook v4 (NusaAksara, sintetis v4c,
# adegan v3, potongan foto nyata terpercaya), lalu diekspor ke folder gambar + daftar label PaddleOCR.
# Pembaca v2 ikut dimuat hanya sebagai pembanding pada split yang sama. Config PaddleOCR berasal dari scripts/b2_paddle.py.
# Pakai: python -X utf8 scripts/buat_notebook_b2.py   (butuh docs/random/AksaraLens_Model2_v4.ipynb dari buat_notebook_v4.py)
import copy, json, os

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUMBER = os.path.join(AKAR, 'docs/random/AksaraLens_Model2_v4.ipynb')
TUJUAN = os.path.join(AKAR, 'docs/random/AksaraLens_Model2_B2.ipynb')
nb = json.load(open(SUMBER, encoding='utf-8'))
LAMA = nb['cells']
B2_PY = open(os.path.join(AKAR, 'scripts/b2_paddle.py'), encoding='utf-8').read()
CHARSET = json.load(open(os.path.join(AKAR, 'src/ml/model2/scanner_charset.json'), encoding='utf-8'))['charset'][1:]


def kode(s):
    return {'cell_type': 'code', 'execution_count': None, 'metadata': {}, 'outputs': [], 'source': s.strip('\n').splitlines(True)}


def teks(s):
    return {'cell_type': 'markdown', 'metadata': {}, 'source': s.strip('\n').splitlines(True)}


def salin(i, *ganti):
    c = copy.deepcopy(LAMA[i])
    s = ''.join(c['source'])
    for a, b in ganti:
        assert a in s, (i, a[:60])
        s = s.replace(a, b)
    c['source'] = s.splitlines(True)
    if c['cell_type'] == 'code':
        c['outputs'], c['execution_count'] = [], None
    return c


for i, awal in [(6, 'SIMPAN_KE_DRIVE'), (11, '# ===== Alat bantu aksara'), (13, '# ===== Generator data sintetis'), (16, '# ===== Data adegan v3'),
                (19, 'import numpy as np, torch'), (21, 'def blok('), (23, 'import editdistance'), (25, 'def normalisasi_polaritas'),
                (27, '!pip install -q datasets'), (28, '# Bagi per HALAMAN'), (29, '@torch.no_grad()'), (31, '# ---------- Data adegan'),
                (32, '# ---------- Sintetis v4'), (39, '## Sumber')]:
    assert ''.join(LAMA[i]['source']).lstrip().startswith(awal), (i, ''.join(LAMA[i]['source'])[:40])

JUDUL = teks('''
# AksaraLens · Model 2 B2: pembaca pra-latih PP-OCRv5 untuk foto papan

Fine-tune **PP-OCRv5_server_rec** (PaddleOCR, Apache-2.0), pembaca yang sudah dilatih jutaan baris teks dari foto nyata,
dengan 31 karakter aksara Jawa AksaraLens. Keluarannya CTC dengan urutan kelas **sama persis** dengan pembaca v2
(`scanner_charset.json`), sehingga dekoder, model bahasa L5, dan penilai status di aplikasi tetap dipakai.

**Data:** baris buku NusaAksara (asli + augmentasi), sintetis v4c (baris buku di latar foto papan), adegan v3, buku sintetis,
dan potongan foto nyata terpercaya. Tanpa Set C. Label kosong (negatif) tidak dipakai karena PaddleOCR membuangnya;
penolakan "bukan aksara" tetap tugas klasifikator.

**Cara pakai:** Runtime → **A100** (atau L4/T4, lebih lama) → **Run all**. Butuh di Drive `aksaralens/`: `sintetis_v4c_jpg.zip`,
`data_nyata_v4.zip`, dan `model2_v2/crnn_finetune.pt` (pembanding). Hasil di `aksaralens/model2_b2/`:
`aksaralens_pembaca_b2.onnx` dan `hasil_b2.json`. Set C tidak ada di notebook ini; gerbang rilis diukur agen di laptop.
''')

PENGATURAN = salin(6, ("OUT_DIR = '/content/drive/MyDrive/aksaralens/model2_v4'   # hasil v4, terpisah dari v2/v3",
                       "OUT_DIR = '/content/drive/MyDrive/aksaralens/model2_b2'   # hasil B2, terpisah dari v2/v4"),
                   ("assert SIMPAN_KE_DRIVE, 'v4 membutuhkan bobot v2 dan data di Drive'", "assert SIMPAN_KE_DRIVE, 'B2 membutuhkan data di Drive'"))

# Sel data v4 tanpa pratinjau gambar di akhir (tidak perlu di sini).
DATA_V4 = ''.join(LAMA[32]['source'])
DATA_V4 = DATA_V4[:DATA_V4.index('contoh = random.Random(3)')].rstrip() + '\n'

PEMBANDING = kode('''
# ---------- Pembanding: pembaca v2 pada split yang sama ----------
awal_v2 = nilai_v4(model)                    # model = bobot v2 (dimuat di bagian 8)
awal_v2['buku_uji'] = m_awal['akurasi_suku']
print('v2:', {k: (round(v, 4) if v is not None else None) for k, v in awal_v2.items()})
model.cpu(); torch.cuda.empty_cache()        # GPU dikosongkan untuk PaddlePaddle
''')

EKSPOR_DATA = kode(r'''
# ---------- Ekspor data ke format PaddleOCR: gambar + "path\tlabel\tlebar\ttinggi" (label urutan TAMPAK) ----------
import multiprocessing as mp, shutil
DATA = '/content/b2data'
shutil.rmtree(DATA, ignore_errors=True); os.makedirs(f'{DATA}/img', exist_ok=True)
N_ADEGAN, N_SINTETIS = 20000, 10000          # dibuat baru; buku, v4, dan foto nyata dari bagian sebelumnya
ULANG_BUKU, ULANG_FOTO = 5, 25               # buku asli + 4 augmentasi; 17 foto nyata diulang dengan augmentasi
PANJANG_MAKS = 100
PORSI_BALIK = 0.25                           # sebagian dibalik (tulisan terang di latar gelap) supaya kuat dua polaritas

def baris_daftar(nama, gray, teks_logis):
    t = to_visual(teks_logis)
    if not t or len(t) > PANJANG_MAKS or any(c not in CHAR2IDX for c in t) or gray is None or gray.size == 0:
        return None
    p = f'img/{nama}.png'
    cv2.imwrite(f'{DATA}/{p}', gray)
    return f'{p}\t{t}\t{gray.shape[1]}\t{gray.shape[0]}'

def _balik(g, rng):
    return 255 - g if rng.random() < PORSI_BALIK else g

def kerja_buku(k):
    rng = random.Random(10_000 + k); d = nyata_latih[k]; out = []
    for j in range(ULANG_BUKU):
        g = d['gray'] if j == 0 else augment(d['gray'], rng)
        out.append(baris_daftar(f'buku_{k}_{j}', _balik(g, rng) if j else g, d['teks']))
    return out

def kerja_v4(k):
    d = v4_latih[k]
    return [baris_daftar(f'v4_{k}', cv2.imread(d['path'], cv2.IMREAD_GRAYSCALE), d['teks'])]   # polaritas asli foto

_per = {}
def kerja_adegan(k):
    rng = random.Random(20_000_000 + k); per = _per.setdefault('p', Perender(FONT_SPECS))
    while True:
        r = baris_adegan(rng, per)
        if r is not None:
            return [baris_daftar(f'adegan_{k}', r[0], r[1])]

def kerja_sintetis(k):
    rng = random.Random(30_000_000 + k); per = _per.setdefault('p', Perender(FONT_SPECS))
    while True:
        s = acak_teks(rng, 1, 14, PAKAI_WYANJANA); a = per.render(s, rng)
        if a is not None:
            return [baris_daftar(f'sint_{k}', _balik(augment(a, rng), rng), s)]

def kerja_foto(k):
    rng = random.Random(40_000 + k); d = nyata_foto_latih[k % len(nyata_foto_latih)]
    g = d['gray'] if k < len(nyata_foto_latih) else _balik(augment(d['gray'], rng), rng)
    return [baris_daftar(f'foto_{k}', g, d['teks'])]

def kerja_adegan_val(k):                      # sama persis dengan validasi adegan v2/v4 (AdeganDS seed 4242)
    rng = random.Random(4242 * 1_000_003 + k); per = _per.setdefault('p', Perender(FONT_SPECS))
    while True:
        r = baris_adegan(rng, per)
        if r is not None:
            return [baris_daftar(f'val_adegan_{k}', r[0], r[1])]

def jalankan(fungsi, n):
    with mp.get_context('fork').Pool(os.cpu_count()) as pool:
        return [b for hasil in pool.map(fungsi, range(n), chunksize=64) for b in hasil if b]

t0 = time.time()
latih = (jalankan(kerja_buku, len(nyata_latih)) + jalankan(kerja_v4, len(v4_latih)) + jalankan(kerja_adegan, N_ADEGAN)
         + jalankan(kerja_sintetis, N_SINTETIS) + (jalankan(kerja_foto, len(nyata_foto_latih) * ULANG_FOTO) if nyata_foto_latih else []))
random.Random(0).shuffle(latih)
val = {
    'buku': [baris_daftar(f'val_buku_{k}', d['gray'], d['teks']) for k, d in enumerate(nyata_val)],
    'buku_uji': [baris_daftar(f'uji_buku_{k}', d['gray'], d['teks']) for k, d in enumerate(nyata_uji)],
    'v4': [baris_daftar(f'val_v4_{k}', cv2.imread(d['path'], cv2.IMREAD_GRAYSCALE), d['teks']) for k, d in enumerate(v4_val)],
    'adegan': jalankan(kerja_adegan_val, 400),
    'foto': [baris_daftar(f'val_foto_{k}', d['gray'], d['teks']) for k, d in enumerate(nyata_foto_val)],
}
val = {k: [b for b in v if b] for k, v in val.items()}
open(f'{DATA}/latih.txt', 'w', encoding='utf-8').write('\n'.join(latih) + '\n')
for k, v in val.items():
    open(f'{DATA}/val_{k}.txt', 'w', encoding='utf-8').write('\n'.join(v) + '\n')
# Validasi selama latihan (pemilihan bobot PaddleOCR): buku + v4 + adegan + foto, tanpa data uji buku
open(f'{DATA}/val.txt', 'w', encoding='utf-8').write('\n'.join(val['buku'] + val['v4'] + val['adegan'] + val['foto']) + '\n')
asal = lambda b: b.split('/')[1].split('_')[0]
from collections import Counter
print(f'Latih {len(latih)} baris', dict(Counter(asal(b) for b in latih)), f'({time.time()-t0:.0f} dtk)')
print('Validasi', {k: len(v) for k, v in val.items()})
fig, axs = plt.subplots(10, 1, figsize=(12, 9))
for ax, b in zip(axs, random.Random(5).sample(latih, 10)):
    p, t = b.split('\t')[:2]
    ax.imshow(cv2.imread(f'{DATA}/{p}', cv2.IMREAD_GRAYSCALE), cmap='gray'); ax.axis('off')
    ax.set_title(f"{asal(b)}: {' '.join(suku_kata(to_logical(t)))}"[:120], fontsize=8, loc='left')
plt.tight_layout(); plt.show()
''')

PASANG_PADDLE = kode(r'''
# ---------- PaddlePaddle GPU + PaddleOCR (dijalankan sebagai proses terpisah, tidak bercampur dengan PyTorch) ----------
import subprocess
!pip install -q paddlepaddle-gpu==3.3.1 -i https://www.paddlepaddle.org.cn/packages/stable/cu130/
if not os.path.exists('/content/PaddleOCR'):
    os.system('git clone -q https://github.com/PaddlePaddle/PaddleOCR.git /content/PaddleOCR')
!cd /content/PaddleOCR && git checkout -q dab3fe3 && pip install -q -r requirements.txt
PRA = '/content/b2/PP-OCRv5_server_rec_pretrained'
os.makedirs('/content/b2', exist_ok=True)
if not os.path.exists(PRA + '.pdparams'):
    urllib.request.urlretrieve('https://paddle-model-ecology.bj.bcebos.com/paddlex/official_pretrained_model/PP-OCRv5_server_rec_pretrained.pdparams', PRA + '.pdparams')
print('Bobot pra-latih:', os.path.getsize(PRA + '.pdparams') // 2**20, 'MB')
print(subprocess.run(['python', '-c', 'import paddle; paddle.utils.run_check(); print(paddle.__version__, paddle.device.cuda.get_device_name())'],
                     capture_output=True, text=True).stdout[-400:])
''')

CONFIG = kode('B2_PY = ' + repr(B2_PY) + '\nCHARSET_JSON = ' + json.dumps(CHARSET, ensure_ascii=False) + '\n' + r'''
# ---------- Config (B2_PY = isi scripts/b2_paddle.py dari repo, ditulis apa adanya) ----------
open('/content/b2/b2_paddle.py', 'w', encoding='utf-8').write(B2_PY)
import sys, importlib; sys.path.insert(0, '/content/b2'); import b2_paddle; importlib.reload(b2_paddle)
assert CHARSET_JSON == VOCAB, 'Urutan kelas berbeda dari aplikasi. Laporkan ke agen.'
open('/content/b2/dict.txt', 'w', encoding='utf-8').write('\n'.join(CHARSET_JSON) + '\n')
EPOCH_B2, BS_B2, LR_B2 = 12, 32, 3e-4
SIMPAN_B2 = f'{OUT_DIR}/paddle'              # checkpoint di Drive: aman bila runtime terputus
b2_paddle.tulis_config('/content/b2/cfg.yml', data_dir=DATA, latih=f'{DATA}/latih.txt', val=f'{DATA}/val.txt', dict_path='/content/b2/dict.txt',
                       out_dir=SIMPAN_B2, pretrained=PRA, epoch=EPOCH_B2, bs=BS_B2, lr=LR_B2, lebar_maks=1600, gpu=True,
                       workers=min(8, os.cpu_count()), eval_tiap=1000, cetak_tiap=100)
print('Config ditulis; latih', sum(1 for _ in open(f'{DATA}/latih.txt')), 'baris, epoch', EPOCH_B2)
''')

LATIH = kode(r'''
# ---------- Latih (log penuh di Drive: model2_b2/paddle/train.log) ----------
# Bila runtime terputus: jalankan ulang sel-sel sebelumnya, lalu sel ini melanjutkan dari checkpoint latest.
lanjut = f'{SIMPAN_B2}/latest.pdparams'
opsi = ['-o', f'Global.checkpoints={SIMPAN_B2}/latest'] if os.path.exists(lanjut) else []
t0 = time.time()
p = subprocess.Popen(['python', 'tools/train.py', '-c', '/content/b2/cfg.yml', *opsi], cwd='/content/PaddleOCR',
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
for baris in p.stdout:
    if any(k in baris for k in ('epoch:', 'cur metric', 'best metric', 'Error', 'error', 'Traceback', 'save model')):
        print(baris.rstrip()[-260:], flush=True)
assert p.wait() == 0, 'Latihan gagal; lihat train.log di Drive dan laporkan ke agen.'
print(f'Selesai dalam {(time.time()-t0)/60:.0f} menit:', sorted(os.listdir(SIMPAN_B2)))
''')

EKSPOR_ONNX = kode(r'''
# ---------- Ekspor: bobot -> model inferensi Paddle -> ONNX ----------
# paddle2onnx 2.1.0 belum punya wheel Python 3.13 dan hanya cocok dengan paddle 3.1.1, jadi ekspor DAN konversi memakai venv
# Python 3.12 terpisah berisi paddle 3.1.1 CPU. (7 Nov 2026: model inferensi dari paddle-gpu 3.3.1 ditolak paddle2onnx,
# "unsupported operators"; ekspor dengan paddle 3.1.1 lolos.)
if not os.path.exists('/content/p2o/bin/paddle2onnx'):
    assert os.system('pip install -q uv && uv venv -q -p 3.12 /content/p2o && uv pip install -q -p /content/p2o/bin/python paddlepaddle==3.1.1 '
                     'paddle2onnx==2.1.0 setuptools packaging onnx -r /content/PaddleOCR/requirements.txt') == 0
onnx_ada = {}
for nama in ('best_accuracy', 'latest'):
    if not os.path.exists(f'{SIMPAN_B2}/{nama}.pdparams'): continue
    inf = f'/content/b2/infer_{nama}'
    r = subprocess.run(['/content/p2o/bin/python', 'tools/export_model.py', '-c', '/content/b2/cfg.yml', '-o', 'Global.use_gpu=False',
                        f'Global.pretrained_model={SIMPAN_B2}/{nama}', f'Global.save_inference_dir={inf}'],
                       cwd='/content/PaddleOCR', capture_output=True, text=True)
    assert r.returncode == 0, r.stdout[-2000:] + r.stderr[-2000:]
    berkas = sorted(os.listdir(inf)); model_file = 'inference.json' if 'inference.json' in berkas else 'inference.pdmodel'
    out = f'/content/b2/b2_{nama}.onnx'
    r = subprocess.run(['/content/p2o/bin/paddle2onnx', '--model_dir', inf, '--model_filename', model_file, '--params_filename', 'inference.pdiparams',
                        '--save_file', out, '--opset_version', '17'], capture_output=True, text=True)
    assert r.returncode == 0 and os.path.exists(out), r.stdout[-2000:] + r.stderr[-2000:]
    onnx_ada[nama] = out
    print(nama, '->', out, f'{os.path.getsize(out)/2**20:.1f} MB')
''')

UKUR = kode(r'''
# ---------- Ukur ONNX dengan praproses yang akan dipakai aplikasi (bukan evaluasi PaddleOCR) ----------
import onnxruntime as ort
def baca_daftar(k):
    return [(cv2.imread(f'{DATA}/{b.split(chr(9))[0]}', cv2.IMREAD_GRAYSCALE), to_logical(b.split(chr(9))[1])) for b in val[k]]
set_ukur = {k: baca_daftar(k) for k in ('buku', 'buku_uji', 'v4', 'adegan', 'foto')}

def baca_onnx(sesi, gray, dua_polaritas=False):
    calon = [gray, 255 - gray] if dua_polaritas else [gray]
    terbaik = None
    for g in calon:
        p = sesi.run(None, {sesi.get_inputs()[0].name: b2_paddle.ke_masukan(g)})[0][0]      # [T, 32] peluang
        ids = p.argmax(-1); out, prev, yakin = [], 0, []
        for t, c in enumerate(ids):
            if c != prev and c != 0: out.append(int(c)); yakin.append(p[t, c])
            prev = c
        skor = float(np.mean(yakin)) if yakin else 0.0
        if terbaik is None or skor > terbaik[1]: terbaik = (decode(out), skor)
    return terbaik[0]

hasil_b2 = {}
for nama, path in onnx_ada.items():
    sesi = ort.InferenceSession(path, providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
    m = {}
    for k, items in set_ukur.items():
        if not items: m[k] = None; continue
        P = [baca_onnx(sesi, g) for g, _ in items]; T = [t for _, t in items]
        m[k] = metrik(P, T)['akurasi_suku']
        if k in ('v4', 'foto'):
            m[k + '_dua_polaritas'] = metrik([baca_onnx(sesi, g, True) for g, _ in items], T)['akurasi_suku']
    hasil_b2[nama] = m
    print(nama, {k: (round(v, 4) if v is not None else None) for k, v in m.items()})

def skor_pilih(m):
    if m['buku'] < awal_v2['buku'] - 0.01: return -1                    # buku bersih tidak boleh dikorbankan
    papan = m['v4'] if m['foto'] is None else 0.5 * m['v4'] + 0.5 * m['foto']
    return papan + 0.3 * m['adegan']
pilih = max(hasil_b2, key=lambda k: skor_pilih(hasil_b2[k]))
shutil.copy(onnx_ada[pilih], f'{OUT_DIR}/aksaralens_pembaca_b2.onnx')
ringkas = dict(versi='B2', dasar='PP-OCRv5_server_rec', dipilih=pilih, lolos_penjaga_buku=skor_pilih(hasil_b2[pilih]) >= 0,
               v2=awal_v2, b2=hasil_b2, n=dict(latih=len(latih), **{k: len(v) for k, v in val.items()}),
               config=dict(epoch=EPOCH_B2, bs=BS_B2, lr=LR_B2), masukan='[1,3,48,W] BGR (x/255-0.5)/0.5, keluaran [1,T,32] peluang softmax',
               onnx_mb=os.path.getsize(onnx_ada[pilih]) / 2**20)
json.dump(ringkas, open(f'{OUT_DIR}/hasil_b2.json', 'w'), indent=1, default=float)
print(json.dumps({k: v for k, v in ringkas.items()}, indent=1, default=float)[:3000])
print('Kirim ke agen dari', OUT_DIR, ': aksaralens_pembaca_b2.onnx dan hasil_b2.json')
''')

sel = [
    JUDUL,
    salin(1), salin(2), salin(3), salin(4), salin(5), PENGATURAN,
    salin(7), salin(8), salin(9), salin(10), salin(11), salin(12), salin(13), salin(14),
    salin(15), salin(16), salin(17),
    salin(18), salin(19), salin(20), salin(21), salin(22), salin(23), salin(24), salin(25),
    salin(26), salin(27), salin(28), salin(29),
    teks('## 11. Data (sama dengan v4) dan pembanding v2'),
    salin(31), kode(DATA_V4), PEMBANDING,
    teks('## 12. Ekspor data ke format PaddleOCR\n\nPeriksa 10 contoh di bawah: label harus cocok dengan gambar (tulisan terang/gelap keduanya boleh).'),
    EKSPOR_DATA,
    teks('## 13. Fine-tune PP-OCRv5_server_rec\n\nPaddlePaddle GPU dan PaddleOCR dipasang, lalu latihan berjalan sebagai proses terpisah. Lapisan keluaran (18 ribu kelas Tionghoa/Latin) diganti 32 kelas AksaraLens; seluruh jaringan dilatih ulang dengan lr kecil.'),
    PASANG_PADDLE, CONFIG, LATIH,
    teks('## 14. Ekspor ONNX dan ukur\n\nDua kandidat (bobot validasi terbaik dan bobot terakhir) diukur dengan praproses aplikasi. Yang dipilih: papan (v4 + foto) terbaik selama buku tidak turun lebih dari 1 poin dari v2.'),
    EKSPOR_ONNX, UKUR,
    salin(39, ('## Sumber & atribusi', '## Sumber & atribusi\n- PP-OCRv5_server_rec, PaddleOCR (Apache-2.0). https://github.com/PaddlePaddle/PaddleOCR')),
]
nb['cells'] = sel
for c in sel:
    c.pop('id', None)
json.dump(nb, open(TUJUAN, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Tersimpan', TUJUAN, len(sel), 'sel', os.path.getsize(TUJUAN) // 1024, 'KB')
for i, c in enumerate(sel):
    if c['cell_type'] == 'code':
        s = ''.join(ln for ln in ''.join(c['source']).splitlines(True) if not ln.lstrip().startswith(('!', '%')))
        compile(s, f'sel {i}', 'exec')
print('Sintaks semua sel kode lolos')
