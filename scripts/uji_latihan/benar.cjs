// Pakai: dev server di :5173 (npm run dev), Playwright + Chromium terpasang (npm i playwright di folder lain, tidak jadi dependency proyek).
//       node scripts/uji_latihan/benar.cjs [jumlah ulang]. Hasil 24 Nov dicatat di docs/EVALUASI.md bagian 2b.
// Tulisan "benar" tiruan: kerangka glyph watermark digambar ulang dengan lebar goresan aplikasi (10 px CSS),
// dengan variasi tangan (skala, rotasi, geser). Ukur apa yang diputuskan CNN dan UI untuk tiap huruf.
const { chromium } = require('playwright'); const path = require('path');
const VARIASI = [
  { nama: 'pas', s: 1, r: 0, dx: 0, dy: 0 },
  { nama: 'kecil-miring', s: 0.8, r: 6, dx: 10, dy: 8 },
  { nama: 'besar-geser', s: 1.12, r: -5, dx: -14, dy: 6 },
];
(async () => {
  const b = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe') });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.75 });
  const n = +(process.argv[2] || 6);
  for (let k = 0; k < n; k++) for (const v of VARIASI) {
    const p = await ctx.newPage();
    await p.goto('http://localhost:5173/latihan/b1-tulis', { waitUntil: 'load', timeout: 120000 });
    await p.waitForSelector('canvas.canvas-drawing-layer', { timeout: 120000 });
    await p.waitForFunction(() => { const c = document.querySelector('canvas.canvas-drawing-layer').getBoundingClientRect(); return document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2)?.tagName === 'CANVAS'; }, null, { timeout: 30000 });
    const cv = await p.locator('canvas.canvas-drawing-layer').boundingBox();
    await p.mouse.move(cv.x + cv.width / 2, cv.y + cv.height / 2); await p.mouse.down(); await p.mouse.move(cv.x + cv.width / 2 + 1, cv.y + cv.height / 2, { steps: 2 }); await p.mouse.up(); // memicu hasDrawn
    await p.evaluate(() => { const c = document.querySelector('canvas.canvas-drawing-layer'); c.getContext('2d').clearRect(0, 0, c.width, c.height); });
    const info = await p.evaluate(async (v) => {
      const { skeleton } = await import('/src/ml/model1/praproses.ts');
      const c = document.querySelector('canvas.canvas-drawing-layer');
      const wm = document.querySelector('.canvas-watermark-guide');
      const dpr = c.width / c.getBoundingClientRect().width;
      const cr = c.getBoundingClientRect(), wr = wm.getBoundingClientRect(), st = getComputedStyle(wm);
      const W = c.width, H = c.height;
      const off = new OffscreenCanvas(W, H); const o = off.getContext('2d');
      o.font = `${st.fontWeight} ${parseFloat(st.fontSize) * dpr}px ${st.fontFamily}`;
      o.textAlign = 'center'; o.textBaseline = 'middle';
      const cx = (wr.x + wr.width / 2 - cr.x) * dpr, cy = (wr.y + wr.height / 2 - cr.y) * dpr;
      o.translate(cx + v.dx * dpr, cy + v.dy * dpr); o.rotate(v.r * Math.PI / 180); o.scale(v.s, v.s);
      o.fillText(wm.textContent, 0, 0);
      const d = o.getImageData(0, 0, W, H).data; const m = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
      const sk = skeleton(m, W, H);
      const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#3A2315';
      let jml = 0;
      for (let i = 0; i < W * H; i++) if (sk[i] && (i % 3 === 0)) { g.beginPath(); g.arc(i % W, Math.floor(i / W), 5 * dpr, 0, Math.PI * 2); g.fill(); jml++; }
      g.restore();
      const per = await import('/src/ml/model1/periksa.ts');
      return { target: wm.textContent, titik: jml, cnn: await per.periksaTulisan(c, '?') };
    }, v);
    await p.locator('button.btn-action-pelajaran').click();
    await p.waitForTimeout(1200);
    const ui = await p.evaluate(() => {
      const t = (s) => document.querySelector(s)?.innerText?.replace(/\s+/g, ' ').trim();
      return t('.latihan-celebration-card') || t('.latihan-warning-card') || '';
    });
    console.log(JSON.stringify({ v: v.nama, ...info, ui: ui.slice(0, 90) }));
    if (k === 0) await p.screenshot({ path: path.join(require('os').tmpdir(), `benar_${v.nama}.png`) });
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
