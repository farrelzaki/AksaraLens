# L5 dekoder bahasa (docs/RENCANA_SCANNER_FINAL.md): model bahasa karakter n-gram + beam search CTC.
# Kembaran Python dari src/ml/model2/bahasa.ts; keduanya membaca src/ml/model2/model_bahasa.json yang sama.
# Model dilatih atas urutan TAMPAK (taling sebelum klusternya), sama dengan keluaran CTC.
#
# Pakai: python -X utf8 scripts/model_bahasa.py bangun     -> src/ml/model2/model_bahasa.json
#        python -X utf8 scripts/model_bahasa.py fixture    -> src/ml/model2/bahasa.fixture.json (uji paritas TS)
# Tes:   python -X utf8 -m unittest scripts/test_model_bahasa.py
#
# Sumber korpus (mentah di docs/random/lm, gitignored; hanya model hasil hitungan yang di-commit):
#   - nama tempat & jalan OpenStreetMap DIY + Surakarta (© kontributor OpenStreetMap, ODbL)
#   - artikel acak Wikipedia bahasa Jawa (CC BY-SA), ditransliterasi lewat latin_ke_jawa.py
#   - baris HALAMAN LATIH NusaAksara (halaman val/uji tidak dipakai) dan kata contoh konten belajar
#   Kunci jawaban Set C tidak pernah dipakai.
import json, math, os, re, sys
from collections import Counter, defaultdict

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_MODEL = os.path.join(AKAR, 'src/ml/model2/model_bahasa.json')
JSON_FIXTURE = os.path.join(AKAR, 'src/ml/model2/bahasa.fixture.json')
LM = os.path.join(AKAR, 'docs/random/lm')
AWAL = '^'  # penanda awal baris pada konteks

# Parameter dekoder (dipilih pada v4 val + baris NusaAksara halaman val, dicek di C-pengembangan; log keputusan L5)
LEBAR = 8
ALFA = 0.4   # bobot model bahasa
BETA = 1.2   # bonus per karakter (mengimbangi penalti panjang dari model bahasa)
PANGKAS = -8.0  # karakter dengan log-peluang CTC di bawah ini pada suatu kolom tidak diperluas
JAGA = 0.25  # koreksi hanya dipakai bila berbeda paling banyak 25% karakter dari bacaan greedy (minimal 1)


def jarak(a, b):
    p = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        c = [i]
        for j, y in enumerate(b, 1):
            c.append(min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (x != y)))
        p = c
    return p[-1]


def pilih_koreksi(greedy, beam, yakin, nilai_status):
    """Penjaga: status baris tetap diputuskan dari bacaan greedy (penolakan tidak berubah). Bacaan model bahasa hanya
    menggantikan teks yang tampil bila perubahannya kecil dan tetap sah menurut penilai mode area. -> teks atau None."""
    if not beam or beam == greedy or jarak(beam, greedy) > max(1, int(JAGA * len(greedy) + 0.5)):
        return None
    return beam if nilai_status(beam, yakin, 'area') != 'TOLAK' else None


# ---------- model bahasa ----------
def latih(baris, n=3, min_hitung=2):
    """baris (urutan tampak) -> model {'n', 'p': {konteks+c: logp}, 'b': {konteks: log bobot mundur}}.
    Witten-Bell terinterpolasi; n-gram berorde > 1 yang muncul < min_hitung kali dibuang."""
    hitung = [defaultdict(Counter) for _ in range(n)]  # hitung[k][konteks panjang k][c]
    for s in baris:
        s = AWAL * (n - 1) + s
        for i in range(n - 1, len(s)):
            for k in range(n):
                hitung[k][s[i - k:i]][s[i]] += 1
    abjad = sorted(hitung[0][''])
    p, b = {}, {}
    seragam = -math.log(len(abjad) + 1)

    def lebih_rendah(ctx, c):
        return dapat(dict(n=n, p=p, b=b), ctx, c, seragam)

    for k in range(n):
        for ctx in sorted(hitung[k], key=lambda x: (len(x), x)):
            cnt = hitung[k][ctx]
            if k > 0:
                cnt = Counter({c: v for c, v in cnt.items() if v >= min_hitung})
                if not cnt:
                    continue
            total, jenis = sum(cnt.values()), len(cnt)
            lam = total / (total + jenis)
            for c in sorted(cnt):
                rendah = math.exp(lebih_rendah(ctx[1:], c)) if k > 0 else math.exp(seragam)
                p[ctx + c] = round(math.log(lam * cnt[c] / total + (1 - lam) * rendah), 3)
            b[ctx] = round(math.log(1 - lam), 3)
    return dict(n=n, seragam=round(seragam, 3), p=p, b=b)


def dapat(model, ctx, c, seragam=None):
    """log P(c | ctx) dengan mundur ke konteks lebih pendek."""
    if seragam is None:
        seragam = model['seragam']
    p, b = model['p'], model['b']
    tambah = 0.0
    while True:
        if ctx + c in p:
            return tambah + p[ctx + c]
        if ctx == '':
            return tambah + seragam
        tambah += b.get(ctx, 0.0)
        ctx = ctx[1:]


def konteks(model, awalan):
    n = model['n']
    s = AWAL * (n - 1) + awalan
    return s[len(s) - (n - 1):]


# ---------- beam search CTC ----------
def _lse(a, b):
    if a == -math.inf:
        return b
    if b == -math.inf:
        return a
    m = max(a, b)
    return m + math.log1p(math.exp(-abs(a - b)))


def log_softmax(logit, C):
    """logit datar [T*C] -> daftar baris log-peluang."""
    T = len(logit) // C
    out = []
    for t in range(T):
        r = logit[t * C:(t + 1) * C]
        m = max(r)
        z = m + math.log(sum(math.exp(v - m) for v in r))
        out.append([v - z for v in r])
    return out


def dekode_beam(lp, charset, model, lebar=LEBAR, alfa=ALFA, beta=BETA, pangkas=PANGKAS):
    """lp: [T][C] log-peluang (indeks 0 = blank). -> teks urutan TAMPAK.
    Prefix beam search; skor = log P_ctc + alfa * log P_lm + beta * panjang."""
    beam = {'': (0.0, -math.inf, 0.0)}  # awalan -> (log p berakhir blank, log p berakhir non-blank, skor lm+beta)
    for baris in lp:
        baru = {}

        def tambah(k, pb, pnb, lm):
            if k in baru:
                a, b_, _ = baru[k]
                baru[k] = (_lse(a, pb), _lse(b_, pnb), lm)
            else:
                baru[k] = (pb, pnb, lm)

        calon = [c for c in range(1, len(baris)) if baris[c] >= pangkas]
        for awalan, (pb, pnb, lm) in beam.items():
            tot = _lse(pb, pnb)
            tambah(awalan, tot + baris[0], -math.inf, lm)
            akhir = awalan[-1] if awalan else None
            for c in calon:
                ch = charset[c]
                if ch == akhir:
                    tambah(awalan, -math.inf, pnb + baris[c], lm)  # ulangan dilipat
                    sumber = pb
                else:
                    sumber = tot
                if sumber == -math.inf:
                    continue
                k = awalan + ch
                if k in baru:
                    lm2 = baru[k][2]
                else:
                    lm2 = lm + alfa * dapat(model, konteks(model, awalan), ch) + beta
                tambah(k, -math.inf, sumber + baris[c], lm2)
        urut = sorted(baru.items(), key=lambda kv: (-(_lse(kv[1][0], kv[1][1]) + kv[1][2]), kv[0]))
        beam = dict(urut[:lebar])
    return min(beam.items(), key=lambda kv: (-(_lse(kv[1][0], kv[1][1]) + kv[1][2]), kv[0]))[0]


# ---------- korpus ----------
def _charset():
    meta = json.load(open(os.path.join(AKAR, 'src/ml/model2/scanner_charset.json'), encoding='utf8'))
    return meta['charset']


def ke_tampak(s):
    sys.path.insert(0, os.path.join(AKAR, 'scripts'))
    from rujukan_scanner import _CL, TALING
    return re.sub('(' + _CL + ')' + TALING, TALING + r'\1', s)


def korpus():
    sys.path.insert(0, os.path.join(AKAR, 'scripts'))
    from latin_ke_jawa import ke_jawa
    import sintetis_nyata as sn
    ada = set(_charset()[1:])
    baris, asal = [], Counter()

    def masuk(teks_jawa, sumber):
        t = sn.bersihkan(teks_jawa, ada)
        if t and len(t) >= 2:
            baris.append(ke_tampak(t))
            asal[sumber] += 1

    def dari_latin(teks, sumber):
        kata = re.findall(r'[a-zA-ZéèêÉÈÊ]+', teks)
        kata = [k for k in kata if not re.search(r'[fvzqx]', k.lower())]
        if kata:
            masuk(ke_jawa(' '.join(kata))[0], sumber)

    osm = json.load(open(os.path.join(LM, 'osm.json'), encoding='utf8'))['elements']
    nama = sorted({e['tags']['name'] for e in osm if 'name' in e.get('tags', {})})
    for nm in nama:
        nm = re.sub(r'^(Jalan|Jl\.?|Gang|Gg\.?)\s+', '', nm, flags=re.I)
        dari_latin(nm, 'osm')
    for blok in open(os.path.join(LM, 'wiki_jv.txt'), encoding='utf8').read().split('\n'):
        for kal in re.split(r'[.;:!?()\[\]"“”]+', blok):
            if len(kal.split()) >= 2:
                dari_latin(kal, 'wikipedia')
    lat, _, lab = sn.split_nusa()
    for nm in lat:
        masuk(lab[nm], 'nusa_latih')
    materi = json.load(open(os.path.join(AKAR, 'src/content/materi-huruf.json'), encoding='utf8'))
    for v in materi.values():
        for c in v.get('contoh', []):
            dari_latin(c['kata'], 'konten')
    for k in ('jalan kantor kelurahan kecamatan pemerintah kota pasar hotel toko bank museum sekolah '
              'sugeng rawuh kabupaten provinsi desa dusun kampung masjid gereja pura kraton').split():
        dari_latin(k, 'papan')
    return baris, asal


def main():
    perintah = sys.argv[1] if len(sys.argv) > 1 else 'bangun'
    if perintah == 'bangun':
        baris, asal = korpus()
        m = latih(baris)
        m['sumber'] = dict(asal)
        m['atribusi'] = 'Nama tempat © kontributor OpenStreetMap (ODbL); teks Wikipedia bahasa Jawa (CC BY-SA); NusaAksara (halaman latih)'
        s = json.dumps(m, ensure_ascii=False, separators=(',', ':'))
        open(JSON_MODEL, 'w', encoding='utf8').write(s)
        print(f'{len(baris)} baris {dict(asal)} -> {len(m["p"])} n-gram, {len(s.encode()) / 1024:.0f} KB -> {JSON_MODEL}')
    elif perintah == 'fixture':
        import random
        model = json.load(open(JSON_MODEL, encoding='utf8'))
        cs = [c if i else '' for i, c in enumerate(_charset())]
        C, kasus = len(cs), []
        rng = random.Random(7)
        for _ in range(12):
            T = rng.randint(6, 40)
            logit = []
            for t in range(T):
                r = [rng.gauss(0, 1.5) for _ in range(C)]
                r[0] += rng.choice([4, 0, 0])
                r[rng.randrange(1, C)] += rng.choice([3, 5, 1])
                logit += [round(v, 4) for v in r]
            kasus.append(dict(T=T, logit=logit, teks=dekode_beam(log_softmax(logit, C), cs, model)))
        json.dump(dict(C=C, kasus=kasus), open(JSON_FIXTURE, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
        print(len(kasus), 'kasus ->', JSON_FIXTURE)


if __name__ == '__main__':
    main()
