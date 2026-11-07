# Model ONNX

Berkas `.onnx` tidak di-commit. Salin dari Drive tim ke folder ini:

| Berkas | Sumber Drive | Ukuran |
| --- | --- | --- |
| `aksaralens_huruf.onnx` (Model 1) | `aksaralens/model1` | 1,9 MB |
| `aksaralens_scanner.onnx` (pembaca v2 lama, CRNN; tidak dipakai sejak B2) | `aksaralens/model2_v2` | 8,2 MB |
| `aksaralens_pembaca_b2.onnx` (Model 2a, pembaca B2: PP-OCRv5_server_rec di-fine-tune, int8 QDQ, Apache-2.0) | `aksaralens/model2_b2` lalu `scripts/b2_kuantisasi.py` | 18 MB |
| `aksaralens_detektor_pp.onnx` (Model 2b, detektor PP-OCRv5 mobile, Apache-2.0) | [PaddlePaddle/PP-OCRv5_mobile_det_onnx](https://huggingface.co/PaddlePaddle/PP-OCRv5_mobile_det_onnx) | 4,8 MB |
| `aksaralens_klasifikator.onnx` (penyaring aksara Jawa, dilatih `scripts/klasifikator_aksara.py`; `models/v2` = versi bersih tanpa Set C) | dilatih sendiri | 0,3 MB |

Label/charset-nya (`huruf_label.json`, `scanner_charset.json`) sudah di-commit di
`src/ml/model1/` dan `src/ml/model2/`. Bila model dilatih ulang, ganti keduanya bersamaan.

## Produksi: Supabase Storage

File `.onnx` disajikan dari bucket publik Supabase Storage, bukan dari repo/Vercel.

1. Supabase Dashboard → Storage → **New bucket** `models`, centang **Public bucket**.
2. Buat folder versi, mis. `v1/`, lalu unggah ketiga file di atas ke `models/v1/`.
3. Isi `VITE_MODEL_URL` (di `.env` lokal dan Environment Variables Vercel):
   `https://<proyek>.supabase.co/storage/v1/object/public/models/v1`
4. Model dilatih ulang → unggah ke folder baru (`v2/`), ganti `VITE_MODEL_URL`, dan perbarui
   `huruf_label.json` / `scanner_charset.json` di commit yang sama. Jangan menimpa file di `v1/`,
   karena browser pengguna mungkin masih menyimpan cache-nya.

`VITE_MODEL_URL` kosong → aplikasi memakai file di folder ini (pengembangan lokal).
