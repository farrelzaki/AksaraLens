# Model ONNX

Berkas `.onnx` tidak di-commit. Salin dari Drive tim ke folder ini:

| Berkas | Sumber Drive | Ukuran |
| --- | --- | --- |
| `aksaralens_huruf.onnx` (Model 1) | `aksaralens/model1` | 1,9 MB |
| `aksaralens_scanner.onnx` (Model 2a, CRNN) | `aksaralens/model2_v2` | 8,2 MB |
| `aksaralens_detektor_baris.onnx` (Model 2b, U-Net) | `aksaralens/model2_v2` | 1,95 MB |

Label/charset-nya (`huruf_label.json`, `scanner_charset.json`) sudah di-commit di
`src/ml/model1/` dan `src/ml/model2/`. Bila model dilatih ulang, ganti keduanya bersamaan.

Untuk deploy Vercel, model perlu diunggah lewat jalur lain (mis. Git LFS atau
penyimpanan statis terpisah) — belum diputuskan.
