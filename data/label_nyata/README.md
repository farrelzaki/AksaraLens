# Label teks potongan aksara (untuk melatih pembaca scanner)

505 potongan baris aksara Jawa dari 105 foto Wikimedia Commons, dipotong otomatis oleh detektor scanner. Tugas kita: **menuliskan bacaan Latin** dari aksara di tiap gambar. Hasilnya melatih pembaca scanner (L4, `docs/RENCANA_SCANNER_FINAL.md`).

## Cara kerja (satu orang, sekitar 15-60 menit)

1. Clone repo, lalu dari akar repo jalankan: `python -m http.server 8000`
2. Buka `http://localhost:8000/scripts/alat_label.html?bagian=N&dari=M` (M = jumlah orang yang melabeli, N = nomor kamu, 1..M; tiap nomor mendapat potongan berbeda).
3. Untuk tiap gambar, ketik bacaan Latin-nya. Usulan dari papan Latin sudah terisi bila ada: **periksa, jangan percaya begitu saja**.
   - Enter = simpan, Tab = lewati bila ragu, Esc = bukan aksara Jawa atau rusak/terpotong.
   - Aturan: `e` di tengah kata = pepet (ê), di akhir = taling (é); tulis `é` atau `ê` untuk memaksa. `dh`, `th`, `ny`, `ng` satu huruf. Singkatan ditulis penuh (JL. = jalan). Aksara di gambar harus sama dengan pratinjau yang muncul; bila beda, perbaiki ketikanmu.
   - Lebih baik melewati daripada menebak.
4. Klik **Unduh hasil**, simpan sebagai `data/label_nyata/hasil/<namamu>_bagianNdariM.json`, lalu buat PR ke `develop` (`docs: add label results <namamu>`).

## Isi

- `potongan/`: gambar potongan. `draf.json`: kotak asal dan usulan label otomatis. `atribusi.csv`: sumber foto.
- Potongan adalah hasil pemotongan (turunan) dari foto Commons dan tetap di bawah lisensi aslinya: CC BY-SA 3.0 dan 4.0, CC BY 4.0, CC0, atau domain publik. Atribusi lengkap ada di `atribusi.csv`. Foto utuh tidak disertakan.
- Foto Set C (uji) tidak termasuk dan tidak boleh ditambahkan ke data latih.

## Bila melabeli dengan AI lain (Gemini, ChatGPT, dst.)

Boleh, tetapi jawaban AI **tidak dipercaya begitu saja**: AI sering mengarang bacaan aksara Jawa. Simpan hasilnya sebagai JSON `{"F131_00.png": "bakpia kukus", ...}` (nama berkas potongan: bacaan Latin) atau CSV `berkas,latin`, di `data/label_nyata/hasil/`. Lalu:

1. `python -X utf8 scripts/periksa_label.py data/label_nyata/hasil/*.json` memberi tiap label tingkat **terpercaya / periksa / buang** berdasarkan bukti yang saling bebas (lihat kepala berkasnya).
2. Yang berstatus **periksa**: buka `http://localhost:8000/scripts/periksa_visual.html?bagian=N&dari=M`. Anda hanya mencocokkan BENTUK (jumlah huruf, tanda atas/bawah/samping) antara gambar dan tulisan label; tidak perlu bisa membaca. Simpan hasilnya `hasil/visual_<nama>.json`.
3. Jalankan ulang langkah 1 dengan `--visual data/label_nyata/hasil/visual_*.json`. Hanya label **terpercaya** dipakai melatih.
4. Dua AI berbeda yang diminta membaca potongan yang sama dan memberi jawaban sama menambah bukti. Simpan masing-masing di berkas terpisah.
5. Setelah ada label terpercaya: `python -X utf8 scripts/ekspor_label_latih.py` membuat `docs/random/data_nyata_v4.zip` untuk notebook latih v4 (unggah ke Drive `aksaralens/`).
