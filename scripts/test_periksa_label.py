import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from periksa_label import cer, jarak, tentukan_tier


class TesPeriksaLabel(unittest.TestCase):
    def test_jarak_dan_cer(self):
        self.assertEqual(jarak('kitten', 'sitting'), 3)
        self.assertEqual(cer('abc', 'abc'), 0)
        self.assertAlmostEqual(cer('abcd', 'abxd'), 0.25)
        self.assertEqual(cer('', ''), 0)

    def test_tier(self):
        self.assertEqual(tentukan_tier(['decoy', 'papan'], True), 'terpercaya')
        self.assertEqual(tentukan_tier(['visual', 'decoy'], True), 'terpercaya')
        self.assertEqual(tentukan_tier(['decoy'], True), 'periksa')
        self.assertEqual(tentukan_tier([], True), 'buang')
        self.assertEqual(tentukan_tier(['decoy', 'papan', 'sumber2'], False), 'buang')  # label tak sah selalu dibuang


if __name__ == '__main__':
    unittest.main()
