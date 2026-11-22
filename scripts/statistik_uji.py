# L-B: statistik berpasangan untuk keluaran scripts/uji_baris.py (docs/RISET_RENCANA_28NOV.md, aturan D2).
# - akurasi suku kata per set + selisih B - A dengan interval bootstrap berpasangan 95% (resampel baris)
# - salah-terima pada negatif (status != TOLAK) dengan interval Wilson 95%
# - AUC penolakan: skor memisahkan "layak tampil" (positif dengan CER <= 0,2) dari sisanya (negatif + positif CER > 0,2)
# Pakai: python -X utf8 scripts/statistik_uji.py A.jsonl B.jsonl [--skor yakin] [--json ringkasan.json]
import argparse, json, math, random

POSITIF = ('wiki', 'v4c', 'nusa')
NEGATIF = ('lain', 'latin')
ATURAN_D2 = ('v4c', 'nusa')  # aturan pilih r1/r2 (disetujui 18 Nov): gabungan v4 val + Nusa uji


def muat(p):
    return {(r['set'], r['nama']): r for r in map(json.loads, open(p, encoding='utf-8'))}


def akurasi(rs):
    n = sum(r['suku_n'] for r in rs)
    return sum(r['suku_benar'] for r in rs) / max(n, 1)


def bootstrap_selisih(pasangan, kali=10000, seed=0):
    """pasangan: [(rA, rB)] -> (selisih, bawah, atas) akurasi suku B - A, resampel baris berpasangan."""
    rng = random.Random(seed)
    a = [(x['suku_benar'], y['suku_benar'], x['suku_n']) for x, y in pasangan]
    def sel(s):
        n = sum(t[2] for t in s)
        return (sum(t[1] for t in s) - sum(t[0] for t in s)) / max(n, 1)
    d = sel(a)
    bs = sorted(sel([rng.choice(a) for _ in a]) for _ in range(kali))
    return d, bs[int(0.025 * kali)], bs[int(0.975 * kali)]


def wilson(k, n, z=1.96):
    if not n:
        return 0.0, 0.0, 0.0
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return p, max(0.0, c - h), min(1.0, c + h)


def auc(pos, neg):
    """Mann-Whitney: peluang skor positif > skor negatif (seri dihitung setengah)."""
    if not pos or not neg:
        return float('nan')
    semua = sorted([(s, 1) for s in pos] + [(s, 0) for s in neg])
    peringkat, i = {}, 0
    while i < len(semua):
        j = i
        while j < len(semua) and semua[j][0] == semua[i][0]:
            j += 1
        for k in range(i, j):
            peringkat[k] = (i + j + 1) / 2
        i = j
    r_pos = sum(peringkat[k] for k, (_, y) in enumerate(semua) if y)
    return (r_pos - len(pos) * (len(pos) + 1) / 2) / (len(pos) * len(neg))


def layak(r):
    return r['set'] in POSITIF and r['cer'] <= 0.2


def ringkas(nama, d, skor):
    out = {}
    print(f'\n== {nama}')
    for s in POSITIF:
        rs = [r for r in d.values() if r['set'] == s]
        if rs:
            out[s] = dict(n=len(rs), suku=akurasi(rs), cer_02=sum(r['cer'] <= 0.2 for r in rs) / len(rs))
            print(f'  {s:6s} n={len(rs):4d}  suku {out[s]["suku"]:.1%}  baris CER<=0,2 {out[s]["cer_02"]:.1%}')
    for mode in ('foto', 'area'):
        rs = [r for r in d.values() if r['set'] in NEGATIF]
        k = sum(r[f'status_{mode}'] != 'TOLAK' for r in rs)
        p, lo, hi = wilson(k, len(rs))
        out[f'salah_terima_{mode}'] = dict(k=k, n=len(rs), p=p, ci=[lo, hi])
        print(f'  negatif salah-terima ({mode}): {k}/{len(rs)} = {p:.1%} [{lo:.1%}, {hi:.1%}]')
        for s in NEGATIF:
            rs_s = [r for r in rs if r['set'] == s]
            print(f'     {s:6s} {sum(r[f"status_{mode}"] != "TOLAK" for r in rs_s)}/{len(rs_s)}')
    pos = [r['fitur'][skor] for r in d.values() if layak(r)]
    neg = [r['fitur'][skor] for r in d.values() if not layak(r)]
    out['auc'] = auc(pos, neg)
    print(f'  AUC penolakan (skor={skor}): {out["auc"]:.3f}  (layak tampil {len(pos)}, sisanya {len(neg)})')
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('a')
    ap.add_argument('b')
    ap.add_argument('--skor', default='yakin')
    ap.add_argument('--json')
    a = ap.parse_args()
    A, B = muat(a.a), muat(a.b)
    kunci = sorted(set(A) & set(B))
    A, B = {k: A[k] for k in kunci}, {k: B[k] for k in kunci}
    hasil = dict(A=ringkas(a.a, A, a.skor), B=ringkas(a.b, B, a.skor))
    print('\n== Selisih akurasi suku B - A, bootstrap berpasangan 95%')
    for nama, sets in [(s, (s,)) for s in POSITIF] + [('aturan D2 (v4c + nusa)', ATURAN_D2), ('semua positif', POSITIF)]:
        ps = [(A[k], B[k]) for k in kunci if k[0] in sets]
        if ps:
            d, lo, hi = bootstrap_selisih(ps)
            hasil[f'selisih_{nama}'] = [d, lo, hi]
            print(f'  {nama:24s} {d:+.1%} [{lo:+.1%}, {hi:+.1%}]  n={len(ps)}')
    d, lo, _ = hasil['selisih_aturan D2 (v4c + nusa)']
    print(f'\nAturan D2 bagian (a): batas bawah {lo:+.1%} {">" if lo > -0.01 else "<="} -1 poin -> '
          f'{"B lolos (a)" if lo > -0.01 else "B tidak lolos (a)"}; bagian (b) diputuskan setelah verifikator (L-C).')
    if a.json:
        json.dump(hasil, open(a.json, 'w'), indent=1)


if __name__ == '__main__':
    main()
