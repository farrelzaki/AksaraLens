# Klasifikator aksara kecil (Langkah 2, docs/RENCANA_SCANNER_CERDAS.md bagian 11): potongan baris -> peluang "aksara Jawa".
# Dipakai sebagai penyaring setelah detektor, sebelum pembaca. Data latih: baris Jawa NusaAksara (positif) lawan
# aksara lain NusaAksara, Latin sintetis, dan tekstur (negatif), dengan augmentasi ala foto. Folder data gitignored.
# Pakai: python -X utf8 scripts/klasifikator_aksara.py latih [--eval eval_kotak.npz] [--keluar folder]
import argparse, glob, os, random
import cv2, numpy as np

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUSA = os.path.join(AKAR, 'docs/random/nusa')
KELUAR = os.path.join(AKAR, 'docs/random/klasifikator')
T, L = 32, 160  # tinggi, lebar masukan
FONT_LATIN = ['arial', 'arialbd', 'calibri', 'calibrib', 'times', 'timesbd', 'cour', 'verdana', 'verdanab', 'tahoma', 'impact', 'segoeui', 'georgia', 'trebuc']
KATA = ('JL JALAN KANTOR KELURAHAN KECAMATAN PEMERINTAH KOTA PASAR HOTEL TOKO BANK MUSEUM SEKOLAH Selamat Datang Yogyakarta '
        'Surakarta Malioboro Kraton Parkir Dilarang Masuk Buka Tutup Warung Makan Apotek Rumah Sakit No Km RT RW Gang Desa Pusat '
        'Indonesia Street Road Hotel Cafe Menu Open Exit Stop Bus Station Sale Disc').split()


def ke_input(gray):
    """Potongan gray (ukuran bebas) -> uint8 [T, L]: resize INTER_AREA, normalisasi persentil 2..98."""
    g = cv2.resize(np.asarray(gray, np.float32), (L, T), interpolation=cv2.INTER_AREA)
    lo, hi = np.percentile(g, 2), np.percentile(g, 98)
    return (np.clip((g - lo) / max(hi - lo, 1.0), 0, 1) * 255).round().astype(np.uint8)


def baca(path):
    b = np.fromfile(path, np.uint8)
    return cv2.imdecode(b, cv2.IMREAD_GRAYSCALE) if b.size else None


def augmentasi(g, rng):
    g = g.astype(np.float32)
    h, w = g.shape
    if rng.random() < 0.6 and w > 2 * h:  # potongan bagian baris, seperti kotak kata
        w2 = max(int(w * rng.uniform(0.2, 1.0)), h)
        x = rng.randint(0, w - w2)
        g = g[:, x:x + w2]
    g = cv2.copyMakeBorder(g, int(h * rng.uniform(0, 0.3)), int(h * rng.uniform(0, 0.3)), int(h * rng.uniform(0, 0.5)), int(h * rng.uniform(0, 0.5)), cv2.BORDER_REPLICATE)
    h, w = g.shape
    a = np.deg2rad(rng.uniform(-6, 6))
    M = np.float32([[np.cos(a), -np.sin(a) + rng.uniform(-0.25, 0.25), 0], [np.sin(a), np.cos(a), 0]])
    g = cv2.warpAffine(g, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
    lo, hi = rng.uniform(0, 0.45) * 255, rng.uniform(0.55, 1.0) * 255
    g = lo + g / 255 * (hi - lo)
    g = g + np.linspace(rng.uniform(-30, 30), rng.uniform(-30, 30), g.shape[1], dtype=np.float32)[None, :]
    if rng.random() < 0.5:
        g = 255 - g
    s = rng.choice([0, 0, 0.6, 1.0, 1.6])
    if s:
        g = cv2.GaussianBlur(g, (0, 0), s)
    g = g + np.random.default_rng(rng.randrange(1 << 30)).normal(0, rng.uniform(0, 14), g.shape).astype(np.float32)
    return np.clip(g, 0, 255)


def latin(rng):
    from PIL import Image, ImageDraw, ImageFont
    f = None
    for _ in range(6):
        try:
            f = ImageFont.truetype(f'C:/Windows/Fonts/{rng.choice(FONT_LATIN)}.ttf', rng.randint(36, 80))
            break
        except OSError:
            pass
    f = f or ImageFont.load_default(60)
    acak = 'ABCDEFGHJKLMNPRSTUWabcdefghklmnoprstu0123456789'
    kata = [rng.choice(KATA) if rng.random() < 0.8 else ''.join(rng.choice(acak) for _ in range(rng.randint(1, 6))) for _ in range(rng.randint(1, 4))]
    teks = ' '.join(kata)
    if rng.random() < 0.3:
        teks = teks.upper()
    b = f.getbbox(teks)
    im = Image.new('L', (b[2] + 30, b[3] + 30), 255)
    ImageDraw.Draw(im).text((15, 10), teks, font=f, fill=0)
    return np.asarray(im)


def tekstur(rng):
    h, w = rng.randint(30, 90), rng.randint(60, 400)
    g = np.full((h, w), 128, np.float32)
    for _ in range(rng.randint(0, 6)):
        k = rng.randint(2, 40)
        n = np.random.default_rng(rng.randrange(1 << 30)).normal(0, 1, (max(2, h // k), max(2, w // k))).astype(np.float32)
        g = g + rng.uniform(-90, 90) * cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
    for _ in range(rng.randint(0, 5)):
        cv2.line(g, (rng.randint(0, w), rng.randint(0, h)), (rng.randint(0, w), rng.randint(0, h)), rng.uniform(0, 255), rng.randint(1, 5))
    return np.clip(g, 0, 255)


def susun(aug, seed=0):
    rng = random.Random(seed)
    jawa = sorted(glob.glob(f'{NUSA}/baris/*.png'))
    lain = sorted(glob.glob(f'{NUSA}/lain/*.png'))
    rng.shuffle(jawa)
    rng.shuffle(lain)

    def bikin(files, y, kali):
        X, Y = [], []
        for p in files:
            g = baca(p)
            if g is None or min(g.shape) < 8:
                continue
            for _ in range(kali):
                X.append(ke_input(augmentasi(g, rng)))
                Y.append(y)
        return X, Y

    out = {}
    # 80 baris Jawa dan 400 baris aksara lain ditahan untuk validasi (per berkas)
    for nama, (fj, fl, kj, kl, nl, nt) in dict(latih=(jawa[80:], lain[400:], aug, 3, 9000, 2000), valid=(jawa[:80], lain[:400], 4, 2, 800, 200)).items():
        X, Y = bikin(fj, 1, kj)
        a, b = bikin(fl, 0, kl)
        X += a
        Y += b
        for _ in range(nl):
            X.append(ke_input(augmentasi(latin(rng), rng)))
            Y.append(0)
        for _ in range(nt):
            X.append(ke_input(augmentasi(tekstur(rng), rng)))
            Y.append(0)
        out[nama] = (np.stack(X), np.array(Y, np.float32))
    return out


def model():
    import torch
    import torch.nn as nn

    def blok(i, o):
        return nn.Sequential(nn.Conv2d(i, o, 3, padding=1, bias=False), nn.BatchNorm2d(o), nn.ReLU(inplace=True))

    class Net(nn.Module):
        def __init__(s):
            super().__init__()
            s.f = nn.Sequential(blok(1, 16), nn.MaxPool2d(2), blok(16, 32), nn.MaxPool2d(2), blok(32, 64), nn.MaxPool2d(2), blok(64, 96))
            s.k = nn.Linear(192, 1)

        def forward(s, x):
            z = s.f(x)
            return s.k(torch.cat([z.mean((2, 3)), z.amax((2, 3))], 1))[:, 0]

    return Net()


def auc(skor, y):
    o = np.argsort(skor)
    r = np.empty(len(o))
    r[o] = np.arange(len(o))
    p = y == 1
    return float((r[p].sum() - p.sum() * (p.sum() - 1) / 2) / (p.sum() * (~p).sum()))


def tabel(skor, y, judul):
    print(f'{judul}: n={len(y)} (Jawa {int((y == 1).sum())}), AUC {auc(skor, y):.3f}')
    for a in (0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8):
        lolos = skor >= a
        print(f'  ambang {a:.1f}: Jawa lolos {lolos[y == 1].mean():.1%}  bukan-Jawa ditolak {(~lolos[y == 0]).mean():.1%}')


def latih(a):
    import torch
    torch.manual_seed(0)
    d = susun(a.aug)
    Xt, Yt = d['latih']
    Xv, Yv = d['valid']
    print('latih', Xt.shape, Yt.mean(), 'valid', Xv.shape)
    net = model()
    print('parameter', sum(p.numel() for p in net.parameters()))
    opt = torch.optim.AdamW(net.parameters(), 2e-3, weight_decay=1e-4)
    sch = torch.optim.lr_scheduler.OneCycleLR(opt, 4e-3, total_steps=a.langkah)
    Xt_t, Yt_t = torch.from_numpy(Xt), torch.from_numpy(Yt)

    def pakai(x):
        return (x.float() / 255)[:, None]

    for i in range(a.langkah):
        net.train()
        idx = torch.randint(0, len(Xt_t), (128,))
        loss = torch.nn.functional.binary_cross_entropy_with_logits(net(pakai(Xt_t[idx])), Yt_t[idx])
        opt.zero_grad()
        loss.backward()
        opt.step()
        sch.step()
        if (i + 1) % 500 == 0:
            print(i + 1, round(loss.item(), 4), flush=True)
    net.eval()

    def prediksi(X):
        with torch.no_grad():
            return torch.cat([torch.sigmoid(net(pakai(torch.from_numpy(X[j:j + 512])))) for j in range(0, len(X), 512)]).numpy()

    tabel(prediksi(Xv), Yv, 'validasi buku/sintetis')
    if os.path.exists(a.eval):
        e = np.load(a.eval)
        tabel(prediksi(e['x']), e['y'], 'foto nyata (kotak detektor, C-pengembangan)')
    os.makedirs(a.keluar, exist_ok=True)
    torch.save(net.state_dict(), f'{a.keluar}/klasifikator.pt')
    torch.onnx.export(net, torch.zeros(1, 1, T, L), f'{a.keluar}/aksaralens_klasifikator.onnx', input_names=['potongan'], output_names=['logit'],
                      dynamic_axes={'potongan': {0: 'n'}, 'logit': {0: 'n'}}, opset_version=17, dynamo=False)
    print('ukuran onnx', os.path.getsize(f'{a.keluar}/aksaralens_klasifikator.onnx') / 1e3, 'KB')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('perintah', choices=['latih'])
    ap.add_argument('--eval', default=os.path.join(KELUAR, 'eval_kotak.npz'))
    ap.add_argument('--keluar', default=KELUAR)
    ap.add_argument('--aug', type=int, default=25)
    ap.add_argument('--langkah', type=int, default=4000)
    latih(ap.parse_args())
