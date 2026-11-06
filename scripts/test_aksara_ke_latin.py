import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from latin_ke_jawa import ke_jawa
from tambah_bacaan_model import ke_latin


class TesAksaraKeLatin(unittest.TestCase):
    def test_kata_dasar(self):
        self.assertEqual(ke_latin('ꦗꦭꦤ꧀'), 'jalan')
        self.assertEqual(ke_latin('ꦧꦸꦏꦸꦱꦼꦏꦺꦴꦭꦃ'), 'bukusêkolah')
        self.assertEqual(ke_latin('ꦏꦤ꧀ꦠꦺꦴꦂ'), 'kantor')
        self.assertEqual(ke_latin('ꦧꦁꦏꦺꦴꦏ꧀'), 'bangkok')

    def test_bolak_balik_dengan_pengubah_latin(self):
        # aksara -> Latin -> aksara harus kembali sama untuk kata tanpa vokal awal ('ha' berbeda dengan vokal murni)
        for kata in ['jalan', 'malioboro', 'surakarta', 'kecamatan', 'bakpia', 'asuransi', 'pasar', 'bangkok', 'lungguh', 'thithik']:
            aksara = ke_jawa(kata)[0]
            self.assertEqual(ke_jawa(ke_latin(aksara))[0], aksara, kata)


if __name__ == '__main__':
    unittest.main()
