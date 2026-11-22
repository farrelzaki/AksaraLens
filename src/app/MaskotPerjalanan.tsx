import { useId } from 'react';
import { BatikPatternDef } from './MaskotAksa';
import './maskot-perjalanan.css';

/**
 * Aksa versi "perjalanan": maskot kartun lime full body berblangkon batik, gaya datar
 * sama dengan Aksa di onboarding (kepala besar, badan kecil berperut terang, kaki & tangan kapsul),
 * digambar kecil untuk roadmap Materi Bab dan selingan pelajaran, sedang beraktivitas sesuai tahap.
 * Murni dekoratif (aria-hidden), vektor penuh, animasi CSS (otomatis mati bila prefers-reduced-motion).
 */
export type AktivitasAksa = 'kenali' | 'cocokkan' | 'ingat' | 'tulis' | 'kuis' | 'rayakan';

const LIME = '#A8D800';
/** Bayangan datar (bukan gradasi). */
const BAYANG = '#89AD0B';
const BAYANG_BADAN = '#8DB900';
const PERUT = '#D2ED7D';
const COKLAT = '#4D3423';
const GARIS_BLANGKON = '#0B1035';
const LENGAN_W = 9.5;

/**
 * Geometri karakter disalin persis dari Aksa onboarding (OnboardingSceneArt, ruang 371x354)
 * lalu diskalakan 0,4 supaya bentuk kepala, mata, badan, dan blangkon identik.
 */
const SKALA = 'translate(0 -44) scale(0.4)';
const KEPALA =
  'M25.8361 166.049C22.0327 129.862 48.2849 97.4433 84.4721 93.6399L99.5446 92.0558C135.732 88.2524 168.151 114.505 171.954 150.692L175.42 183.671C178.125 209.404 159.457 232.458 133.723 235.162L80.7935 240.725C55.0604 243.43 32.007 224.762 29.3024 199.029L25.8361 166.049Z';
const BADAN =
  'M55.9685 245.925C55.9685 229.255 69.4825 215.74 86.1529 215.74H115.164C131.834 215.74 145.348 229.255 145.348 245.925V276.531C145.348 288.914 135.309 298.953 122.926 298.953H78.3912C66.0075 298.953 55.9685 288.914 55.9685 276.531V245.925Z';
const BADAN_BAYANG =
  'M145.348 276.531C145.348 290.696 133.865 302.18 119.699 302.18H81.6176C67.452 302.18 55.9685 290.696 55.9685 276.531C55.9685 287.133 66.0075 295.727 78.3912 295.727H122.926C135.309 295.727 145.348 287.133 145.348 276.531Z';
const PERUT_D =
  'M78.5697 259.901C78.5697 247.994 88.2222 238.342 100.129 238.342C112.036 238.342 121.689 247.994 121.689 259.901V266.068C121.689 277.975 112.036 287.627 100.129 287.627C88.2222 287.627 78.5697 277.975 78.5697 266.068V259.901Z';
const KAKI_KIRI =
  'M50.274 300.807C49.4927 295.248 53.3661 290.108 58.9254 289.327L81.5255 286.151C87.0848 285.369 92.2249 289.243 93.0062 294.802C93.4884 298.233 91.0978 301.406 87.6665 301.888L57.3601 306.147C53.9288 306.629 50.7563 304.239 50.274 300.807Z';
const KAKI_KANAN =
  'M106.261 294.802C107.042 289.243 112.182 285.369 117.741 286.151L140.342 289.327C145.901 290.108 149.774 295.248 148.993 300.807C148.511 304.239 145.338 306.629 141.907 306.147L111.6 301.888C108.169 301.406 105.778 298.233 106.261 294.802Z';
const MATA_L =
  'M70.7724 193.508C83.9637 192.121 93.48 179.795 92.0275 165.975C90.575 152.155 78.7038 142.077 65.5125 143.463C52.3211 144.849 42.8049 157.176 44.2574 170.996C45.7099 184.815 57.581 194.894 70.7724 193.508Z';
const MATA_R =
  'M133.708 186.893C146.899 185.507 156.415 173.18 154.963 159.36C153.51 145.541 141.639 135.462 128.448 136.848C115.256 138.235 105.74 150.562 107.193 164.381C108.645 178.201 120.516 188.28 133.708 186.893Z';
const PUPIL_L = [
  'M75.1831 188.061C82.721 187.269 88.1181 179.837 87.2378 171.462C86.3575 163.086 79.5332 156.939 71.9953 157.731C64.4574 158.523 59.0603 165.955 59.9406 174.331C60.8209 182.706 67.6452 188.853 75.1831 188.061Z',
  'M76.3809 184.869C80.3592 184.451 83.2453 180.887 82.8272 176.908C82.4091 172.93 78.845 170.044 74.8667 170.462C70.8883 170.88 68.0022 174.444 68.4203 178.422C68.8385 182.401 72.4025 185.287 76.3809 184.869Z',
  'M68.8803 171.858C71.3929 171.594 73.2157 169.343 72.9517 166.83C72.6876 164.317 70.4366 162.495 67.924 162.759C65.4113 163.023 63.5885 165.274 63.8526 167.786C64.1167 170.299 66.3677 172.122 68.8803 171.858Z',
];
const PUPIL_R = [
  'M128.261 182.483C135.799 181.69 141.196 174.258 140.316 165.883C139.435 157.508 132.611 151.36 125.073 152.152C117.535 152.945 112.138 160.377 113.019 168.752C113.899 177.127 120.723 183.275 128.261 182.483Z',
  'M129.459 179.29C133.437 178.872 136.323 175.308 135.905 171.33C135.487 167.351 131.923 164.465 127.945 164.883C123.966 165.301 121.08 168.865 121.498 172.844C121.916 176.822 125.48 179.708 129.459 179.29Z',
  'M121.958 166.279C124.471 166.015 126.294 163.764 126.03 161.251C125.765 158.739 123.514 156.916 121.002 157.18C118.489 157.444 116.666 159.695 116.93 162.208C117.195 164.72 119.446 166.543 121.958 166.279Z',
];
const PUPIL_WARNA = [COKLAT, '#040920', '#FFFFFF'];
const BLANGKON =
  'M42.4261 132.704C42.4608 106.325 58.852 91.4156 91.5995 87.9755C124.347 84.5354 143.479 95.7131 148.994 121.509L115.015 114.556C109.025 121.639 102.721 127.071 96.1038 130.853C88.5092 128.003 81.2143 123.999 74.2191 118.842L42.4261 132.704Z';
const BLANGKON_GARIS =
  'M46.6377 108.692C60.946 109.293 78.3559 110.97 98.8672 113.721M98.8672 113.721C113.908 115.739 130.617 118.335 148.994 121.509M98.8672 113.721C116.411 107.674 130.222 102.717 140.301 98.8528M98.8672 113.721C83.0771 119.164 64.2634 125.492 42.4261 132.704M73.0855 92.0249C78.5905 99.0224 85.4615 104.333 93.6986 107.957C101.251 102.394 107.146 95.742 111.383 88.0017';
const BLANGKON_DEPAN = 'M74.2191 118.842L93.5675 106.708L115.015 114.556C109.054 121.916 102.75 127.349 96.1038 130.853C88.5093 128.003 81.2144 123.999 74.2191 118.842Z';
const LENGAN_KIRI_KAPSUL =
  'M21.3602 249.989C24.0173 243.412 31.5025 240.235 38.079 242.892C44.6554 245.549 47.8327 253.034 45.1756 259.611L40.9419 270.089C38.2849 276.666 30.7996 279.843 24.2232 277.186C17.6467 274.529 14.4694 267.044 17.1265 260.467L21.3602 249.989Z';
const LENGAN_KIRI_BAYANG =
  'M38.079 242.892C45.7568 245.994 49.4662 254.733 46.3642 262.411L43.7419 268.901C40.6399 276.579 31.901 280.288 24.2232 277.186C29.6982 279.398 36.2906 275.86 38.9477 269.284L43.1814 258.805C45.8384 252.228 43.554 245.104 38.079 242.892Z';

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
  const maskBadan = `rm-badan-${uid}`;
  const maskLengan = `rm-lengan-${uid}`;
  const aksara = AKSARA_BAB[bab];

  // Arah pandang pupil sesuai aktivitas (satuan ruang onboarding, 1 satuan = 0,4 px render)
  const geserPupil =
    aktivitas === 'ingat' ? 'translate(4 -6)'
    : aktivitas === 'tulis' ? 'translate(2.5 6)'
    : aktivitas === 'kenali' ? 'translate(5.5 -2)'
    : aktivitas === 'kuis' ? 'translate(3 -5)'
    : undefined;

  const rayakan = aktivitas === 'rayakan';

  const lenganKiriTurun = (
    <g transform={SKALA}>
      <mask id={maskLengan} fill="white">
        <path d={LENGAN_KIRI_KAPSUL} />
      </mask>
      <path d={LENGAN_KIRI_KAPSUL} fill={LIME} />
      <path d={LENGAN_KIRI_BAYANG} fill={BAYANG} mask={`url(#${maskLengan})`} />
    </g>
  );

  return (
    <svg
      className={`aksa-3d rm-aksa rm-aksa-${aktivitas} ${cermin ? 'rm-aksa-cermin' : ''}`}
      viewBox="-8 -24 112 108"
      width={UKURAN_MASKOT.lebar}
      height={UKURAN_MASKOT.tinggi}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <BatikPatternDef id={batikId} scale={0.48} />
        <clipPath id={clipBlangkon}>
          <path d={BLANGKON} />
        </clipPath>
        <clipPath id={clipMataL}>
          <path d={MATA_L} />
        </clipPath>
        <clipPath id={clipMataR}>
          <path d={MATA_R} />
        </clipPath>
        <mask id={maskBadan} fill="white">
          <path d={BADAN} />
        </mask>
      </defs>

      {/* Bayangan tanah (tidak ikut melompat) */}
      <ellipse className="rm-aksa-bayangan" cx="38" cy="77.5" rx="27" ry="3.4" fill="rgba(77, 52, 35, 0.16)" />

      <g className={rayakan ? 'rm-aksa-lompat' : 'rm-aksa-ayun'}>
        {/* Karakter identik dengan Aksa onboarding (geometri disalin, diskalakan 0,4) */}
        <g transform={SKALA}>
          {/* Badan + bayangan bawah + perut terang */}
          <path d={BADAN} fill={LIME} />
          <path d={BADAN_BAYANG} fill={BAYANG_BADAN} mask={`url(#${maskBadan})`} />
          <path d={PERUT_D} fill={PERUT} />
          {/* Kaki kapsul */}
          <path d={KAKI_KIRI} fill={LIME} />
          <path d={KAKI_KANAN} fill={LIME} />

          {/* Kepala besar */}
          <path d={KEPALA} fill={LIME} />

          {/* Alis */}
          <path d="M56.4532 144.799C60.8039 139.997 65.4001 138.747 70.2419 141.05" stroke={COKLAT} strokeWidth="5.2" strokeLinecap="round" />
          <path d="M123.32 135.471C127.83 132.186 132.585 132.452 137.587 136.271" stroke={COKLAT} strokeWidth="5.2" strokeLinecap="round" />

          {/* Mata */}
          {[
            { clip: clipMataL, mata: MATA_L, pupil: PUPIL_L, cx: 68, cy: 168, lid: { x: 38, y: 80 } },
            { clip: clipMataR, mata: MATA_R, pupil: PUPIL_R, cx: 131, cy: 161, lid: { x: 102, y: 72 } },
          ].map((m) => (
            <g key={m.clip} clipPath={`url(#${m.clip})`}>
              <path d={m.mata} fill="#FFFFFF" />
              {rayakan ? (
                <path d={`M${m.cx - 15} ${m.cy + 7} Q${m.cx} ${m.cy - 17} ${m.cx + 15} ${m.cy + 7}`} stroke={COKLAT} strokeWidth="6" strokeLinecap="round" />
              ) : (
                <g transform={geserPupil}>
                  {m.pupil.map((d, i) => (
                    <path key={i} d={d} fill={PUPIL_WARNA[i]} />
                  ))}
                </g>
              )}
              {!rayakan && <rect className="rm-aksa-kelopak" x={m.lid.x} y={m.lid.y} width="60" height="60" fill={LIME} />}
            </g>
          ))}

          {/* Hidung dua titik khas Aksa + senyum */}
          <circle cx="98.5" cy="189.8" r="2.5" fill={COKLAT} />
          <circle cx="105.7" cy="189" r="2.5" fill={COKLAT} />
          {rayakan ? (
            <path d="M100 198 Q110 218 121 197 Z" fill={COKLAT} />
          ) : (
            <path d="M104.181 203.3C110.598 207.239 115.074 205.663 117.609 198.574" stroke={COKLAT} strokeWidth="3.6" strokeLinecap="round" />
          )}

          {/* Blangkon batik */}
          <circle cx="141.9" cy="107.2" r="8.6" fill="#724221" stroke={GARIS_BLANGKON} strokeWidth="2.5" />
          <g clipPath={`url(#${clipBlangkon})`}>
            <rect x="38" y="80" width="120" height="60" fill={`url(#${batikId})`} />
          </g>
          <path d={BLANGKON} stroke={GARIS_BLANGKON} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={BLANGKON_GARIS} stroke={GARIS_BLANGKON} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={BLANGKON_DEPAN} fill="#8C5426" stroke={GARIS_BLANGKON} strokeWidth="2.5" strokeLinejoin="round" />
        </g>

        {/* ===== Lengan & properti per aktivitas ===== */}
        {aktivitas === 'kenali' && (
          <>
            {lenganKiriTurun}
            <g className="rm-prop-kaca">
              <path d="M55 60 Q70 57 79 46" stroke={LIME} strokeWidth={LENGAN_W} strokeLinecap="round" />
              <path d="M80 44 L84 37" stroke="#8C5426" strokeWidth="3.4" strokeLinecap="round" />
              <circle cx="88" cy="29.5" r="8.5" fill="rgba(255,255,255,0.6)" stroke={COKLAT} strokeWidth="2.6" />
              <path d="M84 26 Q86 23.5 89 23.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          </>
        )}

        {aktivitas === 'cocokkan' && (
          <>
            <g className="rm-prop-kartu-kiri">
              <path d="M25 60 Q10 58 1 49" stroke={LIME} strokeWidth={LENGAN_W} strokeLinecap="round" />
              <g transform="rotate(-12 -2 42)">
                <rect x="-9" y="31" width="15" height="19" rx="3" fill="#FFFFFF" stroke={COKLAT} strokeWidth="1.6" />
                <Teks x={-1.5} y={45} cermin={cermin} size={10}>{aksara.kartuA}</Teks>
              </g>
            </g>
            <g className="rm-prop-kartu-kanan">
              <path d="M55 60 Q70 58 79 49" stroke={LIME} strokeWidth={LENGAN_W} strokeLinecap="round" />
              <g transform="rotate(12 82 42)">
                <rect x="74" y="31" width="15" height="19" rx="3" fill="#FFFBEA" stroke={COKLAT} strokeWidth="1.6" />
                <Teks x={81.5} y={45} cermin={cermin} size={10}>{aksara.kartuB}</Teks>
              </g>
            </g>
          </>
        )}

        {aktivitas === 'ingat' && (
          <>
            {lenganKiriTurun}
            {/* Tangan di dagu, sedang mengingat */}
            <path d="M55 61 Q64 60 60 54" stroke={LIME} strokeWidth={LENGAN_W} strokeLinecap="round" />
            <g transform="translate(5 0)"><g className="rm-prop-gelembung">
              <circle cx="66" cy="2" r="2.2" fill="#FFFFFF" stroke="#DCD4CA" strokeWidth="1.2" />
              <circle cx="72" cy="-5" r="3.3" fill="#FFFFFF" stroke="#DCD4CA" strokeWidth="1.2" />
              <ellipse cx="86" cy="-13" rx="15" ry="11.5" fill="#FFFFFF" stroke="#DCD4CA" strokeWidth="1.4" />
              <Teks x={86} y={-8} cermin={cermin} size={13}>{aksara.pikir}</Teks>
            </g></g>
          </>
        )}

        {aktivitas === 'tulis' && (
          <>
            {lenganKiriTurun}
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
            <path d="M55 60 Q68 59 75 63" stroke={LIME} strokeWidth={LENGAN_W} strokeLinecap="round" />
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
            {lenganKiriTurun}
            <path d="M55 59 Q74 50 80 32" stroke={LIME} strokeWidth={LENGAN_W} strokeLinecap="round" />
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
            <path d="M25 58 Q10 50 4 36" stroke={LIME} strokeWidth={LENGAN_W} strokeLinecap="round" />
            <path d="M55 58 Q70 50 76 36" stroke={LIME} strokeWidth={LENGAN_W} strokeLinecap="round" />
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
