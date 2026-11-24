// Pakai: dev server di :5173 (npm run dev), Playwright + Chromium terpasang (npm i playwright di folder lain, tidak jadi dependency proyek).
//       node scripts/uji_latihan/ambang.cjs [jumlah ulang]. Hasil 24 Nov dicatat di docs/EVALUASI.md bagian 2b.
// Ambang sadar-target: positif = kerangka glyph 20 huruf x 8 variasi; negatif = coretan acak (garis, silang, lingkaran,
// zigzag, jalan acak, kumpulan garis) x 20 target. Laporkan tingkat terima pada beberapa ambang (top-1 = target dan p >= t).
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
    const { LABEL_MODEL1 } = await import('/src/ml/model1/keputusan.ts');
    const { HURUF } = await import('/src/aksara/huruf.ts');
    const [ses, ort] = await Promise.all([muatModel('model1'), ortSiap()]);
    const wm = document.querySelector('.canvas-watermark-guide'), st = getComputedStyle(wm);
    const c0 = document.querySelector('canvas.canvas-drawing-layer');
    const dpr = 2.75, W = c0.width, H = c0.height;
    const prob = async (kv) => {
      const id = kv.getContext('2d').getImageData(0, 0, W, H);
      const x = praproses(grayDariKanvas(id.data, W, H)); if (!x) return null;
      const y = (await ses.run({ [ses.inputNames[0]]: new ort.Tensor('float32', x, [1, 1, UKURAN, UKURAN]) }))[ses.outputNames[0]].data;
      const mx = Math.max(...y), e = Array.from(y, (v) => Math.exp(v - mx)), z = e.reduce((a, c) => a + c, 0);
      return e.map((v) => v / z);
    };
    const huruf = HURUF.filter((x) => x.jenis === 'nglegena');
    const pos = [];
    const VAR = [[1, 0, 0, 0], [0.8, 6, 10, 8], [1.12, -5, -14, 6], [0.9, -8, 6, -6], [1.05, 4, 0, 10], [0.7, 0, -10, 0], [1, 10, 0, 0], [0.95, -3, 12, -8]];
    for (const h of huruf) for (const [s, r, dx, dy] of VAR) {
      const off = new OffscreenCanvas(W, H), o = off.getContext('2d');
      o.font = `${st.fontWeight} ${parseFloat(st.fontSize) * dpr}px ${st.fontFamily}`; o.textAlign = 'center'; o.textBaseline = 'middle';
      o.translate(W / 2 + dx * dpr, H / 2 + dy * dpr); o.rotate(r * Math.PI / 180); o.scale(s, s); o.fillText(h.unicode, 0, 0);
      const d = o.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
      const sk = skeleton(m, W, H);
      const kv = new OffscreenCanvas(W, H), g = kv.getContext('2d'); g.fillStyle = '#3A2315';
      for (let i = 0; i < W * H; i++) if (sk[i] && i % 3 === 0) { g.beginPath(); g.arc(i % W, Math.floor(i / W), 5 * dpr, 0, 7); g.fill(); }
      const pr = await prob(kv); if (pr) pos.push({ t: LABEL_MODEL1.indexOf(h.kode), pr });
    }
    // negatif: coretan acak
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const neg = [];
    const jenis = ['garis', 'silang', 'lingkaran', 'zigzag', 'acak', 'garis3'];
    for (let k = 0; k < 600; k++) {
      const kv = new OffscreenCanvas(W, H), g = kv.getContext('2d');
      g.strokeStyle = '#3A2315'; g.lineWidth = 10 * dpr; g.lineCap = 'round'; g.lineJoin = 'round';
      const j = jenis[k % jenis.length], P = () => [W * (0.2 + 0.6 * rnd()), H * (0.25 + 0.5 * rnd())];
      g.beginPath();
      if (j === 'garis') { g.moveTo(...P()); g.lineTo(...P()); }
      else if (j === 'silang') { g.moveTo(...P()); g.lineTo(...P()); g.moveTo(...P()); g.lineTo(...P()); }
      else if (j === 'lingkaran') { const [x, y] = P(); g.ellipse(x, y, W * (0.08 + 0.2 * rnd()), H * (0.08 + 0.2 * rnd()), rnd() * 3, 0, 6.3); }
      else if (j === 'zigzag') { const n = 3 + Math.floor(rnd() * 5); let [x, y] = [W * 0.2, H * 0.4]; g.moveTo(x, y); for (let i = 0; i < n; i++) { x += W * 0.6 / n; y = H * (0.3 + 0.4 * rnd()); g.lineTo(x, y); } }
      else if (j === 'acak') { g.moveTo(...P()); for (let i = 0; i < 6; i++) g.quadraticCurveTo(...P(), ...P()); }
      else { for (let i = 0; i < 3; i++) { g.moveTo(...P()); g.lineTo(...P()); } }
      g.stroke();
      const pr = await prob(kv); if (pr) neg.push({ j, pr });
    }
    const T = [0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3];
    const argmax = (pr) => pr.reduce((bi, v, i) => (v > pr[bi] ? i : bi), 0);
    const res = {};
    for (const t of T) {
      const pt = pos.filter((x) => argmax(x.pr) === x.t && x.pr[x.t] >= t).length;
      // negatif: tiap coretan dicoba terhadap 20 target; diterima bila top-1 = target dan p >= t
      let nt = 0; const perJenis = {};
      for (const x of neg) { const a = argmax(x.pr); const ok = LABEL_MODEL1[a] !== 'bukan' && x.pr[a] >= t; if (ok) { nt++; perJenis[x.j] = (perJenis[x.j] || 0) + 1; } }
      // per huruf positif
      const perHuruf = {};
      for (const x of pos) { const k = LABEL_MODEL1[x.t]; perHuruf[k] = (perHuruf[k] || 0) + (argmax(x.pr) === x.t && x.pr[x.t] >= t ? 1 : 0); }
      const lemah = Object.entries(perHuruf).filter(([, v]) => v < 6).map(([k, v]) => `${k}:${v}/8`).join(' ');
      res[t] = { pos: `${pt}/${pos.length}`, negTerimaSalahSatuTarget: `${nt}/${neg.length}`, negPerTarget: (nt / neg.length / 20 * 100).toFixed(2) + '%', perJenis, lemah };
    }
    return res;
  });
  for (const [t, v] of Object.entries(hasil)) console.log(t, JSON.stringify(v));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
