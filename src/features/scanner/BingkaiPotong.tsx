import { useRef } from 'react';
import { ubahBingkai, type Pegangan } from '../../ml/model2/bingkai';
import type { Bingkai } from '../../ml/model2/scanner';

// F5 langkah 2 "Atur area": pratinjau foto + bingkai yang bisa digeser dan ditarik di keempat sudut.
// Fungsional dulu; tampilan final: Choirun. Area sentuh pegangan 44 px (PRD aksesibilitas).

const SUDUT: Exclude<Pegangan, 'geser'>[] = ['kiri-atas', 'kanan-atas', 'kiri-bawah', 'kanan-bawah'];

export function BingkaiPotong({ src, nilai, onUbah }: { src: string; nilai: Bingkai; onUbah: (b: Bingkai) => void }) {
  const wadah = useRef<HTMLDivElement>(null);
  const tarik = useRef<{ pegangan: Pegangan; x: number; y: number; awal: Bingkai } | null>(null);

  const mulai = (pegangan: Pegangan) => (e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // tanpa capture tetap jalan selama pointer berada di atas bingkai
    }
    tarik.current = { pegangan, x: e.clientX, y: e.clientY, awal: nilai };
  };
  const gerak = (e: React.PointerEvent) => {
    const t = tarik.current;
    const kotak = wadah.current?.getBoundingClientRect();
    if (!t || !kotak) return;
    onUbah(ubahBingkai(t.awal, t.pegangan, (e.clientX - t.x) / kotak.width, (e.clientY - t.y) / kotak.height));
  };
  const selesai = () => (tarik.current = null);

  const persen = (v: number) => `${v * 100}%`;

  return (
    <div ref={wadah} style={{ position: 'relative', overflow: 'hidden', touchAction: 'none', userSelect: 'none' }}>
      <img src={src} alt="Pratinjau foto" style={{ display: 'block', width: '100%' }} draggable={false} />
      <div
        role="group"
        aria-label="Area yang dibaca. Geser untuk memindah, tarik sudut untuk mengubah ukuran."
        onPointerDown={mulai('geser')}
        onPointerMove={gerak}
        onPointerUp={selesai}
        onPointerCancel={selesai}
        style={{
          position: 'absolute',
          left: persen(nilai.x),
          top: persen(nilai.y),
          width: persen(nilai.w),
          height: persen(nilai.h),
          border: '2px solid #fff',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
          cursor: 'move',
        }}
      >
        {SUDUT.map((s) => (
          <div
            key={s}
            aria-hidden
            onPointerDown={mulai(s)}
            onPointerMove={gerak}
            onPointerUp={selesai}
            onPointerCancel={selesai}
            style={{
              position: 'absolute',
              width: 44,
              height: 44,
              [s.startsWith('kiri') ? 'left' : 'right']: -22,
              [s.endsWith('atas') ? 'top' : 'bottom']: -22,
              cursor: s === 'kiri-atas' || s === 'kanan-bawah' ? 'nwse-resize' : 'nesw-resize',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <span style={{ width: 14, height: 14, background: '#fff', borderRadius: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
