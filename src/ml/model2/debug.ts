// Diagnosis kecepatan di ponsel: `?debug` menampilkan rincian waktu scan di atas halaman; `?ep=wasm|webgpu` memaksa penyedia eksekusi.
import type { HasilScan } from './scan';

export function tampilDebug(info: HasilScan['info']) {
  let el = document.getElementById('scan-debug');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'scan-debug';
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;margin:0;padding:6px;background:#000c;color:#0f0;font:11px/1.3 monospace;white-space:pre-wrap;word-break:break-all;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = `total ${Math.round(info.waktuMs)} ms
${JSON.stringify(info.tahap)}`;
}
