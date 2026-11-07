# Membuat docs/random/AksaraLens_Model2_v4.ipynb (L4a, docs/RENCANA_SCANNER_FINAL.md): fine-tune PEMBACA CRNN v2 dengan
# sintetis v4 (baris NusaAksara asli di atas latar foto nyata), adegan v3 pendek, negatif, dan potongan foto nyata TERPERCAYA.
# Detektor tidak dilatih: produksi memakai PP-OCRv5. Arsitektur, charset, dan tinggi 64 tetap, jadi kode web tidak berubah.
# Dibangun dari notebook v3 (jalankan scripts/buat_notebook_v3.py dulu bila belum ada). Pakai: python -X utf8 scripts/buat_notebook_v4.py
import copy, json, os

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUMBER = os.path.join(AKAR, 'docs/random/AksaraLens_Model2_v3.ipynb')
TUJUAN = os.path.join(AKAR, 'docs/random/AksaraLens_Model2_v4.ipynb')
nb = json.load(open(SUMBER, encoding='utf-8'))
LAMA = nb['cells']


def kode(s):
    return {'cell_type': 'code', 'execution_count': None, 'metadata': {}, 'outputs': [], 'source': s.strip('\n').splitlines(True)}


def teks(s):
    return {'cell_type': 'markdown', 'metadata': {}, 'source': s.strip('\n').splitlines(True)}


def sumber(i):
    return ''.join(LAMA[i]['source'])


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


# Pastikan indeks sel v3 yang dipakai masih sesuai (notebook v3 dibangun ulang oleh skripnya sendiri).
for i, awal in [(6, 'SIMPAN_KE_DRIVE'), (11, '# ===== Alat bantu aksara'), (13, '# ===== Generator data sintetis'), (16, '# ===== Data adegan v3'),
                (19, 'import numpy as np, torch'), (21, 'def blok('), (23, 'import editdistance'), (25, 'def normalisasi_polaritas'),
                (27, '!pip install -q datasets'), (28, '# Bagi per HALAMAN'), (29, '@torch.no_grad()'), (31, '# ---------- Data adegan'),
                (43, 'import onnx, onnxruntime'), (45, '## Sumber')]:
    assert sumber(i).lstrip().startswith(awal), (i, sumber(i)[:40])

JUDUL = teks('''
# AksaraLens · Model 2 v4: pembaca untuk foto papan

Fine-tune **pembaca CRNN v2** (yang sedang dipakai di aplikasi). Detektor tidak dilatih karena aplikasi memakai PP-OCRv5.
Arsitektur, charset, dan tinggi 64 sama dengan v2, jadi aplikasi cukup mengganti berkas `aksaralens_scanner.onnx`.

**Data per batch:** buku NusaAksara asli, **sintetis v4** (baris buku asli ditempel ke latar foto papan nyata), adegan v3 pendek,
negatif (Latin, angka, tekstur, Sunda/Bali; label kosong), dan **potongan foto nyata terpercaya** bila ada.

**Cara pakai**
1. Runtime → Change runtime type → **T4 GPU**.
2. Unggah ke Drive folder `aksaralens/`:
   - `sintetis_v4c_jpg.zip` (wajib, ±171 MB, dari `docs/random/` di laptop Farrel);
   - `data_nyata_v4.zip` (opsional, hasil `scripts/ekspor_label_latih.py`; makin banyak label terpercaya makin baik).
3. Pastikan `aksaralens/model2_v2/crnn_finetune.pt` ada (bobot v2).
4. Runtime → **Run all**. Sekitar 40–50 menit di T4.
5. Kirim ke agen dari `aksaralens/model2_v4`: `aksaralens_scanner.onnx` dan `hasil_v4.json`.

Set C dan set uji baru **tidak** ada di notebook ini; gerbang rilis diukur agen di laptop.
''')

PENGATURAN = salin(6, ("OUT_DIR = '/content/drive/MyDrive/aksaralens/model2_v3'   # hasil v3, terpisah dari v2",
                       "OUT_DIR = '/content/drive/MyDrive/aksaralens/model2_v4'   # hasil v4, terpisah dari v2/v3"),
                   ("assert SIMPAN_KE_DRIVE, 'v3 membutuhkan bobot v2 di Drive'", "assert SIMPAN_KE_DRIVE, 'v4 membutuhkan bobot v2 dan data di Drive'"))

# Sel 31 v3 memuat AdeganDS/NegatifDS/validasi + data nyata v3; bagian data nyata v3 diganti dengan data v4 di bawah.
ADEGAN_DS = sumber(31)
ADEGAN_DS = ADEGAN_DS[:ADEGAN_DS.index('# ---------- Data nyata opsional')].rstrip() + '\n'
ADEGAN_DS = ADEGAN_DS.replace('def nilai_v3(model):', 'def nilai_v3_lama(model):')

DATA_V4 = kode(r'''
# ---------- Sintetis v4 + potongan foto nyata terpercaya ----------
import zipfile, csv as _csv
DRIVE = os.path.dirname(OUT_DIR)
V4_ZIP, NYATA_ZIP = f'{DRIVE}/sintetis_v4c_jpg.zip', f'{DRIVE}/data_nyata_v4.zip'
assert os.path.exists(V4_ZIP), 'Unggah sintetis_v4c_jpg.zip ke ' + DRIVE
if not os.path.exists('/content/v4/label.json'):
    zipfile.ZipFile(V4_ZIP).extractall('/content/v4')

# Sampel v4 dibuat dari baris Nusa. Hanya sampel yang baris asalnya ada di nyata_latih (latih) / nyata_val (validasi) yang dipakai,
# sehingga halaman uji buku tidak pernah terlihat, dan labelnya diambil dari d['teks'] notebook ini (pembersihan sama).
teks_latih = {d['file']: d['teks'] for d in nyata_latih}
teks_val = {d['file']: d['teks'] for d in nyata_val}

def muat_v4(folder, teks_boleh):
    lab = json.load(open(f'{folder}/label.json', encoding='utf-8'))
    asal = json.load(open(f'{folder}/sumber.json'))
    balik = set(json.load(open(f'{folder}/terbalik.json')))
    items = []
    for f in sorted(lab):
        if asal[f] in teks_boleh:
            items.append(dict(path=f'{folder}/gambar/{f}', teks=teks_boleh[asal[f]], balik=f in balik))
    return items, len(lab)

v4_latih, n_v4 = muat_v4('/content/v4', teks_latih)
v4_val, n_v4v = muat_v4('/content/v4/val', teks_val)
print(f'Sintetis v4: latih {len(v4_latih)}/{n_v4}, validasi {len(v4_val)}/{n_v4v}')
assert len(v4_latih) >= 0.9 * n_v4 and len(v4_val) >= 0.9 * n_v4v, 'Pembagian halaman berbeda dari saat data dibuat. Laporkan ke agen.'

def baca_v4(d):
    g = cv2.imread(d['path'], cv2.IMREAD_GRAYSCALE)
    return 255 - g if d['balik'] else g            # pembaca menerima tinta gelap

nyata_foto_latih, nyata_foto_val = [], []
if os.path.exists(NYATA_ZIP):
    zipfile.ZipFile(NYATA_ZIP).extractall('/content/nyata_v4')
    for r in _csv.DictReader(open('/content/nyata_v4/label.csv', encoding='utf-8')):
        g = cv2.imread(f"/content/nyata_v4/{r['file']}", cv2.IMREAD_GRAYSCALE)
        if g is None or any(c not in CHAR2IDX for c in r['teks']): continue
        (nyata_foto_val if r['bagian'] == 'val' else nyata_foto_latih).append(dict(gray=g, teks=r['teks'], file=r['file']))
print(f'Potongan foto nyata terpercaya: latih {len(nyata_foto_latih)}, validasi {len(nyata_foto_val)}')

class V4DS(Dataset):
    def __init__(self, items, aug=True): self.items, self.aug = items, aug
    def __len__(self): return len(self.items)
    def __getitem__(self, i):
        d = self.items[i]; g = baca_v4(d); rng = random.Random()
        # sampel v4 sudah berefek foto; cukup sesekali tambahan ringan supaya tiap epoch tidak identik
        if self.aug and rng.random() < 0.3:
            g = cv2.GaussianBlur(g, (3, 3), 0) if rng.random() < 0.5 else np.clip(g.astype(np.int16) + rng.randint(-25, 25), 0, 255).astype(np.uint8)
        x = ke_input(g, max_w=4000); y = encode(d['teks'])
        if x.shape[1] // 4 < len(y) + sum(1 for a, b in zip(y, y[1:]) if a == b):
            return None
        return torch.from_numpy(x)[None], torch.tensor(y, dtype=torch.long), d['teks']

def gabung_aman(batch):
    return gabung([b for b in batch if b is not None])

val_v4 = DataLoader(V4DS(v4_val, aug=False), 32, shuffle=False, num_workers=WORKERS, collate_fn=gabung_aman)

@torch.no_grad()
def nilai_v4(model):
    """Validasi: buku nyata (penjaga), sintetis v4 val (papan), adegan, negatif tertolak, dan foto nyata val bila ada."""
    m = nilai_v3_lama(model)
    m['v4'] = evaluasi(model, val_v4)[0]['akurasi_suku']
    m['foto'] = eval_nyata(model, nyata_foto_val)[0]['akurasi_suku'] if nyata_foto_val else None
    return m

contoh = random.Random(3).sample(v4_latih, 6)
fig, axs = plt.subplots(6, 1, figsize=(12, 6))
for ax, d in zip(axs, contoh):
    ax.imshow(baca_v4(d), cmap='gray'); ax.axis('off'); ax.set_title(' '.join(suku_kata(d['teks']))[:120], fontsize=8, loc='left')
plt.tight_layout(); plt.show()
''')

LATIH_V4 = kode(r'''
import shutil
# Titik awal: bobot v2. Fase 1 belajar papan dengan konvolusi bawah DIBEKUKAN pada 20% langkah awal (fitur goresan dasar v2 dijaga),
# fase 2 lr kecil dengan batch didominasi buku untuk mengembalikan akurasi buku. Bobot dipilih dari validasi papan selama buku
# tidak turun lebih dari 1 poin dari v2.
F1_LANGKAH, F1_LR = 5000, 2e-4
F2_LANGKAH, F2_LR = 2000, 5e-5
BEKU_PORSI = 0.2
BEKU_BLOK = 3                     # tiga blok konvolusi pertama (32, 64, 128 kanal)
TURUN_BUKU = 0.01
ada_foto = len(nyata_foto_latih) > 0
# (buku nyata, buku sintetis, v4, adegan, negatif, foto nyata) per batch. Tanpa foto nyata, slotnya diberikan ke v4.
F1_CAMPUR = (9, 2, 11, 6, 2, 2) if ada_foto else (9, 2, 13, 6, 2, 0)
F2_CAMPUR = (16, 2, 7, 3, 2, 2) if ada_foto else (16, 2, 9, 3, 2, 0)

class NyataDS(Dataset):
    def __init__(self, items): self.items = items
    def __len__(self): return len(self.items)
    def __getitem__(self, i):
        d = self.items[i]; rng = random.Random()
        g = augment(d['gray'], rng) if rng.random() < 0.7 else d['gray']
        x = ke_input(g, max_w=4000); y = encode(d['teks'])
        if x.shape[1] // 4 < len(y) + sum(1 for a, b in zip(y, y[1:]) if a == b):
            x = ke_input(d['gray'], max_w=4000)
        return torch.from_numpy(x)[None], torch.tensor(y, dtype=torch.long), d['teks']

def tanpa_henti(dl):
    while True:
        ada = False
        for b in dl:
            ada = True; yield b
        if not ada: raise RuntimeError('DataLoader kosong')

def pemuat(n, ds):
    if n == 0: return None
    return tanpa_henti(DataLoader(ds, n, shuffle=True, drop_last=len(ds) >= n, num_workers=WORKERS, collate_fn=list))

def muat_campuran(c):
    buku, sint, v4, adegan, neg, foto = c
    foto_ds = NyataDS(nyata_foto_latih * max(1, 400 // max(1, len(nyata_foto_latih))))   # sedikit -> diulang
    return [p for p in (pemuat(buku, NyataDS(nyata_latih)), pemuat(sint, LatihDS(SAMPEL_EPOCH, seed=123)), pemuat(v4, V4DS(v4_latih)),
                        pemuat(adegan, AdeganDS(SAMPEL_EPOCH)), pemuat(neg, NegatifDS(SAMPEL_EPOCH)),
                        pemuat(foto, foto_ds) if ada_foto else None) if p is not None]

def konv_bawah(model, n_blok):
    """Modul-modul tiga blok konvolusi pertama (Conv, BN, ReLU, pool)."""
    out, blok = [], 0
    for m in model.cnn:
        if isinstance(m, nn.Conv2d):
            blok += 1
            if blok > n_blok: break
        out.append(m)
    return out

def bekukan(model, beku):
    for m in konv_bawah(model, BEKU_BLOK):
        for p in m.parameters(): p.requires_grad = not beku
        if isinstance(m, nn.BatchNorm2d): m.eval() if beku else m.train()   # statistik BN ikut dibekukan

def skor_pilih(m):
    if m['buku'] < awal['buku'] - TURUN_BUKU: return -1                      # buku bersih tidak boleh dikorbankan
    papan = m['v4'] if m['foto'] is None else 0.5 * m['v4'] + 0.5 * m['foto']
    return papan + 0.3 * m['adegan'] + 0.5 * m['negatif']

for f in ('crnn_finetune.pt', 'crnn_cadangan.pt'):
    if os.path.exists(f'{OUT_DIR}/{f}'): os.remove(f'{OUT_DIR}/{f}')
model.load_state_dict(torch.load(BOBOT_V2, map_location=dev))
awal = nilai_v4(model)
print('v2 di validasi:', {k: (round(v, 4) if v is not None else None) for k, v in awal.items()})
terbaik, terbaik_buku, riwayat_ft, t0 = -1, -1, [], time.time()

def latih_fase(nama, langkah, lr, campur, tiap, beku_sampai=0):
    global terbaik, terbaik_buku
    sumber_data = muat_campuran(campur)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.LambdaLR(opt, lambda s: min(1, (s + 1) / 200) * 0.5 * (1 + np.cos(np.pi * min(s, langkah) / langkah)))
    scaler = torch.amp.GradScaler(enabled=(dev == 'cuda'))
    for step in range(1, langkah + 1):
        model.train(); bekukan(model, step <= beku_sampai)
        batch = [b for d in sumber_data for b in next(d) if b is not None]
        X, Y, LI, LY, S = gabung(batch)
        with torch.autocast(device_type='cuda', enabled=(dev == 'cuda')):
            logits = model(X.to(dev))
        loss = ctc(logits.float().log_softmax(-1).permute(1, 0, 2), Y, LI, LY)
        opt.zero_grad(set_to_none=True); scaler.scale(loss).backward()
        scaler.unscale_(opt); nn.utils.clip_grad_norm_(model.parameters(), 5)
        scaler.step(opt); scaler.update(); sched.step()
        if step % tiap == 0 or step == langkah:
            bekukan(model, False)
            m = nilai_v4(model)
            riwayat_ft.append(dict(fase=nama, langkah=step, loss=loss.item(), **m))
            foto = f"  foto {m['foto']:.2%}" if m['foto'] is not None else ''
            print(f"{nama} {step}/{langkah}  loss {loss.item():.3f}  buku {m['buku']:.2%}  v4 {m['v4']:.2%}  adegan {m['adegan']:.2%}  negatif {m['negatif']:.1%}{foto}  ({time.time()-t0:.0f} dtk)")
            if m['buku'] > terbaik_buku:
                terbaik_buku = m['buku']; torch.save(model.state_dict(), f'{OUT_DIR}/crnn_cadangan.pt')
            s = skor_pilih(m)
            if s > terbaik:
                terbaik = s; torch.save(model.state_dict(), f'{OUT_DIR}/crnn_finetune.pt')

latih_fase('fase1', F1_LANGKAH, F1_LR, F1_CAMPUR, 500, beku_sampai=int(BEKU_PORSI * F1_LANGKAH))
latih_fase('fase2', F2_LANGKAH, F2_LR, F2_CAMPUR, 250)

lolos_buku = os.path.exists(f'{OUT_DIR}/crnn_finetune.pt')
if not lolos_buku:
    print('PERINGATAN: tidak ada langkah yang menjaga akurasi buku; memakai bobot dengan buku tertinggi. Laporkan ke agen.')
    shutil.copy(f'{OUT_DIR}/crnn_cadangan.pt', f'{OUT_DIR}/crnn_finetune.pt')
model.load_state_dict(torch.load(f'{OUT_DIR}/crnn_finetune.pt', map_location=dev))
m_akhir, P, T = eval_nyata(model, nyata_uji)
akhir = nilai_v4(model)
print(f"Buku nyata, data uji: v2 {m_awal['akurasi_suku']:.2%} -> v4 {m_akhir['akurasi_suku']:.2%} (syarat >= 88%)")
print(f"Sintetis v4 validasi: v2 {awal['v4']:.2%} -> v4 {akhir['v4']:.2%}")
''')

EKSPOR = salin(43, ("BOBOT = f'{OUT_DIR}/crnn_finetune.pt' if os.path.exists(f'{OUT_DIR}/crnn_finetune.pt') else f'{OUT_DIR}/crnn_terbaik.pt'",
                    "BOBOT = f'{OUT_DIR}/crnn_finetune.pt'"))
_s = ''.join(EKSPOR['source'])
_s = _s[:_s.index('# Detektor baris -> ONNX')] + (
    "# Charset dan praproses tidak berubah dari v2: aplikasi tetap memakai src/ml/model2/scanner_charset.json yang ada.\n"
    "json.dump(riwayat_ft, open(f'{OUT_DIR}/riwayat_latih.json', 'w'), indent=1, default=float)\n"
    "print('Tersimpan di', OUT_DIR, ':', os.listdir(OUT_DIR))\n")
_s = _s.replace("sama = 0; X, Y, LI, LY, S = next(iter(dl_val))", "sama = 0; X, Y, LI, LY, S = next(iter(val_v4))")
EKSPOR['source'] = _s.splitlines(True)

RINGKAS = kode('''
# ---------- Ringkasan untuk agen ----------
ringkas = dict(versi=4, buku_uji_v2=m_awal['akurasi_suku'], buku_uji_v4=m_akhir['akurasi_suku'], validasi_v2=awal, validasi_v4=akhir,
               n=dict(v4_latih=len(v4_latih), v4_val=len(v4_val), foto_latih=len(nyata_foto_latih), foto_val=len(nyata_foto_val)),
               campur=dict(fase1=F1_CAMPUR, fase2=F2_CAMPUR), lolos_penjaga_buku=lolos_buku,
               onnx_mb=os.path.getsize(ONNX_PATH) / 1e6, riwayat=riwayat_ft)
json.dump(ringkas, open(f'{OUT_DIR}/hasil_v4.json', 'w'), indent=1, default=float)
print(json.dumps({k: v for k, v in ringkas.items() if k != 'riwayat'}, indent=1, default=float))
print('Kirim dari', OUT_DIR, ': aksaralens_scanner.onnx dan hasil_v4.json')
''')

sel = [
    JUDUL,
    salin(1), salin(2), salin(3), salin(4), salin(5), PENGATURAN,
    salin(7), salin(8), salin(9), salin(10), salin(11), salin(12), salin(13), salin(14),
    salin(15), salin(16), salin(17),
    salin(18), salin(19), salin(20), salin(21), salin(22), salin(23), salin(24), salin(25),
    salin(26), salin(27), salin(28), salin(29),
    teks('## 11. Data v4\n\nAdegan dan negatif dari v3, ditambah sintetis v4 dan potongan foto nyata terpercaya. Lihat 6 contoh v4 di bawah: tulisan harus gelap di latar terang.'),
    kode(ADEGAN_DS), DATA_V4,
    teks('## 12. Fine-tune v4\n\nTiap batch berisi buku nyata, buku sintetis, v4, adegan, negatif, dan foto nyata (bila ada). Tiga blok konvolusi pertama dibekukan pada 20% awal fase 1. Bobot dipilih dari validasi papan (v4, dan foto nyata bila ada) ditambah penolakan negatif, selama buku tidak turun lebih dari 1 poin.'),
    LATIH_V4, salin(33),
    salin(42), EKSPOR, RINGKAS, salin(45),
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
