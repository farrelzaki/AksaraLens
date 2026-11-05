# Memastikan scripts/latin_ke_jawa.mjs (dipakai alat_label.html) menghasilkan keluaran yang sama persis dengan latin_ke_jawa.py.
# Pakai: python -X utf8 scripts/cocok_latin_ke_jawa.py   (butuh Node.js)
import json, os, subprocess, sys
D = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, D)
from latin_ke_jawa import ke_jawa

KATA = ['jalan malioboro', 'bukusêkolah', 'panorama jawa', 'nyala', 'dhawuh', 'thithik', 'nganti', 'bangkok', 'kantor', 'surakarta', 'lungguh',
        'pasar', 'hotel', 'kraton', 'apa', 'ibu', 'lia', 'tua', 'kecamatan', 'desé', 'JL. 5 Zaki', 'pemerintah kota surakarta', 'bakpia kukus',
        'asuransi jasindo', 'loket', 'jl. brigjend. slamet riyadi', 'yogyakarta international airport', 'kawedalaken comité', 'sekolah', 'museum']
mjs = subprocess.run(['node', os.path.join(D, 'latin_ke_jawa.mjs'), *KATA], capture_output=True, text=True, encoding='utf8', check=True).stdout.splitlines()
salah = 0
for t, baris in zip(KATA, mjs):
    js = json.loads(baris)
    py = [t, *ke_jawa(t)]
    if js != py:
        salah += 1
        print('BEDA', t, js, py)
print(f'{len(KATA) - salah}/{len(KATA)} sama')
sys.exit(1 if salah else 0)
