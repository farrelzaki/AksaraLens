import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from set_c import bocor, kunci_judul


class TesSetC(unittest.TestCase):
    def test_bentuk_judul_berbeda_dianggap_sama(self):
        k = kunci_judul('File:Aksara Jawa 039.jpg')
        self.assertEqual(kunci_judul('https://commons.wikimedia.org/wiki/File:Aksara_Jawa_039.jpg'), k)
        self.assertEqual(kunci_judul('https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Aksara_Jawa_039.jpg/1920px-Aksara_Jawa_039.jpg'), k)
        self.assertEqual(kunci_judul('File:Aksara%20Jawa%20039.jpg'), k)

    def test_bocor(self):
        set_c = {kunci_judul('File:Aksara_Jawa_039.jpg'): 'C19'}
        self.assertEqual(bocor([('F084.jpg', 'File:Aksara Jawa 039.jpg'), ('F000.jpg', 'File:Lain.jpg')], set_c), {'F084.jpg': 'C19'})


if __name__ == '__main__':
    unittest.main()
