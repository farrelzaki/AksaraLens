# L-C: apakah verifikator terlatih (regresi logistik) lebih baik dari keyakinan sekarang? (docs/RISET_RENCANA_28NOV.md)
# Masukan: keluaran scripts/uji_baris.py. Dibagi dua per hash nama; ambang dipilih di separuh latih (salah-terima negatif <= 5%).
# Hasil 19 Nov: tidak; keunggulan semua fitur datang dari panjang baris (positif ±29 tanda, negatif 1-2), jalan pintas.
# Pakai: python -X utf8 scripts/analisis_verifikator.py hasil_r1.jsonl [hasil_r2.jsonl ...]
import json, sys, hashlib, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
FIT = ['yakin', 'min_huruf', 'risiko_hapus', 'margin', 'validitas', 'konsonan', 'panjang']
def muat(p):
    R = [json.loads(l) for l in open(p, encoding='utf-8')]
    for r in R: r['y'] = int(r['set'] in ('wiki', 'v4c', 'nusa') and r['cer'] <= 0.2); r['neg'] = r['set'] in ('lain', 'latin')
    return R
def X(R, fit):
    out = []
    for r in R:
        f = r['fitur']; v = []
        for k in fit:
            x = f[k]
            v.append(np.log1p(x) if k in ('konsonan', 'panjang') else x)
        out.append(v)
    return np.array(out)
def separuh(r): return int(hashlib.md5((r['set'] + r['nama']).encode()).hexdigest(), 16) % 2
for p in sys.argv[1:]:
    R = muat(p); A = [r for r in R if separuh(r) == 0]; B = [r for r in R if separuh(r) == 1]
    print('==', p.split('/')[-1], 'latih', len(A), 'uji', len(B))
    for nama, fit in [('yakin saja', ['yakin']), ('semua fitur', FIT), ('tanpa yakin', FIT[1:])]:
        m = LogisticRegression(C=1.0, max_iter=2000).fit(X(A, fit), [r['y'] for r in A])
        sB = m.predict_proba(X(B, fit))[:, 1]; yB = np.array([r['y'] for r in B]); nB = np.array([r['neg'] for r in B])
        sA = m.predict_proba(X(A, fit))[:, 1]; nA = np.array([r['neg'] for r in A])
        # ambang dari separuh latih: salah-terima negatif <= 5%
        t = np.quantile(sA[nA], 0.95)
        fa = (sB[nB] >= t).mean(); rec = (sB[yB == 1] >= t).mean()
        print(f'  {nama:12s} AUC uji {roc_auc_score(yB, sB):.3f} | ambang {t:.3f}: salah-terima negatif uji {fa:.1%}, recall layak {rec:.1%}')
        if nama == 'semua fitur': print('   bobot', dict(zip(fit, np.round(m.coef_[0], 2))), 'b', round(m.intercept_[0], 2))
    # aturan sekarang (status foto) di separuh uji
    fa = np.mean([r['status_foto'] != 'TOLAK' for r in B if r['neg']]); rec = np.mean([r['status_foto'] != 'TOLAK' for r in B if r['y']])
    print(f'  aturan sekarang (foto): salah-terima {fa:.1%}, recall layak {rec:.1%}')
    fa = np.mean([r['status_area'] != 'TOLAK' for r in B if r['neg']]); rec = np.mean([r['status_area'] != 'TOLAK' for r in B if r['y']])
    print(f'  aturan sekarang (area): salah-terima {fa:.1%}, recall layak {rec:.1%}')

print('\n### Pemeriksaan jalan pintas panjang baris')
for p in sys.argv[1:]:
    R = muat(p)
    import statistics as st
    for s in ('wiki','v4c','nusa','lain','latin'):
        L = [r['fitur']['panjang'] for r in R if r['set']==s]; print(' ', p.split('/')[-1], s, 'median panjang', st.median(L))
    A = [r for r in R if separuh(r) == 0]; B = [r for r in R if separuh(r) == 1]
    fit = ['yakin', 'min_huruf', 'margin', 'validitas']
    m = LogisticRegression(max_iter=2000).fit(X(A, fit), [r['y'] for r in A])
    sA = m.predict_proba(X(A, fit))[:, 1]; nA = np.array([r['neg'] for r in A]); t = np.quantile(sA[nA], 0.95)
    sB = m.predict_proba(X(B, fit))[:, 1]; yB = np.array([r['y'] for r in B]); nB = np.array([r['neg'] for r in B])
    print(f'  tanpa panjang/konsonan: AUC {roc_auc_score(yB, sB):.3f}, salah-terima {(sB[nB]>=t).mean():.1%}, recall {(sB[yB==1]>=t).mean():.1%}', dict(zip(fit, np.round(m.coef_[0],2))), round(m.intercept_[0],2))
    # positif pendek saja (<= 12 tanda) vs negatif: apakah tetap terpisah?
    pend = [r for r in B if (r['y'] and r['fitur']['panjang'] <= 12) or r['neg']]
    if sum(r['y'] for r in pend) > 5:
        s2 = m.predict_proba(X(pend, fit))[:, 1]; y2 = [r['y'] for r in pend]
        print(f'  positif pendek (<=12 tanda, n={sum(y2)}) vs negatif: AUC {roc_auc_score(y2, s2):.3f}; yakin saja AUC {roc_auc_score(y2, [r["fitur"]["yakin"] for r in pend]):.3f}; min_huruf AUC {roc_auc_score(y2, [r["fitur"]["min_huruf"] for r in pend]):.3f}')
