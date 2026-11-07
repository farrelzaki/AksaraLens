import math, os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model_bahasa import dapat, dekode_beam, jarak, latih, pilih_koreksi

CS = ['', 'ꦏ', 'ꦶ', 'ꦺ']
MAINAN = dict(n=2, seragam=math.log(1 / 4), p={'ꦏ': -1, 'ꦶ': -1.5, 'ꦏꦶ': -0.05, 'ꦏꦺ': -4}, b={'ꦏ': -2})
kolom = lambda *p: [math.log(v) for v in p]


class TesModelBahasa(unittest.TestCase):
    def test_mundur(self):
        self.assertEqual(dapat(MAINAN, 'ꦏ', 'ꦶ'), -0.05)
        self.assertEqual(dapat(MAINAN, 'ꦏ', 'ꦏ'), -3)

    def test_peluang_jumlah_satu(self):
        m = latih(['ꦏꦶꦠ', 'ꦏꦶꦫ', 'ꦏꦸꦠ', 'ꦏꦶꦠ'], n=3, min_hitung=1)
        abjad = 'ꦏꦶꦠꦫꦸ'
        for ctx in ['^^', '^ꦏ', 'ꦏꦶ']:
            total = sum(math.exp(dapat(m, ctx, c)) for c in abjad)  # sisa massa untuk karakter tak dikenal
            self.assertTrue(0.8 < total <= 1.005, (ctx, total))
        self.assertGreater(dapat(m, 'ꦏꦶ', 'ꦠ'), dapat(m, 'ꦏꦶ', 'ꦸ'))

    def test_beam_memakai_model_bahasa(self):
        lp = [kolom(0.01, 0.97, 0.01, 0.01), kolom(0.01, 0.01, 0.45, 0.53)]
        self.assertEqual(dekode_beam(lp, CS, MAINAN, alfa=0, beta=0), 'ꦏꦺ')
        self.assertEqual(dekode_beam(lp, CS, MAINAN, alfa=1, beta=0), 'ꦏꦶ')

    def test_ulangan(self):
        k, b = kolom(0.01, 0.97, 0.01, 0.01), kolom(0.97, 0.01, 0.01, 0.01)
        self.assertEqual(dekode_beam([k, k, b, k], CS, MAINAN, alfa=0, beta=0), 'ꦏꦏ')

    def test_penjaga(self):
        status = lambda t, y, m: 'TERIMA'
        self.assertEqual(pilih_koreksi('ꦕꦩꦫ', 'ꦕꦼꦩꦫ', 0.9, status), 'ꦕꦼꦩꦫ')
        self.assertIsNone(pilih_koreksi('ꦏꦭꦸꦫ', 'ꦱꦸꦒꦼꦁꦫꦮꦸꦃ', 0.9, status))
        self.assertIsNone(pilih_koreksi('ꦕꦩꦫ', 'ꦕꦼꦩꦫ', 0.9, lambda t, y, m: 'TOLAK'))
        self.assertEqual(jarak('ꦏꦶ', 'ꦏꦺ'), 1)


if __name__ == '__main__':
    unittest.main()
