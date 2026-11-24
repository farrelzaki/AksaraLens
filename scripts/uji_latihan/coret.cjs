// Pakai: dev server di :5173 (npm run dev), Playwright + Chromium terpasang (npm i playwright di folder lain, tidak jadi dependency proyek).
//       node scripts/uji_latihan/coret.cjs [jumlah ulang]. Hasil 24 Nov dicatat di docs/EVALUASI.md bagian 2b.
// Reproduksi bug Model 1: coretan (garis/silang) diterima sebagai aksara benar.
// Tiap skenario: buka latihan, gambar coretan relatif terhadap kotak watermark, tekan tombol cek,
// baca hasil UI + keluaran CNN langsung (periksaTulisan) agar jalur templat vs CNN terpisah.
const { chromium } = require('playwright'); const path = require('path');
const SKEN = {
  datar: [[[0.0, 0.45], [1.0, 0.5]]],
  diagonal: [[[0.0, 0.95], [1.0, 0.05]]],
  silang: [[[0.0, 0.5], [0.95, 0.5]], [[0.15, 1.0], [0.8, -0.1]]],
  tegak: [[[0.5, 0.0], [0.5, 1.0]]],
  lingkaran: 'lingkaran',
  zigzag: [[[0, 0.2], [0.25, 0.8], [0.5, 0.2], [0.75, 0.8], [1, 0.2]]],
};
(async () => {
  const b = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe') });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.75, hasTouch: false });
  const ulang = +(process.argv[2] || 2);
  for (const [nama, garis] of Object.entries(SKEN)) for (let u = 0; u < ulang; u++) {
    const p = await ctx.newPage();
    await p.goto('http://localhost:5173/latihan/b1-tulis', { waitUntil: 'load', timeout: 120000 });
    await p.waitForSelector('canvas.canvas-drawing-layer', { timeout: 120000 });
    await p.waitForTimeout(600);
    await p.waitForFunction(() => { const c = document.querySelector('canvas.canvas-drawing-layer').getBoundingClientRect(); return document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2)?.tagName === 'CANVAS'; }, null, { timeout: 30000 });
    const wm = await p.locator('.canvas-watermark-guide').boundingBox();
    const cv = await p.locator('canvas.canvas-drawing-layer').boundingBox();
    // kotak tinta watermark kira-kira: lebar elemen bisa lebih lebar dari glyph, pakai irisan dengan kanvas
    const x0 = Math.max(wm.x, cv.x + cv.width * 0.18), x1 = Math.min(wm.x + wm.width, cv.x + cv.width * 0.82);
    const y0 = Math.max(wm.y, cv.y + cv.height * 0.3), y1 = Math.min(wm.y + wm.height, cv.y + cv.height * 0.62);
    const P = ([fx, fy]) => [x0 + fx * (x1 - x0), y0 + fy * (y1 - y0)];
    const garisNyata = garis === 'lingkaran'
      ? [Array.from({ length: 41 }, (_, i) => [0.5 + 0.5 * Math.cos(i / 40 * 2 * Math.PI), 0.5 + 0.5 * Math.sin(i / 40 * 2 * Math.PI)])]
      : garis;
    for (const g of garisNyata) {
      const [sx, sy] = P(g[0]); await p.mouse.move(sx, sy); await p.mouse.down();
      for (let i = 1; i < g.length; i++) { const [tx, ty] = P(g[i]); await p.mouse.move(tx, ty, { steps: 25 }); }
      await p.mouse.up();
    }
    const target = await p.evaluate(() => document.querySelector('.canvas-watermark-guide')?.textContent);
    const cnn = await p.evaluate(async () => {
      const m = await import('/src/ml/model1/periksa.ts');
      const c = document.querySelector('canvas.canvas-drawing-layer');
      const r = await m.periksaTulisan(c, '?');
      return r;
    });
    await p.locator('button.btn-action-pelajaran').click();
    await p.waitForTimeout(1500);
    const ui = await p.evaluate(() => {
      const t = (s) => document.querySelector(s)?.innerText?.replace(/\s+/g, ' ').trim();
      return t('.latihan-celebration-card') || t('.latihan-warning-card') || t('[class*="feedback"]') || '';
    });
    console.log(JSON.stringify({ nama, target, cnn, ui: ui.slice(0, 120) }));
    if (u === 0) await p.screenshot({ path: path.join(require('os').tmpdir(), `coret_${nama}.png`) });
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
