import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // onnxruntime-web membawa berkas .wasm sendiri; jangan di-prebundle.
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  // worker scanner memuat onnxruntime-web secara dinamis; butuh worker ES module
  worker: { format: 'es' },
  test: { environment: 'node' },
});
