import { TAHAP } from '../content/tahap';
import type { StatusTitik } from './model';

/** Tahap dibuka berurutan dari Bab 1 ke Bab 3: tahap berikutnya (termasuk bab selanjutnya) terbuka setelah tahap sebelumnya selesai. */
export function statusTahap(selesai: ReadonlySet<string>): Map<string, StatusTitik> {
  const status = new Map<string, StatusTitik>();
  let sebelumnyaSelesai = true;
  for (const t of TAHAP) {
    const s: StatusTitik = selesai.has(t.id) ? 'selesai' : sebelumnyaSelesai ? 'terbuka' : 'terkunci';
    status.set(t.id, s);
    sebelumnyaSelesai = s === 'selesai';
  }
  return status;
}
