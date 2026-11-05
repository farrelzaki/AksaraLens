# Membuat docs/random/AksaraLens_Model2_v3.ipynb dari notebook v2 (Tahap 2-3 RENCANA_SCANNER_CERDAS).
# Pakai: python -X utf8 scripts/buat_notebook_v3.py
# Keluaran gitignored; bobot v2 dibaca dari Drive, hasil v3 disimpan terpisah di folder model2_v3.
import copy, json, os

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUMBER = os.path.join(AKAR, 'docs/random/AksaraLens_Model2_Scanner.ipynb')
TUJUAN = os.path.join(AKAR, 'docs/random/AksaraLens_Model2_v3.ipynb')

nb = json.load(open(SUMBER, encoding='utf-8'))
LAMA = nb['cells']


def kode(s):
    return {'cell_type': 'code', 'execution_count': None, 'metadata': {}, 'outputs': [], 'source': s.strip('\n').splitlines(True)}


def teks(s):
    return {'cell_type': 'markdown', 'metadata': {}, 'source': s.strip('\n').splitlines(True)}


def salin(i, *ganti):
    """Sel lama tanpa keluaran; `ganti` berisi pasangan (lama, baru) yang wajib ditemukan."""
    c = copy.deepcopy(LAMA[i])
    s = ''.join(c['source'])
    for a, b in ganti:
        assert a in s, (i, a)
        s = s.replace(a, b)
    c['source'] = s.splitlines(True)
    if c['cell_type'] == 'code':
        c['outputs'], c['execution_count'] = [], None
    return c


JUDUL = teks('''
# AksaraLens · Model 2 v3: latih ulang untuk foto adegan

Melanjutkan bobot v2, **tidak melatih dari nol**. Tujuannya membaca aksara di papan, batu, kaca, layar, dan tabel berjarak lebar, sekaligus menolak teks Latin, angka, tekstur, serta aksara Sunda dan Bali.

**Cara pakai**
1. Runtime → Change runtime type → **T4 GPU**.
2. Pastikan Drive berisi `aksaralens/model2_v2/crnn_finetune.pt` dan `detektor_baris.pt`.
3. Runtime → **Run all**. Latihan pembaca sekitar 30 menit (terukur dari putaran 1); detektor belum terukur.
4. Di bagian **Pratinjau data adegan**, tangkap layar 24 contohnya dan kirim ke agen.
5. Hasil tersimpan di `aksaralens/model2_v3`. Kirim tiga berkas ini: `aksaralens_scanner.onnx`, `aksaralens_detektor_baris.onnx`, `hasil_v3.json`.

Gerbang akhir diukur agen di komputer dengan Set C, jadi Set C **tidak** dipakai di notebook ini.
''')

ADEGAN = open(os.path.join(AKAR, 'scripts/adegan_v3.py'), encoding='utf-8').read()

PRATINJAU = kode('''
# Pratinjau: 12 baris adegan, 6 negatif (label kosong), 6 foto utuh dengan kotak detektor
siapkan_font_lain()
rng = random.Random(11)
fig, axs = plt.subplots(12, 2, figsize=(14, 12))
for i in range(12):
    a, t = baris_adegan(rng, perender)
    axs[i, 0].imshow(a, cmap='gray', vmin=0, vmax=255); axs[i, 0].set_title(' '.join(suku_kata(t)), fontsize=8, loc='left')
    axs[i, 0].axis('off'); axs[i, 1].axis('off')
for i in range(6):
    a, _ = negatif_adegan(rng)
    axs[i, 1].imshow(a, cmap='gray', vmin=0, vmax=255); axs[i, 1].set_title('negatif', fontsize=8, loc='left')
plt.tight_layout(); plt.show()
fig, axs = plt.subplots(2, 3, figsize=(14, 9))
for ax in axs.flat:
    a, k = halaman_adegan(rng, perender)
    v = cv2.cvtColor(a, cv2.COLOR_GRAY2RGB)
    for x0, y0, x1, y1 in k: cv2.rectangle(v, (int(x0), int(y0)), (int(x1), int(y1)), (255, 0, 0), 4)
    ax.imshow(v); ax.axis('off')
plt.tight_layout(); plt.show()
''')

DEF_LATIH = kode('''
import editdistance, time, json

def greedy(logits):
    # logits [B,T,C] -> list of str (Unicode logis)
    best = logits.argmax(-1).cpu().numpy()
    out = []
    for row in best:
        ids, prev = [], 0
        for t in row:
            if t != prev and t != 0: ids.append(int(t))
            prev = t
        out.append(decode(ids))
    return out

def metrik(pred, true):
    # CER (per karakter Unicode) & akurasi per suku kata
    ce = sum(editdistance.eval(p, t) for p, t in zip(pred, true)); cn = sum(len(t) for t in true)
    se = sum(editdistance.eval(suku_kata(p), suku_kata(t)) for p, t in zip(pred, true)); sn = sum(len(suku_kata(t)) for t in true)
    tepat = np.mean([p == t for p, t in zip(pred, true)])
    return dict(cer=ce / max(cn, 1), akurasi_suku=1 - se / max(sn, 1), baris_tepat=tepat)

@torch.no_grad()
def evaluasi(model, dl):
    model.eval(); P, T = [], []
    for X, Y, LI, LY, S in dl:
        P += greedy(model(X.to(dev))); T += S
    return metrik(P, T), P, T

ctc = nn.CTCLoss(blank=0, zero_infinity=True)
riwayat = []

BOBOT_V2 = f'{SUMBER_V2}/crnn_finetune.pt'
assert os.path.exists(BOBOT_V2), 'Bobot v2 tidak ditemukan di Drive: ' + BOBOT_V2
model.load_state_dict(torch.load(BOBOT_V2, map_location=dev))
print('Memulai dari', BOBOT_V2)
''')

FT = kode('''
# ---------- Data adegan: baris positif dan negatif, validasi tetap ----------
class AdeganDS(Dataset):
    def __init__(self, n, seed=None, per=None):
        self.n, self.seed, self.per = n, seed, per
    def __len__(self): return self.n
    def __getitem__(self, i):
        self.per = self.per or Perender(FONT_SPECS)
        rng = random.Random() if self.seed is None else random.Random(self.seed * 1_000_003 + i)
        while True:
            r = baris_adegan(rng, self.per)
            if r is None: continue
            a, t = r
            x = ke_input(a, max_w=4000); y = encode(t)
            if x.shape[1] // 4 >= 2 * len(y) + 1:
                return torch.from_numpy(x)[None], torch.tensor(y, dtype=torch.long), t

class NegatifDS(Dataset):
    def __init__(self, n, seed=None): self.n, self.seed = n, seed
    def __len__(self): return self.n
    def __getitem__(self, i):
        rng = random.Random() if self.seed is None else random.Random(self.seed * 1_000_003 + i)
        a, t = negatif_adegan(rng)
        return torch.from_numpy(ke_input(a, max_w=4000))[None], torch.tensor([], dtype=torch.long), t

val_adegan = DataLoader(AdeganDS(400, seed=4242), 32, shuffle=False, num_workers=WORKERS, collate_fn=gabung)
val_negatif = DataLoader(NegatifDS(200, seed=4343), 32, shuffle=False, num_workers=WORKERS, collate_fn=gabung)

@torch.no_grad()
def nilai_v3(model):
    """Validasi tanpa Set C: buku nyata, adegan sintetis, dan negatif yang tertolak (keluaran kosong)."""
    buku, _, _ = eval_nyata(model, nyata_val)
    adegan, _, _ = evaluasi(model, val_adegan)
    model.eval(); kosong = n = 0
    for X, Y, LI, LY, S in val_negatif:
        kosong += sum(p == '' for p in greedy(model(X.to(dev)))); n += len(S)
    return dict(buku=buku['akurasi_suku'], adegan=adegan['akurasi_suku'], negatif=kosong / max(n, 1))

# ---------- Data nyata opsional: Drive aksaralens/data_nyata_v3/label.csv (kolom file,teks) ----------
import csv as _csv
NYATA_FOTO_DIR = f'{os.path.dirname(OUT_DIR)}/data_nyata_v3'
nyata_foto = []
if os.path.exists(f'{NYATA_FOTO_DIR}/label.csv'):
    for r in _csv.DictReader(open(f'{NYATA_FOTO_DIR}/label.csv', encoding='utf-8')):
        g = cv2.imread(f"{NYATA_FOTO_DIR}/{r['file']}", cv2.IMREAD_GRAYSCALE)
        if g is not None: nyata_foto.append(dict(gray=g, teks=r['teks'].strip(), halaman=r['file'], file=r['file']))
print('Potongan foto nyata:', len(nyata_foto))
''')

FT2 = kode('''
import shutil
# Fase 1 mempelajari adegan; fase 2 mengembalikan akurasi buku dengan lr kecil dan batch didominasi buku.
# Putaran 1 (hanya fase 1, 6000 langkah): adegan 94%, tetapi buku stabil di sekitar 87% saat lr sudah kecil, dari v2 90,5%.
FT_LANGKAH = 4000
FT_LR = 1.5e-4
KONSOL_LANGKAH = 3000
KONSOL_LR = 5e-5
FT_CAMPUR = (11, 6, 10, 5)                                      # buku nyata, buku sintetis, adegan, negatif per batch
KONSOL_CAMPUR = (20, 2, 7, 3)
TURUN_BUKU = 0.01                                               # akurasi buku boleh turun sebanyak ini dari v2

class NyataDS(Dataset):
    def __init__(self, items): self.items = items
    def __len__(self): return len(self.items)
    def __getitem__(self, i):
        d = self.items[i]; rng = random.Random()
        g = augment(d['gray'], rng) if rng.random() < 0.7 else d['gray']
        x = ke_input(g, max_w=4000); y = encode(d['teks'])
        if x.shape[1] // 4 < len(y) + sum(1 for a, b in zip(y, y[1:]) if a == b):
            x = ke_input(d['gray'], max_w=4000)          # efek foto membuat terlalu sempit -> pakai asli
        return torch.from_numpy(x)[None], torch.tensor(y, dtype=torch.long), d['teks']

def tanpa_henti(dl):
    while True:
        ada = False
        for b in dl:
            ada = True; yield b
        if not ada: raise RuntimeError('DataLoader kosong: data terlalu sedikit untuk ukuran batch')

latih_nyata = nyata_latih + nyata_foto * 5                       # foto nyata sedikit, jadi lebih sering muncul
def muat_campuran(nyata, sint, adegan, neg):
    return (tanpa_henti(DataLoader(NyataDS(latih_nyata), min(nyata, len(latih_nyata)), shuffle=True, drop_last=True, num_workers=WORKERS, collate_fn=list)),
            tanpa_henti(DataLoader(LatihDS(SAMPEL_EPOCH, seed=123), sint, shuffle=True, num_workers=WORKERS, collate_fn=list)),
            tanpa_henti(DataLoader(AdeganDS(SAMPEL_EPOCH), adegan, shuffle=True, num_workers=WORKERS, collate_fn=list)),
            tanpa_henti(DataLoader(NegatifDS(SAMPEL_EPOCH), neg, shuffle=True, num_workers=WORKERS, collate_fn=list)))

for f in ('crnn_finetune.pt', 'crnn_cadangan.pt'):
    if os.path.exists(f'{OUT_DIR}/{f}'): os.remove(f'{OUT_DIR}/{f}')
model.load_state_dict(torch.load(BOBOT_V2, map_location=dev))
awal = nilai_v3(model)
print('v2 di validasi:', awal)
terbaik_ft, terbaik_buku, riwayat_ft, t0 = -1, -1, [], time.time()

def latih_fase(nama, langkah, lr, campur, tiap):
    global terbaik_ft, terbaik_buku
    pemuat = muat_campuran(*campur)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.LambdaLR(opt, lambda s: min(1, (s + 1) / 100) * 0.5 * (1 + np.cos(np.pi * min(s, langkah) / langkah)))
    scaler = torch.amp.GradScaler(enabled=(dev == 'cuda'))
    for step in range(1, langkah + 1):
        model.train()
        X, Y, LI, LY, S = gabung(sum((next(d) for d in pemuat), []))
        with torch.autocast(device_type='cuda', enabled=(dev == 'cuda')):
            logits = model(X.to(dev))
        loss = ctc(logits.float().log_softmax(-1).permute(1, 0, 2), Y, LI, LY)
        opt.zero_grad(set_to_none=True); scaler.scale(loss).backward()
        scaler.unscale_(opt); nn.utils.clip_grad_norm_(model.parameters(), 5)
        scaler.step(opt); scaler.update(); sched.step()
        if step % tiap == 0 or step == langkah:
            m = nilai_v3(model)
            riwayat_ft.append(dict(fase=nama, langkah=step, loss=loss.item(), **m))
            print(f"{nama} {step}/{langkah}  loss {loss.item():.3f}  buku {m['buku']:.2%}  adegan {m['adegan']:.2%}  negatif ditolak {m['negatif']:.1%}  ({time.time()-t0:.0f} dtk)")
            if m['buku'] > terbaik_buku:
                terbaik_buku = m['buku']; torch.save(model.state_dict(), f'{OUT_DIR}/crnn_cadangan.pt')
            skor = m['adegan'] + m['negatif'] if m['buku'] >= awal['buku'] - TURUN_BUKU else -1   # buku bersih tidak boleh dikorbankan
            if skor > terbaik_ft:
                terbaik_ft = skor; torch.save(model.state_dict(), f'{OUT_DIR}/crnn_finetune.pt')

latih_fase('fase1', FT_LANGKAH, FT_LR, FT_CAMPUR, 500)
latih_fase('fase2', KONSOL_LANGKAH, KONSOL_LR, KONSOL_CAMPUR, 250)

# Gagal penjaga tidak menghentikan latihan: gerbang rilis diukur agen, dan detektor tetap perlu dilatih.
lolos_buku = os.path.exists(f'{OUT_DIR}/crnn_finetune.pt')
if not lolos_buku:
    print('PERINGATAN: tidak ada langkah yang menjaga akurasi buku; memakai bobot dengan buku tertinggi. Laporkan ke agen.')
    shutil.copy(f'{OUT_DIR}/crnn_cadangan.pt', f'{OUT_DIR}/crnn_finetune.pt')
model.load_state_dict(torch.load(f'{OUT_DIR}/crnn_finetune.pt', map_location=dev))
m_akhir, P, T = eval_nyata(model, nyata_uji)
print(f"Buku nyata, data uji: v2 {m_awal['akurasi_suku']:.2%} -> v3 {m_akhir['akurasi_suku']:.2%} (syarat >= 88%)")
print('Validasi v3:', nilai_v3(model))
''')

DET_DS = kode('''
# ---------- Data detektor v3: halaman buku asli, buku sintetis, dan foto adegan ----------
class DetDS(Dataset):
    def __init__(self, halaman, n, porsi_sintetis=0.2, porsi_adegan=0.4):
        self.hal, self.n, self.ps, self.pa = halaman, n, porsi_sintetis, porsi_adegan
        self.per = None
    def __len__(self): return self.n
    def __getitem__(self, i):
        rng = random.Random(); r = rng.random()
        if r < self.pa:
            self.per = self.per or Perender(FONT_SPECS)
            g, k = halaman_adegan(rng, self.per)
            x, m = potong_acak_adegan(g, k, rng)
        else:
            if r < self.pa + self.ps or not self.hal: g, k = halaman_latih_sintetis(rng)
            else:
                h = rng.choice(self.hal); g, k = HAL[h], per_hal[h]
            x, m = potong_acak(g, k, rng)
        return torch.from_numpy(x)[None], torch.from_numpy(m)[None]

# Validasi adegan tetap, disimpan di HAL agar bisa dinilai evaluasi_pemisah. Pipeline membaca dua polaritas,
# jadi di sini cukup polaritas yang sudah dinormalkan.
_rng = random.Random(777)
hal_val_adegan = []
for i in range(40):
    g, k = halaman_adegan(_rng, perender)
    nama = f'adegan_{i}'; HAL[nama] = normalisasi_polaritas(g); per_hal[nama] = k; hal_val_adegan.append(nama)
''')

DET_LATIH = kode('''
# ---------- Latih detektor, melanjutkan bobot v2 ----------
DET_LANGKAH = 3000
DET_BATCH = 16
DET_V2 = f'{SUMBER_V2}/detektor_baris.pt'
det.load_state_dict(torch.load(DET_V2, map_location=dev))
m_det_v2 = evaluasi_pemisah(kotak_detektor, hal_val); m_det_v2_ad = evaluasi_pemisah(kotak_detektor, hal_val_adegan)
print(f"v2  buku: {m_det_v2['recall']:.1%}/{m_det_v2['presisi']:.1%}  adegan: {m_det_v2_ad['recall']:.1%}/{m_det_v2_ad['presisi']:.1%}")
dl_det = tanpa_henti(DataLoader(DetDS(hal_latih, DET_LANGKAH * DET_BATCH), DET_BATCH, shuffle=False, num_workers=WORKERS))
opt_d = torch.optim.AdamW(det.parameters(), lr=5e-4, weight_decay=1e-4)
sch_d = torch.optim.lr_scheduler.OneCycleLR(opt_d, max_lr=5e-4, total_steps=DET_LANGKAH, pct_start=0.1)
pos_w = torch.tensor([3.0], device=dev)
for f in ('detektor_baris.pt', 'detektor_cadangan.pt'):
    if os.path.exists(f'{OUT_DIR}/{f}'): os.remove(f'{OUT_DIR}/{f}')
terbaik_d, terbaik_d_buku, t0 = -1, -1, time.time()
for step in range(1, DET_LANGKAH + 1):
    det.train()
    X, M = next(dl_det); X, M = X.to(dev), M.to(dev)
    with torch.autocast(device_type='cuda', enabled=(dev == 'cuda')):
        logit = det(X)
    logit = logit.float()
    pr = torch.sigmoid(logit)
    dice = 1 - (2 * (pr * M).sum() + 1) / (pr.sum() + M.sum() + 1)
    loss = F.binary_cross_entropy_with_logits(logit, M, pos_weight=pos_w) + dice
    opt_d.zero_grad(set_to_none=True); loss.backward(); opt_d.step(); sch_d.step()
    if step % 500 == 0 or step == DET_LANGKAH:
        mb, ma = evaluasi_pemisah(kotak_detektor, hal_val), evaluasi_pemisah(kotak_detektor, hal_val_adegan)
        print(f"langkah {step}/{DET_LANGKAH}  loss {loss.item():.3f}  buku {mb['recall']:.1%}/{mb['presisi']:.1%}  adegan {ma['recall']:.1%}/{ma['presisi']:.1%}  ({time.time()-t0:.0f} dtk)")
        if mb['recall'] > terbaik_d_buku:
            terbaik_d_buku = mb['recall']; torch.save(det.state_dict(), f'{OUT_DIR}/detektor_cadangan.pt')
        skor = ma['recall'] + ma['presisi'] if mb['recall'] >= m_det_v2['recall'] - 0.01 else -1      # buku tidak boleh turun
        if skor > terbaik_d: terbaik_d = skor; torch.save(det.state_dict(), f'{OUT_DIR}/detektor_baris.pt')
lolos_det = os.path.exists(f'{OUT_DIR}/detektor_baris.pt')
if not lolos_det:
    print('PERINGATAN: tidak ada langkah yang menjaga pemisahan buku; memakai bobot dengan recall buku tertinggi. Laporkan ke agen.')
    shutil.copy(f'{OUT_DIR}/detektor_cadangan.pt', f'{OUT_DIR}/detektor_baris.pt')
det.load_state_dict(torch.load(f'{OUT_DIR}/detektor_baris.pt', map_location=dev))
''')

RINGKAS = kode('''
# ---------- Ringkasan untuk agen ----------
det.load_state_dict(torch.load(DET_V2, map_location=dev)); dv2 = evaluasi_pemisah(kotak_detektor, hal_uji)
det.load_state_dict(torch.load(f'{OUT_DIR}/detektor_baris.pt', map_location=dev)); dv3 = evaluasi_pemisah(kotak_detektor, hal_uji)
ringkas = dict(pembaca=dict(buku_uji_v2=m_awal['akurasi_suku'], buku_uji_v3=m_akhir['akurasi_suku'], validasi_v2=awal, validasi_v3=nilai_v3(model), riwayat=riwayat_ft),
               detektor=dict(buku_uji_v2=dv2, buku_uji_v3=dv3), n_foto_nyata=len(nyata_foto),
               lolos_penjaga=dict(pembaca=lolos_buku, detektor=lolos_det))
json.dump(ringkas, open(f'{OUT_DIR}/hasil_v3.json', 'w'), indent=1, default=float)
print(json.dumps({k: v for k, v in ringkas['pembaca'].items() if k != 'riwayat'}, indent=1, default=float))
print('Detektor, 30 halaman uji buku: v2', round(dv2['recall'], 3), '-> v3', round(dv3['recall'], 3))
print('Kirim dari', OUT_DIR, ': aksaralens_scanner.onnx, aksaralens_detektor_baris.onnx, hasil_v3.json')
''')

ATRIBUSI = copy.deepcopy(LAMA[48])
ATRIBUSI['source'] = ''.join(ATRIBUSI['source']).splitlines(True) + ['\n', '- Noto Sans Sundanese dan Noto Sans Balinese, © The Noto Project Authors, SIL Open Font License 1.1 (hanya data negatif).\n']

sel = [
    JUDUL,
    salin(1), salin(2), salin(3), salin(4), salin(5),
    salin(6, ("OUT_DIR = '/content/drive/MyDrive/aksaralens/model2_v2' if SIMPAN_KE_DRIVE else '/content/aksaralens/model2_v2'   # v2: cakupan 3 bab + detektor baris",
              "OUT_DIR = '/content/drive/MyDrive/aksaralens/model2_v3'   # hasil v3, terpisah dari v2\nSUMBER_V2 = '/content/drive/MyDrive/aksaralens/model2_v2'   # bobot awal\nassert SIMPAN_KE_DRIVE, 'v3 membutuhkan bobot v2 di Drive'")),
    salin(7), salin(8), salin(9), salin(10), salin(11), salin(12), salin(13), salin(14),
    teks('## 5b. Pratinjau data adegan\n\nTangkap layar 24 contoh di bawah untuk diperiksa agen, sebelum hasil latihan dipakai.'),
    kode('# ===== Data adegan v3 =====\n' + ADEGAN),
    PRATINJAU,
    salin(15), salin(16), salin(17), salin(18),
    teks('## 8. Bobot awal\n\nTidak ada latihan dari nol: sel ini hanya menyiapkan alat ukur lalu memuat bobot v2.'),
    DEF_LATIH,
    salin(22), salin(23),
    salin(26), salin(27), salin(28),
    salin(29, ("model.load_state_dict(torch.load(f'{OUT_DIR}/crnn_terbaik.pt', map_location=dev))\n", ''),
           ('SEBELUM fine-tune (hanya sintetis) di data uji nyata', 'v2 di data uji nyata')),
    teks('## 11. Fine-tune v3\n\nTiap batch berisi buku nyata, buku sintetis, adegan, dan negatif. Fase 1 mempelajari adegan; fase 2 memakai lr kecil dan batch yang didominasi buku untuk mengembalikan akurasi buku. Bobot terbaik dipilih dari adegan + penolakan negatif, selama akurasi buku tidak turun lebih dari 1 poin. Jika tidak ada yang memenuhi, latihan tetap lanjut dengan bobot berakurasi buku tertinggi, dan `hasil_v3.json` mencatatnya.'),
    FT, FT2, salin(32),
    salin(33), salin(34), salin(35), salin(36), DET_DS, DET_LATIH, salin(38), salin(39),
    salin(44),
    salin(45, ('meta = dict(versi=2,', 'meta = dict(versi=3,')),
    RINGKAS, ATRIBUSI,
]
nb['cells'] = sel
for c in sel:
    c.pop('id', None)
json.dump(nb, open(TUJUAN, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Tersimpan', TUJUAN, len(sel), 'sel', os.path.getsize(TUJUAN) // 1024, 'KB')

# Pemeriksaan sintaks semua sel kode (baris ! dan % bukan Python).
for i, c in enumerate(sel):
    if c['cell_type'] == 'code':
        s = ''.join(ln for ln in ''.join(c['source']).splitlines(True) if not ln.lstrip().startswith(('!', '%')))
        compile(s, f'sel {i}', 'exec')
print('Sintaks semua sel kode lolos')
