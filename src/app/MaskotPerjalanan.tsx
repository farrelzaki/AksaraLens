import { useId } from 'react';
import { BatikPatternDef } from './MaskotAksa';
import './maskot-perjalanan.css';

/**
 * Aksa versi "perjalanan": dino lime full body berblangkon batik. Gayanya datar seperti Aksa di
 * onboarding (kepala besar, badan berperut bergaris, ekor dan duri punggung, tanpa gradasi 3D),
 * digambar kecil untuk roadmap Materi Bab dan selingan pelajaran, sedang beraktivitas sesuai tahap.
 * Murni dekoratif (aria-hidden), vektor penuh, animasi CSS (otomatis mati bila prefers-reduced-motion).
 */
export type AktivitasAksa = 'kenali' | 'cocokkan' | 'ingat' | 'tulis' | 'kuis' | 'rayakan';

const LIME = '#A8D800';
const LENGAN = '#97C400';
/** Bayangan datar (bukan gradasi). */
const BAYANG = '#8DB900';
const PERUT = '#D2ED7D';
const GARIS_PERUT = '#B6D45A';
const DURI = '#EE9A3A';
const COKLAT = '#4D3423';
const GARIS_BLANGKON = '#0B1035';
const LENGAN_KIRI_TURUN = 'M25 61 Q15 64 15 71';
const BLANGKON =
  'M13 21 C15 5 26 -2.5 41 -2.5 C56 -2 66 6 67 20 L54 15 C50 18.5 45 21 40.5 22 C36 20 32 17.5 28.5 14.5 Z';

/** Aksara di gelembung pikiran / kartu, mengikuti materi tiap bab. */
const AKSARA_BAB: Record<1 | 2 | 3, { pikir: string; kartuA: string; kartuB: string }> = {
  1: { pikir: 'ꦏ', kartuA: 'ꦲ', kartuB: 'ꦤ' },
  2: { pikir: 'ꦏꦶ', kartuA: 'ꦶ', kartuB: 'ꦸ' },
  3: { pikir: 'ꦏꦁ', kartuA: 'ꦁ', kartuB: 'ꦃ' },
};

/** Teks yang tetap terbaca walau seluruh maskot dicerminkan (menghadap kiri). */
function Teks({ x, y, cermin, size, children }: { x: number; y: number; cermin: boolean; size: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={size}
      fill={COKLAT}
      fontFamily="'Noto Sans Javanese', serif"
      transform={cermin ? `translate(${2 * x} 0) scale(-1 1)` : undefined}
    >
      {children}
    </text>
  );
}

interface Props {
  aktivitas: AktivitasAksa;
  bab: 1 | 2 | 3;
  /** true = maskot menghadap kiri (dipakai di sisi kanan node). */
  cermin?: boolean;
}

/** Lebar/tinggi render (px). Kaki maskot ada di (KAKI_X, KAKI_Y) dalam kotak ini. */
export const UKURAN_MASKOT = { lebar: 84, tinggi: 81, kakiX: 36, kakiY: 76 } as const;

export function MaskotPerjalanan({ aktivitas, bab, cermin = false }: Props) {
  const uid = useId().replace(/:/g, '');
  const batikId = `rm-batik-${uid}`;
  const clipBlangkon = `rm-blangkon-${uid}`;
  const clipMataL = `rm-mata-l-${uid}`;
  const clipMataR = `rm-mata-r-${uid}`;
  const aksara = AKSARA_BAB[bab];

  // Arah pandang pupil sesuai aktivitas
  const geserPupil =
    aktivitas === 'ingat' ? 'translate(1.5 -2.5)'
    : aktivitas === 'tulis' ? 'translate(1 2.5)'
    : aktivitas === 'kenali' ? 'translate(2.2 -0.8)'
    : aktivitas === 'kuis' ? 'translate(1.2 -2)'
    : undefined;

  const rayakan = aktivitas === 'rayakan';

  return (
    <svg
      className={`rm-aksa rm-aksa-${aktivitas} ${cermin ? 'rm-aksa-cermin' : ''}`}
      viewBox="-8 -24 112 108"
      width={UKURAN_MASKOT.lebar}
      height={UKURAN_MASKOT.tinggi}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <BatikPatternDef id={batikId} scale={0.42} />
        <clipPath id={clipBlangkon}>
          <path d={BLANGKON} />
        </clipPath>
        <clipPath id={clipMataL}>
          <ellipse cx="30" cy="37" rx="7.6" ry="8.6" />
        </clipPath>
        <clipPath id={clipMataR}>
          <ellipse cx="50" cy="37" rx="7.6" ry="8.6" />
        </clipPath>
      </defs>

      {/* Bayangan tanah (tidak ikut melompat) */}
      <ellipse className="rm-aksa-bayangan" cx="38" cy="77.5" rx="27" ry="3.4" fill="rgba(77, 52, 35, 0.16)" />

      <g className={rayakan ? 'rm-aksa-lompat' : 'rm-aksa-ayun'}>
        {/* Ekor dino + duri */}
        <path d="M-1 58 L1.5 52.5 L5 59.5 Z" fill={DURI} />
        <path d="M6 63 L9.5 57.5 L12 64.5 Z" fill={DURI} />
        <path d="M13 66 L17 61 L19 67.5 Z" fill={DURI} />
        <path d="M30 63 C21 68 9 67 -2 57 C2 68 14 77 30 75 Z" fill={LIME} />
        <path d="M-2 57 C2 68 14 77 30 75 L30 72.5 C17 73.5 6 67 -2 57 Z" fill={BAYANG} />

        {/* Kaki dengan cakar */}
        <ellipse cx="31" cy="75" rx="7.4" ry="3.6" fill={BAYANG} />
        <ellipse cx="51" cy="75" rx="7.4" ry="3.6" fill={BAYANG} />
        {[28.5, 32, 35.5, 48.5, 52, 55.5].map((x) => (
          <circle key={x} cx={x} cy="77" r="1.2" fill="#FFFBEA" />
        ))}

        {/* Badan + perut bergaris khas dino */}
        <path
          d="M23 56 C23 51 27 49 31 49 L49 49 C53 49 57 51 57 56 L57 68 C57 73 53 76 48 76 L32 76 C27 76 23 73 23 68 Z"
          fill={LIME}
        />
        <ellipse cx="40" cy="65" rx="10" ry="8.6" fill={PERUT} />
        <path d="M32.5 62 Q40 64.5 47.5 62" stroke={GARIS_PERUT} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M32.5 67 Q40 69.5 47.5 67" stroke={GARIS_PERUT} strokeWidth="1.3" strokeLinecap="round" />

        {/* Duri di belakang kepala */}
        <path d="M10.5 30 L4.5 33.5 L10.5 38 Z" fill={DURI} />
        <path d="M10.5 39 L5 42.5 L11 46.5 Z" fill={DURI} />

        {/* Kepala besar (siluet onboarding), warna datar + bayangan bawah */}
        <path
          d="M10 33 C10 15 23 7 40 7 C57 7 70 15 70 33 L70 45 C70 52 65 56 58 56 L22 56 C15 56 10 52 10 45 Z"
          fill={LIME}
        />
        <path
          d="M10 45 C10 52 15 56 22 56 L58 56 C65 56 70 52 70 45 C68 50.5 64 52.5 58 52.5 L22 52.5 C16 52.5 12 50.5 10 45 Z"
          fill={BAYANG}
        />

        {/* Pipi merona */}
        <ellipse cx="21" cy="46.5" rx="3.6" ry="2.1" fill="#F2A99A" opacity="0.75" />
        <ellipse cx="59" cy="46.5" rx="3.6" ry="2.1" fill="#F2A99A" opacity="0.75" />

        {/* Alis */}
        <path d="M23.5 26.5 Q29 23 34.5 25.5" stroke={COKLAT} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M45.5 25.5 Q51 23 56.5 26.5" stroke={COKLAT} strokeWidth="2.2" strokeLinecap="round" />

        {/* Mata */}
        {[
          { cx: 30, clip: clipMataL },
          { cx: 50, clip: clipMataR },
        ].map((m) => (
          <g key={m.cx} clipPath={`url(#${m.clip})`}>
            <ellipse cx={m.cx} cy="37" rx="7.6" ry="8.6" fill="#FFFFFF" />
            {rayakan ? (
              <path
                d={`M${m.cx - 4.5} 39 Q${m.cx} 32.5 ${m.cx + 4.5} 39`}
                stroke={COKLAT}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            ) : (
              <g transform={geserPupil}>
                <circle cx={m.cx + 1.3} cy="38.3" r="4.8" fill={COKLAT} />
                <circle cx={m.cx + 0.9} cy="39.6" r="2.5" fill="#040920" />
                <circle cx={m.cx + 3} cy="35.8" r="1.7" fill="#FFFFFF" />
              </g>
            )}
            {!rayakan && (
              <rect className="rm-aksa-kelopak" x={m.cx - 9} y="27" width="18" height="20" fill={LIME} />
            )}
          </g>
        ))}

        {/* Hidung dua titik khas Aksa + senyum */}
        <circle cx="38" cy="47.2" r="1" fill={COKLAT} />
        <circle cx="42" cy="47.2" r="1" fill={COKLAT} />
        {rayakan ? (
          <path d="M35.5 50 Q40 56.5 44.5 50 Z" fill={COKLAT} />
        ) : (
          <path d="M37 50.5 Q40 53 43 50.5" stroke={COKLAT} strokeWidth="1.4" strokeLinecap="round" />
        )}

        {/* Blangkon batik */}
        <g>
          <circle cx="64.5" cy="8.5" r="4.6" fill="#724221" stroke={GARIS_BLANGKON} strokeWidth="1.2" />
          <path d={BLANGKON} fill="#8C5426" />
          <g clipPath={`url(#${clipBlangkon})`}>
            <rect x="10" y="-6" width="60" height="30" fill={`url(#${batikId})`} />
          </g>
          <path d={BLANGKON} stroke={GARIS_BLANGKON} strokeWidth="1.3" strokeLinejoin="round" />
          <path
            d="M28.5 14.5 L40.5 9.5 L54 15 C50 18.5 45 21 40.5 22 C36 20 32 17.5 28.5 14.5 Z"
            fill="#8C5426"
            stroke={GARIS_BLANGKON}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </g>

        {/* ===== Lengan & properti per aktivitas ===== */}
        {aktivitas === 'kenali' && (
          <>
            <path d={LENGAN_KIRI_TURUN} stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
            <g className="rm-prop-kaca">
              <path d="M55 60 Q70 57 79 46" stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
              <path d="M80 44 L84 37" stroke="#8C5426" strokeWidth="3.4" strokeLinecap="round" />
              <circle cx="88" cy="29.5" r="8.5" fill="rgba(255,255,255,0.6)" stroke={COKLAT} strokeWidth="2.6" />
              <path d="M84 26 Q86 23.5 89 23.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          </>
        )}

        {aktivitas === 'cocokkan' && (
          <>
            <g className="rm-prop-kartu-kiri">
              <path d="M25 60 Q10 58 1 49" stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
              <g transform="rotate(-12 -2 42)">
                <rect x="-9" y="31" width="15" height="19" rx="3" fill="#FFFFFF" stroke={COKLAT} strokeWidth="1.6" />
                <Teks x={-1.5} y={45} cermin={cermin} size={10}>{aksara.kartuA}</Teks>
              </g>
            </g>
            <g className="rm-prop-kartu-kanan">
              <path d="M55 60 Q70 58 79 49" stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
              <g transform="rotate(12 82 42)">
                <rect x="74" y="31" width="15" height="19" rx="3" fill="#FFFBEA" stroke={COKLAT} strokeWidth="1.6" />
                <Teks x={81.5} y={45} cermin={cermin} size={10}>{aksara.kartuB}</Teks>
              </g>
            </g>
          </>
        )}

        {aktivitas === 'ingat' && (
          <>
            <path d={LENGAN_KIRI_TURUN} stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
            {/* Tangan di dagu, sedang mengingat */}
            <path d="M55 61 Q64 60 60 54" stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
            <g className="rm-prop-gelembung">
              <circle cx="66" cy="2" r="2.2" fill="#FFFFFF" stroke="#DCD4CA" strokeWidth="1.2" />
              <circle cx="72" cy="-5" r="3.3" fill="#FFFFFF" stroke="#DCD4CA" strokeWidth="1.2" />
              <ellipse cx="86" cy="-13" rx="15" ry="11.5" fill="#FFFFFF" stroke="#DCD4CA" strokeWidth="1.4" />
              <Teks x={86} y={-8} cermin={cermin} size={13}>{aksara.pikir}</Teks>
            </g>
          </>
        )}

        {aktivitas === 'tulis' && (
          <>
            <path d={LENGAN_KIRI_TURUN} stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
            {/* Daun lontar di depan maskot */}
            <g transform="rotate(-6 74 70)">
              <rect x="58" y="64" width="32" height="11" rx="3" fill="#F3E3C3" stroke="#C9A66B" strokeWidth="1.2" />
              <path
                className="rm-prop-goresan"
                d="M62 70 q2.5 -3 5 0 t5 0 t5 0 t5 0"
                stroke={COKLAT}
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </g>
            <path d="M55 60 Q68 59 75 63" stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
            <g className="rm-prop-pensil">
              <g transform="rotate(28 78 60)">
                <rect x="75" y="42" width="6" height="18" rx="1" fill="#FFD263" stroke={COKLAT} strokeWidth="1.2" />
                <rect x="75" y="39" width="6" height="4" rx="1" fill="#DC9B8C" stroke={COKLAT} strokeWidth="1.2" />
                <path d="M75 60 L81 60 L78 66 Z" fill="#F3D5A8" stroke={COKLAT} strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M77 64 L79 64 L78 66 Z" fill={COKLAT} />
              </g>
            </g>
          </>
        )}

        {aktivitas === 'kuis' && (
          <>
            <path d={LENGAN_KIRI_TURUN} stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
            <path d="M55 59 Q74 50 80 32" stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
            <g className="rm-prop-bintang">
              <path
                d="M82 11 L85 18.5 L93 19 L87 24 L89 32 L82 27.5 L75 32 L77 24 L71 19 L79 18.5 Z"
                fill="#FFD263"
                stroke="#C99723"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </g>
            <path className="rm-kilau" d="M96 6 L97 9 L100 10 L97 11 L96 14 L95 11 L92 10 L95 9 Z" fill="#EE851B" />
          </>
        )}

        {rayakan && (
          <>
            <path d="M25 58 Q10 50 4 36" stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
            <path d="M55 58 Q70 50 76 36" stroke={LENGAN} strokeWidth="6" strokeLinecap="round" />
          </>
        )}
      </g>

      {rayakan && (
        <g className="rm-konfeti">
          <rect x="-4" y="-8" width="5" height="3" rx="1" fill="#FFD263" transform="rotate(20 -2 -6)" />
          <rect x="88" y="-12" width="5" height="3" rx="1" fill="#BBA4EF" transform="rotate(-25 90 -10)" />
          <rect x="16" y="-18" width="4" height="3" rx="1" fill="#EE851B" transform="rotate(40 18 -16)" />
          <rect x="62" y="-20" width="4" height="3" rx="1" fill="#9CAF6C" transform="rotate(-10 64 -18)" />
          <circle cx="40" cy="-14" r="1.8" fill="#DC9B8C" />
          <circle cx="96" cy="8" r="1.6" fill="#FFD263" />
          <circle cx="-4" cy="12" r="1.6" fill="#BBA4EF" />
        </g>
      )}
    </svg>
  );
}
