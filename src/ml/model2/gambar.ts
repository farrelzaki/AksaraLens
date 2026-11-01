// Operasi gambar grayscale pengganti OpenCV untuk pipeline scanner (notebook Model 2, sel 23 & 39).
// Semua fungsi murni. Nilai piksel 0..255; langkah yang di notebook menghasilkan uint8 dibulatkan
// agar hasilnya sedekat mungkin dengan cv2.

export interface Gray {
  w: number;
  h: number;
  d: Float32Array;
}

export const buatGray = (w: number, h: number, isi = 0): Gray => ({ w, h, d: new Float32Array(w * h).fill(isi) });

/** Pembulatan seperti cvRound / Python round (setengah ke genap). */
export function bulat(x: number): number {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

const keUint8 = (x: number) => (x <= 0 ? 0 : x >= 255 ? 255 : bulat(x));

/** cv2.cvtColor(RGB2GRAY): koefisien fixed-point OpenCV. */
export function dariRGBA(rgba: ArrayLike<number>, w: number, h: number): Gray {
  const g = buatGray(w, h);
  for (let i = 0, j = 0; i < g.d.length; i++, j += 4) {
    g.d[i] = (rgba[j] * 4899 + rgba[j + 1] * 9617 + rgba[j + 2] * 1868 + 8192) >> 14;
  }
  return g;
}

// ---------- resize (INTER_AREA) ----------

type Bobot = { i: number[]; w: number[] }[];

/** Bobot 1D: rata-rata luas bila mengecil, linear bila membesar (perilaku INTER_AREA cv2). */
function bobot1D(nSrc: number, nDst: number, skala: number): Bobot {
  const out: Bobot = [];
  for (let o = 0; o < nDst; o++) {
    const idx: number[] = [];
    const wt: number[] = [];
    if (skala >= 1) {
      const a = o * skala;
      const b = Math.min((o + 1) * skala, nSrc);
      for (let k = Math.floor(a); k < Math.ceil(b); k++) {
        const ov = Math.min(b, k + 1) - Math.max(a, k);
        if (ov > 0) {
          idx.push(Math.min(k, nSrc - 1));
          wt.push(ov);
        }
      }
      const total = wt.reduce((p, q) => p + q, 0);
      for (let k = 0; k < wt.length; k++) wt[k] /= total;
    } else {
      let f = (o + 0.5) * skala - 0.5;
      let i0 = Math.floor(f);
      let fr = f - i0;
      if (i0 < 0) [i0, fr] = [0, 0];
      if (i0 >= nSrc - 1) [i0, fr] = [nSrc - 1, 0];
      idx.push(i0, Math.min(i0 + 1, nSrc - 1));
      wt.push(1 - fr, fr);
    }
    out.push({ i: idx, w: wt });
  }
  return out;
}

/**
 * Koefisien cabang linear cv2.resize untuk INTER_AREA saat membesar:
 * sx = floor(dx·skala), fx = (dx+1) − (sx+1)/skala, fx ≤ 0 → 0, lainnya pecahannya.
 */
function linearArea(nSrc: number, nDst: number, skala: number): { sx: Int32Array; fx: Float64Array } {
  const sx = new Int32Array(nDst);
  const fx = new Float64Array(nDst);
  for (let o = 0; o < nDst; o++) {
    let s0 = Math.floor(o * skala);
    let f = o + 1 - (s0 + 1) / skala;
    f = f <= 0 ? 0 : f - Math.floor(f);
    if (s0 >= nSrc - 1) [s0, f] = [nSrc - 1, 0];
    sx[o] = s0;
    fx[o] = f;
  }
  return { sx, fx };
}

/**
 * cv2.resize(..., INTER_AREA). `skalaX/Y` = src/dst (default dari ukuran).
 * Mengecil di kedua sumbu: rata-rata luas (float). Selain itu cv2 memakai cabang linear dengan
 * koefisien khusus INTER_AREA dan fixed-point 11 bit untuk uint8 — ditiru di sini.
 * Hasil dibulatkan ke uint8, kecuali `bulatkan = false` (masukan float32 di cv2).
 */
export function resize(g: Gray, nw: number, nh: number, skalaX = g.w / nw, skalaY = g.h / nh, bulatkan = true): Gray {
  if (skalaX < 1 || skalaY < 1) return resizeLinear(g, nw, nh, skalaX, skalaY, bulatkan);
  const bx = bobot1D(g.w, nw, skalaX);
  const by = bobot1D(g.h, nh, skalaY);
  const tmp = new Float32Array(nw * g.h);
  for (let y = 0; y < g.h; y++) {
    const r = y * g.w;
    for (let x = 0; x < nw; x++) {
      const { i, w } = bx[x];
      let s = 0;
      for (let k = 0; k < i.length; k++) s += g.d[r + i[k]] * w[k];
      tmp[y * nw + x] = s;
    }
  }
  const out = buatGray(nw, nh);
  for (let y = 0; y < nh; y++) {
    const { i, w } = by[y];
    for (let x = 0; x < nw; x++) {
      let s = 0;
      for (let k = 0; k < i.length; k++) s += tmp[i[k] * nw + x] * w[k];
      out.d[y * nw + x] = bulatkan ? keUint8(s) : s;
    }
  }
  return out;
}

const SKALA_KOEF = 2048; // INTER_RESIZE_COEF_SCALE

function resizeLinear(g: Gray, nw: number, nh: number, skalaX: number, skalaY: number, uint8: boolean): Gray {
  const X = linearArea(g.w, nw, skalaX);
  const Y = linearArea(g.h, nh, skalaY);
  const q = (f: number) => (uint8 ? bulat(f * SKALA_KOEF) : f);
  const ax0 = Array.from(X.fx, (f) => q(1 - f));
  const ax1 = Array.from(X.fx, (f) => q(f));
  const tmp = new Float64Array(nw * g.h);
  for (let y = 0; y < g.h; y++) {
    const r = y * g.w;
    for (let x = 0; x < nw; x++) {
      const s0 = X.sx[x];
      const s1 = Math.min(s0 + 1, g.w - 1);
      tmp[y * nw + x] = g.d[r + s0] * ax0[x] + g.d[r + s1] * ax1[x];
    }
  }
  const out = buatGray(nw, nh);
  for (let y = 0; y < nh; y++) {
    const r0 = Y.sx[y];
    const r1 = Math.min(r0 + 1, g.h - 1);
    const b0 = q(1 - Y.fx[y]);
    const b1 = q(Y.fx[y]);
    for (let x = 0; x < nw; x++) {
      const v = tmp[r0 * nw + x] * b0 + tmp[r1 * nw + x] * b1;
      // FixedPtCast<int, uchar, 22>: (v + 2^21) >> 22
      out.d[y * nw + x] = uint8 ? Math.min(255, Math.max(0, Math.floor((v + 2097152) / 4194304))) : v;
    }
  }
  return out;
}

// ---------- konvolusi terpisah ----------

function konvolusi(g: Gray, kernel: number[], tepi: (i: number, n: number) => number): Gray {
  const r = kernel.length >> 1;
  const K = Float32Array.from(kernel);
  const { w, h } = g;
  // indeks tepi dihitung sekali per sumbu, bukan per sampel
  const ix = Int32Array.from({ length: w + 2 * r }, (_, i) => tepi(i - r, w));
  const iy = Int32Array.from({ length: h + 2 * r }, (_, i) => tepi(i - r, h));
  const tmp = new Float32Array(w * h);
  const baris = new Float32Array(w + 2 * r);
  for (let y = 0; y < h; y++) {
    const o = y * w;
    for (let i = 0; i < baris.length; i++) baris[i] = g.d[o + ix[i]];
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = 0; k < K.length; k++) s += baris[x + k] * K[k];
      tmp[o + x] = s;
    }
  }
  const out = buatGray(w, h);
  const kol = new Float32Array(w);
  for (let y = 0; y < h; y++) {
    kol.fill(0);
    for (let k = 0; k < K.length; k++) {
      const o = iy[y + k] * w;
      const kk = K[k];
      for (let x = 0; x < w; x++) kol[x] += tmp[o + x] * kk;
    }
    for (let x = 0; x < w; x++) out.d[y * w + x] = keUint8(kol[x]);
  }
  return out;
}

const reflect101 = (i: number, n: number) => (n === 1 ? 0 : i < 0 ? -i : i >= n ? 2 * n - i - 2 : i);
const replicate = (i: number, n: number) => (i < 0 ? 0 : i >= n ? n - 1 : i);

function kernelGauss(k: number): number[] {
  if (k === 3) return [1 / 4, 2 / 4, 1 / 4]; // tabel tetap cv2 untuk ksize 3 & 5
  if (k === 5) return [1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16];
  const sigma = 0.3 * ((k - 1) * 0.5 - 1) + 0.8;
  const r = k >> 1;
  const v = Array.from({ length: k }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const s = v.reduce((a, b) => a + b, 0);
  return v.map((x) => x / s);
}

/** cv2.GaussianBlur(g, (5,5), 0). */
export const blur5 = (g: Gray) => konvolusi(g, kernelGauss(5), reflect101);
/** cv2.GaussianBlur(g, (3,3), 0). */
export const blur3 = (g: Gray) => konvolusi(g, kernelGauss(3), reflect101);

// ---------- ambang ----------

/** Ambang Otsu cv2: kelas 0 = nilai <= t. */
export function otsu(g: Gray): number {
  const hist = new Float64Array(256);
  for (const v of g.d) hist[v]++;
  const n = g.d.length;
  let jumlah = 0;
  for (let i = 0; i < 256; i++) jumlah += i * hist[i];
  let w0 = 0;
  let s0 = 0;
  let terbaik = -1;
  let t = 0;
  for (let i = 0; i < 256; i++) {
    w0 += hist[i];
    if (w0 === 0) continue;
    const w1 = n - w0;
    if (w1 === 0) break;
    s0 += i * hist[i];
    const m0 = s0 / w0;
    const m1 = (jumlah - s0) / w1;
    const v = w0 * w1 * (m0 - m1) ** 2;
    if (v > terbaik) [terbaik, t] = [v, i];
  }
  return t;
}

/** normalisasi_polaritas: balik bila mayoritas piksel gelap (tulisan terang di latar gelap). */
/** Negatif gambar (255 - nilai). */
export function balik(g: Gray): Gray {
  const d = new Float32Array(g.d.length);
  for (let i = 0; i < d.length; i++) d[i] = 255 - g.d[i];
  return { w: g.w, h: g.h, d };
}

export function normalisasiPolaritas(g: Gray): Gray {
  const b = blur5(g);
  const t = otsu(b);
  let gelap = 0;
  for (const v of b.d) if (v <= t) gelap++;
  if (gelap / b.d.length <= 0.5) return g;
  const out = buatGray(g.w, g.h);
  for (let i = 0; i < g.d.length; i++) out.d[i] = 255 - g.d[i];
  return out;
}

/** masker_tinta: adaptiveThreshold Gaussian (C=12, INV) lalu opening 2×2. Tinta = 255. */
export function maskerTinta(g: Gray): Gray {
  const blk = Math.max(15, Math.floor(Math.min(g.h, g.w) / 20) | 1);
  const rata = konvolusi(g, kernelGauss(blk), replicate);
  const m = buatGray(g.w, g.h);
  for (let i = 0; i < g.d.length; i++) m.d[i] = g.d[i] <= rata.d[i] - 12 ? 255 : 0;
  return morf(morf(m, Math.min), Math.max);
}

/** Erosi/dilasi kernel 2×2 anchor (1,1): tetangga di offset {-1, 0}; di luar gambar diabaikan. */
function morf(g: Gray, op: (a: number, b: number) => number): Gray {
  const { w, h, d } = g;
  const out = buatGray(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = d[i];
      if (x > 0) v = op(v, d[i - 1]);
      if (y > 0) {
        v = op(v, d[i - w]);
        if (x > 0) v = op(v, d[i - w - 1]);
      }
      out.d[i] = v;
    }
  }
  return out;
}

// ---------- rotasi (deskew) ----------

/**
 * Rotasi seperti cv2.warpAffine(getRotationMatrix2D(pusat, sudut, 1)), bilinear, tepi konstan.
 * Satu loop tanpa callback/alokasi per piksel.
 */
function rotasi(g: Gray, sudut: number, tepi: number, out: Float32Array, bulatkan: boolean) {
  const t = (sudut * Math.PI) / 180;
  const a = Math.cos(t);
  const b = Math.sin(t);
  const { w, h, d } = g;
  const cx = w / 2;
  const cy = h / 2;
  for (let y = 0; y < h; y++) {
    const dy = y - cy;
    // invers rotasi: src = R^-1 (dst - pusat) + pusat; maju per x dengan (a, b)
    let sx = -a * cx - b * dy + cx;
    let sy = -b * cx + a * dy + cy;
    for (let x = 0; x < w; x++, sx += a, sy += b) {
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      if (x0 < -1 || y0 < -1 || x0 >= w || y0 >= h) {
        out[y * w + x] = tepi;
        continue;
      }
      const fx = sx - x0;
      const fy = sy - y0;
      let p00: number, p10: number, p01: number, p11: number;
      if (x0 >= 0 && y0 >= 0 && x0 + 1 < w && y0 + 1 < h) {
        const i = y0 * w + x0;
        p00 = d[i];
        p10 = d[i + 1];
        p01 = d[i + w];
        p11 = d[i + w + 1];
      } else {
        const xa = x0 >= 0, xb = x0 + 1 < w, ya = y0 >= 0, yb = y0 + 1 < h;
        p00 = xa && ya ? d[y0 * w + x0] : tepi;
        p10 = xb && ya ? d[y0 * w + x0 + 1] : tepi;
        p01 = xa && yb ? d[(y0 + 1) * w + x0] : tepi;
        p11 = xb && yb ? d[(y0 + 1) * w + x0 + 1] : tepi;
      }
      const v = (p00 + (p10 - p00) * fx) * (1 - fy) + (p01 + (p11 - p01) * fx) * fy;
      out[y * w + x] = bulatkan ? keUint8(v) : v;
    }
  }
}

/** cv2.warpAffine(getRotationMatrix2D(pusat, sudut, 1)), bilinear, tepi = `tepi`. */
export function putar(g: Gray, sudut: number, tepi: number, bulatkan = true): Gray {
  const out = buatGray(g.w, g.h);
  rotasi(g, sudut, tepi, out.d, bulatkan);
  return out;
}

/**
 * cari_sudut: sudut −10°…+10° (langkah 0,5) yang membuat profil baris paling tajam.
 * Profil baris gambar terputar dihitung dengan memindahkan tiap piksel tinta ke posisinya setelah
 * rotasi (dibagi linear ke dua baris), bukan memutar seluruh gambar: setara, tetapi hanya
 * menyentuh piksel tinta (umumnya 5–15% gambar).
 */
export function cariSudut(mask: Gray): number {
  const { w, h, d } = mask;
  const cx = w / 2;
  const cy = h / 2;
  const xs: number[] = [];
  const ys: number[] = [];
  const vs: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = d[y * w + x];
      if (v) {
        xs.push(x - cx);
        ys.push(y - cy);
        vs.push(v);
      }
    }
  let terbaik = -1;
  let sudut = 0;
  const prof = new Float64Array(h);
  for (let i = 0; i <= 40; i++) {
    const a = -10 + i * 0.5;
    const t = (a * Math.PI) / 180;
    const c = Math.cos(t);
    const s = Math.sin(t);
    prof.fill(0);
    for (let k = 0; k < vs.length; k++) {
      // maju: dst = R (src - pusat) + pusat, R = [[c, s], [-s, c]] seperti getRotationMatrix2D
      const tx = c * xs[k] + s * ys[k] + cx;
      if (tx < 0 || tx > w - 1) continue;
      const ty = -s * xs[k] + c * ys[k] + cy;
      const y0 = Math.floor(ty);
      const f = ty - y0;
      if (y0 >= 0 && y0 < h) prof[y0] += vs[k] * (1 - f);
      if (y0 + 1 >= 0 && y0 + 1 < h) prof[y0 + 1] += vs[k] * f;
    }
    let mean = 0;
    for (let y = 0; y < h; y++) mean += prof[y];
    mean /= h;
    let varian = 0;
    for (let y = 0; y < h; y++) varian += (prof[y] - mean) ** 2;
    varian /= h;
    if (varian > terbaik) {
      terbaik = varian;
      sudut = a;
    }
  }
  return sudut;
}

// ---------- potong & statistik ----------

export function potong(g: Gray, x0: number, y0: number, x1: number, y1: number): Gray {
  const out = buatGray(x1 - x0, y1 - y0);
  for (let y = y0; y < y1; y++) out.d.set(g.d.subarray(y * g.w + x0, y * g.w + x1), (y - y0) * out.w);
  return out;
}

/** np.percentile (interpolasi linear). */
export function persentil(v: ArrayLike<number>, q: number): number {
  const s = Float64Array.from(v).sort();
  const pos = ((s.length - 1) * q) / 100;
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, s.length - 1);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export interface Komponen {
  x0: number;
  y0: number;
  w: number;
  h: number;
  luas: number;
}

/** cv2.connectedComponentsWithStats(…, 8) atas piksel bernilai true. `label` (opsional) diisi indeks komponen. */
export function komponenTerhubung(aktif: Uint8Array, w: number, h: number, label = new Int32Array(w * h)): Komponen[] {
  label.fill(-1);
  const hasil: Komponen[] = [];
  const tumpuk: number[] = [];
  for (let s = 0; s < aktif.length; s++) {
    if (!aktif[s] || label[s] >= 0) continue;
    const id = hasil.length;
    let [x0, y0, x1, y1, luas] = [w, h, -1, -1, 0];
    label[s] = id;
    tumpuk.push(s);
    while (tumpuk.length) {
      const p = tumpuk.pop()!;
      const x = p % w;
      const y = (p - x) / w;
      luas++;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const q = yy * w + xx;
          if (aktif[q] && label[q] < 0) {
            label[q] = id;
            tumpuk.push(q);
          }
        }
    }
    hasil.push({ x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1, luas });
  }
  return hasil;
}
