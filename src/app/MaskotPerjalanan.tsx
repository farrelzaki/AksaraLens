import { useId } from 'react';
import { BatikPatternDef } from './MaskotAksa';
import './maskot-perjalanan.css';

/**
 * Aksa versi "perjalanan": maskot kubah lime berblangkon batik (sama dengan MaskotHomepageHero),
 * digambar kecil untuk roadmap Materi Bab dan sedang melakukan aktivitas sesuai tahap aktif.
 * Murni dekoratif (aria-hidden), vektor penuh, animasi CSS (otomatis mati bila prefers-reduced-motion).
 */
export type AktivitasAksa = 'kenali' | 'cocokkan' | 'ingat' | 'tulis' | 'kuis' | 'rayakan';

const LIME = '#A8D800';
const LENGAN = '#97C400';
const COKLAT = '#4D3423';
const GARIS_BLANGKON = '#0B1035';

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
  const gradId = `rm-tubuh-${uid}`;
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
        <radialGradient id={gradId} cx="34%" cy="32%" r="78%">
          <stop offset="0" stopColor="#C9F23A" />
          <stop offset="0.55" stopColor={LIME} />
          <stop offset="1" stopColor="#8DBA00" />
        </radialGradient>
        <clipPath id={clipBlangkon}>
          <path d="M13 33 C15 17 26 9 41 9.5 C56 10 66 18 67 32 L54 27 C50 30.5 45 33 40.5 34 C36 32 32 29.5 28.5 26.5 Z" />
        </clipPath>
        <clipPath id={clipMataL}>
          <ellipse cx="29" cy="49" rx="8.6" ry="9.6" />
        </clipPath>
        <clipPath id={clipMataR}>
          <ellipse cx="51" cy="49" rx="8.6" ry="9.6" />
        </clipPath>
      </defs>

      {/* Bayangan tanah (tidak ikut melompat) */}
      <ellipse className="rm-aksa-bayangan" cx="40" cy="77" rx="23" ry="3.6" fill="rgba(77, 52, 35, 0.16)" />

      <g className={rayakan ? 'rm-aksa-lompat' : 'rm-aksa-ayun'}>
        {/* Kaki */}
        <ellipse cx="29" cy="74" rx="7.5" ry="4" fill="#8DBA00" />
        <ellipse cx="51" cy="74" rx="7.5" ry="4" fill="#8DBA00" />

        {/* Tubuh kubah lime dengan gradasi lembut (kesan 3D) */}
        <path
          d="M10 52 C10 31 23 20 40 20 C57 20 70 31 70 52 L70 62 C70 69.5 64.5 75 57 75 L23 75 C15.5 75 10 69.5 10 62 Z"
          fill={`url(#${gradId})`}
        />
        <ellipse cx="23" cy="36" rx="7" ry="4" fill="#FFFFFF" opacity="0.32" transform="rotate(-28 23 36)" />

        {/* Alis */}
        <path d="M22 39.5 Q28 35.5 34 38.5" stroke={COKLAT} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M46 38.5 Q52 35.5 58 39.5" stroke={COKLAT} strokeWidth="2.4" strokeLinecap="round" />

        {/* Mata */}
        {[
          { cx: 29, clip: clipMataL },
          { cx: 51, clip: clipMataR },
        ].map((m) => (
          <g key={m.cx} clipPath={`url(#${m.clip})`}>
            <ellipse cx={m.cx} cy="49" rx="8.6" ry="9.6" fill="#FFFFFF" />
            {rayakan ? (
              <path
                d={`M${m.cx - 5} 51 Q${m.cx} 44 ${m.cx + 5} 51`}
                stroke={COKLAT}
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            ) : (
              <g transform={geserPupil}>
                <circle cx={m.cx + 1.5} cy="50.5" r="5.3" fill={COKLAT} />
                <circle cx={m.cx + 1} cy="52" r="2.8" fill="#040920" />
                <circle cx={m.cx + 3.4} cy="47.8" r="1.8" fill="#FFFFFF" />
              </g>
            )}
            {!rayakan && (
              <rect className="rm-aksa-kelopak" x={m.cx - 10} y="38" width="20" height="22" fill={LIME} />
            )}
          </g>
        ))}

        {/* Hidung dua titik khas Aksa */}
        <circle cx="38" cy="61" r="1.1" fill={COKLAT} />
        <circle cx="42.4" cy="61" r="1.1" fill={COKLAT} />
        {rayakan && <path d="M35.5 64.5 Q40.2 70 45 64.5 Z" fill={COKLAT} />}

        {/* Blangkon batik */}
        <g>
          <circle cx="64.5" cy="20.5" r="4.6" fill="#724221" stroke={GARIS_BLANGKON} strokeWidth="1.2" />
          <path
            d="M13 33 C15 17 26 9 41 9.5 C56 10 66 18 67 32 L54 27 C50 30.5 45 33 40.5 34 C36 32 32 29.5 28.5 26.5 Z"
            fill="#8C5426"
          />
          <g clipPath={`url(#${clipBlangkon})`}>
            <rect x="10" y="6" width="60" height="30" fill={`url(#${batikId})`} />
          </g>
          <path
            d="M13 33 C15 17 26 9 41 9.5 C56 10 66 18 67 32 L54 27 C50 30.5 45 33 40.5 34 C36 32 32 29.5 28.5 26.5 Z"
            stroke={GARIS_BLANGKON}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M28.5 26.5 L40.5 21.5 L54 27 C50 30.5 45 33 40.5 34 C36 32 32 29.5 28.5 26.5 Z"
            fill="#8C5426"
            stroke={GARIS_BLANGKON}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </g>

        {/* ===== Lengan & properti per aktivitas ===== */}
        {aktivitas === 'kenali' && (
          <>
            <path d="M12 56 Q5 60 6 67" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
            <g className="rm-prop-kaca">
              <path d="M68 56 Q76 53 79 46" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
              <path d="M80 44 L84 37" stroke="#8C5426" strokeWidth="3.4" strokeLinecap="round" />
              <circle cx="88" cy="29.5" r="8.5" fill="rgba(255,255,255,0.6)" stroke={COKLAT} strokeWidth="2.6" />
              <path d="M84 26 Q86 23.5 89 23.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          </>
        )}

        {aktivitas === 'cocokkan' && (
          <>
            <g className="rm-prop-kartu-kiri">
              <path d="M12 57 Q4 55 1 49" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
              <g transform="rotate(-12 -2 42)">
                <rect x="-9" y="31" width="15" height="19" rx="3" fill="#FFFFFF" stroke={COKLAT} strokeWidth="1.6" />
                <Teks x={-1.5} y={45} cermin={cermin} size={10}>{aksara.kartuA}</Teks>
              </g>
            </g>
            <g className="rm-prop-kartu-kanan">
              <path d="M68 57 Q76 55 79 49" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
              <g transform="rotate(12 82 42)">
                <rect x="74" y="31" width="15" height="19" rx="3" fill="#FFFBEA" stroke={COKLAT} strokeWidth="1.6" />
                <Teks x={81.5} y={45} cermin={cermin} size={10}>{aksara.kartuB}</Teks>
              </g>
            </g>
          </>
        )}

        {aktivitas === 'ingat' && (
          <>
            <path d="M12 56 Q5 60 6 67" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
            <path d="M68 58 Q71 66 61 66.5" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
            <g className="rm-prop-gelembung">
              <circle cx="66" cy="12" r="2.2" fill="#FFFFFF" stroke="#DCD4CA" strokeWidth="1.2" />
              <circle cx="72" cy="4" r="3.3" fill="#FFFFFF" stroke="#DCD4CA" strokeWidth="1.2" />
              <ellipse cx="85" cy="-10" rx="15" ry="11.5" fill="#FFFFFF" stroke="#DCD4CA" strokeWidth="1.4" />
              <Teks x={85} y={-5} cermin={cermin} size={13}>{aksara.pikir}</Teks>
            </g>
          </>
        )}

        {aktivitas === 'tulis' && (
          <>
            <path d="M12 56 Q5 60 6 67" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
            {/* Daun lontar di depan maskot */}
            <g transform="rotate(-6 70 70)">
              <rect x="54" y="64" width="32" height="11" rx="3" fill="#F3E3C3" stroke="#C9A66B" strokeWidth="1.2" />
              <path
                className="rm-prop-goresan"
                d="M58 70 q2.5 -3 5 0 t5 0 t5 0 t5 0"
                stroke={COKLAT}
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </g>
            <path d="M68 58 Q75 60 76 64" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
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
            <path d="M12 56 Q5 60 6 67" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
            <path d="M68 52 Q78 43 80 32" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
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
            <path d="M12 52 Q2 44 2 33" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
            <path d="M68 52 Q78 44 78 33" stroke={LENGAN} strokeWidth="7" strokeLinecap="round" />
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
