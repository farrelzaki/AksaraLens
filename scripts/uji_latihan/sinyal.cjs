// Pakai: dev server di :5173 (npm run dev), Playwright + Chromium terpasang (tidak jadi dependency proyek).
//       node scripts/uji_latihan/sinyal.cjs
// Mengukur sinyal tambahan untuk menolak tulisan salah tanpa latih ulang CNN, per sampel:
//   pT  = peluang CNN untuk huruf target, top1 = tebakan teratas
//   pF  = peluang huruf target bila tinta dicerminkan kiri-kanan (tulisan cermin -> pF tinggi)
//   aspek = max(r, 1/r), r = (lebar/tinggi tinta) / (lebar/tinggi panduan)  (huruf setengah -> ~2)
//   cakup = bagian kerangka panduan (posisi asli) yang berjarak <= 20 px CSS dari tinta
//   panjang = panjang kerangka tinta / panjang kerangka panduan; skala/lebar/tinggi = ukuran kotak tinta / kotak panduan
// Kategori: benar (variasi + goyangan tangan), setengah, seperempat hilang, cermin, huruf lain. Hasil -> JSON di tmp.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe') });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.75 });
  await p.goto('http://localhost:5173/latihan/b1-tulis', { waitUntil: 'load', timeout: 120000 });
  await p.waitForSelector('canvas.canvas-drawing-layer', { timeout: 120000 });
  const data = await p.evaluate(async () => {
    await document.fonts.ready;
    const { skeleton, praproses, grayDariKanvas, UKURAN } = await import('/src/ml/model1/praproses.ts');
    const { muatModel, ortSiap } = await import('/src/ml/onnx.ts');
    const { LABEL_MODEL1 } = await import('/src/ml/model1/keputusan.ts');
    const { HURUF } = await import('/src/aksara/huruf.ts');
    const [ses, ort] = await Promise.all([muatModel('model1'), ortSiap()]);
    const huruf = HURUF.filter((x) => x.jenis === 'nglegena');
    const wm = document.querySelector('.canvas-watermark-guide'), st = getComputedStyle(wm);
    const c0 = document.querySelector('canvas.canvas-drawing-layer');
    const dpr = 2.75, W = c0.width, H = c0.height;
    const font = `${st.fontWeight} ${parseFloat(st.fontSize) * dpr}px ${st.fontFamily}`;
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const kerangka = (teks, [s, r, dx, dy], cermin = false) => {
      const off = new OffscreenCanvas(W, H), o = off.getContext('2d');
      o.font = font; o.textAlign = 'center'; o.textBaseline = 'middle';
      o.translate(W / 2 + dx * dpr, H / 2 + dy * dpr); o.rotate(r * Math.PI / 180); o.scale(cermin ? -s : s, s); o.fillText(teks, 0, 0);
      const d = o.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
      const sk = skeleton(m, W, H); const pts = [];
      for (let i = 0; i < W * H; i++) if (sk[i]) pts.push([i % W, (i / W) | 0]);
      return pts;
    };
    const kotak = (pts) => { let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9]; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };
    const lukis = (pts, goyang = 0) => {
      const kv = new OffscreenCanvas(W, H), g = kv.getContext('2d'); g.fillStyle = '#3A2315';
      const a = goyang * dpr, l1 = (40 + 40 * rnd()) * dpr, l2 = (40 + 40 * rnd()) * dpr, f1 = rnd() * 6, f2 = rnd() * 6;
      for (let k = 0; k < pts.length; k += 3) { const [x, y] = pts[k]; g.beginPath(); g.arc(x + a * Math.sin(y / l1 + f1), y + a * Math.sin(x / l2 + f2), 5 * dpr, 0, 7); g.fill(); }
      return kv;
    };
    const cnn = async (kv) => {
      const id = kv.getContext('2d').getImageData(0, 0, W, H);
      const x = praproses(grayDariKanvas(id.data, W, H)); if (!x) return null;
      const y = (await ses.run({ [ses.inputNames[0]]: new ort.Tensor('float32', x, [1, 1, UKURAN, UKURAN]) }))[ses.outputNames[0]].data;
      const mx = Math.max(...y), e = Array.from(y, (v) => Math.exp(v - mx)), z = e.reduce((a, c) => a + c, 0);
      return e.map((v) => v / z);
    };
    const cermin = (kv) => { const f = new OffscreenCanvas(W, H), g = f.getContext('2d'); g.translate(W, 0); g.scale(-1, 1); g.drawImage(kv, 0, 0); return f; };
    const panduan = {};
    for (const h of huruf) { const pts = kerangka(h.unicode, [1, 0, 0, 0]); panduan[h.kode] = { pts, box: kotak(pts), n: pts.length }; }
    const fitur = async (kv, target) => {
      const pr = await cnn(kv); if (!pr) return null;
      const ti = LABEL_MODEL1.indexOf(target); const top = pr.reduce((bi, v, i) => (v > pr[bi] ? i : bi), 0);
      const prF = await cnn(cermin(kv));
      const d = kv.getContext('2d').getImageData(0, 0, W, H).data; const m = new Uint8Array(W * H); const ink = [];
      for (let i = 0; i < W * H; i++) if ((m[i] = d[i * 4 + 3] > 60 ? 1 : 0)) ink.push([i % W, (i / W) | 0]);
      const sk = skeleton(m, W, H); let panjang = 0; for (let i = 0; i < W * H; i++) if (sk[i]) panjang++;
      const pd = panduan[target]; const [a0, b0, a1, b1] = kotak(ink); const [g0, h0, g1, h1] = pd.box;
      const r = ((a1 - a0) / Math.max(1, b1 - b0)) / ((g1 - g0) / Math.max(1, h1 - h0));
      const rr = Math.round(20 * dpr); let kena = 0, n = 0;
      for (let k = 0; k < pd.pts.length; k += 7) { n++; const [x, y] = pd.pts[k]; let ok = false;
        for (let dy = -rr; dy <= rr && !ok; dy += 3) for (let dx = -rr; dx <= rr && !ok; dx += 3) { if (dx * dx + dy * dy > rr * rr) continue; const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && m[yy * W + xx]) ok = true; }
        if (ok) kena++; }
      return { pT: +pr[ti].toFixed(3), top1: top === ti, bukan: LABEL_MODEL1[top] === 'bukan', pF: prF ? +prF[ti].toFixed(3) : 0,
        aspek: +Math.max(r, 1 / r).toFixed(2), cakup: +(kena / n).toFixed(2), panjang: +(panjang / pd.n).toFixed(2),
        skala: +Math.sqrt(((a1 - a0) * (b1 - b0)) / ((g1 - g0) * (h1 - h0))).toFixed(3), lebar: +((a1 - a0) / (g1 - g0)).toFixed(3), tinggi: +((b1 - b0) / (h1 - h0)).toFixed(3) };
    };
    const V = () => [0.8 + 0.3 * rnd(), -8 + 16 * rnd(), -14 + 28 * rnd(), -10 + 20 * rnd()];
    const out = [];
    for (const t of huruf) {
      for (let k = 0; k < 8; k++) { const f = await fitur(lukis(kerangka(t.unicode, V()), 3 + 5 * rnd()), t.kode); if (f) out.push({ kat: 'benar', t: t.kode, ...f }); }
      const dasar = kerangka(t.unicode, [1, 0, 0, 0]); const [x0, y0, x1, y1] = kotak(dasar), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      const pot = { kiri: ([x]) => x <= mx, kanan: ([x]) => x >= mx, atas: ([, y]) => y <= my, bawah: ([, y]) => y >= my };
      for (const [nm, fn] of Object.entries(pot)) { const f = await fitur(lukis(dasar.filter(fn), 3), t.kode); if (f) out.push({ kat: 'setengah', t: t.kode, v: nm, ...f }); }
      const kw = { 'kiri-atas': ([x, y]) => !(x < mx && y < my), 'kanan-atas': ([x, y]) => !(x > mx && y < my), 'kiri-bawah': ([x, y]) => !(x < mx && y > my), 'kanan-bawah': ([x, y]) => !(x > mx && y > my) };
      for (const [nm, fn] of Object.entries(kw)) { const f = await fitur(lukis(dasar.filter(fn), 3), t.kode); if (f) out.push({ kat: 'seperempat_hilang', t: t.kode, v: nm, ...f }); }
      for (let k = 0; k < 2; k++) { const f = await fitur(lukis(kerangka(t.unicode, V(), true), 4), t.kode); if (f) out.push({ kat: 'cermin', t: t.kode, ...f }); }
      for (const lain of huruf) if (lain.kode !== t.kode) { const f = await fitur(lukis(kerangka(lain.unicode, V()), 4), t.kode); if (f) out.push({ kat: 'huruf_lain', t: t.kode, v: lain.kode, ...f }); }
    }
    return out;
  });
  const f = path.join(require('os').tmpdir(), 'sinyal_latihan.json'); fs.writeFileSync(f, JSON.stringify(data)); console.log(data.length, 'sampel ->', f);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
