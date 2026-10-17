// F7 "Tentang & sumber data". Atribusi wajib (CC BY 4.0, CC BY-SA 4.0, SIL OFL 1.1) dan
// sitasi NusaAksara. Sumber: PRD Lampiran + notebook Model 1 & 2. Ubah bersama bila dataset berubah.

export interface Sumber {
  nama: string;
  oleh: string;
  lisensi: string;
  dipakai: string;
  url: string;
}

export const TENTANG =
  'AksaraLens membantu belajar aksara Jawa secara bertahap: jalur belajar 3 bab, latihan menulis yang diperiksa ' +
  'model pengenal tulisan tangan, dan scanner yang membaca tulisan aksara cetak dari foto. Semua pengenalan berjalan ' +
  'di perangkatmu; foto tidak pernah dikirim ke server.';

export const TIM = ['Farrel', 'Emil', 'Choirun'];

export const DATASET: Sumber[] = [
  {
    nama: 'Aksara Jawa / Hanacaraka',
    oleh: 'vzrenggamani dkk.',
    lisensi: 'CC0 1.0',
    dipakai: 'Latihan menulis (model pemeriksa tulisan)',
    url: 'https://github.com/vzrenggamani/aksarajawa-hanacaraka',
  },
  {
    nama: 'Javanese Handwriting Object Detection – Aksara Jawa',
    oleh: 'Fawwaz Zaini Ahmad, Roboflow Universe',
    lisensi: 'CC BY 4.0',
    dipakai: 'Latihan menulis (model pemeriksa tulisan)',
    url: 'https://universe.roboflow.com/fawwaz-zaini-ahmad-ce2om/javanese-handwriting-object-detection-aksara-jawa',
  },
  {
    nama: 'Javanese script',
    oleh: 'Ismi Naimah, Kaggle',
    lisensi: 'CC BY-SA 4.0',
    dipakai: 'Latihan menulis (model pemeriksa tulisan)',
    url: 'https://www.kaggle.com/datasets/isminaimah/javanese-script',
  },
  {
    nama: 'NusaAksara',
    oleh: 'Muhammad Farid Adilazuarda dkk.',
    lisensi: 'Non-komersial',
    dipakai: 'Scanner (pembaca baris)',
    url: 'https://huggingface.co/datasets/NusaAksara/NusaAksara',
  },
  {
    nama: 'NusaAksara-java (halaman + kotak baris)',
    oleh: 'Exqrch',
    lisensi: 'Tidak tertulis; diperlakukan seperti NusaAksara',
    dipakai: 'Scanner (detektor baris)',
    url: 'https://huggingface.co/datasets/Exqrch/NusaAksara-java',
  },
];

export const FONT_DAN_KODE: Sumber[] = [
  {
    nama: 'Noto Sans Javanese',
    oleh: 'The Noto Project Authors',
    lisensi: 'SIL OFL 1.1',
    dipakai: 'Tampilan aksara, data latih sintetis scanner',
    url: 'https://github.com/notofonts/javanese',
  },
  {
    nama: 'Tuladha Jejeg',
    oleh: 'R.S. Wihananto',
    lisensi: 'SIL OFL 1.1',
    dipakai: 'Data latih sintetis scanner',
    url: 'https://en.wikipedia.org/wiki/Tuladha_Jejeg',
  },
  {
    nama: 'scikit-image (tabel skeleton Zhang-Suen)',
    oleh: 'The scikit-image team',
    lisensi: 'BSD-3-Clause',
    dipakai: 'Pra-proses latihan menulis',
    url: 'https://github.com/scikit-image/scikit-image',
  },
  {
    nama: 'ONNX Runtime Web',
    oleh: 'Microsoft',
    lisensi: 'MIT',
    dipakai: 'Menjalankan model di browser',
    url: 'https://onnxruntime.ai/',
  },
];

export const SITASI =
  'Muhammad Farid Adilazuarda dkk. 2025. NusaAksara: A Multimodal and Multilingual Benchmark for Preserving ' +
  'Indonesian Indigenous Scripts. Proceedings of ACL 2025. https://aclanthology.org/2025.acl-long.1377/';

export const RUJUKAN = [
  'Putri & Subrata (2024). Media interaktif aksara Jawa (CAKRA) untuk siswa kelas 4.',
  'Sulaiman & Mulyana (2023). Pengenalan tulisan tangan aksara Jawa berbasis web canvas dengan CNN.',
  'Naufal dkk. (2024). OCR aksara Jawa cetak.',
  'Widiarti dkk. (2026). Segmentasi halaman aksara Jawa cetak.',
  'Arah goresan merujuk tutorial Omah Aksara; data goresan direkam ulang oleh tim.',
];
