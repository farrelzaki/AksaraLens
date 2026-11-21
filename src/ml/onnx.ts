// Pemuatan ONNX Runtime Web. Diimpor dinamis agar tidak masuk bundle awal
// (target ≤ 500 KB gzip); hanya halaman latihan menulis dan scanner yang memuatnya.

import type { InferenceSession } from 'onnxruntime-web';

export type NamaModel = 'model1' | 'model2a' | 'model2a_r1' | 'model2v2' | 'model2b' | 'model2c';

const BERKAS: Record<NamaModel, string> = {
  model1: 'aksaralens_huruf.onnx',
  model2a: 'aksaralens_pembaca_b2r2.onnx', // pembaca B2 putaran 2 (PP-OCRv5 fine-tune + Wikisource, int8), bawaan
  model2a_r1: 'aksaralens_pembaca_b2.onnx', // pembaca B2 putaran 1: dipakai bila berkas putaran 2 belum ada / gagal dimuat
  model2v2: 'aksaralens_scanner.onnx', // pembaca CRNN v2: sakelar `?pembaca=v2` / VITE_PEMBACA=v2, dan cadangan bila B2 gagal dimuat
  model2b: 'aksaralens_detektor_pp.onnx',
  model2c: 'aksaralens_klasifikator.onnx',
};

/**
 * Lokasi file model. Produksi: bucket publik Supabase Storage lewat VITE_MODEL_URL
 * (mis. https://<proyek>.supabase.co/storage/v1/object/public/models/v1). Kosong = `public/models/` lokal.
 */
export const DASAR_MODEL = (import.meta.env.VITE_MODEL_URL as string | undefined) || '/models';

export const urlModel = (nama: NamaModel, dasar = DASAR_MODEL) => `${dasar.replace(/\/+$/, '')}/${BERKAS[nama]}`;

/**
 * Folder cadangan bila folder utama belum diunggah / gagal diunduh (mis. produksi menunjuk `.../v2`
 * padahal bucket baru berisi `.../v1`). Bisa diatur lewat VITE_MODEL_URL_CADANGAN; bila kosong dan
 * folder utama berakhiran `/vN` (N > 1), cadangannya `/v1`. Folder lama tidak pernah ditimpa, jadi aman.
 */
export const DASAR_CADANGAN: string | undefined =
  (import.meta.env.VITE_MODEL_URL_CADANGAN as string | undefined) ||
  (() => {
    const m = DASAR_MODEL.replace(/\/+$/, '').match(/^(.*\/)v(\d+)$/);
    return m && Number(m[2]) > 1 ? `${m[1]}v1` : undefined;
  })();

/** URL absolut (dasar lokal `/models` diselesaikan terhadap halaman/worker). */
const urlAbsolut = (nama: NamaModel, dasar = DASAR_MODEL) => new URL(urlModel(nama, dasar), location.href).href;

const cache = new Map<NamaModel, Promise<InferenceSession>>();

export const ortSiap = () => import('onnxruntime-web');

/** Nama Cache Storage untuk berkas model (PRD: latihan & scanner tetap jalan offline setelah tercache). */
export const CACHE_MODEL = 'aksaralens-model';

const adalahHtml = (res: Response, bytes?: Uint8Array) => {
  const ct = (res.headers.get('content-type') ?? '').toLowerCase();
  if (ct.includes('text/html') || ct.includes('application/xhtml')) return true;
  if (!bytes || bytes.length < 4) return false;
  // Tolak HTML SPA fallback (<!doctype / <html) saat berkas .onnx belum ada di public/models/
  return bytes[0] === 0x3c && (bytes[1] === 0x21 || bytes[1] === 0x68 || bytes[1] === 0x48);
};

/**
 * Bytes model: dari Cache Storage bila ada, kalau tidak diunduh lalu disimpan. URL berversi
 * (folder `v1/`), jadi isi cache tidak pernah basi; entri dengan URL lain (versi lama) dihapus.
 * Tanpa Cache Storage (mis. http non-localhost) langsung diunduh.
 */
export async function ambilModel(url: string, cadangan: string[] = []): Promise<Uint8Array> {
  const c = typeof caches === 'undefined' ? null : await caches.open(CACHE_MODEL).catch(() => null);
  let galat = 'Model gagal diunduh';
  for (const u of [url, ...cadangan]) {
    const tersimpan = await c?.match(u);
    if (tersimpan) {
      const bytesCache = new Uint8Array(await tersimpan.arrayBuffer());
      if (bytesCache.length > 0 && !adalahHtml(tersimpan, bytesCache)) return bytesCache;
      await c?.delete(u).catch(() => undefined);
    }

    const res = await fetch(u).catch(() => null);
    if (!res?.ok) {
      galat = `Model gagal diunduh (${res ? res.status : 'jaringan'})`;
      continue; // coba folder cadangan
    }
    const salinan = c ? res.clone() : null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!bytes.length || adalahHtml(res, bytes)) {
      galat = 'Berkas model .onnx tidak ditemukan';
      continue;
    }
    if (c && salinan) {
      await c.put(u, salinan).catch(() => undefined); // kuota penuh: tetap jalan tanpa cache
      const dipakai = new Set(
        (Object.keys(BERKAS) as NamaModel[]).flatMap((n) => [urlAbsolut(n), ...(DASAR_CADANGAN ? [urlAbsolut(n, DASAR_CADANGAN)] : [])]),
      );
      for (const req of await c.keys()) if (!dipakai.has(req.url)) await c.delete(req);
    }
    return bytes;
  }
  throw new Error(galat);
}

export type JenisPembaca = 'b2' | 'v2';
/** Pembaca baris yang diminta: `?pembaca=v2` (dikirim halaman ke worker) > VITE_PEMBACA > bawaan B2. */
let pembacaPaksa: JenisPembaca | undefined;
export const paksaPembaca = (p?: string) => {
  pembacaPaksa = p === 'b2' || p === 'v2' ? p : undefined;
};
export const pembacaDiminta = (): JenisPembaca =>
  pembacaPaksa ?? ((import.meta.env.VITE_PEMBACA as string | undefined) === 'v2' ? 'v2' : 'b2');

/** Penyedia eksekusi yang dipaksa lewat `?ep=wasm|webgpu` (diagnosis kecepatan di ponsel); kosong = otomatis. */
let epPaksa: string | undefined;
export const paksaEp = (ep?: string) => {
  epPaksa = ep === 'wasm' || ep === 'webgpu' ? ep : undefined;
};
const pilihEp = () => (epPaksa ? (epPaksa === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm']) : 'gpu' in navigator ? ['webgpu', 'wasm'] : ['wasm']);
export const infoOrt = () => ({ ep: pilihEp()[0], terisolasi: self.crossOriginIsolated, inti: navigator.hardwareConcurrency });

let antreanSesi: Promise<void> = Promise.resolve();

/** Membuat sesi sekali per model; WebGPU bila ada, cadangan WASM (F5). */
export function muatModel(nama: NamaModel): Promise<InferenceSession> {
  let sesi = cache.get(nama);
  if (!sesi) {
    sesi = Promise.all([ortSiap(), ambilModel(urlAbsolut(nama), DASAR_CADANGAN ? [urlAbsolut(nama, DASAR_CADANGAN)] : [])]).then(([ort, bytes]) => {
      // Pembaca B2 (int8 QDQ) selalu WASM: kernel MaxPool WebGPU belum mendukung ceil_mode, dan jalur int8 cepat ada di WASM.
      // Sesi dibuat bergiliran: inisialisasi backend berbeda secara bersamaan memicu "multiple calls to initWasm()".
      const buat = antreanSesi.then(() =>
        ort.InferenceSession.create(bytes, { executionProviders: nama.startsWith('model2a') ? ['wasm'] : pilihEp() }),
      );
      antreanSesi = buat.then(() => undefined, () => undefined);
      return buat;
    });
    sesi.catch(() => cache.delete(nama));
    cache.set(nama, sesi);
  }
  return sesi;
}
