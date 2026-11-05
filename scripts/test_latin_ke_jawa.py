import json, os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from latin_ke_jawa import ke_jawa

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARSET = set(json.load(open(os.path.join(AKAR, 'src/ml/model2/scanner_charset.json'), encoding='utf8'))['charset'][1:])


class TesLatinKeJawa(unittest.TestCase):
    def a(self, latin, aksara):
        self.assertEqual(ke_jawa(latin)[0], aksara, latin)

    def test_contoh_demo_aplikasi(self):  # sama dengan UNICODE_DEMO di src/ml/model2/scanner.ts
        self.a('panorama jawa', 'ꦥꦤꦺꦴꦫꦩꦗꦮ')
        self.a('bukusêkolah', 'ꦧꦸꦏꦸꦱꦼꦏꦺꦴꦭꦃ')
        self.a('jalan malioboro', 'ꦗꦭꦤ꧀ꦩꦭꦶꦪꦺꦴꦧꦺꦴꦫꦺꦴ')

    def test_nglegena_dan_digraf(self):
        self.a('nyala', 'ꦚꦭ')
        self.a('dhawuh', 'ꦝꦮꦸꦃ')
        self.a('thithik', 'ꦛꦶꦛꦶꦏ꧀')
        self.a('nganti', 'ꦔꦤ꧀ꦠꦶ')

    def test_panyigeg(self):
        self.a('bangkok', 'ꦧꦁꦏꦺꦴꦏ꧀')
        self.a('kantor', 'ꦏꦤ꧀ꦠꦺꦴꦂ')
        self.a('surakarta', 'ꦱꦸꦫꦏꦂꦠ')
        self.a('lungguh', 'ꦭꦸꦁꦒꦸꦃ')

    def test_pangkon_akhir_dan_pasangan(self):
        self.a('pasar', 'ꦥꦱꦂ')
        self.a('hotel', 'ꦲꦺꦴꦠꦺꦭ꧀')  # e di akhir kata = taling ('hotél')
        self.a('kraton', 'ꦏ꧀ꦫꦠꦺꦴꦤ꧀')

    def test_vokal_awal_dan_penghubung(self):
        self.a('apa', 'ꦲꦥ')
        self.a('ibu', 'ꦲꦶꦧꦸ')
        self.a('lia', 'ꦭꦶꦪ')  # vokal setelah i diberi ꦪ
        self.a('tua', 'ꦠꦸꦮ')  # vokal setelah u diberi ꦮ

    def test_e(self):
        self.a('kecamatan', 'ꦏꦼꦕꦩꦠꦤ꧀')  # e tengah = pepet
        self.a('desé', 'ꦢꦼꦱꦺ')  # é eksplisit = taling

    def test_diragukan(self):
        self.assertFalse(ke_jawa('jalan malioboro')[1])
        self.assertTrue(ke_jawa('JL. 5 Zaki')[1])  # titik, angka, huruf z

    def test_keluaran_hanya_karakter_model(self):
        for t in ['jalan malioboro', 'kelurahan', 'kecamatan', 'selamat datang', 'museum sonobudoyo', 'pasar beringharjo', 'hotel']:
            self.assertTrue(set(ke_jawa(t)[0]) <= CHARSET, t)


if __name__ == '__main__':
    unittest.main()
