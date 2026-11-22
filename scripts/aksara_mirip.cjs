// Menghitung aksara nglegena yang mirip bentuk untuk pilihan koreksi hasil scan -> src/aksara/mirip.json.
// Tiap aksara digambar di Chromium dengan dua font (Noto Sans Javanese, font aksara aplikasi; Javanese Text,
// font Windows), dipotong ke tintanya, diperkecil ke 48x48, dikaburkan, lalu dibandingkan dengan kosinus.
// Kemiripan = rata-rata kedua font. Butuh paket playwright (bukan dependency aplikasi; pasang di luar repo, pakai NODE_PATH):
//   node scripts/aksara_mirip.cjs [jalur chrome.exe]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const NGLEGENA = 'ꦲꦤꦕꦫꦏꦢꦠꦱꦮꦭꦥꦝꦗꦪꦚꦩꦒꦧꦛꦔ';
const FONT = ["'Noto Sans Javanese'", "'Javanese Text'"];
const JUMLAH = 3; // pilihan mirip per aksara

(async () => {
  const b = await chromium.launch(process.argv[2] ? { executablePath: process.argv[2] } : {});
  const p = await b.newPage();
  await p.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Javanese&display=block"><span style="font-family:'Noto Sans Javanese'">${NGLEGENA}</span>`);
  await p.evaluate(() => document.fonts.ready);
  const vektor = await p.evaluate(({ huruf, font }) => {
    const S = 48;
    const satu = (c, f) => {
      const k = document.createElement('canvas');
      k.width = k.height = 200;
      const x = k.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, 200, 200);
      x.fillStyle = '#000';
      x.font = `100px ${f}`;
      x.fillText(c, 40, 130);
      const d = x.getImageData(0, 0, 200, 200).data;
      let [x0, y0, x1, y1] = [200, 200, -1, -1];
      for (let i = 0; i < 200 * 200; i++) if (d[i * 4] < 128) {
        const px = i % 200, py = (i - px) / 200;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
      const k2 = document.createElement('canvas');
      k2.width = k2.height = S;
      const x2 = k2.getContext('2d');
      x2.fillStyle = '#fff';
      x2.fillRect(0, 0, S, S);
      x2.filter = 'blur(1.5px)';
      const w = x1 - x0 + 1, h = y1 - y0 + 1, s = (S - 4) / Math.max(w, h);
      x2.drawImage(k, x0, y0, w, h, (S - w * s) / 2, (S - h * s) / 2, w * s, h * s);
      const e = x2.getImageData(0, 0, S, S).data;
      const v = [];
      for (let i = 0; i < S * S; i++) v.push(1 - e[i * 4] / 255);
      return v;
    };
    return font.map((f) => [...huruf].map((c) => satu(c, f)));
  }, { huruf: NGLEGENA, font: FONT });
  await b.close();

  const kos = (a, b) => {
    let ab = 0, aa = 0, bb = 0;
    for (let i = 0; i < a.length; i++) { ab += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
    return ab / Math.sqrt(aa * bb);
  };
  const huruf = [...NGLEGENA];
  const mirip = {};
  huruf.forEach((c, i) => {
    const skor = huruf.map((d, j) => [d, j === i ? -1 : vektor.reduce((n, v) => n + kos(v[i], v[j]), 0) / vektor.length]);
    skor.sort((a, b) => b[1] - a[1]);
    mirip[c] = skor.slice(0, JUMLAH).map(([d]) => d);
  });
  const keluar = path.join(__dirname, '..', 'src', 'aksara', 'mirip.json');
  fs.writeFileSync(keluar, JSON.stringify(mirip, null, 1) + '\n');
  console.log(keluar);
  for (const [c, m] of Object.entries(mirip)) console.log(c, m.join(' '));
})().catch((e) => { console.error(e); process.exit(1); });
