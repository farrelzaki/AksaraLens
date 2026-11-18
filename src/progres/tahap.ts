import { TAHAP } from '../content/tahap';
import type { StatusTitik } from './model';

/** Tahap dibuka berurutan di dalam tiap bab: tahap pertama tiap bab terbuka, tahap berikutnya terbuka setelah tahap sebelumnya selesai. */
export function statusTahap(selesai: ReadonlySet<string>): Map<string, StatusTitik> {
  const status = new Map<string, StatusTitik>();
  for (const bab of [1, 2, 3] as const) {
    let sebelumnyaSelesai = true;
    for (const t of TAHAP.filter((x) => x.bab === bab)) {
      const s: StatusTitik = selesai.has(t.id) ? 'selesai' : sebelumnyaSelesai ? 'terbuka' : 'terkunci';
      status.set(t.id, s);
      sebelumnyaSelesai = s === 'selesai';
    }
  }
  return status;
}
