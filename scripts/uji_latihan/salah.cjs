// Pakai: dev server di :5173 (npm run dev), Playwright + Chromium terpasang (tidak jadi dependency proyek).
//       node scripts/uji_latihan/salah.cjs
// Apakah pemeriksa menolak tulisan SALAH? Untuk tiap 20 huruf target, digambar (kerangka glyph, goresan 10 px CSS):
//   huruf_lain : 19 huruf lain x 2 variasi tangan        -> harus ditolak
//   setengah   : hanya separuh kiri / kanan / atas / bawah huruf target -> harus ditolak
//   cermin     : huruf target dibalik kiri-kanan          -> harus ditolak
//   benar      : huruf target x 4 variasi (pembanding)    -> sebaiknya lulus
// Keputusan = nilaiTulisan (CNN, ambang sadar-target) seperti aplikasi. Templat (penjaga tambahan) tidak dihitung,
// jadi angka "lolos" di sini adalah batas atas: di aplikasi hanya bisa sama atau lebih sedikit.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe') });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.75 });
  await p.goto('http://localhost:5173/latihan/b1-tulis', { waitUntil: 'load', timeout: 120000 });
  await p.waitForSelector('canvas.canvas-drawing-layer', { timeout: 120000 });
  const hasil = await p.evaluate(async () => {
    await document.fonts.ready;
    const { skeleton, praproses, grayDariKanvas, UKURAN } = await import('/src/ml/model1/praproses.ts');
    const { muatModel, ortSiap } = await import('/src/ml/onnx.ts');
    const { nilaiTulisan } = await import('/src/ml/model1/keputusan.ts');
    const { HURUF } = await import('/src/aksara/huruf.ts');
    const [ses, ort] = await Promise.all([muatModel('model1'), ortSiap()]);
    const wm = document.querySelector('.canvas-watermark-guide'), st = getComputedStyle(wm);
    const c0 = document.querySelector('canvas.canvas-drawing-layer');
    const dpr = 2.75, W = c0.width, H = c0.height;
    const font = `${st.fontWeight} ${parseFloat(st.fontSize) * dpr}px ${st.fontFamily}`;
    // potong: null | 'kiri' | 'kanan' | 'atas' | 'bawah'; cermin: bool
    const gambar = (teks, [s, r, dx, dy], potong = null, cermin = false) => {
      const off = new OffscreenCanvas(W, H), o = off.getContext('2d');
      o.font = font; o.textAlign = 'center'; o.textBaseline = 'middle';
      o.translate(W / 2 + dx * dpr, H / 2 + dy * dpr); o.rotate(r * Math.PI / 180); o.scale(cermin ? -s : s, s); o.fillText(teks, 0, 0);
      const d = o.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H);
      let x0 = W, x1 = 0, y0 = H, y1 = 0;
      for (let i = 0; i < W * H; i++) if ((m[i] = d[i * 4 + 3] > 100 ? 1 : 0)) { const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      const sk = skeleton(m, W, H);
      const kv = new OffscreenCanvas(W, H), g = kv.getContext('2d'); g.fillStyle = '#3A2315';
      for (let i = 0; i < W * H; i++) {
        if (!sk[i] || i % 3) continue;
        const x = i % W, y = (i / W) | 0;
        if ((potong === 'kiri' && x > mx) || (potong === 'kanan' && x < mx) || (potong === 'atas' && y > my) || (potong === 'bawah' && y < my)) continue;
        g.beginPath(); g.arc(x, y, 5 * dpr, 0, 7); g.fill();
      }
      return kv;
    };
    const nilai = async (kv, target) => {
      const id = kv.getContext('2d').getImageData(0, 0, W, H);
      const x = praproses(grayDariKanvas(id.data, W, H)); if (!x) return { jenis: 'kosong' };
      const y = (await ses.run({ [ses.inputNames[0]]: new ort.Tensor('float32', x, [1, 1, UKURAN, UKURAN]) }))[ses.outputNames[0]].data;
      const mx = Math.max(...y), e = Array.from(y, (v) => Math.exp(v - mx)), z = e.reduce((a, c) => a + c, 0);
      return nilaiTulisan(e.map((v) => v / z), target);
    };
    const huruf = HURUF.filter((x) => x.jenis === 'nglegena');
    const V = [[1, 0, 0, 0], [0.85, 5, 8, 6], [1.08, -5, -10, 4], [0.92, -7, 4, -6]];
    const tot = {}; const tambah = (k, lolos, ket) => { tot[k] = tot[k] || { lolos: 0, n: 0, contoh: [] }; tot[k].n++; if (lolos) { tot[k].lolos++; if (tot[k].contoh.length < 12) tot[k].contoh.push(ket); } };
    for (const t of huruf) {
      for (const lain of huruf) if (lain.kode !== t.kode) for (const v of V.slice(0, 2)) {
        const r = await nilai(gambar(lain.unicode, v), t.kode); tambah('huruf_lain', r.jenis === 'benar', `tulis ${lain.kode} -> target ${t.kode}`);
      }
      for (const pt of ['kiri', 'kanan', 'atas', 'bawah']) {
        const r = await nilai(gambar(t.unicode, V[0], pt), t.kode); tambah('setengah', r.jenis === 'benar', `${t.kode} ${pt}`);
      }
      for (const v of V.slice(0, 2)) { const r = await nilai(gambar(t.unicode, v, null, true), t.kode); tambah('cermin', r.jenis === 'benar', `${t.kode} cermin`); }
      for (const v of V) { const r = await nilai(gambar(t.unicode, v), t.kode); tambah('benar (pembanding)', r.jenis === 'benar', t.kode); }
    }
    return tot;
  });
  for (const [k, v] of Object.entries(hasil)) console.log(`${k.padEnd(20)} lolos ${v.lolos}/${v.n} (${(100 * v.lolos / v.n).toFixed(1)}%)${v.contoh.length && !k.startsWith('benar') ? '  contoh: ' + v.contoh.join('; ') : ''}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
