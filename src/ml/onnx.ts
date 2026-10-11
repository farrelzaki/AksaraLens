// Pemuatan ONNX Runtime Web. Diimpor dinamis agar tidak masuk bundle awal
// (target ≤ 500 KB gzip); hanya halaman latihan menulis dan scanner yang memuatnya.

import type { InferenceSession } from 'onnxruntime-web';

export type NamaModel = 'model1' | 'model2a' | 'model2b';

const BERKAS: Record<NamaModel, string> = {
  model1: '/models/model1.onnx',
  model2a: '/models/model2a.onnx',
  model2b: '/models/model2b.onnx',
};

const cache = new Map<NamaModel, Promise<InferenceSession>>();

export const ortSiap = () => import('onnxruntime-web');

/** Membuat sesi sekali per model; WebGPU bila ada, cadangan WASM (F5). */
export function muatModel(nama: NamaModel): Promise<InferenceSession> {
  let sesi = cache.get(nama);
  if (!sesi) {
    sesi = ortSiap().then((ort) => {
      const ep = 'gpu' in navigator ? ['webgpu', 'wasm'] : ['wasm'];
      return ort.InferenceSession.create(BERKAS[nama], { executionProviders: ep });
    });
    sesi.catch(() => cache.delete(nama));
    cache.set(nama, sesi);
  }
  return sesi;
}
