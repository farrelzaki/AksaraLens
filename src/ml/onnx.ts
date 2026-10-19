// Pemuatan ONNX Runtime Web. Diimpor dinamis agar tidak masuk bundle awal
// (target ≤ 500 KB gzip); hanya halaman latihan menulis dan scanner yang memuatnya.

import type { InferenceSession } from 'onnxruntime-web';

export type NamaModel = 'model1' | 'model2a' | 'model2b';

const BERKAS: Record<NamaModel, string> = {
  model1: 'aksaralens_huruf.onnx',
  model2a: 'aksaralens_scanner.onnx',
  model2b: 'aksaralens_detektor_baris.onnx',
};

/**
 * Lokasi file model. Produksi: bucket publik Supabase Storage lewat VITE_MODEL_URL
 * (mis. https://<proyek>.supabase.co/storage/v1/object/public/models/v1). Kosong = `public/models/` lokal.
 */
export const DASAR_MODEL = (import.meta.env.VITE_MODEL_URL as string | undefined) || '/models';

export const urlModel = (nama: NamaModel, dasar = DASAR_MODEL) => `${dasar.replace(/\/+$/, '')}/${BERKAS[nama]}`;

/** URL absolut (dasar lokal `/models` diselesaikan terhadap halaman/worker). */
const urlAbsolut = (nama: NamaModel) => new URL(urlModel(nama), location.href).href;

const cache = new Map<NamaModel, Promise<InferenceSession>>();

export const ortSiap = () => import('onnxruntime-web');

/** Nama Cache Storage untuk berkas model (PRD: latihan & scanner tetap jalan offline setelah tercache). */
export const CACHE_MODEL = 'aksaralens-model';

/**
 * Bytes model: dari Cache Storage bila ada, kalau tidak diunduh lalu disimpan. URL berversi
 * (folder `v1/`), jadi isi cache tidak pernah basi; entri dengan URL lain (versi lama) dihapus.
 * Tanpa Cache Storage (mis. http non-localhost) langsung diunduh.
 */
export async function ambilModel(url: string): Promise<Uint8Array> {
  const c = typeof caches === 'undefined' ? null : await caches.open(CACHE_MODEL).catch(() => null);
  const tersimpan = await c?.match(url);
  if (tersimpan) return new Uint8Array(await tersimpan.arrayBuffer());

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Model gagal diunduh (${res.status})`);
  if (c) {
    await c.put(url, res.clone()).catch(() => undefined); // kuota penuh: tetap jalan tanpa cache
    const dipakai = new Set((Object.keys(BERKAS) as NamaModel[]).map(urlAbsolut));
    for (const req of await c.keys()) if (!dipakai.has(req.url)) await c.delete(req);
  }
  return new Uint8Array(await res.arrayBuffer());
}

/** Membuat sesi sekali per model; WebGPU bila ada, cadangan WASM (F5). */
export function muatModel(nama: NamaModel): Promise<InferenceSession> {
  let sesi = cache.get(nama);
  if (!sesi) {
    sesi = Promise.all([ortSiap(), ambilModel(urlAbsolut(nama))]).then(([ort, bytes]) => {
      const ep = 'gpu' in navigator ? ['webgpu', 'wasm'] : ['wasm'];
      return ort.InferenceSession.create(bytes, { executionProviders: ep });
    });
    sesi.catch(() => cache.delete(nama));
    cache.set(nama, sesi);
  }
  return sesi;
}
