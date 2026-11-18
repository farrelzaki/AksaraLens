import type { CSSProperties } from 'react';
import type { JenisTahap } from '../../content/tahap';
import { MaskotPerjalanan, UKURAN_MASKOT, type AktivitasAksa } from '../../app/MaskotPerjalanan';
import './roadmap.css';

/**
 * Lapisan dekoratif roadmap "Perjalanan belajar" (MateriBabPage).
 * - Tidak mengubah layout: digambar absolut di atas kanvas 366 × 740 yang sama dengan node.
 * - Mengikuti progres: tiap tikungan jalur punya pohon bunga yang tumbuh (bibit → rimbun → mekar)
 *   setelah tahap sebelumnya selesai; bunga di samping node mekar saat tahapnya selesai;
 *   maskot Aksa berdiri di node aktif dan melakukan aktivitas tahap itu, lalu merayakan di garis akhir.
 * - Murni hiasan: aria-hidden + pointer-events: none, node tetap bisa diklik.
 */

type StatusNode = 'selesai' | 'terbuka' | 'terkunci';

export interface NodeRoadmap {
  cx: number;
  cy: number;
  status: StatusNode;
  jenis?: JenisTahap;
}

interface Props {
  bab: 1 | 2 | 3;
  nodes: NodeRoadmap[];
  /** Index node yang sedang aktif (sama dengan penanda "MULAI DI SINI"/"LANJUTKAN"); -1 bila tidak ada. */
  indexAktif: number;
}

interface Tema {
  kelopak: string;
  putik: string;
  bunga: [string, string, string];
  tanah: string;
  kupu: string;
  bendera: string;
}

// Warna turunan token bab (docs/DESIGN_SYSTEM.md, src/app/tokens.css)
const TEMA: Record<1 | 2 | 3, Tema> = {
  // Bab 1: kamboja putih-kuning di taman sage
  1: { kelopak: '#FFFFFF', putik: '#FFD263', bunga: ['#FFFFFF', '#FFD263', '#F3C9BE'], tanah: '#E7EDDA', kupu: '#EE851B', bendera: '#9CAF6C' },
  // Bab 2: bunga kuning keemasan
  2: { kelopak: '#FFD263', putik: '#EE851B', bunga: ['#FFD263', '#FFFFFF', '#F7B45C'], tanah: '#F2ECD8', kupu: '#BBA4EF', bendera: '#FFD263' },
  // Bab 3: bunga ungu lembut
  3: { kelopak: '#BBA4EF', putik: '#FFFBEA', bunga: ['#BBA4EF', '#FFFFFF', '#D9CBF7'], tanah: '#EEE8F6', kupu: '#FFD263', bendera: '#BBA4EF' },
};

const DAUN = ['#7C9150', '#8FA55B', '#9CAF6C', '#AFC27E'];
const BATANG = '#8C5426';

type TahapPohon = 'bibit' | 'rimbun' | 'mekar';

/** Pohon di tiap tikungan: mekar bila tahap ke-`ambang` sudah selesai, rimbun satu langkah sebelumnya. */
function tahapPohon(selesai: number, ambang: number): TahapPohon {
  if (selesai >= ambang) return 'mekar';
  if (selesai >= ambang - 1) return 'rimbun';
  return 'bibit';
}

const tunda = (detik: number): CSSProperties => ({ animationDelay: `${detik}s` });

/** Bunga lima kelopak (dipakai di tajuk pohon dan bunga tangkai). */
function Kembang({ x, y, r, kelopak, putik }: { x: number; y: number; r: number; kelopak: string; putik: string }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={x + Math.cos(a) * r * 0.82}
            cy={y + Math.sin(a) * r * 0.82}
            r={r * 0.62}
            fill={kelopak}
            stroke="rgba(77, 52, 35, 0.14)"
            strokeWidth="0.6"
          />
        );
      })}
      <circle cx={x} cy={y} r={r * 0.42} fill={putik} />
    </g>
  );
}

function Pohon({ x, y, skala, tahap, tema, delay }: { x: number; y: number; skala: number; tahap: TahapPohon; tema: Tema; delay: number }) {
  const posisiKembang: [number, number][] = [
    [-20, -47], [-6, -66], [11, -60], [21, -44], [-9, -39], [4, -50], [-19, -61], [16, -31], [-24, -34],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${skala})`}>
      <ellipse cx="0" cy="1" rx="34" ry="6" fill={tema.tanah} />
      {tahap === 'bibit' ? (
        <g className="rm-goyang" style={tunda(delay)}>
          <path d="M0 0 C0 -7 1 -13 0 -20" stroke={BATANG} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M0 -12 C-8 -13 -12 -19 -11 -24 C-4 -23 -1 -18 0 -12 Z" fill={DAUN[2]} />
          <path d="M0 -17 C7 -19 11 -25 10 -29 C3 -28 0 -23 0 -17 Z" fill={DAUN[1]} />
        </g>
      ) : (
        <>
          <path d="M-5 0 C-4 -12 -4 -22 -2 -34 L2 -34 C4 -22 4 -12 5 0 Z" fill={BATANG} />
          <path d="M0 -24 C6 -28 10 -32 12 -38" stroke={BATANG} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M0 -20 C-6 -23 -9 -27 -11 -32" stroke={BATANG} strokeWidth="2.2" strokeLinecap="round" />
          <g className="rm-goyang" style={tunda(delay)}>
            <circle cx="0" cy="-40" r="19" fill={DAUN[0]} />
            <circle cx="-15" cy="-46" r="16" fill={DAUN[1]} />
            <circle cx="15" cy="-46" r="16" fill={DAUN[1]} />
            <circle cx="0" cy="-58" r="19" fill={DAUN[2]} />
            <circle cx="-7" cy="-63" r="9" fill={DAUN[3]} />
            <circle cx="-9" cy="-66" r="4" fill="#FFFFFF" opacity="0.25" />
            {tahap === 'rimbun' &&
              posisiKembang.slice(0, 4).map(([kx, ky], i) => (
                <circle key={i} cx={kx} cy={ky} r="2.4" fill={tema.kelopak} stroke="rgba(77,52,35,0.18)" strokeWidth="0.6" />
              ))}
            {tahap === 'mekar' && (
              <g className="rm-mekar">
                {posisiKembang.map(([kx, ky], i) => (
                  <Kembang key={i} x={kx} y={ky} r={i % 3 === 0 ? 4.6 : 3.8} kelopak={tema.kelopak} putik={tema.putik} />
                ))}
              </g>
            )}
          </g>
          {tahap === 'mekar' && (
            <>
              <ellipse className="rm-kelopak-jatuh" style={tunda(delay)} cx="-14" cy="-30" rx="2.6" ry="1.6" fill={tema.kelopak} stroke="rgba(77,52,35,0.18)" strokeWidth="0.5" />
              <ellipse className="rm-kelopak-jatuh" style={tunda(delay + 1.7)} cx="16" cy="-26" rx="2.6" ry="1.6" fill={tema.kelopak} stroke="rgba(77,52,35,0.18)" strokeWidth="0.5" />
            </>
          )}
        </>
      )}
    </g>
  );
}

type TahapBunga = 'tunas' | 'kuncup' | 'mekar';

function Bunga({ x, y, tahap, warna, putik, tinggi, delay }: { x: number; y: number; tahap: TahapBunga; warna: string; putik: string; tinggi: number; delay: number }) {
  const t = tahap === 'tunas' ? tinggi * 0.45 : tinggi;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="rm-goyang" style={tunda(delay)}>
        <path d={`M0 0 Q1.5 ${-t / 2} 0 ${-t}`} stroke="#7C9150" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M0 -3 C4 -5 7 -8 7 -10 C3 -10 1 -7 0 -3 Z" fill={DAUN[2]} />
        {tahap !== 'tunas' && <path d="M0 -6 C-4 -8 -6 -11 -6 -13 C-2 -12 0 -9 0 -6 Z" fill={DAUN[1]} />}
        {tahap === 'tunas' && <path d="M0 -3 C-4 -5 -6 -7 -6 -9 C-2 -8 0 -6 0 -3 Z" fill={DAUN[1]} />}
        {tahap === 'kuncup' && (
          <g>
            <ellipse cx="0" cy={-t - 3} rx="3" ry="4.4" fill={warna} stroke="rgba(77,52,35,0.2)" strokeWidth="0.6" />
            <path d={`M-3 ${-t - 1} Q0 ${-t + 2} 3 ${-t - 1}`} fill={DAUN[1]} />
          </g>
        )}
        {tahap === 'mekar' && (
          <g className="rm-mekar">
            <Kembang x={0} y={-t - 2} r={4.8} kelopak={warna} putik={putik} />
          </g>
        )}
      </g>
    </g>
  );
}

function Rumput({ x, y, skala, warna, delay }: { x: number; y: number; skala: number; warna: string; delay: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${skala})`}>
      <path
        className="rm-goyang rm-goyang-cepat"
        style={tunda(delay)}
        d="M-8 0 C-7 -5 -6 -8 -4 -11 C-3 -6 -2 -3 -1 0 C0 -5 1 -10 3 -14 C3.6 -8 4 -4 5 0 C6 -4 8 -7 10 -9 C9 -5 8.4 -2 8 0 Z"
        fill={warna}
      />
    </g>
  );
}

function KupuKupu({ x, y, warna, delay }: { x: number; y: number; warna: string; delay: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="rm-kupu" style={tunda(delay)}>
        <g className="rm-sayap">
          <ellipse cx="-3.6" cy="-2" rx="4" ry="3.2" fill={warna} stroke="rgba(77,52,35,0.35)" strokeWidth="0.6" />
          <ellipse cx="3.6" cy="-2" rx="4" ry="3.2" fill={warna} stroke="rgba(77,52,35,0.35)" strokeWidth="0.6" />
          <ellipse cx="-2.6" cy="2.4" rx="2.6" ry="2.2" fill={warna} stroke="rgba(77,52,35,0.35)" strokeWidth="0.6" />
          <ellipse cx="2.6" cy="2.4" rx="2.6" ry="2.2" fill={warna} stroke="rgba(77,52,35,0.35)" strokeWidth="0.6" />
        </g>
        <path d="M0 -4 L0 4.5" stroke="#4D3423" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Kilau({ x, y, r, warna, delay }: { x: number; y: number; r: number; warna: string; delay: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        className="rm-kilau-latar"
        style={tunda(delay)}
        d={`M0 ${-r} L${r * 0.28} ${-r * 0.28} L${r} 0 L${r * 0.28} ${r * 0.28} L0 ${r} L${-r * 0.28} ${r * 0.28} L${-r} 0 L${-r * 0.28} ${-r * 0.28} Z`}
        fill={warna}
      />
    </g>
  );
}

/*
 * Catatan koordinat: angka cx/cy node adalah titik di garis jalur. Lingkaran node tampil ±25px
 * lebih tinggi (spot node ikut menghitung label saat translate(-50%, -50%)), badge
 * "MULAI DI SINI/LANJUTKAN" mengisi bagian dalam tikungan, dan label berada di cy+27..cy+77.
 * Karena itu dekorasi ditaruh di margin luar jalur (x < 46 dan x > 318), bukan di dalam tikungan.
 */

// Rumpun rumput di ruang kosong kanvas 366 × 740
const RUMPUT: [number, number, number][] = [
  [196, 60, 0.8], [270, 55, 0.9], [326, 62, 0.7], [362, 60, 0.65],
  [356, 196, 0.75], [8, 244, 0.7], [44, 246, 0.65], [326, 334, 0.7], [362, 332, 0.65],
  [14, 330, 0.9], [348, 356, 0.85], [338, 424, 0.8], [8, 504, 0.7], [44, 506, 0.65],
  [16, 520, 0.9], [14, 566, 0.8],
  [40, 714, 1], [112, 724, 0.9], [190, 708, 0.85], [228, 724, 0.9], [358, 726, 0.8],
];

/** Pohon bunga di margin luar, berurutan dari atas; ambang = jumlah tahap selesai agar mekar. */
const POHON: { x: number; y: number; skala: number; ambang: number }[] = [
  { x: 342, y: 58, skala: 0.62, ambang: 1 },
  { x: 24, y: 240, skala: 0.62, ambang: 2 },
  { x: 342, y: 328, skala: 0.62, ambang: 3 },
  { x: 24, y: 500, skala: 0.62, ambang: 4 },
];

const KUPU: { x: number; y: number; ambang: number }[] = [
  { x: 304, y: 30, ambang: 1 },
  { x: 66, y: 186, ambang: 2 },
  { x: 308, y: 298, ambang: 3 },
  { x: 66, y: 440, ambang: 4 },
];

const AKTIVITAS: Record<JenisTahap, AktivitasAksa> = {
  kenali: 'kenali',
  cocokkan: 'cocokkan',
  ingat: 'ingat',
  tulis: 'tulis',
  kuis: 'kuis',
};

const TITIK_TENGAH = 183;

export function RoadmapDekorasi({ bab, nodes, indexAktif }: Props) {
  const tema = TEMA[bab];
  const selesai = nodes.filter((n) => n.status === 'selesai').length;
  const semua = nodes.length > 0 && selesai === nodes.length;

  // Posisi & aktivitas maskot
  let maskot: { x: number; y: number; aktivitas: AktivitasAksa; cermin: boolean; kunci: string };
  if (semua) {
    maskot = { x: 282, y: 720, aktivitas: 'rayakan', cermin: false, kunci: 'akhir' };
  } else {
    const i = indexAktif >= 0 ? indexAktif : 0;
    const n = nodes[i];
    const kiri = n.cx < TITIK_TENGAH;
    maskot = {
      // Berdiri di jalur tepat sebelum node aktif, menghadap node
      x: kiri ? n.cx - 82 : n.cx + 80,
      y: n.cy - 2,
      aktivitas: n.jenis ? AKTIVITAS[n.jenis] : 'kenali',
      cermin: !kiri,
      kunci: `node-${i}`,
    };
  }
  const kakiX = maskot.cermin ? UKURAN_MASKOT.lebar - UKURAN_MASKOT.kakiX : UKURAN_MASKOT.kakiX;

  return (
    <>
      <svg
        className="rm-latar"
        viewBox="0 0 366 740"
        width="366"
        height="740"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Rumput selalu ada: taman tetap terasa hidup sejak awal */}
        {RUMPUT.map(([x, y, s], i) => (
          <Rumput key={`r${i}`} x={x} y={y} skala={s} warna={i % 2 ? DAUN[1] : DAUN[2]} delay={-(i % 5) * 0.6} />
        ))}

        {/* Pohon bunga di tiap tikungan, tumbuh mengikuti progres */}
        {POHON.map((p, i) => (
          <Pohon key={`p${i}`} x={p.x} y={p.y} skala={p.skala} tahap={tahapPohon(selesai, p.ambang)} tema={tema} delay={-i * 0.9} />
        ))}

        {/* Bunga di samping tiap node: tunas (terkunci) → kuncup (aktif) → mekar (selesai) */}
        {nodes.map((n, i) => {
          const tahap: TahapBunga = n.status === 'selesai' ? 'mekar' : n.status === 'terbuka' ? 'kuncup' : 'tunas';
          const kiri = n.cx < TITIK_TENGAH;
          // Di luar kotak label (lebar 170px): kiri x < 33, kanan x > 324
          const posisi: [number, number][] = kiri
            ? [[5, n.cy + 44], [15, n.cy + 49], [25, n.cy + 43]]
            : [[334, n.cy + 43], [347, n.cy + 49], [360, n.cy + 44]];
          return posisi.map(([x, y], k) => (
            <Bunga
              key={`b${i}-${k}`}
              x={x}
              y={y}
              tahap={tahap}
              warna={tema.bunga[k]}
              putik={k === 1 ? '#EE851B' : tema.putik === tema.bunga[k] ? '#EE851B' : tema.putik}
              tinggi={k === 1 ? 16 : 12}
              delay={-(i + k) * 0.5}
            />
          ));
        })}

        {/* Kupu-kupu datang setelah pohon terdekat mekar */}
        {KUPU.filter((k) => selesai >= k.ambang).map((k, i) => (
          <KupuKupu key={`k${i}`} x={k.x} y={k.y} warna={tema.kupu} delay={-i * 1.3} />
        ))}

        {/* Garis akhir: gundukan, pohon besar, dan bendera */}
        <ellipse cx="298" cy="722" rx="70" ry="9" fill={tema.tanah} />
        <Pohon x={320} y={720} skala={1.22} tahap={semua ? 'mekar' : selesai >= 4 ? 'rimbun' : 'bibit'} tema={tema} delay={-2.2} />
        <g transform="translate(232 721)">
          <path d="M0 0 L0 -62" stroke={BATANG} strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="-64" r="3" fill={semua ? '#FFD263' : '#C9C1B6'} />
          <path
            className={semua ? 'rm-bendera' : undefined}
            d="M1.5 -60 L30 -52 L1.5 -43 Z"
            fill={semua ? tema.bendera : '#DCD4CA'}
            stroke="rgba(77,52,35,0.35)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {semua && <path d="M9 -52 L10.3 -54.7 L13 -55 L11 -57 L11.6 -59.8 L9 -58.4" fill="#FFFFFF" opacity="0.9" />}
        </g>
        {semua && (
          <>
            <Kilau x={248} y={612} r={6} warna="#FFD263" delay={0} />
            <Kilau x={352} y={592} r={5} warna={tema.kupu} delay={-0.8} />
            <Kilau x={212} y={668} r={4} warna="#EE851B" delay={-1.4} />
            <KupuKupu x={262} y={640} warna={tema.kupu} delay={-0.4} />
          </>
        )}
      </svg>

      {/* Maskot Aksa: dirender ulang (animasi hadir) setiap pindah node */}
      <div
        key={maskot.kunci}
        className="rm-maskot"
        style={{ left: `${maskot.x - kakiX}px`, top: `${maskot.y - UKURAN_MASKOT.kakiY}px` }}
        aria-hidden="true"
      >
        <MaskotPerjalanan aktivitas={maskot.aktivitas} bab={bab} cermin={maskot.cermin} />
      </div>
    </>
  );
}
