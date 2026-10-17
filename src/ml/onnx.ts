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

const cache = new Map<NamaModel, Promise<InferenceSession>>();

export const ortSiap = () => import('onnxruntime-web');

/** Membuat sesi sekali per model; WebGPU bila ada, cadangan WASM (F5). */
export function muatModel(nama: NamaModel): Promise<InferenceSession> {
  let sesi = cache.get(nama);
  if (!sesi) {
    sesi = ortSiap().then((ort) => {
      const ep = 'gpu' in navigator ? ['webgpu', 'wasm'] : ['wasm'];
      return ort.InferenceSession.create(urlModel(nama), { executionProviders: ep });
    });
    sesi.catch(() => cache.delete(nama));
    cache.set(nama, sesi);
  }
  return sesi;
}
