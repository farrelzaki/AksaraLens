import { useEffect, useRef, useState } from 'react';
import { skeleton } from '../../ml/model1/praproses';

interface AnimasiCaraMenulisProps {
  aksara: string;
  putarKey: number;
  autoPlay?: boolean;
  compact?: boolean;
  onSelesai?: () => void;
}

interface TitikGores {
  x: number;
  y: number;
}

interface PetaGoresan {
  alpha: Uint8Array;
  timeMap: Int32Array;
  pts: TitikGores[];
}

const W = 240;
const H = 180;

function bangunPetaGoresan(aksara: string): PetaGoresan {
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const ctx = off.getContext('2d');
  if (!ctx) {
    return {
      alpha: new Uint8Array(W * H),
      timeMap: new Int32Array(W * H).fill(-1),
      pts: [],
    };
  }

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = aksara.length > 2 ? 96 : 112;
  ctx.font = `400 ${fontSize}px "Noto Sans Javanese", sans-serif`;
  ctx.fillText(aksara, W / 2, H / 2 + 4);

  const img = ctx.getImageData(0, 0, W, H).data;
  const alpha = new Uint8Array(W * H);
  const m = new Uint8Array(W * H);

  for (let i = 0; i < W * H; i++) {
    const a = img[i * 4 + 3];
    alpha[i] = a;
    m[i] = a > 48 ? 1 : 0;
  }

  const skel = skeleton(m, W, H);
  const visitedComp = new Uint8Array(W * H);
  const components: number[][] = [];

  const dirs = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (skel[idx] === 1 && visitedComp[idx] === 0) {
        const comp: number[] = [];
        const q: number[] = [idx];
        visitedComp[idx] = 1;
        while (q.length > 0) {
          const curr = q.pop()!;
          comp.push(curr);
          const cx = curr % W;
          const cy = (curr - cx) / W;
          for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
              const nIdx = ny * W + nx;
              if (skel[nIdx] === 1 && visitedComp[nIdx] === 0) {
                visitedComp[nIdx] = 1;
                q.push(nIdx);
              }
            }
          }
        }
        if (comp.length >= 2) {
          components.push(comp);
        }
      }
    }
  }

  // Urutkan komponen dari kiri ke kanan sesuai arah menulis aksara Jawa
  components.sort((a, b) => {
    let minXa = W;
    let minXb = W;
    for (const idx of a) {
      const x = idx % W;
      if (x < minXa) minXa = x;
    }
    for (const idx of b) {
      const x = idx % W;
      if (x < minXb) minXb = x;
    }
    return minXa - minXb;
  });

  const rawPts: TitikGores[] = [];

  for (const comp of components) {
    // Cari titik awal terbaik: ujung paling kiri (prioritaskan endpoint derajat 1)
    let startIdx = comp[0];
    let bestScore = Infinity;

    for (const idx of comp) {
      const x = idx % W;
      const y = (idx - x) / W;
      let deg = 0;
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && skel[ny * W + nx] === 1) {
          deg++;
        }
      }
      const score = x * 2.0 + y * 0.35 - (deg === 1 ? 65 : 0);
      if (score < bestScore) {
        bestScore = score;
        startIdx = idx;
      }
    }

    const unvisited = new Set<number>(comp);
    let curr = startIdx;
    unvisited.delete(curr);
    let vx = 0;
    let vy = 0;

    rawPts.push({ x: curr % W, y: Math.floor(curr / W) });

    while (unvisited.size > 0) {
      const cx = curr % W;
      const cy = (curr - cx) / W;

      let nextIdx = -1;
      let bestNeighborScore = -Infinity;

      // Utamakan tetangga langsung (radius 1) terlebih dahulu agar garis tidak melompat
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        const cand = ny * W + nx;
        if (!unvisited.has(cand)) continue;
        const dist = Math.hypot(dx, dy);
        const dot = vx === 0 && vy === 0 ? 0 : (dx * vx + dy * vy) / dist;
        const sc = dot * 3.0 - dist * 0.9;
        if (sc > bestNeighborScore) {
          bestNeighborScore = sc;
          nextIdx = cand;
        }
      }

      // Cadangan radius 2 bila putus 1 piksel
      if (nextIdx === -1) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            const cand = ny * W + nx;
            if (!unvisited.has(cand)) continue;
            const dist = Math.hypot(dx, dy);
            const dot = vx === 0 && vy === 0 ? 0 : (dx * vx + dy * vy) / dist;
            const sc = dot * 2.5 - dist * 1.4;
            if (sc > bestNeighborScore) {
              bestNeighborScore = sc;
              nextIdx = cand;
            }
          }
        }
      }

      // Bila ujung cabang habis, lompat ke segmen belum dikunjungi terdekat
      if (nextIdx === -1) {
        let minDist = Infinity;
        for (const cand of unvisited) {
          const nx = cand % W;
          const ny = (cand - nx) / W;
          const d = Math.hypot(nx - cx, ny - cy) + (nx - cx) * 0.15;
          if (d < minDist) {
            minDist = d;
            nextIdx = cand;
          }
        }
      }

      const nx = nextIdx % W;
      const ny = (nextIdx - nx) / W;
      const stepDist = Math.hypot(nx - cx, ny - cy);
      if (stepDist > 0 && stepDist <= 3) {
        vx = (nx - cx) / stepDist;
        vy = (ny - cy) / stepDist;
      } else {
        vx = 0;
        vy = 0;
      }

      unvisited.delete(nextIdx);
      curr = nextIdx;
      rawPts.push({ x: nx, y: ny });
    }
  }

  // Subsample titik agar kecepatan goresan pensil konstan dan mulus
  const pts: TitikGores[] = [];
  for (let i = 0; i < rawPts.length; i++) {
    if (
      i === 0 ||
      i === rawPts.length - 1 ||
      Math.hypot(rawPts[i].x - pts[pts.length - 1].x, rawPts[i].y - pts[pts.length - 1].y) >= 1.8
    ) {
      pts.push(rawPts[i]);
    }
  }

  const timeMap = new Int32Array(W * H).fill(-1);
  if (pts.length > 0) {
    const queue = new Int32Array(W * H);
    let head = 0;
    let tail = 0;

    for (let i = 0; i < pts.length; i++) {
      const idx = Math.round(pts[i].y) * W + Math.round(pts[i].x);
      if (timeMap[idx] === -1) {
        timeMap[idx] = i;
        queue[tail++] = idx;
      }
    }

    while (head < tail) {
      const curr = queue[head++];
      const tVal = timeMap[curr];
      const cx = curr % W;
      const cy = (curr - cx) / W;

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
          const nIdx = ny * W + nx;
          if (alpha[nIdx] > 8 && timeMap[nIdx] === -1) {
            timeMap[nIdx] = tVal;
            queue[tail++] = nIdx;
          }
        }
      }
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        if (alpha[idx] > 8 && timeMap[idx] === -1) {
          let bestK = 0;
          let bestD = Infinity;
          for (let k = 0; k < pts.length; k++) {
            const d = (pts[k].x - x) ** 2 + (pts[k].y - y) ** 2;
            if (d < bestD) {
              bestD = d;
              bestK = k;
            }
          }
          timeMap[idx] = bestK;
        }
      }
    }
  }

  return { alpha, timeMap, pts };
}

export function AnimasiCaraMenulis({
  aksara,
  putarKey,
  autoPlay = false,
  compact = false,
  onSelesai,
}: AnimasiCaraMenulisProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onSelesaiRef = useRef(onSelesai);
  onSelesaiRef.current = onSelesai;

  const [posisiPensil, setPosisiPensil] = useState<TitikGores | null>(null);

  useEffect(() => {
    let batal = false;
    let rafId = 0;

    const jalankan = async () => {
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Abaikan jika Font Loading API tidak tersedia
        }
      }
      if (batal) return;

      const peta = bangunPetaGoresan(aksara);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const lukisFrame = (stepMax: number, sedangAktif: boolean) => {
        const imgData = ctx.createImageData(W, H);
        const data = imgData.data;
        const { alpha, timeMap } = peta;

        for (let i = 0; i < W * H; i++) {
          const a = alpha[i];
          if (a <= 8) continue;
          const t = timeMap[i];
          const terisi = t !== -1 && t <= stepMax;
          const sedangDiUjung = sedangAktif && terisi && stepMax - t <= 4;

          const p = i * 4;
          if (sedangDiUjung) {
            data[p] = 78;
            data[p + 1] = 96;
            data[p + 2] = 43;
            data[p + 3] = a;
          } else if (terisi) {
            data[p] = 58;
            data[p + 1] = 35;
            data[p + 2] = 21;
            data[p + 3] = a;
          } else {
            // Aksara transparan yang ikut terisi seiring jalannya animasi
            data[p] = 58;
            data[p + 1] = 35;
            data[p + 2] = 21;
            data[p + 3] = Math.round(a * 0.22);
          }
        }
        ctx.putImageData(imgData, 0, 0);
      };

      const totalPts = peta.pts.length;
      const harusAnimasi = (putarKey > 0 || autoPlay) && totalPts > 1;

      if (!harusAnimasi) {
        lukisFrame(totalPts, false);
        setPosisiPensil(null);
        return;
      }

      const durasiMs = Math.max(1750, Math.min(2700, totalPts * 16));
      const mulai = performance.now();

      const tick = (now: number) => {
        if (batal) return;
        const elapsed = now - mulai;
        const prog = Math.min(1, elapsed / durasiMs);
        const eased = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
        const idx = Math.min(totalPts - 1, Math.floor(eased * (totalPts - 1)));

        lukisFrame(idx, prog < 1);

        if (prog < 1) {
          const p0 = peta.pts[Math.max(0, idx - 1)];
          const p1 = peta.pts[idx];
          const p2 = peta.pts[Math.min(totalPts - 1, idx + 1)];
          setPosisiPensil({
            x: (p0.x + p1.x * 2 + p2.x) / 4,
            y: (p0.y + p1.y * 2 + p2.y) / 4,
          });
          rafId = requestAnimationFrame(tick);
        } else {
          lukisFrame(totalPts, false);
          setPosisiPensil(null);
          if (onSelesaiRef.current) onSelesaiRef.current();
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    void jalankan();

    return () => {
      batal = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [aksara, putarKey, autoPlay]);

  return (
    <div
      className={`cara-menulis-stage ${compact ? 'is-compact' : ''}`}
      aria-label={`Animasi cara menulis aksara ${aksara}`}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="cara-menulis-canvas"
      />
      {posisiPensil && (
        <div
          className="cara-menulis-pencil"
          style={{
            left: `${(posisiPensil.x / W) * 100}%`,
            top: `${(posisiPensil.y / H) * 100}%`,
          }}
          aria-hidden="true"
        >
          <span className="cara-menulis-nib-glow" />
          <svg
            width="38"
            height="38"
            viewBox="0 0 38 38"
            fill="none"
            className="cara-menulis-pencil-svg"
          >
            {/* Ujung pensil tepat pada (2, 36) agar menempel presisi dengan goresan */}
            <g transform="translate(2, 36) rotate(-42)">
              <polygon points="0,0 5,-2.2 5,2.2" fill="#2A1810" />
              <polygon
                points="5,-2.2 11,-4.8 11,4.8 5,2.2"
                fill="#F3D2A2"
                stroke="#3A2315"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <rect
                x="11"
                y="-4.8"
                width="20"
                height="9.6"
                rx="1"
                fill="#F2C14E"
                stroke="#3A2315"
                strokeWidth="1.3"
              />
              <line x1="11" y1="-1.6" x2="31" y2="-1.6" stroke="#D9A436" strokeWidth="1" />
              <line x1="11" y1="1.6" x2="31" y2="1.6" stroke="#D9A436" strokeWidth="1" />
              <rect
                x="31"
                y="-4.8"
                width="4"
                height="9.6"
                fill="#E6DFD5"
                stroke="#3A2315"
                strokeWidth="1.2"
              />
              <rect
                x="35"
                y="-4.8"
                width="5.5"
                height="9.6"
                rx="2.4"
                fill="#D58B94"
                stroke="#3A2315"
                strokeWidth="1.2"
              />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
