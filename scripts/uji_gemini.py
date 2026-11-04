# Uji apakah model visi Gemini bisa membaca aksara Jawa (keputusan cadangan 5 Nov 2026, lihat docs/RENCANA_SCANNER_CERDAS.md).
# Hanya mengirim foto Set C bagian pengembangan (foto publik Wikimedia Commons), bukan foto pengguna. Kunci dari lingkungan.
# Pakai (PowerShell): $env:GEMINI_API_KEY='...'; python -X utf8 scripts/uji_gemini.py [model ...]
import base64, json, os, sys, time, urllib.request
import cv2, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uji_set_c as u

KUNCI = os.environ.get('GEMINI_API_KEY')
if not KUNCI:
    sys.exit('Set GEMINI_API_KEY di lingkungan (jangan ditulis di repo).')
MODEL = sys.argv[1:] or ['gemini-2.5-flash', 'gemini-2.5-pro']
PROMPT = ('Foto ini berisi tulisan aksara Jawa (Hanacaraka). Salin HANYA tulisan aksara Jawa yang tampak, sebagai karakter Unicode aksara Jawa, '
          'berurutan dari atas ke bawah dan kiri ke kanan. Abaikan teks Latin. Jangan beri penjelasan. Bila tidak ada aksara Jawa, jawab: KOSONG.')
META = json.load(open(os.path.join(u.AKAR, 'scripts/set_c_meta.json'), encoding='utf-8'))
import csv
LABEL = {r['id']: r for r in csv.DictReader(open(os.path.join(u.AKAR, 'docs/random/set_c/label_set_c.csv'), encoding='utf-8'))}


def tanya(model, jpg):
    body = {'contents': [{'parts': [{'text': PROMPT}, {'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(jpg).decode()}}]}],
            'generationConfig': {'temperature': 0}}
    r = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent', data=json.dumps(body).encode(),
                               headers={'Content-Type': 'application/json', 'x-goog-api-key': KUNCI})
    for coba in range(4):
        try:
            d = json.load(urllib.request.urlopen(r, timeout=120))
            return ''.join(p.get('text', '') for p in d['candidates'][0]['content']['parts']).strip()
        except Exception as e:
            time.sleep(5 * (coba + 1))
    return ''


for model in MODEL:
    hasil = []
    for i, m in META.items():
        if m['split'] != 'pengembangan' or m['jenis'] == 'negatif' or not m['kotak']:
            continue
        gray, _ = u.muat_abu(m)
        H, W = gray.shape
        T = LABEL[i]['teks_unicode'].replace(' ', '')
        x0 = min(b[0] for b in m['kotak']) * W; y0 = min(b[1] for b in m['kotak']) * H
        x1 = max(b[2] for b in m['kotak']) * W; y1 = max(b[3] for b in m['kotak']) * H
        mx, my = (x1 - x0) * .15, (y1 - y0) * .15
        pot = gray[int(max(0, y0 - my)):int(min(H, y1 + my)), int(max(0, x0 - mx)):int(min(W, x1 + mx))]
        for nama, g in (('foto', gray), ('area', pot)):
            t = tanya(model, cv2.imencode('.jpg', g)[1].tobytes())
            t = '' if t.upper().startswith('KOSONG') else ''.join(c for c in t if 'ꦀ' <= c <= '꧟')
            cer = min(u.jarak(t, T) / len(T), 1.0)
            hasil.append((nama, cer))
            print(model, i, nama, f'CER {cer:.2f}', '|', T[:14], '|', t[:20], flush=True)
    for nama in ('foto', 'area'):
        c = [x for n, x in hasil if n == nama]
        print(f'== {model} {nama}: n={len(c)}  CER<=.2 {np.mean([x <= .2 for x in c]):.0%}  CER<=.5 {np.mean([x <= .5 for x in c]):.0%}  CER rata-rata {np.mean(c):.2f}')
