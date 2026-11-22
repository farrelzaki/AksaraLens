// Paritas Python–web: menjalankan scan.ts (vite dev) di Chromium pada foto uji dan membandingkan teks
// dengan JSON bangku Python (bangku_v3.py ... --json). Juga mencatat waktu per foto.
// Pakai:
//   cp <model>.onnx public/models/   # pembaca_b2, scanner, detektor_pp, klasifikator
//   VITE_MODEL_URL=/models npx vite --port 5199 --strictPort &
//   node scripts/paritas_web.cjs http://localhost:5199 <folder foto> <json python> <keluaran.json> b2|v2
// Folder foto berisi <id>.jpg/.png untuk setiap kunci 'foto' di JSON Python (mis. Set C positif + negatif).
// Foto hanya dibaca lokal oleh Chromium headless; tidak ada yang dikirim keluar.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [,, url, dirFoto, jsonPy, keluar, pembaca] = process.argv;
(async () => {
  const py = JSON.parse(fs.readFileSync(jsonPy, 'utf8')).foto;
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('[konsol]', m.text().slice(0, 200)); });
  await p.route('**/__foto/**', (r) => r.fulfill({ path: path.join(dirFoto, decodeURIComponent(r.request().url().split('/__foto/')[1])) }));
  await p.goto(url + '/?pembaca=' + pembaca, { waitUntil: 'domcontentloaded' });
  const hasil = {};
  let sama = 0, n = 0;
  for (const k of Object.keys(py)) {
    const f = fs.readdirSync(dirFoto).find((x) => x.startsWith(k + '.'));
    const r = await p.evaluate(async ({ f, pembaca }) => {
      const onnx = await import('/src/ml/onnx.ts');
      onnx.paksaPembaca(pembaca); onnx.paksaEp('wasm');
      const scan = await import('/src/ml/model2/scan.ts');
      const blob = await (await fetch('/__foto/' + f)).blob();
      const t0 = performance.now();
      const h = await scan.bacaFoto(blob);
      return { teks: h.baris.map((x) => x.unicode), status: h.baris.map((x) => x.status), ms: Math.round(performance.now() - t0), tahap: h.info.tahap };
    }, { f, pembaca });
    const pyTeks = (py[k].baris || []).filter((x) => x[2] !== 'TOLAK').map((x) => x[0]);
    const ok = JSON.stringify(pyTeks) === JSON.stringify(r.teks);
    sama += ok; n++;
    hasil[k] = { ...r, python: pyTeks, sama: ok };
    console.log(k, ok ? 'SAMA' : 'BEDA', r.ms + 'ms', r.tahap && r.tahap.pembaca, ok ? '' : JSON.stringify({ web: r.teks, py: pyTeks }));
  }
  console.log(`PARITAS ${sama}/${n}`);
  fs.writeFileSync(keluar, JSON.stringify(hasil, null, 1));
  await b.close();
})();
