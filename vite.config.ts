import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// 1. Sinkronisasi aset otomatis ke public/assets saat Vite dimulai
function syncDesignAssets() {
  const sourceDir = path.resolve(currentDir, 'design/assets-csv');
  const destDir = path.resolve(currentDir, 'public/assets');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const srcFile = path.join(sourceDir, file);
      if (fs.statSync(srcFile).isFile()) {
        const destFile = path.join(destDir, file);
        if (!fs.existsSync(destFile)) {
          try {
            fs.copyFileSync(srcFile, destFile);
          } catch {}
        }
        // Salin versi spasi tunggal jika ada spasi ganda
        const singleSpaceName = file.replace(/\s+/g, ' ');
        if (singleSpaceName !== file) {
          const destSingle = path.join(destDir, singleSpaceName);
          if (!fs.existsSync(destSingle)) {
            try {
              fs.copyFileSync(srcFile, destSingle);
            } catch {}
          }
        }
      }
    }
  }
}

try {
  syncDesignAssets();
} catch (e) {
  console.warn('Sync assets warning:', e);
}

// 2. Plugin Vite untuk melayani langsung aset dari design/assets-csv jika diperlukan
function serveDesignAssets(): Plugin {
  const assetsDir = path.resolve(currentDir, 'design/assets-csv');
  return {
    name: 'serve-design-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const rawFileName = decodeURIComponent(req.url?.slice(1) ?? '');
        let filePath = path.join(assetsDir, rawFileName);

        if (!fs.existsSync(filePath) && fs.existsSync(assetsDir)) {
          const normalized = rawFileName.replace(/\s+/g, ' ').toLowerCase();
          const found = fs.readdirSync(assetsDir).find((f) => f.replace(/\s+/g, ' ').toLowerCase() === normalized);
          if (found) {
            filePath = path.join(assetsDir, found);
          }
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
          };
          res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveDesignAssets()],
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  worker: { format: 'es' },
  test: { environment: 'node' },
});
