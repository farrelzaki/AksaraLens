import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ekspor_label_latih import bagi_per_foto, foto_dari, pilih_terpercaya


class TesEksporLabel(unittest.TestCase):
    def test_foto_dari(self):
        self.assertEqual(foto_dari('F131_00.png'), 'F131')
        self.assertEqual(foto_dari('F007_80.png'), 'F007')

    def test_satu_foto_satu_bagian(self):
        berkas = [f'F{f:03d}_{k:02d}.png' for f in range(20) for k in range(3)]
        b = bagi_per_foto(berkas)
        for f in range(20):
            self.assertEqual(len({b[f'F{f:03d}_{k:02d}.png'] for k in range(3)}), 1)
        self.assertEqual(sum(v == 'val' for v in b.values()) // 3, 3)  # 15% dari 20 foto

    def test_sedikit_foto(self):
        self.assertEqual(set(bagi_per_foto(['F001_00.png', 'F001_01.png']).values()), {'latih'})
        self.assertEqual(sorted(bagi_per_foto(['F001_00.png', 'F002_00.png']).values()), ['latih', 'val'])

    def test_hanya_terpercaya(self):
        h = {'a.png': dict(tier='terpercaya', sah=True, aksara='ꦱꦸ'), 'b.png': dict(tier='periksa', sah=True, aksara='ꦏ'),
             'c.png': dict(tier='terpercaya', sah=False, aksara='ꦏ')}
        self.assertEqual(pilih_terpercaya(h), {'a.png': 'ꦱꦸ'})


if __name__ == '__main__':
    unittest.main()
