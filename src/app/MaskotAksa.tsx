import { useEffect, useId, useRef, useState } from 'react';

/**
 * Filter pencahayaan 3D semu untuk semua maskot Aksa di luar onboarding (kelas `.aksa-3d`).
 * Dipasang SEKALI di root aplikasi (main.tsx). Bayangan tepi lembut + kilau specular dari
 * siluet membuat maskot tampak seperti bahan "clay" menggembung tanpa mengubah gambar vektornya.
 */
export function Aksa3DDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="aksa-3d" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB" primitiveUnits="objectBoundingBox">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.045" result="bulat" />
          <feDiffuseLighting in="bulat" surfaceScale="1.6" diffuseConstant="1" lightingColor="#ffffff" result="cahaya">
            <feDistantLight azimuth="235" elevation="58" />
          </feDiffuseLighting>
          <feComponentTransfer in="cahaya" result="cahayaNorm">
            <feFuncR type="linear" slope="1.16" />
            <feFuncG type="linear" slope="1.16" />
            <feFuncB type="linear" slope="1.16" />
          </feComponentTransfer>
          <feComposite in="cahayaNorm" in2="SourceAlpha" operator="in" result="cahayaPotong" />
          <feBlend in="SourceGraphic" in2="cahayaPotong" mode="multiply" result="berbayang" />
          <feSpecularLighting in="bulat" surfaceScale="1.6" specularConstant="0.35" specularExponent="30" lightingColor="#ffffff" result="kilau">
            <feDistantLight azimuth="235" elevation="55" />
          </feSpecularLighting>
          <feComposite in="kilau" in2="SourceAlpha" operator="in" result="kilauPotong" />
          <feComposite in="berbayang" in2="kilauPotong" operator="arithmetic" k1="0" k2="1" k3="0.4" k4="0" />
        </filter>
      </defs>
    </svg>
  );
}

export type AuthMascotMood =
  | 'idle'
  | 'nama'
  | 'email'
  | 'password-hidden'
  | 'password-visible'
  | 'error'
  | 'loading';

/**
 * Pola Batik Parang & Cecek tradisional khas Jawa untuk blangkon Aksa.
 * Dibangun dengan vektor murni agar tajam di layar Retina/4K dan ringan tanpa bitmap ratusan KB.
 */
export function BatikPatternDef({ id, scale = 1 }: { id: string; scale?: number }) {
  return (
    <pattern
      id={id}
      width="24"
      height="24"
      patternUnits="userSpaceOnUse"
      patternTransform={scale === 1 ? 'rotate(-26)' : `rotate(-26) scale(${scale})`}
    >
      {/* Dasar sogan cokelat tua khas batik Mataram */}
      <rect width="24" height="24" fill="#4A2714" />
      {/* Gelombang Parang diagonal */}
      <path
        d="M-6 6 Q0 0 6 6 T18 6 T30 6"
        fill="none"
        stroke="#C5935E"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M-6 18 Q0 12 6 18 T18 18 T30 18"
        fill="none"
        stroke="#C5935E"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Aksen garis krem tipis (ukel) */}
      <path
        d="M-6 12 Q0 7 6 12 T18 12 T30 12"
        fill="none"
        stroke="#EFE0C6"
        strokeWidth="0.9"
        strokeDasharray="2 3"
      />
      <path
        d="M-6 24 Q0 19 6 24 T18 24 T30 24"
        fill="none"
        stroke="#EFE0C6"
        strokeWidth="0.9"
        strokeDasharray="2 3"
      />
      {/* Titik cecek & motif kawung halus */}
      <circle cx="6" cy="3" r="1.2" fill="#F4E6CF" opacity="0.9" />
      <circle cx="18" cy="15" r="1.2" fill="#F4E6CF" opacity="0.9" />
      <circle cx="12" cy="9" r="0.9" fill="#8C5426" />
      <circle cx="24" cy="21" r="0.9" fill="#8C5426" />
      <circle cx="0" cy="21" r="0.9" fill="#8C5426" />
    </pattern>
  );
}

/* ============================================================================
   1. MASKOT SPLASH SCREEN (Berbasis public/assets/icon profile 1.svg)
   Karakter: Ceria menyambut, tersenyum hangat, berkedip lembut, dan aura bintang.
   ============================================================================ */
export function MaskotSplash({ compact = false }: { compact?: boolean } = {}) {
  const uid = useId().replace(/:/g, '');
  const batikId = `batik-splash-${uid}`;
  const clipBlangkon = `blangkon-splash-${uid}`;
  const clipEyeL = `eye-l-splash-${uid}`;
  const clipEyeR = `eye-r-splash-${uid}`;

  return (
    <div
      className={compact ? 'aksa-splash-stage is-compact' : 'aksa-splash-stage'}
      aria-label="Maskot Aksa menyapa"
    >
      {!compact && (
        <>
          {/* Sparkles dekoratif di sekitar kapsul */}
          <svg
            className="aksa-sparkle-float aksa-sparkle-1"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <path
              d="M12 2L14.3 9.7L22 12L14.3 14.3L12 22L9.7 14.3L2 12L9.7 9.7L12 2Z"
              fill="#9CAF6C"
            />
          </svg>
          <svg
            className="aksa-sparkle-float aksa-sparkle-2"
            viewBox="0 0 24 24"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <path
              d="M12 2L14.3 9.7L22 12L14.3 14.3L12 22L9.7 14.3L2 12L9.7 9.7L12 2Z"
              fill="#C86A2E"
            />
          </svg>
        </>
      )}

      <svg
        viewBox="0 0 181 190"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="aksa-splash-svg aksa-3d"
        role="img"
        aria-label="Maskot Aksa tersenyum"
      >
        <defs>
          <BatikPatternDef id={batikId} />
          <clipPath id={clipBlangkon}>
            <path d="M23.8145 50.048C27.2542 17.7146 49.2684 1.54785 89.8572 1.54785C130.446 1.54785 152.46 17.7146 155.9 50.048L115.139 37.149C106.884 45.0604 98.4565 50.9079 89.8572 54.6916C80.9139 50.2199 72.4865 44.3724 64.5752 37.149L23.8145 50.048Z" />
          </clipPath>
          <clipPath id={clipEyeL}>
            <path d="M50.7794 132.237C67.2907 132.237 80.6757 118.214 80.6757 100.917C80.6757 83.6191 67.2907 69.5967 50.7794 69.5967C34.2681 69.5967 20.8831 83.6191 20.8831 100.917C20.8831 118.214 34.2681 132.237 50.7794 132.237Z" />
          </clipPath>
          <clipPath id={clipEyeR}>
            <path d="M129.554 132.237C146.065 132.237 159.45 118.214 159.45 100.917C159.45 83.6191 146.065 69.5967 129.554 69.5967C113.043 69.5967 99.6575 83.6191 99.6575 100.917C99.6575 118.214 113.043 132.237 129.554 132.237Z" />
          </clipPath>
        </defs>

        <g className="aksa-splash-body-rig">
          {/* Tubuh lime membulat */}
          <path
            d="M0 90.1817C0 46.5928 35.3357 11.2571 78.9246 11.2571H101.477C145.066 11.2571 180.402 46.5928 180.402 90.1817V135.797C180.402 165.517 156.309 189.609 126.59 189.609H53.8123C24.0926 189.609 0 165.517 0 135.797V90.1817Z"
            fill="#A8D800"
          />

          {/* Rona pipi hangat */}
          <ellipse cx="34" cy="134" rx="11" ry="6" fill="#FF9E7D" opacity="0.28" />
          <ellipse cx="146" cy="134" rx="11" ry="6" fill="#FF9E7D" opacity="0.28" />

          {/* Alis */}
          <g className="aksa-splash-brows">
            <path
              d="M39.3904 70.0713C45.4013 64.6931 51.254 63.7441 56.9485 67.2241"
              strokeWidth="5.22"
              strokeLinecap="round"
              stroke="#4D3423"
            />
            <path
              d="M123.385 67.2241C129.396 63.7441 135.248 64.6931 140.943 70.0713"
              strokeWidth="5.22"
              strokeLinecap="round"
              stroke="#4D3423"
            />
          </g>

          {/* Mata Kiri terklip (kelopak dimulai di y=-4..66 agar 100% di atas mata y=69.6) */}
          <g clipPath={`url(#${clipEyeL})`}>
            <path
              d="M50.7794 132.237C67.2907 132.237 80.6757 118.214 80.6757 100.917C80.6757 83.6191 67.2907 69.5967 50.7794 69.5967C34.2681 69.5967 20.8831 83.6191 20.8831 100.917C20.8831 118.214 34.2681 132.237 50.7794 132.237Z"
              fill="white"
            />
            <g className="aksa-splash-pupils">
              <path
                d="M56.9485 126.068C66.3835 126.068 74.0321 117.569 74.0321 107.086C74.0321 96.6024 66.3835 88.104 56.9485 88.104C47.5135 88.104 39.8649 96.6024 39.8649 107.086C39.8649 117.569 47.5135 126.068 56.9485 126.068Z"
                fill="#4D3423"
              />
              <path
                d="M58.8467 122.271C63.8263 122.271 67.863 118.234 67.863 113.255C67.863 108.275 63.8263 104.239 58.8467 104.239C53.8671 104.239 49.8303 108.275 49.8303 113.255C49.8303 118.234 53.8671 122.271 58.8467 122.271Z"
                fill="#040920"
              />
              <circle cx="51.254" cy="99.493" r="5.6945" fill="white" className="aksa-eye-glint" />
              <circle cx="64.5412" cy="108.984" r="2.8473" fill="#202845" />
            </g>
            <g className="aksa-eyelid-splash">
              <rect x="16" y="-4" width="70" height="70" fill="#A8D800" />
              <path
                d="M24 62C38 69 63 69 77 62"
                stroke="#4D3423"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Mata Kanan terklip */}
          <g clipPath={`url(#${clipEyeR})`}>
            <path
              d="M129.554 132.237C146.065 132.237 159.45 118.214 159.45 100.917C159.45 83.6191 146.065 69.5967 129.554 69.5967C113.043 69.5967 99.6575 83.6191 99.6575 100.917C99.6575 118.214 113.043 132.237 129.554 132.237Z"
              fill="white"
            />
            <g className="aksa-splash-pupils">
              <path
                d="M123.385 126.068C132.82 126.068 140.469 117.569 140.469 107.086C140.469 96.6024 132.82 88.104 123.385 88.104C113.95 88.104 106.301 96.6024 106.301 107.086C106.301 117.569 113.95 126.068 123.385 126.068Z"
                fill="#4D3423"
              />
              <path
                d="M125.283 122.271C130.263 122.271 134.299 118.234 134.299 113.255C134.299 108.275 130.263 104.239 125.283 104.239C120.303 104.239 116.267 108.275 116.267 113.255C116.267 118.234 120.303 122.271 125.283 122.271Z"
                fill="#040920"
              />
              <circle cx="117.69" cy="99.493" r="5.6945" fill="white" className="aksa-eye-glint" />
              <circle cx="130.978" cy="108.984" r="2.8473" fill="#202845" />
            </g>
            <g className="aksa-eyelid-splash">
              <rect x="94" y="-4" width="70" height="70" fill="#A8D800" />
              <path
                d="M103 62C117 69 142 69 156 62"
                stroke="#4D3423"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Hidung & Senyum */}
          <circle cx="85.8958" cy="131.288" r="2.1355" fill="#4D3423" />
          <circle cx="94.9122" cy="131.288" r="2.1355" fill="#4D3423" />
          <path
            d="M77.354 141.253C85.8958 148.529 94.4376 148.529 102.979 141.253"
            strokeWidth="2.8"
            strokeLinecap="round"
            stroke="#4D3423"
            className="aksa-splash-smile"
          />

          {/* Blangkon (secondary follow-through motion) */}
          <g className="aksa-splash-blangkon">
            <path
              d="M149.088 42.9683C154.787 42.9683 159.407 37.8862 159.407 31.6172C159.407 25.3482 154.787 20.2661 149.088 20.2661C143.389 20.2661 138.769 25.3482 138.769 31.6172C138.769 37.8862 143.389 42.9683 149.088 42.9683Z"
              fill="#724221"
              strokeWidth="3.09575"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <g clipPath={`url(#${clipBlangkon})`}>
              <rect x="20" y="0" width="140" height="58" fill={`url(#${batikId})`} />
            </g>
            <path
              d="M23.8145 50.048C27.2542 17.7146 49.2684 1.54785 89.8572 1.54785C130.446 1.54785 152.46 17.7146 155.9 50.048L115.139 37.149C106.884 45.0604 98.4565 50.9079 89.8572 54.6916C80.9139 50.2199 72.4865 44.3724 64.5752 37.149L23.8145 50.048Z"
              strokeWidth="3.09575"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <path
              d="M32.0698 21.1543C49.5332 23.7341 70.6603 28.0313 95.4511 34.0458M95.4511 34.0458C113.631 38.4564 133.78 43.7904 155.9 50.048M95.4511 34.0458C117.737 28.8912 135.307 24.594 148.16 21.1543M95.4511 34.0458C75.3927 38.6853 51.5139 44.0193 23.8145 50.048M66.639 4.12769C72.4865 13.4149 80.2259 20.8103 89.8572 26.3139C99.8324 20.4664 107.916 13.071 114.107 4.12769"
              strokeWidth="3.09575"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <path
              d="M64.5753 37.1489L89.8573 24.7659L115.139 37.1489C106.884 45.4042 98.4566 51.2518 89.8573 54.6915C80.914 50.2198 72.4867 44.3723 64.5753 37.1489Z"
              fill="#8C5426"
              strokeWidth="3.09575"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   2. MASKOT INTRO PAGE (Berbasis public/assets/maskot intro.svg)
   Karakter: Muncul pop-up sekali saat halaman dibuka, mengayun tenang dengan
   blangkon batik, mata melirik alami, dan gelembung "Hai! Aku Aksa ✦".
   ============================================================================ */
export function MaskotIntro() {
  const uid = useId().replace(/:/g, '');
  const batikId = `batik-intro-${uid}`;
  const clipBlangkon = `blangkon-intro-${uid}`;
  const clipEyeL = `eye-l-intro-${uid}`;
  const clipEyeR = `eye-r-intro-${uid}`;

  const [senyumMerem, setSenyumMerem] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSentuhAksa = () => {
    setSenyumMerem(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setSenyumMerem(false);
      timerRef.current = null;
    }, 2200);
  };

  return (
    <button
      type="button"
      onClick={handleSentuhAksa}
      className={`aksa-intro-stage${senyumMerem ? ' is-happy' : ''}`}
      aria-label="Sapa maskot Aksa"
      aria-pressed={senyumMerem}
    >
      <svg
        viewBox="0 0 412 377"
        preserveAspectRatio="xMidYMax meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="aksa-intro-svg aksa-3d"
        aria-hidden="true"
      >
        <defs>
          <BatikPatternDef id={batikId} />
          <clipPath id={clipBlangkon}>
            <path d="M45.7463 178.842C54.2884 98.5458 108.958 58.3979 209.755 58.3979C310.552 58.3979 365.221 98.5458 373.763 178.842L272.539 146.809C252.038 166.456 231.11 180.977 209.755 190.373C187.545 179.269 166.617 164.747 146.97 146.809L45.7463 178.842Z" />
          </clipPath>
          <clipPath id={clipEyeL}>
            <path d="M120.862 342.087C156.677 342.087 185.711 311.671 185.711 274.15C185.711 236.629 156.677 206.213 120.862 206.213C85.0469 206.213 56.0129 236.629 56.0129 274.15C56.0129 311.671 85.0469 342.087 120.862 342.087Z" />
          </clipPath>
          <clipPath id={clipEyeR}>
            <path d="M291.735 342.087C327.55 342.087 356.584 311.671 356.584 274.15C356.584 236.629 327.55 206.213 291.735 206.213C255.919 206.213 226.885 236.629 226.885 274.15C226.885 311.671 255.919 342.087 291.735 342.087Z" />
          </clipPath>
        </defs>

        {/* Bintang dekorasi kecil */}
        <path
          d="M52 102L54.8 110.2L63 113L54.8 115.8L52 124L49.2 115.8L41 113L49.2 110.2L52 102Z"
          fill="#9CAF6C"
          className="aksa-intro-deco-star aksa-intro-deco-star-1"
        />
        <path
          d="M352 68L354 74L360 76L354 78L352 84L350 78L344 76L350 74L352 68Z"
          fill="#EE851B"
          className="aksa-intro-deco-star aksa-intro-deco-star-2"
        />

        {/* Masuk pop-up sekali saat halaman dibuka */}
        <g className="aksa-intro-peek-entry">
        {/* Rig Badan & Kepala Aksa (menempel rapat di bawah agar bebas celah saat membal) */}
        <g className="aksa-intro-head-rig">
          {/* Jambul / Tunas kepala dengan gerak susulan */}
          <path
            d="M194.975 160.921C178.506 158.863 173.359 147.54 177.476 135.188C181.594 121.806 197.034 122.835 202.181 133.129C204.24 114.6 222.768 106.366 232.032 118.718C243.355 134.158 224.827 156.804 208.357 159.892L194.975 160.921Z"
            fill="#A8D800"
            className="aksa-intro-sprout"
          />

          {/* Tubuh kubah hijau lime (berlebih ke bawah y=430 agar tak pernah terbuka celah saat membal) */}
          <path
            d="M10.7112 263.457C10.7112 173.855 83.3477 101.219 172.949 101.219H239.647C329.249 101.219 401.885 173.855 401.885 263.457V430H10.7112V263.457Z"
            fill="#A8D800"
          />
          <path
            d="M-15.0125 430V251.504C-15.0125 131.07 427.609 131.07 427.609 251.504V430H-15.0125Z"
            fill="#A8D800"
          />

          {/* Rona pipi hangat */}
          <ellipse cx="78" cy="340" rx="22" ry="11" fill="#FF9E7D" className="aksa-intro-blush" />
          <ellipse cx="334" cy="340" rx="22" ry="11" fill="#FF9E7D" className="aksa-intro-blush" />

          {/* Alis ekspresif */}
          <g className="aksa-intro-brows">
            <path
              d="M96.1576 207.242C109.196 195.576 121.891 193.517 134.244 201.066"
              strokeWidth="11.3229"
              strokeLinecap="round"
              stroke="#4D3423"
            />
            <path
              d="M278.353 201.066C291.391 193.517 304.087 195.576 316.439 207.242"
              strokeWidth="11.3229"
              strokeLinecap="round"
              stroke="#4D3423"
            />
          </g>

          {/* Mata Kiri (kelopak di y=54..200 agar 100% di atas mata y=206.21) */}
          <g clipPath={`url(#${clipEyeL})`}>
            <path
              d="M120.862 342.087C156.677 342.087 185.711 311.671 185.711 274.15C185.711 236.629 156.677 206.213 120.862 206.213C85.0469 206.213 56.0129 236.629 56.0129 274.15C56.0129 311.671 85.0469 342.087 120.862 342.087Z"
              fill="white"
            />
            <g className="aksa-intro-pupils">
              <path
                d="M134.244 328.705C154.71 328.705 171.3 310.271 171.3 287.531C171.3 264.791 154.71 246.357 134.244 246.357C113.778 246.357 97.187 264.791 97.187 287.531C97.187 310.271 113.778 328.705 134.244 328.705Z"
                fill="#4D3423"
              />
              <path
                d="M138.361 320.471C149.162 320.471 157.919 311.714 157.919 300.913C157.919 290.111 149.162 281.355 138.361 281.355C127.559 281.355 118.803 290.111 118.803 300.913C118.803 311.714 127.559 320.471 138.361 320.471Z"
                fill="#040920"
              />
              <circle cx="121.891" cy="271.062" r="12.3525" fill="white" className="aksa-eye-glint" />
              <circle cx="150.713" cy="291.649" r="6.176" fill="#202845" />
            </g>
            <g className="aksa-eyelid-intro">
              <rect x="48" y="54" width="146" height="146" fill="#A8D800" />
              <path
                d="M64 192C95 206 146 206 177 192"
                stroke="#4D3423"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* Mata merem senyum (^) saat maskot ditekan */}
            <g className="aksa-intro-happy-eye">
              <rect x="48" y="200" width="146" height="150" fill="#A8D800" />
              <path
                d="M78 286C97 251 145 251 164 286"
                stroke="#4D3423"
                strokeWidth="11.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Mata Kanan */}
          <g clipPath={`url(#${clipEyeR})`}>
            <path
              d="M291.735 342.087C327.55 342.087 356.584 311.671 356.584 274.15C356.584 236.629 327.55 206.213 291.735 206.213C255.919 206.213 226.885 236.629 226.885 274.15C226.885 311.671 255.919 342.087 291.735 342.087Z"
              fill="white"
            />
            <g className="aksa-intro-pupils">
              <path
                d="M278.353 328.705C298.819 328.705 315.41 310.271 315.41 287.531C315.41 264.791 298.819 246.357 278.353 246.357C257.887 246.357 241.296 264.791 241.296 287.531C241.296 310.271 257.887 328.705 278.353 328.705Z"
                fill="#4D3423"
              />
              <path
                d="M282.47 320.471C293.272 320.471 302.028 311.714 302.028 300.913C302.028 290.111 293.272 281.355 282.47 281.355C271.669 281.355 262.913 290.111 262.913 300.913C262.913 311.714 271.669 320.471 282.47 320.471Z"
                fill="#040920"
              />
              <circle cx="266.001" cy="271.062" r="12.3525" fill="white" className="aksa-eye-glint" />
              <circle cx="294.823" cy="291.649" r="6.176" fill="#202845" />
            </g>
            <g className="aksa-eyelid-intro">
              <rect x="220" y="54" width="146" height="146" fill="#A8D800" />
              <path
                d="M236 192C267 206 318 206 349 192"
                stroke="#4D3423"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* Mata merem senyum (^) saat maskot ditekan */}
            <g className="aksa-intro-happy-eye">
              <rect x="220" y="200" width="146" height="150" fill="#A8D800" />
              <path
                d="M250 286C269 251 317 251 336 286"
                stroke="#4D3423"
                strokeWidth="11.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Titik hidung & senyum ceria */}
          <circle cx="197.034" cy="340.028" r="4.632" fill="#0B1035" />
          <circle cx="216.592" cy="340.028" r="4.632" fill="#0B1035" />
          <path
            d="M178 347C195 366 219 366 236 347"
            stroke="#4D3423"
            strokeWidth="7.2"
            strokeLinecap="round"
            fill="none"
            className="aksa-intro-smile"
          />

          {/* Blangkon Batik dengan gerak susulan */}
          <g className="aksa-intro-blangkon">
            <path
              d="M356.847 161.26C371 161.26 382.473 148.639 382.473 133.071C382.473 117.503 371 104.882 356.847 104.882C342.694 104.882 331.22 117.503 331.22 133.071C331.22 148.639 342.694 161.26 356.847 161.26Z"
              fill="#724221"
              strokeWidth="7.68789"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <g clipPath={`url(#${clipBlangkon})`}>
              <rect x="42" y="54" width="338" height="140" fill={`url(#${batikId})`} />
            </g>
            <path
              d="M45.7463 178.842C54.2884 98.5458 108.958 58.3979 209.755 58.3979C310.552 58.3979 365.221 98.5458 373.763 178.842L272.539 146.809C252.038 166.456 231.11 180.977 209.755 190.373C187.545 179.269 166.617 164.747 146.97 146.809L45.7463 178.842Z"
              strokeWidth="7.68789"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <path
              d="M66.2474 107.088C109.615 113.495 162.082 124.166 223.646 139.103M223.646 139.103C268.793 150.056 318.832 163.302 373.763 178.842M223.646 139.103C278.991 126.302 322.623 115.63 354.543 107.088M223.646 139.103C173.834 150.624 114.534 163.87 45.7463 178.842M152.096 64.8047C166.617 87.8684 185.837 106.234 209.755 119.901C234.527 105.38 254.601 87.0142 269.977 64.8047"
              strokeWidth="7.68789"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <path
              d="M146.97 146.809L209.755 116.057L272.539 146.809C252.038 167.31 231.11 181.832 209.755 190.374C187.545 179.269 166.617 164.747 146.97 146.809Z"
              fill="#8C5426"
              strokeWidth="7.68789"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
          </g>
        </g>
        </g>

        {/* Gelembung sapa "Hai! Aku Aksa ✦" mengambang dengan bayangan vektor tajam */}
        <g className="aksa-intro-bubble-group">
          <g className="aksa-intro-bubble-react">
            <path
              d="M274.088 12.5573C274.94 5.62209 281.252 0.690303 288.187 1.54184L374.156 12.0975C381.092 12.949 386.023 19.2614 385.172 26.1966L383.867 36.822C383.016 43.7572 376.703 48.689 369.768 47.8374L273.174 35.9771C272.107 35.8461 271.348 34.875 271.479 33.8081L274.088 12.5573Z"
              transform="translate(0 4.86)"
              fill="#E7E5D5"
            />
            <path
              d="M274.088 12.5573C274.94 5.62209 281.252 0.690303 288.187 1.54184L374.156 12.0975C381.092 12.949 386.023 19.2614 385.172 26.1966L383.867 36.822C383.016 43.7572 376.703 48.689 369.768 47.8374L273.174 35.9771C272.107 35.8461 271.348 34.875 271.479 33.8081L274.088 12.5573Z"
              fill="#FFFEF5"
              stroke="#DBDBC7"
              strokeWidth="1.5"
            />
            <text
              x="318"
              y="23.6"
              transform="rotate(7 318 23.6)"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#4D3423"
              fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
              fontSize="9.8"
              fontWeight="700"
              textRendering="geometricPrecision"
            >
              {senyumMerem ? 'Hehe, halo!' : 'Hai! Aku Aksa'}
            </text>
            <path
              d="M365.66 33.6641C365.641 33.2368 365.509 32.7631 365.266 32.2429C365.023 31.7164 364.648 31.2094 364.139 30.722C363.636 30.2355 363.115 29.9002 362.576 29.7163L362.626 29.3106C363.189 29.249 363.743 29.0752 364.288 28.7891C364.84 28.4974 365.317 28.1246 365.719 27.6706C366.13 27.2046 366.413 26.7296 366.571 26.2456L366.977 26.2954C366.995 26.6245 367.07 26.9704 367.202 27.333C367.335 27.6892 367.518 28.0385 367.75 28.3808C367.99 28.7175 368.265 29.0291 368.577 29.3157C369.041 29.7388 369.53 30.0407 370.044 30.2215L369.994 30.6272C369.631 30.6545 369.246 30.7543 368.84 30.9266C368.439 31.0997 368.059 31.3178 367.7 31.581C367.342 31.8376 367.04 32.1176 366.793 32.4207C366.431 32.8665 366.189 33.2975 366.066 33.7139L365.66 33.6641Z"
              fill="#789421"
              className="aksa-intro-bubble-star"
            />
          </g>
        </g>
      </svg>
    </button>
  );
}

/* ============================================================================
   3. MASKOT LOGIN PAGE (Berbasis public/assets/maskot login.svg)
   Karakter: Teman setia di balik jendela mint yang lembut; menatap input email,
   menutup mata sopan saat mengetik sandi rahasia, dan mengintip lucunya saat sandi ditampilkan!
   ============================================================================ */
export function MaskotLogin({ mood = 'idle' }: { mood?: AuthMascotMood }) {
  const uid = useId().replace(/:/g, '');
  const batikId = `batik-login-${uid}`;
  const clipBadge = `badge-login-${uid}`;
  const clipBlangkon = `blangkon-login-${uid}`;
  const clipEyeL = `eye-l-login-${uid}`;
  const clipEyeR = `eye-r-login-${uid}`;

  return (
    <div className={`aksa-login-stage mood-${mood}`} aria-label="Maskot Aksa menemani masuk">
      <svg
        viewBox="0 0 170 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="aksa-login-svg aksa-3d"
        role="img"
        aria-label="Maskot Aksa"
      >
        <defs>
          <BatikPatternDef id={batikId} />
          <clipPath id={clipBadge}>
            <rect width="169.832" height="169.832" rx="56" />
          </clipPath>
          <clipPath id={clipBlangkon}>
            <path d="M23.3586 71.5966C26.6156 40.9809 47.4604 25.6731 85.8928 25.6731C124.325 25.6731 145.17 40.9809 148.427 71.5966L109.832 59.3829C102.015 66.874 94.0353 72.4109 85.8928 75.9936C77.4247 71.7595 69.445 66.2226 61.954 59.3829L23.3586 71.5966Z" />
          </clipPath>
          <clipPath id={clipEyeL}>
            <path d="M51.9993 133.84C65.6552 133.84 76.7254 122.243 76.7254 107.937C76.7254 93.6306 65.6552 82.0332 51.9993 82.0332C38.3435 82.0332 27.2732 93.6306 27.2732 107.937C27.2732 122.243 38.3435 133.84 51.9993 133.84Z" />
          </clipPath>
          <clipPath id={clipEyeR}>
            <path d="M117.15 133.84C130.806 133.84 141.877 122.243 141.877 107.937C141.877 93.6306 130.806 82.0332 117.15 82.0332C103.495 82.0332 92.4243 93.6306 92.4243 107.937C92.4243 122.243 103.495 133.84 117.15 133.84Z" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipBadge})`}>
          {/* Latar jendela squircle mint */}
          <rect width="169.832" height="169.832" rx="56" fill="#DCE6C9" fillOpacity="0.6" />

          {/* Karakter Aksa membal lembut di dalam bingkai */}
          <g className="aksa-login-rig">
            <path
              d="M80.2577 64.7639C73.978 63.979 72.0156 59.6617 73.5856 54.952C75.1555 49.8497 81.0426 50.2422 83.005 54.167C83.79 47.1024 90.8546 43.9626 94.3869 48.6723C98.7042 54.5595 91.6395 63.194 85.3599 64.3714L80.2577 64.7639Z"
              fill="#B9EC00"
              className="aksa-login-sprout"
            />
            <path
              d="M10 103.859C10 69.6953 37.6953 42 71.8592 42H97.2902C131.454 42 159.149 69.6953 159.149 103.859V188H10V103.859Z"
              fill="#B9EC00"
            />
            <path
              d="M0.192139 188V99.3021C12.9676 42.7775 140.089 14.9635 168.958 99.3021V188H0.192139Z"
              fill="#B9EC00"
            />

            {/* Alis */}
            <g className="aksa-login-brows">
              <path
                d="M42.5798 82.4254C47.5512 77.9774 52.3918 77.1924 57.1015 80.0706"
                strokeWidth="4.31726"
                strokeLinecap="round"
                stroke="#0B1035"
                className="aksa-login-brow-l"
              />
              <path
                d="M112.048 80.0706C117.02 77.1924 121.86 77.9774 126.57 82.4254"
                strokeWidth="4.31726"
                strokeLinecap="round"
                stroke="#0B1035"
                className="aksa-login-brow-r"
              />
            </g>

            {/* Mata Kiri (kelopak y=14..74 agar 100% di atas y=82.03 saat terbuka) */}
            <g clipPath={`url(#${clipEyeL})`}>
              <path
                d="M51.9993 133.84C65.6552 133.84 76.7254 122.243 76.7254 107.937C76.7254 93.6306 65.6552 82.0332 51.9993 82.0332C38.3435 82.0332 27.2732 93.6306 27.2732 107.937C27.2732 122.243 38.3435 133.84 51.9993 133.84Z"
                fill="white"
              />
              <g className="aksa-login-pupils">
                <path
                  d="M57.1014 128.738C64.9047 128.738 71.2306 121.709 71.2306 113.039C71.2306 104.368 64.9047 97.3396 57.1014 97.3396C49.298 97.3396 42.9722 104.368 42.9722 113.039C42.9722 121.709 49.298 128.738 57.1014 128.738Z"
                  fill="#0B1035"
                />
                <path
                  d="M58.6712 125.598C62.7896 125.598 66.1283 122.259 66.1283 118.141C66.1283 114.022 62.7896 110.684 58.6712 110.684C54.5528 110.684 51.2141 114.022 51.2141 118.141C51.2141 122.259 54.5528 125.598 58.6712 125.598Z"
                  fill="#040920"
                />
                <circle cx="52.3916" cy="106.759" r="4.7098" fill="white" className="aksa-eye-glint" />
                <circle cx="63.381" cy="114.609" r="2.3549" fill="#202845" />
              </g>
              <g className="aksa-eyelid-login aksa-eyelid-login-l">
                <rect x="22" y="14" width="60" height="60" fill="#B9EC00" />
                <path
                  d="M32 70C42 77 62 77 72 70"
                  stroke="#0B1035"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
              {/* Mata tertutup rapi saat mengetik sandi rahasia */}
              <g className="aksa-login-closed-l">
                <rect x="22" y="78" width="60" height="62" fill="#B9EC00" />
                <path
                  d="M34 107C43 116 61 116 70 107"
                  stroke="#0B1035"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            </g>

            {/* Mata Kanan */}
            <g clipPath={`url(#${clipEyeR})`}>
              <path
                d="M117.15 133.84C130.806 133.84 141.877 122.243 141.877 107.937C141.877 93.6306 130.806 82.0332 117.15 82.0332C103.495 82.0332 92.4243 93.6306 92.4243 107.937C92.4243 122.243 103.495 133.84 117.15 133.84Z"
                fill="white"
              />
              <g className="aksa-login-pupils">
                <path
                  d="M112.048 128.738C119.852 128.738 126.178 121.709 126.178 113.039C126.178 104.368 119.852 97.3396 112.048 97.3396C104.245 97.3396 97.9192 104.368 97.9192 113.039C97.9192 121.709 104.245 128.738 112.048 128.738Z"
                  fill="#0B1035"
                />
                <path
                  d="M113.618 125.598C117.736 125.598 121.075 122.259 121.075 118.141C121.075 114.022 117.736 110.684 113.618 110.684C109.5 110.684 106.161 114.022 106.161 118.141C106.161 122.259 109.5 125.598 113.618 125.598Z"
                  fill="#040920"
                />
                <circle cx="107.338" cy="106.759" r="4.7098" fill="white" className="aksa-eye-glint" />
                <circle cx="118.328" cy="114.609" r="2.3549" fill="#202845" />
              </g>
              <g className="aksa-eyelid-login aksa-eyelid-login-r">
                <rect x="88" y="14" width="60" height="60" fill="#B9EC00" />
                <path
                  d="M97 70C107 77 127 77 137 70"
                  stroke="#0B1035"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
              <g className="aksa-login-closed-r">
                <rect x="88" y="78" width="60" height="62" fill="#B9EC00" />
                <path
                  d="M99 107C108 116 126 116 135 107"
                  stroke="#0B1035"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            </g>

            {/* Hidung */}
            <circle cx="81.0425" cy="133.055" r="1.7662" fill="#0B1035" />
            <circle cx="88.4995" cy="133.055" r="1.7662" fill="#0B1035" />

            {/* Blangkon */}
            <g className="aksa-login-blangkon">
              <path
                d="M141.977 64.8931C147.373 64.8931 151.748 60.081 151.748 54.145C151.748 48.209 147.373 43.397 141.977 43.397C136.581 43.397 132.206 48.209 132.206 54.145C132.206 60.081 136.581 64.8931 141.977 64.8931Z"
                fill="#724221"
                strokeWidth="2.93129"
                strokeLinejoin="round"
                stroke="#0B1035"
              />
              <g clipPath={`url(#${clipBlangkon})`}>
                <rect x="20" y="23" width="132" height="56" fill={`url(#${batikId})`} />
              </g>
              <path
                d="M23.3586 71.5967C26.6156 40.9809 47.4604 25.6731 85.8928 25.6731C124.325 25.6731 145.17 40.9809 148.427 71.5967L109.832 59.3829C102.015 66.874 94.0353 72.4109 85.8928 75.9936C77.4247 71.7595 69.445 66.2226 61.954 59.3829L23.3586 71.5967Z"
                strokeWidth="2.93129"
                strokeLinejoin="round"
                stroke="#0B1035"
              />
              <path
                d="M31.1754 44.2381C47.7111 46.6808 67.7158 50.7497 91.1896 56.4447M91.1896 56.4447C108.403 60.621 127.482 65.6716 148.427 71.5968M91.1896 56.4447C112.292 51.5639 128.928 47.495 141.099 44.2381M91.1896 56.4447C72.1968 60.8377 49.5865 65.8884 23.3586 71.5968M63.9082 28.116C69.445 36.9098 76.7733 43.9124 85.8928 49.1235C95.3381 43.5867 102.992 36.5841 108.855 28.116"
                strokeWidth="2.93129"
                strokeLinejoin="round"
                stroke="#0B1035"
              />
              <path
                d="M61.9539 59.3834L85.8927 47.6582L109.832 59.3834C102.015 67.2001 94.0352 72.737 85.8927 75.994C77.4246 71.7599 69.4449 66.223 61.9539 59.3834Z"
                fill="#8C5426"
                strokeWidth="2.93129"
                strokeLinejoin="round"
                stroke="#0B1035"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   4. MASKOT REGISTER PAGE (Berbasis public/assets/maskot regist.svg)
   Karakter: Antusias, mata berbinar ingin tahu bertemu teman baru di atas latar lime;
   jambul krem #FFFBEA bergoyang ceria, bintang kilau beterbangan, dan bereaksi ke input!
   ============================================================================ */
export function MaskotRegist({ mood = 'idle' }: { mood?: AuthMascotMood }) {
  const uid = useId().replace(/:/g, '');
  const batikId = `batik-regist-${uid}`;
  const clipBlangkon = `blangkon-regist-${uid}`;
  const clipEyeL = `eye-l-regist-${uid}`;
  const clipEyeR = `eye-r-regist-${uid}`;

  return (
    <div className={`aksa-regist-stage mood-${mood}`} aria-label="Maskot Aksa antusias mendaftar">
      <svg
        viewBox="0 0 350 192"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="aksa-regist-svg aksa-3d"
        role="img"
        aria-label="Maskot Aksa mendaftar"
      >
        <defs>
          <BatikPatternDef id={batikId} />
          <clipPath id={clipBlangkon}>
            <path d="M83.1429 70.13C87.9629 24.8226 118.81 2.16895 175.686 2.16895C232.561 2.16895 263.408 24.8226 268.228 70.13L211.112 52.0552C199.544 63.1411 187.735 71.335 175.686 76.6369C163.154 70.371 151.345 62.1771 140.259 52.0552L83.1429 70.13Z" />
          </clipPath>
          <clipPath id={clipEyeL}>
            <path d="M123.033 168.891C144.668 168.891 162.207 150.517 162.207 127.851C162.207 105.186 144.668 86.8123 123.033 86.8123C101.398 86.8123 83.8595 105.186 83.8595 127.851C83.8595 150.517 101.398 168.891 123.033 168.891Z" />
          </clipPath>
          <clipPath id={clipEyeR}>
            <path d="M226.253 168.891C247.888 168.891 265.427 150.517 265.427 127.851C265.427 105.186 247.888 86.8123 226.253 86.8123C204.618 86.8123 187.079 105.186 187.079 127.851C187.079 150.517 204.618 168.891 226.253 168.891Z" />
          </clipPath>
        </defs>

        {/* Bintang kilau antusias khas halaman Daftar */}
        <path
          d="M44 42L47 51L56 54L47 57L44 66L41 57L32 54L41 51L44 42Z"
          fill="#FFFBEA"
          className="aksa-regist-star aksa-regist-star-1"
        />
        <path
          d="M308 32L310.5 40.5L319 43L310.5 45.5L308 54L305.5 45.5L297 43L305.5 40.5L308 32Z"
          fill="#FFFBEA"
          className="aksa-regist-star aksa-regist-star-2"
        />
        <circle cx="62" cy="112" r="4" fill="#FFFBEA" opacity="0.85" className="aksa-regist-star aksa-regist-star-3" />
        <circle cx="294" cy="96" r="3.5" fill="#B9EC00" className="aksa-regist-star aksa-regist-star-3" />

        <g className="aksa-regist-rig">
          {/* Jambul krem #FFFBEA yang bergoyang lincah */}
          <path
            d="M167.803 59.4529C157.854 58.2093 154.745 51.3694 157.233 43.9077C159.72 35.8243 169.047 36.4461 172.156 42.6641C173.399 31.4716 184.592 26.4972 190.188 33.9589C197.028 43.2859 185.836 56.9657 175.887 58.8311L167.803 59.4529Z"
            fill="#FFFBEA"
            className="aksa-regist-sprout"
          />

          {/* Alis ekspresif */}
          <g className="aksa-regist-brows">
            <path
              d="M108.11 87.4343C115.986 80.3871 123.655 79.1435 131.117 83.7034"
              strokeWidth="6.83986"
              strokeLinecap="round"
              stroke="#0B1035"
              className="aksa-regist-brow-l"
            />
            <path
              d="M218.169 83.7034C226.046 79.1435 233.715 80.3871 241.176 87.4343"
              strokeWidth="6.83986"
              strokeLinecap="round"
              stroke="#0B1035"
              className="aksa-regist-brow-r"
            />
          </g>

          {/* Mata Kiri (kelopak di y=-12..80 agar 100% di atas y=86.81 saat terbuka) */}
          <g clipPath={`url(#${clipEyeL})`}>
            <path
              d="M123.033 168.891C144.668 168.891 162.207 150.517 162.207 127.851C162.207 105.186 144.668 86.8123 123.033 86.8123C101.398 86.8123 83.8595 105.186 83.8595 127.851C83.8595 150.517 101.398 168.891 123.033 168.891Z"
              fill="white"
            />
            <g className="aksa-regist-pupils">
              <path
                d="M131.117 160.807C143.48 160.807 153.502 149.672 153.502 135.935C153.502 122.198 143.48 111.063 131.117 111.063C118.754 111.063 108.732 122.198 108.732 135.935C108.732 149.672 118.754 160.807 131.117 160.807Z"
                fill="#0B1035"
              />
              <path
                d="M133.604 155.833C140.129 155.833 145.418 150.543 145.418 144.018C145.418 137.494 140.129 132.204 133.604 132.204C127.079 132.204 121.79 137.494 121.79 144.018C121.79 150.543 127.079 155.833 133.604 155.833Z"
                fill="#040920"
              />
              <circle cx="123.655" cy="125.986" r="7.462" fill="white" className="aksa-eye-glint" />
              <circle cx="141.066" cy="138.422" r="3.731" fill="#202845" />
            </g>
            <g className="aksa-eyelid-regist aksa-eyelid-regist-l">
              <rect x="78" y="-12" width="90" height="90" fill="#A8D800" />
              <path
                d="M93 74C110 83 136 83 153 74"
                stroke="#0B1035"
                strokeWidth="5.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* Tutup sopan saat mengetik sandi */}
            <g className="aksa-regist-closed-l">
              <rect x="78" y="82" width="90" height="92" fill="#A8D800" />
              <path
                d="M97 128C112 141 134 141 149 128"
                stroke="#0B1035"
                strokeWidth="6.4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Mata Kanan */}
          <g clipPath={`url(#${clipEyeR})`}>
            <path
              d="M226.253 168.891C247.888 168.891 265.427 150.517 265.427 127.851C265.427 105.186 247.888 86.8123 226.253 86.8123C204.618 86.8123 187.079 105.186 187.079 127.851C187.079 150.517 204.618 168.891 226.253 168.891Z"
              fill="white"
            />
            <g className="aksa-regist-pupils">
              <path
                d="M218.169 160.807C230.532 160.807 240.554 149.672 240.554 135.935C240.554 122.198 230.532 111.063 218.169 111.063C205.807 111.063 195.784 122.198 195.784 135.935C195.784 149.672 205.807 160.807 218.169 160.807Z"
                fill="#0B1035"
              />
              <path
                d="M220.657 155.833C227.181 155.833 232.471 150.543 232.471 144.018C232.471 137.494 227.181 132.204 220.657 132.204C214.132 132.204 208.842 137.494 208.842 144.018C208.842 150.543 214.132 155.833 220.657 155.833Z"
                fill="#040920"
              />
              <circle cx="210.708" cy="125.986" r="7.462" fill="white" className="aksa-eye-glint" />
              <circle cx="228.118" cy="138.422" r="3.731" fill="#202845" />
            </g>
            <g className="aksa-eyelid-regist aksa-eyelid-regist-r">
              <rect x="182" y="-12" width="90" height="90" fill="#A8D800" />
              <path
                d="M197 74C214 83 240 83 257 74"
                stroke="#0B1035"
                strokeWidth="5.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            <g className="aksa-regist-closed-r">
              <rect x="182" y="82" width="90" height="92" fill="#A8D800" />
              <path
                d="M200 128C215 141 237 141 252 128"
                stroke="#0B1035"
                strokeWidth="6.4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Titik hidung */}
          <circle cx="169.047" cy="167.647" r="2.798" fill="#0B1035" />
          <circle cx="180.861" cy="167.647" r="2.798" fill="#0B1035" />

          {/* Blangkon */}
          <g className="aksa-regist-blangkon">
            <path
              d="M258.683 60.2095C266.669 60.2095 273.143 53.0882 273.143 44.3037C273.143 35.5192 266.669 28.3979 258.683 28.3979C250.697 28.3979 244.223 35.5192 244.223 44.3037C244.223 53.0882 250.697 60.2095 258.683 60.2095Z"
              fill="#724221"
              strokeWidth="4.33794"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <g clipPath={`url(#${clipBlangkon})`}>
              <rect x="78" y="0" width="194" height="80" fill={`url(#${batikId})`} />
            </g>
            <path
              d="M83.1429 70.13C87.9629 24.8226 118.81 2.16895 175.686 2.16895C232.561 2.16895 263.408 24.8226 268.228 70.13L211.112 52.0552C199.544 63.1411 187.735 71.335 175.686 76.6369C163.154 70.371 151.345 62.1771 140.259 52.0552L83.1429 70.13Z"
              strokeWidth="4.33794"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <path
              d="M94.7108 29.6426C119.181 33.2576 148.786 39.279 183.524 47.7069M183.524 47.7069C208.998 53.8872 237.233 61.3616 268.228 70.13M183.524 47.7069C214.753 40.4839 239.372 34.4624 257.383 29.6426M183.524 47.7069C155.417 54.2079 121.957 61.6823 83.1429 70.13M143.151 5.78394C151.345 18.7978 162.19 29.1606 175.686 36.8725C189.663 28.6786 200.99 18.3158 209.666 5.78394"
              strokeWidth="4.33794"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <path
              d="M140.259 52.0554L175.686 34.7036L211.112 52.0554C199.544 63.6232 187.735 71.8171 175.686 76.637C163.154 70.3711 151.345 62.1772 140.259 52.0554Z"
              fill="#8C5426"
              strokeWidth="4.33794"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   5. MASKOT HOMEPAGE HERO BANNER (Berbasis public/assets/maskot homepage.svg)
   Karakter: Aksa mengintip ramah dari sudut kanan bawah banner hero, bernapas
   santai, berkedip alami, dan sesekali melirik tombol "Mulai belajar".
   ============================================================================ */
export function MaskotHomepageHero() {
  const uid = useId().replace(/:/g, '');
  const batikId = `batik-home-hero-${uid}`;
  const clipBlangkon = `blangkon-home-hero-${uid}`;
  const clipEyeL = `eye-l-home-hero-${uid}`;
  const clipEyeR = `eye-r-home-hero-${uid}`;

  return (
    <div className="aksa-home-hero-stage" aria-hidden="true">
      <svg
        viewBox="0 0 167 143"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="aksa-home-hero-svg aksa-3d"
      >
        <defs>
          <BatikPatternDef id={batikId} scale={0.72} />
          <clipPath id={clipBlangkon}>
            <path d="M29.1114 42.9866C33.643 13.6225 54.4324 -0.185899 91.4797 1.56152C128.527 3.30894 147.924 19.0128 149.672 48.6732L113.023 35.1448C105.147 42.0105 97.2037 46.985 89.1918 50.0684C81.2213 45.6019 73.7811 39.9017 66.871 32.968L29.1114 42.9866Z" />
          </clipPath>
          <clipPath id={clipEyeL}>
            <path d="M49.3294 125.274C65.2201 125.426 78.2306 112.053 78.3891 95.4054C78.5476 78.7579 65.7941 65.1398 49.9033 64.9885C34.0125 64.8372 21.002 78.21 20.8436 94.8575C20.6851 111.505 33.4386 125.123 49.3294 125.274Z" />
          </clipPath>
          <clipPath id={clipEyeR}>
            <path d="M125.143 125.996C141.034 126.147 154.045 112.774 154.203 96.1266C154.362 79.4791 141.608 65.861 125.717 65.7097C109.827 65.5584 96.8161 78.9312 96.6576 95.5787C96.4992 112.226 109.253 125.844 125.143 125.996Z" />
          </clipPath>
        </defs>

        {/* Bintang kilau lembut di kiri atas blangkon */}
        <path
          d="M18 22L19.8 27.2L25 29L19.8 30.8L18 36L16.2 30.8L11 29L16.2 27.2L18 22Z"
          fill="#FFFBEA"
          className="aksa-home-hero-star"
        />

        <g className="aksa-home-hero-rig">
          {/* Tubuh kubah lime */}
          <path
            d="M0.867092 80.7713C1.25947 39.5568 34.9886 6.46383 76.2031 6.85621L100.547 7.08797C141.761 7.48034 174.854 41.2094 174.462 82.424L174.144 115.837C173.841 147.685 147.777 173.257 115.93 172.954L57.6652 172.399C25.8176 172.096 0.245791 146.032 0.548989 114.185L0.867092 80.7713Z"
            fill="#A8D800"
          />

          {/* Alis */}
          <g className="aksa-home-hero-brows">
            <path
              d="M38.9378 65.3409C44.7718 60.2201 50.413 59.3604 55.8614 62.7616"
              strokeWidth="5.02405"
              strokeLinecap="round"
              stroke="#4D3423"
            />
            <path
              d="M119.802 63.3703C125.619 60.0763 131.242 61.0433 136.673 66.2713"
              strokeWidth="5.02405"
              strokeLinecap="round"
              stroke="#4D3423"
            />
          </g>

          {/* Mata Kiri */}
          <g clipPath={`url(#${clipEyeL})`}>
            <path
              d="M49.3294 125.274C65.2201 125.426 78.2306 112.053 78.3891 95.4054C78.5476 78.7579 65.7941 65.1398 49.9033 64.9885C34.0125 64.8372 21.002 78.21 20.8436 94.8575C20.6851 111.505 33.4386 125.123 49.3294 125.274Z"
              fill="white"
            />
            <g className="aksa-home-hero-pupils">
              <path
                d="M55.6713 120.002C46.5909 120.089 39.1518 111.98 39.0558 101.89C38.9597 91.8008 46.243 83.5517 55.3235 83.4652C64.4039 83.3788 71.8429 91.4878 71.939 101.577C72.035 111.667 64.7517 119.916 55.6713 120.002Z"
                fill="#4D3423"
              />
              <path
                d="M53.8102 116.365C49.018 116.411 45.0961 112.563 45.0505 107.77C45.0049 102.978 48.8527 99.0563 53.645 99.0107C58.4372 98.9651 62.359 102.813 62.4047 107.605C62.4503 112.397 58.6024 116.319 53.8102 116.365Z"
                fill="#040920"
              />
              <path
                d="M60.9607 99.8544C57.934 99.8832 55.457 97.453 55.4282 94.4263C55.3994 91.3996 57.8296 88.9227 60.8563 88.8938C63.883 88.865 66.3599 91.2953 66.3888 94.3219C66.4176 97.3486 63.9873 99.8256 60.9607 99.8544Z"
                fill="white"
                className="aksa-eye-glint"
              />
              <path
                d="M48.2339 106.37C46.7209 106.384 45.4826 105.169 45.4682 103.656C45.4538 102.143 46.6687 100.905 48.1818 100.89C49.6948 100.876 50.9331 102.091 50.9475 103.604C50.9619 105.117 49.747 106.355 48.2339 106.37Z"
                fill="#202845"
              />
            </g>
            <g className="aksa-home-hero-eyelid">
              <rect x="16" y="-8" width="68" height="68" fill="#A8D800" />
              <path
                d="M22 57C38 65 61 65 77 57"
                stroke="#4D3423"
                strokeWidth="3.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Mata Kanan */}
          <g clipPath={`url(#${clipEyeR})`}>
            <path
              d="M125.143 125.996C141.034 126.147 154.045 112.774 154.203 96.1266C154.362 79.4791 141.608 65.861 125.717 65.7097C109.827 65.5584 96.8161 78.9312 96.6576 95.5787C96.4992 112.226 109.253 125.844 125.143 125.996Z"
              fill="white"
            />
            <g className="aksa-home-hero-pupils">
              <path
                d="M119.611 119.393C110.53 119.48 103.091 111.371 102.995 101.281C102.899 91.1921 110.182 82.9429 119.263 82.8565C128.343 82.77 135.782 90.879 135.878 100.968C135.974 111.058 128.691 119.307 119.611 119.393Z"
                fill="#4D3423"
              />
              <path
                d="M117.75 115.757C112.957 115.802 109.036 111.955 108.99 107.162C108.944 102.37 112.792 98.4483 117.584 98.4027C122.377 98.3571 126.298 102.205 126.344 106.997C126.39 111.789 122.542 115.711 117.75 115.757Z"
                fill="#040920"
              />
              <path
                d="M124.9 99.2459C121.874 99.2747 119.397 96.8444 119.368 93.8178C119.339 90.7911 121.769 88.3141 124.796 88.2853C127.823 88.2565 130.3 90.6868 130.328 93.7134C130.357 96.7401 127.927 99.217 124.9 99.2459Z"
                fill="white"
                className="aksa-eye-glint"
              />
              <path
                d="M112.173 105.761C110.66 105.775 109.422 104.56 109.408 103.047C109.393 101.534 110.608 100.296 112.121 100.281C113.634 100.267 114.873 101.482 114.887 102.995C114.901 104.508 113.686 105.746 112.173 105.761Z"
                fill="#202845"
              />
            </g>
            <g className="aksa-home-hero-eyelid">
              <rect x="92" y="-8" width="68" height="68" fill="#A8D800" />
              <path
                d="M98 57C114 65 137 65 153 57"
                stroke="#4D3423"
                strokeWidth="3.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Titik hidung */}
          <path
            d="M83.1136 126.737C84.2484 126.748 85.1771 125.836 85.1879 124.702C85.1987 123.567 84.2875 122.638 83.1527 122.627C82.0179 122.616 81.0892 123.528 81.0784 124.662C81.0676 125.797 81.9788 126.726 83.1136 126.737Z"
            fill="#4D3423"
          />
          <path
            d="M91.791 126.819C92.9259 126.83 93.8546 125.919 93.8654 124.784C93.8762 123.649 92.965 122.72 91.8302 122.71C90.6954 122.699 89.7667 123.61 89.7559 124.745C89.7451 125.88 90.6562 126.808 91.791 126.819Z"
            fill="#4D3423"
          />

          {/* Blangkon Batik */}
          <g className="aksa-home-hero-blangkon">
            <path
              d="M143.76 41.9181C148.961 42.1634 153.397 37.7237 153.667 32.0016C153.937 26.2796 149.939 21.4421 144.737 21.1967C139.535 20.9513 135.099 25.3911 134.829 31.1131C134.56 36.8352 138.558 41.6727 143.76 41.9181Z"
              fill="#724221"
              strokeWidth="2.82878"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <g clipPath={`url(#${clipBlangkon})`}>
              <rect x="25" y="-2" width="129" height="56" fill={`url(#${batikId})`} />
            </g>
            <path
              d="M29.1114 42.9867C33.643 13.6225 54.4324 -0.185898 91.4797 1.56152C128.527 3.30894 147.924 19.0128 149.672 48.6732L113.023 35.1448C105.147 42.0105 97.2037 46.985 89.1918 50.0684C81.2213 45.6019 73.7811 39.9017 66.871 32.968L29.1114 42.9867Z"
              strokeWidth="2.82878"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <path
              d="M37.8906 16.9694C53.7192 20.076 72.8179 24.9078 95.1867 31.4648M95.1867 31.4648C111.59 36.2732 129.752 42.0093 149.672 48.6732M95.1867 31.4648C115.75 27.7194 131.972 24.5535 143.852 21.9674M95.1867 31.4648C76.6787 34.8359 54.6537 38.6765 29.1116 42.9867M70.1766 2.91667C75.1141 11.6453 81.8598 18.7287 90.4137 24.1667C99.7703 19.2588 107.467 12.8567 113.503 4.96027"
              strokeWidth="2.82878"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
            <path
              d="M66.8707 32.9679L90.4799 22.7537L113.023 35.1447C105.132 42.3244 97.1887 47.2989 89.1916 50.0683C81.2211 45.6018 73.7808 39.9016 66.8707 32.9679Z"
              fill="#8C5426"
              strokeWidth="2.82878"
              strokeLinejoin="round"
              stroke="#0B1035"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   6. MASKOT KARTU BAB HOMEPAGE (Berbasis public/assets/maskot homepage bab 1-3.svg)
   Karakter: Masing-masing maskot bab beranimasi vektor penuh sesuai temanya
   (Bab 1 papan aksara, Bab 2 menulis dengan pensil, Bab 3 kartu pangkon).
   ============================================================================ */
export function MaskotHomepageBab({ bab }: { bab: number }) {
  const uid = useId().replace(/:/g, '');
  const batikId = `batik-hb-${bab}-${uid}`;
  const clipCard = `card-hb-${bab}-${uid}`;
  const clipBlangkon = `blangkon-hb-${bab}-${uid}`;
  const clipEyeL = `eye-l-hb-${bab}-${uid}`;
  const clipEyeR = `eye-r-hb-${bab}-${uid}`;

  if (bab === 1) {
    return (
      <svg viewBox="0 0 108 124" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="aksa-bab-svg aksa-bab-1 aksa-3d" aria-hidden="true">
        <defs>
          <BatikPatternDef id={batikId} scale={0.42} />
          <clipPath id={clipCard}>
            <rect width="108" height="124" rx="18" />
          </clipPath>
          <clipPath id={clipBlangkon}>
            <path d="M16.4664 34.5911C18.6209 15.7629 31.526 6.44279 55.1815 6.6309C78.8369 6.81901 91.5921 16.3431 93.447 35.2033L69.751 27.4967C64.9031 32.0693 59.9644 35.4382 54.9352 37.6036C49.7437 34.956 44.8592 31.5089 40.2819 27.2624L16.4664 34.5911Z" />
          </clipPath>
          <clipPath id={clipEyeL}>
            <path d="M32.2923 74.2161C41.3875 74.2161 48.7606 66.4919 48.7606 56.9636C48.7606 47.4353 41.3875 39.7111 32.2923 39.7111C23.1971 39.7111 15.824 47.4353 15.824 56.9636C15.824 66.4919 23.1971 74.2161 32.2923 74.2161Z" />
          </clipPath>
          <clipPath id={clipEyeR}>
            <path d="M75.685 74.2161C84.7802 74.2161 92.1533 66.4919 92.1533 56.9636C92.1533 47.4353 84.7802 39.7111 75.685 39.7111C66.5898 39.7111 59.2167 47.4353 59.2167 56.9636C59.2167 66.4919 66.5898 74.2161 75.685 74.2161Z" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipCard})`}>
          <rect width="108" height="124" rx="18" fill="#E7EDDA" />
          <g className="aksa-bab-rig aksa-bab1-rig">
            <path d="M-2.21277 130.825V51.2128C-2.21277 20.6288 110.19 20.6288 110.19 51.2128L107.445 130.825H-2.21277Z" fill="#A8D800" />
            <g className="aksa-bab-brows">
              <path d="M26.0187 39.9725C29.3298 37.0099 32.5537 36.4871 35.6906 38.404" strokeWidth="2.87542" strokeLinecap="round" stroke="#4D3423" />
              <path d="M72.2869 38.404C75.598 36.4871 78.8219 37.0099 81.9587 39.9725" strokeWidth="2.87542" strokeLinecap="round" stroke="#4D3423" />
            </g>
            <g clipPath={`url(#${clipEyeL})`}>
              <path d="M32.2923 74.2161C41.3875 74.2161 48.7606 66.4919 48.7606 56.9636C48.7606 47.4353 41.3875 39.7111 32.2923 39.7111C23.1971 39.7111 15.824 47.4353 15.824 56.9636C15.824 66.4919 23.1971 74.2161 32.2923 74.2161Z" fill="white" />
              <g className="aksa-bab-pupils aksa-bab1-pupils">
                <path d="M35.6905 70.8179C40.8878 70.8179 45.101 66.1366 45.101 60.3618C45.101 54.5871 40.8878 49.9058 35.6905 49.9058C30.4932 49.9058 26.28 54.5871 26.28 60.3618C26.28 66.1366 30.4932 70.8179 35.6905 70.8179Z" fill="#0B1035" />
                <path d="M36.7362 68.7267C39.4792 68.7267 41.7028 66.5031 41.7028 63.7601C41.7028 61.0171 39.4792 58.7935 36.7362 58.7935C33.9932 58.7935 31.7695 61.0171 31.7695 63.7601C31.7695 66.5031 33.9932 68.7267 36.7362 68.7267Z" fill="#040920" />
                <path d="M32.5537 59.3163C34.2861 59.3163 35.6905 57.9118 35.6905 56.1794C35.6905 54.447 34.2861 53.0426 32.5537 53.0426C30.8213 53.0426 29.4169 54.447 29.4169 56.1794C29.4169 57.9118 30.8213 59.3163 32.5537 59.3163Z" fill="white" />
                <path d="M39.873 62.9758C40.7392 62.9758 41.4414 62.2736 41.4414 61.4074C41.4414 60.5412 40.7392 59.839 39.873 59.839C39.0068 59.839 38.3046 60.5412 38.3046 61.4074C38.3046 62.2736 39.0068 62.9758 39.873 62.9758Z" fill="#202845" />
              </g>
              <g className="aksa-bab-eyelid aksa-bab1-eyelid">
                <rect x="13" y="-2" width="39" height="38" fill="#A8D800" />
                <path d="M17 34C26 39 39 39 48 34" stroke="#4D3423" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              </g>
            </g>
            <g clipPath={`url(#${clipEyeR})`}>
              <path d="M75.685 74.2161C84.7802 74.2161 92.1533 66.4919 92.1533 56.9636C92.1533 47.4353 84.7802 39.7111 75.685 39.7111C66.5898 39.7111 59.2167 47.4353 59.2167 56.9636C59.2167 66.4919 66.5898 74.2161 75.685 74.2161Z" fill="white" />
              <g className="aksa-bab-pupils aksa-bab1-pupils">
                <path d="M72.2868 70.8179C77.4841 70.8179 81.6973 66.1366 81.6973 60.3618C81.6973 54.5871 77.4841 49.9058 72.2868 49.9058C67.0896 49.9058 62.8763 54.5871 62.8763 60.3618C62.8763 66.1366 67.0896 70.8179 72.2868 70.8179Z" fill="#0B1035" />
                <path d="M73.3324 68.7267C76.0754 68.7267 78.299 66.5031 78.299 63.7601C78.299 61.0171 76.0754 58.7935 73.3324 58.7935C70.5894 58.7935 68.3657 61.0171 68.3657 63.7601C68.3657 66.5031 70.5894 68.7267 73.3324 68.7267Z" fill="#040920" />
                <path d="M69.15 59.3163C70.8824 59.3163 72.2868 57.9118 72.2868 56.1794C72.2868 54.447 70.8824 53.0426 69.15 53.0426C67.4176 53.0426 66.0132 54.447 66.0132 56.1794C66.0132 57.9118 67.4176 59.3163 69.15 59.3163Z" fill="white" />
                <path d="M76.4692 62.9758C77.3354 62.9758 78.0376 62.2736 78.0376 61.4074C78.0376 60.5412 77.3354 59.839 76.4692 59.839C75.603 59.839 74.9008 60.5412 74.9008 61.4074C74.9008 62.2736 75.603 62.9758 76.4692 62.9758Z" fill="#202845" />
              </g>
              <g className="aksa-bab-eyelid aksa-bab1-eyelid">
                <rect x="56" y="-2" width="39" height="38" fill="#A8D800" />
                <path d="M60 34C69 39 82 39 91 34" stroke="#4D3423" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              </g>
            </g>
            <path d="M51.636 74.8697C52.2857 74.8697 52.8123 74.3431 52.8123 73.6934C52.8123 73.0437 52.2857 72.5171 51.636 72.5171C50.9864 72.5171 50.4597 73.0437 50.4597 73.6934C50.4597 74.3431 50.9864 74.8697 51.636 74.8697Z" fill="#4D3423" />
            <path d="M56.6027 74.8697C57.2524 74.8697 57.779 74.3431 57.779 73.6934C57.779 73.0437 57.2524 72.5171 56.6027 72.5171C55.953 72.5171 55.4264 73.0437 55.4264 73.6934C55.4264 74.3431 55.953 74.8697 56.6027 74.8697Z" fill="#4D3423" />
            <path d="M46.9308 79.1827C51.636 83.1909 56.3413 83.1909 61.0465 79.1827" strokeWidth="1.30701" strokeLinecap="round" stroke="#4D3423" />
            <g className="aksa-bab-blangkon">
              <path d="M89.5098 31.0457C92.8313 31.0721 95.5475 28.1317 95.5766 24.478C95.6056 20.8244 92.9366 17.8411 89.6151 17.8147C86.2936 17.7883 83.5774 20.7287 83.5483 24.3824C83.5193 28.036 86.1883 31.0193 89.5098 31.0457Z" fill="#724221" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
              <g clipPath={`url(#${clipBlangkon})`}>
                <rect x="14" y="4" width="82" height="38" fill={`url(#${batikId})`} />
              </g>
              <path d="M16.4664 34.5911C18.6209 15.7629 31.526 6.44279 55.1815 6.6309C78.8369 6.81901 91.5921 16.3431 93.447 35.2033L69.751 27.4967C64.9031 32.0693 59.9645 35.4382 54.9352 37.6036C49.7437 34.956 44.8592 31.5089 40.2819 27.2624L16.4664 34.5911Z" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
              <path d="M21.4117 17.7897C31.5776 19.3741 43.8707 21.9765 58.2911 25.5967M58.2911 25.5967C68.8658 28.2515 80.5845 31.4536 93.4471 35.2031M58.2911 25.5967C71.3036 22.6958 81.5634 20.2728 89.0704 18.3277M58.2911 25.5967C46.5795 28.2076 32.6379 31.2057 16.4665 34.5909M41.6379 8.02659C45.0028 13.4664 49.4791 17.8124 55.0668 21.0645C60.9075 17.7028 65.6529 13.4301 69.3028 8.24658" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
              <path d="M40.2817 27.2625L55.0737 20.1627L69.7509 27.4968C64.9013 32.2698 59.9627 35.6388 54.935 37.6036C49.7435 34.9561 44.8591 31.509 40.2817 27.2625Z" fill="#8C5426" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
            </g>
            {/* Papan aksara "ha" & tangan bergerak lembut */}
            <path d="M26.9994 92.9917V120.989M80.9946 92.9917V120.989" strokeWidth="3.99965" strokeLinecap="round" stroke="#9B632D" />
            <g className="aksa-bab1-slate">
              <path d="M81.9945 73.9934H26.9994C23.1337 73.9934 20 77.1271 20 80.9928V105.991C20 109.856 23.1337 112.99 26.9994 112.99H81.9945C85.8602 112.99 88.9939 109.856 88.9939 105.991V80.9928C88.9939 77.1271 85.8602 73.9934 81.9945 73.9934Z" fill="#52632F" strokeWidth="2.49978" stroke="#4D3423" />
              <path d="M79.9947 78.993H28.9992C27.3425 78.993 25.9995 80.3361 25.9995 81.9928V102.991C25.9995 104.648 27.3425 105.991 28.9992 105.991H79.9947C81.6514 105.991 82.9945 104.648 82.9945 102.991V81.9928C82.9945 80.3361 81.6514 78.993 79.9947 78.993Z" fill="#F7F4F1" />
              <path d="M43.8566 99.9934C42.6507 99.8494 41.6968 99.4535 40.9948 98.8055C40.3109 98.1576 39.9689 97.2037 39.9689 95.9438V89.5183C39.9689 86.6746 41.4088 85.2527 44.2886 85.2527C47.1323 85.2527 48.5542 86.6296 48.5542 89.3833V96.4567C48.5542 97.5906 49.0851 98.1576 50.147 98.1576H52.3608C53.4227 98.1576 53.9537 97.5906 53.9537 96.4567V89.5183C53.9537 88.1325 54.2777 87.0796 54.9256 86.3596C55.5916 85.6217 56.6355 85.2527 58.0573 85.2527C58.7953 85.2527 59.4612 85.4057 60.0552 85.7117C60.6491 85.9996 61.1171 86.4136 61.459 86.9536C62.143 85.8197 63.2049 85.2527 64.6448 85.2527C67.4165 85.2527 68.8024 86.6296 68.8024 89.3833V99.9934H66.4536V89.3564C66.4536 87.9885 65.8056 87.3045 64.5098 87.3045C63.1959 87.3045 62.5389 88.0155 62.5389 89.4373V99.9934H60.1901V89.3564C60.1901 88.7264 60.0192 88.2315 59.6772 87.8715C59.3352 87.4935 58.8583 87.3045 58.2463 87.3045C56.9504 87.3045 56.3025 88.0155 56.3025 89.4373V96.4027C56.3025 98.7965 55.0336 99.9934 52.4958 99.9934H50.012C47.4923 99.9934 46.2324 98.7965 46.2324 96.4027V89.3564C46.2324 87.9885 45.5844 87.3045 44.2886 87.3045C42.9747 87.3045 42.3177 88.0155 42.3177 89.4373V95.8358C42.3177 97.1677 42.9927 97.9416 44.3426 98.1576L43.8566 99.9934Z" fill="#4D3423" />
              <path d="M19 101.991C21.7612 101.991 23.9996 98.4095 23.9996 93.9916C23.9996 89.5737 21.7612 85.9923 19 85.9923C16.2389 85.9923 14.0005 89.5737 14.0005 93.9916C14.0005 98.4095 16.2389 101.991 19 101.991Z" fill="#A8D800" strokeWidth="1.49987" stroke="#52632F" />
            </g>
            <g className="aksa-bab1-pointer">
              <path d="M90.9937 65.9941L88.9939 89.992" strokeWidth="2.99973" strokeLinecap="round" stroke="#9B632D" />
              <path d="M90.9937 91.9918C93.7549 91.9918 95.9933 88.8581 95.9933 84.9924C95.9933 81.1268 93.7549 77.993 90.9937 77.993C88.2325 77.993 85.9941 81.1268 85.9941 84.9924C85.9941 88.8581 88.2325 91.9918 90.9937 91.9918Z" fill="#A8D800" strokeWidth="1.49987" stroke="#52632F" />
            </g>
          </g>
        </g>
      </svg>
    );
  }

  if (bab === 2) {
    return (
      <svg viewBox="0 0 108 124" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="aksa-bab-svg aksa-bab-2 aksa-3d" aria-hidden="true">
        <defs>
          <BatikPatternDef id={batikId} scale={0.42} />
          <clipPath id={clipCard}>
            <rect width="108" height="124" rx="18" />
          </clipPath>
          <clipPath id={clipBlangkon}>
            <path d="M11.5429 48.6035C12.2424 29.6653 24.3921 19.3799 47.9919 17.7474C71.5917 16.1148 85.0419 24.6293 88.3424 43.2909L64.1237 37.4304C59.642 42.3624 54.9772 46.1013 50.1294 48.6472C44.7496 46.4069 39.6144 43.3459 34.7239 39.4641L11.5429 48.6035Z" />
          </clipPath>
          <clipPath id={clipEyeL}>
            <path d="M32.9878 86.7387C42.0332 85.788 48.5585 77.3354 47.5625 67.8593C46.5666 58.3831 38.4264 51.4719 29.381 52.4226C20.3357 53.3733 13.8103 61.826 14.8063 71.3021C15.8023 80.7782 23.9424 87.6894 32.9878 86.7387Z" />
          </clipPath>
          <clipPath id={clipEyeR}>
            <path d="M76.1428 82.2029C85.1882 81.2522 91.7136 72.7996 90.7176 63.3235C89.7216 53.8474 81.5815 46.9362 72.5361 47.8869C63.4907 48.8376 56.9654 57.2902 57.9613 66.7663C58.9573 76.2424 67.0975 83.1536 76.1428 82.2029Z" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipCard})`}>
          <rect width="108" height="124" rx="18" fill="#FFF0DF" />
          <g className="aksa-bab-rig aksa-bab2-rig">
            <path d="M-0.555176 108.826L-3.6124 68.6132C-6.96977 36.67 104.817 24.9207 108.175 56.8639L108.175 108.826L-0.555176 108.826Z" fill="#A8D800" />
            <g className="aksa-bab-brows">
              <path d="M23.1691 53.3384C26.1524 50.046 29.304 49.189 32.6241 50.7676" strokeWidth="2.87542" strokeLinecap="round" stroke="#4D3423" />
              <path d="M69.0198 46.9423C72.1124 44.6897 75.3733 44.8727 78.8026 47.4911" strokeWidth="2.87542" strokeLinecap="round" stroke="#4D3423" />
            </g>
            <g clipPath={`url(#${clipEyeL})`}>
              <path d="M32.9878 86.7387C42.0332 85.788 48.5585 77.3354 47.5625 67.8593C46.5666 58.3831 38.4264 51.4719 29.381 52.4226C20.3357 53.3733 13.8103 61.826 14.8063 71.3021C15.8023 80.7782 23.9424 87.6894 32.9878 86.7387Z" fill="white" />
              <g className="aksa-bab-pupils aksa-bab2-pupils">
                <path d="M36.0122 83.0039C41.181 82.4606 44.8818 77.3645 44.2782 71.6214C43.6746 65.8783 38.9951 61.663 33.8263 62.2063C28.6575 62.7495 24.9567 67.8456 25.5604 73.5887C26.164 79.3318 30.8435 83.5471 36.0122 83.0039Z" fill="#0B1035" />
                <path d="M36.8336 80.8148C39.5615 80.5281 41.5406 78.0842 41.2539 75.3562C40.9671 72.6282 38.5232 70.6492 35.7953 70.9359C33.0673 71.2226 31.0883 73.6665 31.375 76.3945C31.6617 79.1225 34.1056 81.1015 36.8336 80.8148Z" fill="#040920" />
                <path d="M31.6903 71.8931C33.4133 71.712 34.6632 70.1685 34.4821 68.4456C34.301 66.7226 32.7575 65.4727 31.0346 65.6538C29.3116 65.8349 28.0617 67.3784 28.2428 69.1013C28.4239 70.8243 29.9674 72.0742 31.6903 71.8931Z" fill="white" />
                <path d="M39.3521 74.7676C40.2135 74.677 40.8385 73.9053 40.7479 73.0438C40.6574 72.1824 39.8856 71.5574 39.0242 71.6479C38.1627 71.7385 37.5378 72.5102 37.6283 73.3717C37.7188 74.2332 38.4906 74.8581 39.3521 74.7676Z" fill="#202845" />
              </g>
              <g className="aksa-bab-eyelid aksa-bab2-eyelid">
                <rect x="12" y="10" width="38" height="38" fill="#A8D800" />
                <path d="M15 46C24 51 37 51 46 46" stroke="#4D3423" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              </g>
            </g>
            <g clipPath={`url(#${clipEyeR})`}>
              <path d="M76.1428 82.2029C85.1882 81.2522 91.7136 72.7996 90.7176 63.3235C89.7216 53.8474 81.5815 46.9362 72.5361 47.8869C63.4907 48.8376 56.9654 57.2902 57.9613 66.7663C58.9573 76.2424 67.0975 83.1536 76.1428 82.2029Z" fill="white" />
              <g className="aksa-bab-pupils aksa-bab2-pupils">
                <path d="M72.408 79.1786C77.5768 78.6353 81.2776 73.5392 80.674 67.7961C80.0703 62.053 75.3909 57.8377 70.2221 58.381C65.0533 58.9242 61.3525 64.0203 61.9561 69.7634C62.5597 75.5065 67.2392 79.7218 72.408 79.1786Z" fill="#0B1035" />
                <path d="M73.2293 76.9895C75.9573 76.7027 77.9363 74.2589 77.6496 71.5309C77.3629 68.8029 74.919 66.8239 72.191 67.1106C69.463 67.3973 67.484 69.8412 67.7707 72.5692C68.0575 75.2972 70.5014 77.2762 73.2293 76.9895Z" fill="#040920" />
                <path d="M68.0862 68.0678C69.8091 67.8867 71.059 66.3432 70.878 64.6202C70.6969 62.8973 69.1534 61.6474 67.4304 61.8285C65.7075 62.0096 64.4576 63.5531 64.6387 65.276C64.8198 66.9989 66.3633 68.2489 68.0862 68.0678Z" fill="white" />
                <path d="M75.7478 70.9423C76.6093 70.8517 77.2342 70.08 77.1437 69.2185C77.0531 68.357 76.2814 67.7321 75.4199 67.8226C74.5585 67.9132 73.9335 68.6849 74.0241 69.5464C74.1146 70.4079 74.8864 71.0328 75.7478 70.9423Z" fill="#202845" />
              </g>
              <g className="aksa-bab-eyelid aksa-bab2-eyelid">
                <rect x="55" y="5" width="38" height="38" fill="#A8D800" />
                <path d="M58 41C67 46 80 46 89 41" stroke="#4D3423" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              </g>
            </g>
            <path d="M52.294 85.3667C52.9401 85.2988 53.4088 84.72 53.3409 84.0739C53.273 83.4278 52.6941 82.959 52.048 83.0269C51.4019 83.0949 50.9332 83.6737 51.0011 84.3198C51.069 84.9659 51.6479 85.4346 52.294 85.3667Z" fill="#4D3423" />
            <path d="M57.2334 84.8475C57.8795 84.7796 58.3482 84.2008 58.2803 83.5547C58.2124 82.9086 57.6336 82.4399 56.9875 82.5078C56.3414 82.5757 55.8727 83.1545 55.9406 83.8006C56.0085 84.4467 56.5873 84.9154 57.2334 84.8475Z" fill="#4D3423" />
            <path d="M48.0653 90.1479C53.1637 93.6423 57.8432 93.1505 62.1037 88.6725" strokeWidth="1.30701" strokeLinecap="round" stroke="#4D3423" />
            <g className="aksa-bab-blangkon">
              <path d="M84.097 39.4486C87.4107 39.2193 89.8926 36.0786 89.6404 32.4336C89.3883 28.7885 86.4976 26.0194 83.1839 26.2486C79.8702 26.4779 77.3884 29.6186 77.6405 33.2637C77.8927 36.9087 80.7833 39.6778 84.097 39.4486Z" fill="#724221" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
              <g clipPath={`url(#${clipBlangkon})`}>
                <rect x="9" y="15" width="82" height="38" fill={`url(#${batikId})`} />
              </g>
              <path d="M11.5429 48.6035C12.2424 29.6653 24.3921 19.3799 47.9919 17.7474C71.5917 16.1148 85.0419 24.6293 88.3424 43.2909L64.1237 37.4304C59.642 42.3624 54.9772 46.1013 50.1294 48.6472C44.7496 46.4069 39.6144 43.3459 34.7239 39.4641L11.5429 48.6035Z" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
              <path d="M15.1808 31.4713C25.4385 32.2689 37.8954 33.9177 52.5516 36.4177M52.5516 36.4177C63.2993 38.251 75.2295 40.5419 88.3425 43.2906M52.5516 36.4177C65.3023 32.5242 75.3452 29.319 82.6804 26.802M52.5516 36.4177C41.0756 39.922 27.406 43.9838 11.543 48.6033M34.5959 20.181C38.3694 25.3458 43.1668 29.3344 48.9881 32.147C54.5529 28.3458 58.9554 23.7208 62.1957 18.2718" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
              <path d="M34.7238 39.4641L48.9256 31.2473L64.1236 37.4304C59.6556 42.5624 54.9909 46.3013 50.1293 48.6472C44.7494 46.4069 39.6143 43.3459 34.7238 39.4641Z" fill="#8C5426" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
            </g>
            {/* Meja kayu & kertas */}
            <path d="M-4.11035 108.652H112.89V124.5H-4.11035V108.652Z" fill="#B77D45" />
            <path d="M19.4449 85.3189L72.4402 81.3192L82.4394 113.316L27.4442 116.316L19.4449 85.3189Z" fill="#FFFAF0" strokeWidth="1.99982" strokeLinejoin="round" stroke="#4D3423" />
            <path d="M28.4441 107.317L64.4409 105.317M30.4439 112.316L49.4422 111.316" strokeWidth="1.49987" stroke="#DED3C3" />
            <path d="M40.5123 102.319C39.4851 102.197 38.6725 101.859 38.0745 101.307C37.4919 100.755 37.2006 99.9428 37.2006 98.8695V93.396C37.2006 90.9736 38.4272 89.7623 40.8803 89.7623C43.3027 89.7623 44.514 90.9352 44.514 93.281V96.4087H46.7908V94.8449C46.7908 91.4565 48.5003 89.7623 51.9193 89.7623C53.9125 89.7623 55.323 90.3296 56.1509 91.4642C56.7795 90.3296 57.7071 89.7623 58.9337 89.7623C61.2181 89.7623 62.3604 90.9352 62.3604 93.281V102.319H60.3596V93.258C60.3596 92.0928 59.8076 91.5102 58.7037 91.5102C57.5845 91.5102 57.0248 92.1158 57.0248 93.327V102.319H55.047V94.7069C55.047 92.5757 54.0044 91.5102 51.9193 91.5102C49.8342 91.5102 48.7916 92.5987 48.7916 94.7759V96.4087C49.8342 96.4241 50.6697 96.723 51.2984 97.3057C51.9423 97.8883 52.2643 98.6549 52.2643 99.6055C52.2643 100.203 52.1493 100.709 51.9193 101.123C51.7047 101.522 51.398 101.821 50.9994 102.02C50.6007 102.22 50.1255 102.319 49.5735 102.319C48.6843 102.319 47.9943 102.097 47.5037 101.652C47.0284 101.208 46.7908 100.541 46.7908 99.6515V98.1336H44.514V102.319H42.5361V93.258C42.5361 92.0928 41.9842 91.5102 40.8803 91.5102C39.761 91.5102 39.2014 92.1158 39.2014 93.327V98.7775C39.2014 99.9121 39.7764 100.571 40.9263 100.755L40.5123 102.319ZM49.6655 100.686C50.0028 100.686 50.2251 100.594 50.3324 100.41C50.4551 100.211 50.5164 99.9504 50.5164 99.6285C50.5164 99.1378 50.3554 98.7699 50.0335 98.5246C49.7268 98.2639 49.3129 98.1336 48.7916 98.1336V99.6515C48.7916 100.341 49.0829 100.686 49.6655 100.686ZM55.5003 88.6584L53.2005 88.2445C52.2959 88.0758 51.5523 87.7615 50.9697 87.3015C50.3718 86.8416 50.0728 86.259 50.0728 85.5537C50.0728 84.6798 50.3641 84.0282 50.9467 83.5989C51.5294 83.1542 52.2346 82.9319 53.0625 82.9319C54.0745 82.9319 54.8487 83.2156 55.3853 83.7829C55.922 84.3348 56.1903 85.1091 56.1903 86.1057V88.2215L55.5003 88.6584ZM54.3734 86.9106V85.9677C54.3734 85.4464 54.2354 85.0631 53.9595 84.8178C53.6835 84.5571 53.3462 84.4268 52.9476 84.4268C52.6562 84.4268 52.3956 84.5111 52.1656 84.6798C51.9356 84.8331 51.8207 85.0631 51.8207 85.3697C51.8207 85.799 51.9586 86.1057 52.2346 86.2896C52.4953 86.4736 52.8096 86.6039 53.1775 86.6806L54.3734 86.9106Z" fill="#4D3423" />
            {/* Pensil & tangan animasi menulis */}
            <g className="aksa-bab2-pencil">
              <path d="M80.4395 70.3202L85.4391 73.3199L64.441 101.317L59.4414 103.317L60.4413 97.3178L80.4395 70.3202Z" fill="#FFD263" strokeWidth="1.49987" strokeLinejoin="round" stroke="#4D3423" />
              <path d="M59.4414 103.318L61.4414 97.3177L64.4414 101.318L59.4414 103.318Z" fill="#4D3423" />
              <path d="M80.7851 89.0342C84.0683 86.078 85.232 82.0181 83.3844 79.9662C81.5368 77.9142 77.3775 78.6472 74.0944 81.6034C70.8113 84.5595 69.6475 88.6194 71.4951 90.6713C73.3427 92.7233 77.502 91.9903 80.7851 89.0342Z" fill="#A8D800" strokeWidth="1.49987" stroke="#52632F" />
            </g>
          </g>
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 108 124" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="aksa-bab-svg aksa-bab-3 aksa-3d" aria-hidden="true">
      <defs>
        <BatikPatternDef id={batikId} scale={0.42} />
        <clipPath id={clipCard}>
          <rect width="108" height="124" rx="18" />
        </clipPath>
        <clipPath id={clipBlangkon}>
          <path d="M14.4664 35.5937C16.6209 16.7654 29.526 7.44536 53.1815 7.63347C76.8369 7.82157 89.5921 17.3457 91.447 36.2058L67.751 28.4993C62.9031 33.0719 57.9644 36.4408 52.9352 38.6061C47.7437 35.9586 42.8592 32.5115 38.2819 28.265L14.4664 35.5937Z" />
        </clipPath>
        <clipPath id={clipEyeL}>
          <path d="M31.116 78.9569C40.1987 79.4329 47.966 72.1051 48.4647 62.5899C48.9633 53.0746 42.0046 44.9751 32.9218 44.4991C23.8391 44.0231 16.0718 51.3508 15.5731 60.8661C15.0745 70.3814 22.0332 78.4809 31.116 78.9569Z" />
        </clipPath>
        <clipPath id={clipEyeR}>
          <path d="M74.4492 81.2279C83.532 81.7039 91.2992 74.3761 91.7979 64.8609C92.2966 55.3456 85.3378 47.2461 76.2551 46.7701C67.1723 46.2941 59.4051 53.6218 58.9064 63.1371C58.4077 72.6523 65.3665 80.7519 74.4492 81.2279Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipCard})`}>
        <rect width="108" height="124" rx="18" fill="#F0EAFB" />
        <g className="aksa-bab-rig aksa-bab3-rig">
          <path d="M-2.13786 125.327L-2.13786 48.1792C-0.537217 17.6371 111.712 23.5198 110.111 54.0619L110.111 125.327L-2.13786 125.327Z" fill="#A8D800" />
          <g className="aksa-bab-brows">
            <path d="M26.6431 42.4318C30.1047 39.6466 33.3516 39.2932 36.3838 41.3717" strokeWidth="2.87542" strokeLinecap="round" stroke="#4D3423" />
            <path d="M72.9299 43.287C76.3368 41.546 79.529 42.2368 82.5064 45.3595" strokeWidth="2.87542" strokeLinecap="round" stroke="#4D3423" />
          </g>
          <g clipPath={`url(#${clipEyeL})`}>
            <path d="M31.116 78.9569C40.1987 79.4329 47.966 72.1051 48.4647 62.5899C48.9633 53.0746 42.0046 44.9751 32.9218 44.4991C23.8391 44.0231 16.0718 51.3508 15.5731 60.8661C15.0745 70.3814 22.0332 78.4809 31.116 78.9569Z" fill="white" />
            <g className="aksa-bab-pupils aksa-bab3-pupils">
              <path d="M34.6874 75.7411C39.8775 76.0131 44.33 71.5587 44.6322 65.7919C44.9344 60.0251 40.972 55.1296 35.7819 54.8576C30.5917 54.5856 26.1393 59.04 25.837 64.8069C25.5348 70.5737 29.4973 75.4691 34.6874 75.7411Z" fill="#0B1035" />
              <path d="M35.841 73.7076C38.5802 73.8511 40.9172 71.7469 41.0607 69.0077C41.2043 66.2684 39.1001 63.9314 36.3608 63.7879C33.6216 63.6443 31.2846 65.7485 31.1411 68.4878C30.9975 71.227 33.1017 73.564 35.841 73.7076Z" fill="#040920" />
              <path d="M32.1568 64.0911C33.8869 64.1818 35.3629 62.8528 35.4535 61.1227C35.5442 59.3927 34.2152 57.9167 32.4852 57.826C30.7551 57.7354 29.2792 59.0643 29.1885 60.7944C29.0978 62.5244 30.4268 64.0004 32.1568 64.0911Z" fill="white" />
              <path d="M39.2745 68.1287C40.1396 68.174 40.8775 67.5095 40.9229 66.6445C40.9682 65.7795 40.3037 65.0415 39.4387 64.9961C38.5737 64.9508 37.8357 65.6153 37.7904 66.4803C37.745 67.3453 38.4095 68.0833 39.2745 68.1287Z" fill="#202845" />
            </g>
            <g className="aksa-bab-eyelid aksa-bab3-eyelid">
              <rect x="13" y="2" width="39" height="38" fill="#A8D800" />
              <path d="M16 38C25 43 38 43 47 38" stroke="#4D3423" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </g>
          </g>
          <g clipPath={`url(#${clipEyeR})`}>
            <path d="M74.4492 81.2279C83.532 81.7039 91.2992 74.3761 91.7979 64.8609C92.2966 55.3456 85.3378 47.2461 76.2551 46.7701C67.1723 46.2941 59.4051 53.6218 58.9064 63.1371C58.4077 72.6523 65.3665 80.7519 74.4492 81.2279Z" fill="white" />
            <g className="aksa-bab-pupils aksa-bab3-pupils">
              <path d="M71.2335 77.6564C76.4237 77.9284 80.8761 73.474 81.1783 67.7072C81.4806 61.9403 77.5181 57.0449 72.328 56.7729C67.1379 56.5009 62.6854 60.9553 62.3832 66.7221C62.081 72.489 66.0434 77.3844 71.2335 77.6564Z" fill="#0B1035" />
              <path d="M72.3871 75.6228C75.1263 75.7664 77.4633 73.6622 77.6069 70.9229C77.7504 68.1837 75.6462 65.8467 72.907 65.7032C70.1677 65.5596 67.8308 67.6638 67.6872 70.4031C67.5437 73.1423 69.6479 75.4793 72.3871 75.6228Z" fill="#040920" />
              <path d="M68.703 66.0064C70.433 66.097 71.909 64.7681 71.9997 63.038C72.0904 61.308 70.7614 59.832 69.0313 59.7413C67.3013 59.6506 65.8253 60.9796 65.7346 62.7097C65.644 64.4397 66.9729 65.9157 68.703 66.0064Z" fill="white" />
              <path d="M75.8207 70.044C76.6857 70.0893 77.4237 69.4248 77.469 68.5598C77.5144 67.6948 76.8499 66.9568 75.9848 66.9114C75.1198 66.8661 74.3818 67.5306 74.3365 68.3956C74.2912 69.2606 74.9557 69.9986 75.8207 70.044Z" fill="#202845" />
            </g>
            <g className="aksa-bab-eyelid aksa-bab3-eyelid">
              <rect x="56" y="4" width="39" height="38" fill="#A8D800" />
              <path d="M59 40C68 45 81 45 90 40" stroke="#4D3423" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </g>
          </g>
          <g className="aksa-bab-blangkon">
            <path d="M87.5098 32.0483C90.8313 32.0747 93.5475 29.1342 93.5766 25.4806C93.6056 21.8269 90.9366 18.8436 87.6151 18.8172C84.2936 18.7908 81.5774 21.7313 81.5483 25.3849C81.5193 29.0386 84.1883 32.0219 87.5098 32.0483Z" fill="#724221" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
            <g clipPath={`url(#${clipBlangkon})`}>
              <rect x="12" y="5" width="82" height="38" fill={`url(#${batikId})`} />
            </g>
            <path d="M14.4664 35.5937C16.6209 16.7654 29.526 7.44536 53.1815 7.63347C76.8369 7.82157 89.5921 17.3457 91.447 36.2058L67.751 28.4993C62.9031 33.0719 57.9645 36.4408 52.9352 38.6061C47.7437 35.9586 42.8592 32.5115 38.2819 28.265L14.4664 35.5937Z" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
            <path d="M19.4117 18.7922C29.5776 20.3767 41.8707 22.979 56.2911 26.5993M56.2911 26.5993C66.8658 29.254 78.5845 32.4561 91.4471 36.2056M56.2911 26.5993C69.3036 23.6983 79.5634 21.2753 87.0704 19.3302M56.2911 26.5993C44.5795 29.2102 30.6379 32.2083 14.4665 35.5935M39.6379 9.02916C43.0028 14.469 47.4791 18.8149 53.0668 22.0671C58.9075 18.7053 63.6529 14.4327 67.3028 9.24915" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
            <path d="M38.2817 28.265L53.0737 21.1653L67.7509 28.4994C62.9013 33.2724 57.9627 36.6413 52.935 38.6062C47.7435 35.9586 42.8591 32.5116 38.2817 28.265Z" fill="#8C5426" strokeWidth="1.80429" strokeLinejoin="round" stroke="#0B1035" />
          </g>
          {/* Kartu kiri + tangan kiri */}
          <g className="aksa-bab3-card-l">
            <path d="M38.7259 81.0959L16.9419 84.1575C13.6608 84.6186 11.3747 87.6523 11.8358 90.9335L14.4799 109.747C14.941 113.028 17.9748 115.314 21.2559 114.853L43.0399 111.792C46.3211 111.33 48.6071 108.297 48.146 105.015L45.5019 86.202C45.0408 82.9209 42.0071 80.6348 38.7259 81.0959Z" fill="#FFFAF0" strokeWidth="1.99982" stroke="#4D3423" />
            <path d="M23.1806 104.689C22.3511 104.703 21.6688 104.523 21.1338 104.15C20.611 103.775 20.2913 103.161 20.1747 102.308L19.5802 97.959C19.3172 96.0343 20.1601 94.9388 22.1092 94.6724C24.0339 94.4093 25.1236 95.2096 25.3784 97.0734L25.7181 99.5584L27.527 99.3112L27.3572 98.0686C26.9892 95.3765 28.1634 93.8448 30.8799 93.4734C32.4635 93.257 33.6458 93.5545 34.4269 94.366C34.8031 93.3963 35.4785 92.8448 36.453 92.7116C38.2681 92.4635 39.303 93.2714 39.5577 95.1351L40.5393 102.316L38.9496 102.533L37.9655 95.3342C37.839 94.4084 37.3372 94.0054 36.4601 94.1253C35.5708 94.2469 35.192 94.7888 35.3235 95.7512L36.3002 102.896L34.7287 103.11L33.902 97.0623C33.6705 95.3691 32.7264 94.6357 31.0698 94.8621C29.4131 95.0886 28.7029 96.0667 28.9394 97.7965L29.1167 99.0938C29.9467 98.9928 30.6431 99.1396 31.2058 99.5342C31.7807 99.9272 32.1198 100.501 32.223 101.257C32.288 101.732 32.2516 102.146 32.1138 102.5C31.9866 102.84 31.7754 103.111 31.4803 103.313C31.1852 103.514 30.8184 103.645 30.3799 103.705C29.6734 103.802 29.1011 103.7 28.663 103.4C28.237 103.098 27.9758 102.594 27.8792 101.888L27.7144 100.682L25.9054 100.929L26.36 104.254L24.7886 104.469L23.8045 97.2699C23.6779 96.3441 23.1761 95.9412 22.299 96.0611C21.4098 96.1826 21.0309 96.7246 21.1625 97.6869L21.7544 102.017C21.8776 102.919 22.406 103.38 23.3396 103.402L23.1806 104.689ZM30.2757 102.398C30.5437 102.361 30.7103 102.264 30.7756 102.106C30.8514 101.934 30.8718 101.72 30.8368 101.465C30.7836 101.075 30.6157 100.8 30.3332 100.64C30.0613 100.466 29.7182 100.408 29.3041 100.464L29.4689 101.67C29.5438 102.218 29.8128 102.461 30.2757 102.398Z" fill="#4D3423" />
            <path d="M11.0008 108.99C13.762 108.99 16.0003 105.409 16.0003 100.991C16.0003 96.5731 13.762 92.9917 11.0008 92.9917C8.2396 92.9917 6.00122 96.5731 6.00122 100.991C6.00122 105.409 8.2396 108.99 11.0008 108.99Z" fill="#A8D800" strokeWidth="1.49987" stroke="#52632F" />
          </g>
          {/* Kartu kanan + tangan kanan */}
          <g className="aksa-bab3-card-r">
            <path d="M89.7852 83.405L67.9511 80.7241C64.6624 80.3203 61.669 82.659 61.2652 85.9477L58.9499 104.804C58.5461 108.093 60.8848 111.086 64.1735 111.49L86.0076 114.171C89.2963 114.575 92.2896 112.236 92.6935 108.948L95.0088 90.0909C95.4126 86.8021 93.0739 83.8088 89.7852 83.405Z" fill="#FFD263" strokeWidth="1.99982" stroke="#4D3423" />
            <path d="M68.4318 97.6748C67.8066 97.5181 67.331 97.2457 67.0049 96.8575C66.6883 96.4705 66.5722 95.9453 66.6567 95.282L67.0876 91.8993C67.2783 90.4021 68.1317 89.7501 69.6478 89.9432C71.1449 90.1339 71.8012 90.9542 71.6165 92.4039L71.3703 94.337L72.7774 94.5162L72.9005 93.5497C73.1673 91.4556 74.3572 90.5431 76.4702 90.8123C77.702 90.9692 78.5291 91.4308 78.9515 92.1972C79.4293 91.5455 80.0472 91.2679 80.8053 91.3645C82.2171 91.5443 82.8307 92.3591 82.6461 93.8089L81.9345 99.3947L80.698 99.2372L81.4113 93.6372C81.5031 92.917 81.2078 92.5135 80.5256 92.4266C79.8338 92.3385 79.4403 92.6687 79.3449 93.4173L78.637 98.9747L77.4147 98.819L78.014 94.1144C78.1817 92.7973 77.6213 92.0566 76.3326 91.8925C75.0439 91.7283 74.3139 92.319 74.1425 93.6646L74.014 94.6737C74.6571 94.7653 75.15 95.0158 75.4926 95.4254C75.8447 95.8361 75.9833 96.3353 75.9085 96.9228C75.8614 97.2923 75.7505 97.5959 75.5758 97.8337C75.4118 98.0631 75.1987 98.2238 74.9367 98.3156C74.6746 98.4074 74.373 98.4316 74.0319 98.3881C73.4823 98.3181 73.0734 98.1264 72.8052 97.813C72.5465 97.5008 72.4521 97.0699 72.5221 96.5203L72.6416 95.5822L71.2345 95.403L70.905 97.9898L69.6826 97.8341L70.396 92.234C70.4877 91.5139 70.1924 91.1104 69.5102 91.0234C68.8185 90.9353 68.4249 91.2656 68.3296 92.0141L67.9005 95.3827C67.8112 96.0839 68.1146 96.5366 68.8108 96.7408L68.4318 97.6748ZM74.2173 97.3862C74.4258 97.4127 74.5704 97.3734 74.6512 97.2681C74.7427 97.1546 74.8011 96.9984 74.8265 96.7994C74.8651 96.4962 74.7946 96.2561 74.6149 96.0791C74.4459 95.8939 74.2003 95.7808 73.8782 95.7397L73.7587 96.6778C73.7044 97.1042 73.8572 97.3403 74.2173 97.3862ZM79.0649 111.003C78.5059 110.932 77.9783 110.802 77.4824 110.614C76.9864 110.426 76.5954 110.169 76.3094 109.843C76.0223 109.528 75.9083 109.138 75.9674 108.673C76.146 107.271 77.5875 106.424 80.2919 106.133L80.4903 107.184C79.509 107.328 78.7567 107.526 78.2336 107.777C77.7094 108.038 77.4225 108.363 77.373 108.751C77.2994 109.329 77.9116 109.701 79.2098 109.866C79.8162 109.943 80.3512 109.939 80.8146 109.854C81.2686 109.767 81.6358 109.569 81.9161 109.258C82.2059 108.948 82.3876 108.504 82.4613 107.926L84.2247 94.0822C84.4154 92.5851 85.174 91.921 86.5006 92.09C87.8177 92.2577 88.3839 93.0665 88.1993 94.5163L86.2494 109.824C86.1625 110.506 86.4459 110.889 87.0997 110.972L86.9676 112.01C85.4894 111.822 84.8414 111.012 85.0237 109.581L86.9645 94.3445C87.0563 93.6244 86.8558 93.2329 86.363 93.1702C85.8513 93.105 85.5478 93.4467 85.4525 94.1953L83.6909 108.025C83.5424 109.19 83.0801 110.022 82.3041 110.52C81.5281 111.019 80.4484 111.18 79.0649 111.003Z" fill="#4D3423" />
            <path d="M96.9932 108.99C99.7544 108.99 101.993 105.409 101.993 100.991C101.993 96.5731 99.7544 92.9917 96.9932 92.9917C94.232 92.9917 91.9937 96.5731 91.9937 100.991C91.9937 105.409 94.232 108.99 96.9932 108.99Z" fill="#A8D800" strokeWidth="1.49987" stroke="#52632F" />
          </g>
          <path d="M46.9976 96.9917H57.9976M54.9976 99.9917L57.9976 96.9917L54.9976 93.9917" strokeWidth="1.99982" strokeLinecap="round" strokeLinejoin="round" stroke="#70549A" className="aksa-bab3-arrow" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Maskot Aksa versi kartu Profil ("Perjalanan belajarmu") Bab 1, 2, dan 3.
 * Pure SVG vector tanpa bitmap base64 737KB, dengan animasi bernapas, membaca buku,
 * lirikan mata mengikuti aksara di buku, kedipan natural, dan goyangan blangkon.
 */
export function MaskotProfilBab({ bab }: { bab: number }) {
  const uid = useId().replace(/:/g, '');
  const clipCard = `mpb-card-${uid}`;
  const clipBlangkon = `mpb-blangkon-${uid}`;
  const clipEyeL = `mpb-eyel-${uid}`;
  const clipEyeR = `mpb-eyer-${uid}`;
  const batikId = `mpb-batik-${uid}`;
  const clampedBab = bab === 2 ? 2 : bab === 3 ? 3 : 1;
  const bg = clampedBab === 1 ? '#E7EDDA' : clampedBab === 2 ? '#FFF0DF' : '#F0EAFB';

  return (
    <svg
      viewBox="0 0 142 112"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`aksa-3d aksa-profil-bab-svg aksa-profil-bab-${clampedBab}`}
      aria-hidden="true"
    >
      <defs>
        <BatikPatternDef id={batikId} scale={0.72} />
        <clipPath id={clipCard}>
          <path d="M0 16C0 7.16345 7.16344 0 16 0H125.424C134.261 0 141.424 7.16344 141.424 16V95.9844C141.424 104.821 134.261 111.984 125.424 111.984H16C7.16347 111.984 0 104.821 0 95.9844V16Z" />
        </clipPath>
        <clipPath id={clipBlangkon}>
          <path d="M27.403 41.4224C29.6683 20.1279 44.1667 9.48071 70.898 9.48071C97.6294 9.48071 112.128 20.1279 114.393 41.4224L87.5485 32.9273C82.1116 38.1376 76.5614 41.9888 70.898 44.4807C65.0081 41.5357 59.4579 37.6846 54.2476 32.9273L27.403 41.4224Z" />
        </clipPath>
        <clipPath id={clipEyeL}>
          <path d="M43.197 88.6529C54.6415 88.6529 63.9192 78.973 63.9192 67.0322C63.9192 55.0914 54.6415 45.4115 43.197 45.4115C31.7525 45.4115 22.4749 55.0914 22.4749 67.0322C22.4749 78.973 31.7525 88.6529 43.197 88.6529Z" />
        </clipPath>
        <clipPath id={clipEyeR}>
          <path d="M97.7982 88.6529C109.243 88.6529 118.52 78.973 118.52 67.0322C118.52 55.0914 109.243 45.4115 97.7982 45.4115C86.3537 45.4115 77.076 55.0914 77.076 67.0322C77.076 78.973 86.3537 88.6529 97.7982 88.6529Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipCard})`}>
        <rect width="142" height="112" rx="16" fill={bg} />

        {/* Badan + kepala Aksa */}
        <g className="aksa-profil-bab-rig">
          <path d="M-0.597046 112.481V65.0474C-0.597046 20.2918 141.403 20.2918 141.403 65.0474V112.481H-0.597046Z" fill="#A8D800" />

          {/* Alis ekspresif */}
          <g className="aksa-profil-bab-brows">
            <path d="M35.3029 45.7391C39.4692 42.0264 43.5259 41.3713 47.473 43.7736" strokeWidth="3.63104" strokeLinecap="round" stroke="black" />
            <path d="M93.5222 43.7736C97.6886 41.3713 101.745 42.0264 105.692 45.7391" strokeWidth="3.63104" strokeLinecap="round" stroke="black" />
          </g>

          {/* Mata kiri */}
          <path d="M43.197 88.6529C54.6415 88.6529 63.9192 78.973 63.9192 67.0322C63.9192 55.0914 54.6415 45.4115 43.197 45.4115C31.7525 45.4115 22.4749 55.0914 22.4749 67.0322C22.4749 78.973 31.7525 88.6529 43.197 88.6529Z" fill="white" />
          <g clipPath={`url(#${clipEyeL})`}>
            <g className="aksa-profil-bab-pupils">
              <path d="M47.4731 84.3943C54.0128 84.3943 59.3143 78.5277 59.3143 71.2908C59.3143 64.054 54.0128 58.1874 47.4731 58.1874C40.9333 58.1874 35.6318 64.054 35.6318 71.2908C35.6318 78.5277 40.9333 84.3943 47.4731 84.3943Z" fill="black" />
              <path d="M48.7887 81.7736C52.2403 81.7736 55.0383 78.987 55.0383 75.5495C55.0383 72.112 52.2403 69.3253 48.7887 69.3253C45.3372 69.3253 42.5392 72.112 42.5392 75.5495C42.5392 78.987 45.3372 81.7736 48.7887 81.7736Z" fill="#040920" />
              <path d="M43.5259 69.9805C45.7058 69.9805 47.473 68.2205 47.473 66.0494C47.473 63.8784 45.7058 62.1184 43.5259 62.1184C41.346 62.1184 39.5789 63.8784 39.5789 66.0494C39.5789 68.2205 41.346 69.9805 43.5259 69.9805Z" fill="white" />
              <path d="M52.7359 74.5667C53.8258 74.5667 54.7094 73.6867 54.7094 72.6011C54.7094 71.5156 53.8258 70.6356 52.7359 70.6356C51.6459 70.6356 50.7623 71.5156 50.7623 72.6011C50.7623 73.6867 51.6459 74.5667 52.7359 74.5667Z" fill="#202845" />
            </g>
            <g className="aksa-profil-bab-eyelid">
              <rect x="20" y="-4" width="46" height="48" fill="#A8D800" />
              <path d="M23 42.5C35 47 51 47 63 42.5" stroke="#52632F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </g>
          </g>

          {/* Mata kanan */}
          <path d="M97.7982 88.6529C109.243 88.6529 118.52 78.973 118.52 67.0322C118.52 55.0914 109.243 45.4115 97.7982 45.4115C86.3537 45.4115 77.076 55.0914 77.076 67.0322C77.076 78.973 86.3537 88.6529 97.7982 88.6529Z" fill="white" />
          <g clipPath={`url(#${clipEyeR})`}>
            <g className="aksa-profil-bab-pupils">
              <path d="M93.5223 84.3943C100.062 84.3943 105.363 78.5277 105.363 71.2908C105.363 64.054 100.062 58.1874 93.5223 58.1874C86.9825 58.1874 81.681 64.054 81.681 71.2908C81.681 78.5277 86.9825 84.3943 93.5223 84.3943Z" fill="black" />
              <path d="M94.838 81.7736C98.2896 81.7736 101.088 78.987 101.088 75.5495C101.088 72.112 98.2896 69.3253 94.838 69.3253C91.3865 69.3253 88.5885 72.112 88.5885 75.5495C88.5885 78.987 91.3865 81.7736 94.838 81.7736Z" fill="#040920" />
              <path d="M89.5753 69.9805C91.7552 69.9805 93.5223 68.2205 93.5223 66.0494C93.5223 63.8784 91.7552 62.1184 89.5753 62.1184C87.3953 62.1184 85.6282 63.8784 85.6282 66.0494C85.6282 68.2205 87.3953 69.9805 89.5753 69.9805Z" fill="white" />
              <path d="M98.7851 74.5667C99.875 74.5667 100.759 73.6867 100.759 72.6011C100.759 71.5156 99.875 70.6356 98.7851 70.6356C97.6951 70.6356 96.8115 71.5156 96.8115 72.6011C96.8115 73.6867 97.6951 74.5667 98.7851 74.5667Z" fill="#202845" />
            </g>
            <g className="aksa-profil-bab-eyelid">
              <rect x="75" y="-4" width="46" height="48" fill="#A8D800" />
              <path d="M77.5 42.5C89.5 47 105.5 47 117.5 42.5" stroke="#52632F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </g>
          </g>

          {/* Hidung & senyum */}
          <path d="M67.5374 89.4718C68.3549 89.4718 69.0176 88.8118 69.0176 87.9977C69.0176 87.1836 68.3549 86.5236 67.5374 86.5236C66.7199 86.5236 66.0573 87.1836 66.0573 87.9977C66.0573 88.8118 66.7199 89.4718 67.5374 89.4718Z" fill="black" />
          <path d="M73.7869 89.4718C74.6044 89.4718 75.2671 88.8118 75.2671 87.9977C75.2671 87.1836 74.6044 86.5236 73.7869 86.5236C72.9695 86.5236 72.3068 87.1836 72.3068 87.9977C72.3068 88.8118 72.9695 89.4718 73.7869 89.4718Z" fill="black" />
          <path d="M61.6167 94.877C67.5373 99.8999 73.4579 99.8999 79.3785 94.877" strokeWidth="1.65047" strokeLinecap="round" stroke="black" />

          {/* Blangkon vektor */}
          <g className="aksa-profil-bab-blangkon">
            <path d="M109.907 36.7599C113.66 36.7599 116.703 33.4129 116.703 29.2842C116.703 25.1555 113.66 21.8085 109.907 21.8085C106.153 21.8085 103.111 25.1555 103.111 29.2842C103.111 33.4129 106.153 36.7599 109.907 36.7599Z" fill="#724221" strokeWidth="2.03883" strokeLinejoin="round" stroke="#0B1035" />
            <g clipPath={`url(#${clipBlangkon})`}>
              <rect x="24" y="8" width="94" height="40" fill={`url(#${batikId})`} />
            </g>
            <path d="M27.403 41.4224C29.6683 20.1279 44.1667 9.48071 70.898 9.48071C97.6294 9.48071 112.128 20.1279 114.393 41.4224L87.5485 32.9273C82.1116 38.1376 76.5614 41.9888 70.898 44.4807C65.0081 41.5357 59.4579 37.6846 54.2476 32.9273L27.403 41.4224Z" strokeWidth="2.03883" strokeLinejoin="round" stroke="#0B1035" />
            <path d="M32.8398 22.3931C44.3411 24.0922 58.2552 26.9223 74.5821 30.8834M74.5821 30.8834C86.5549 33.7881 99.8252 37.1631 114.393 41.4222M74.5821 30.8834C89.2596 27.4885 100.831 24.6585 109.296 22.3931M74.5821 30.8834C61.3719 33.9388 45.6455 37.4518 27.403 41.4222M55.6068 11.1796C59.4579 17.2961 64.555 22.1666 70.898 25.7912C77.4676 21.9401 82.7912 17.0695 86.8689 11.1796" strokeWidth="2.03883" strokeLinejoin="round" stroke="#0B1035" />
            <path d="M54.2474 32.9272L70.8979 24.7719L87.5484 32.9272C82.1115 38.3641 76.5613 42.2152 70.8979 44.4806C65.0079 41.5356 59.4578 37.6845 54.2474 32.9272Z" fill="#8C5426" strokeWidth="2.03883" strokeLinejoin="round" stroke="#0B1035" />
          </g>
        </g>

        {/* Buku terbuka + kedua tangan sesuai Bab */}
        {clampedBab === 1 && (
          <g className="aksa-profil-book">
            <path d="M54.627 84.3535C65.7071 82.0208 78.5368 83.7703 93.116 89.602C107.695 83.7703 120.525 82.0208 131.605 84.3535V122.842C119.358 121.093 106.529 122.842 93.116 128.091C79.7031 122.842 66.8735 121.093 54.627 122.842V84.3535Z" fill="#4D3423" />
            <path d="M57.2512 80.8544C68.9146 79.6881 80.8695 82.0208 93.116 87.8524V123.717C80.8695 118.469 68.9146 117.011 57.2512 119.343V80.8544Z" fill="#FFFAF0" strokeWidth="1.7495" strokeLinejoin="round" stroke="#4D3423" />
            <path d="M128.981 80.8544C117.317 79.6881 105.362 82.0208 93.116 87.8524V123.717C105.362 118.469 117.317 117.011 128.981 119.343V80.8544Z" fill="#FFF4D5" strokeWidth="1.7495" strokeLinejoin="round" stroke="#4D3423" />
            <path d="M68.443 103.852C67.7007 103.764 67.1134 103.52 66.6813 103.121C66.2602 102.722 66.0497 102.135 66.0497 101.359V97.4038C66.0497 95.6531 66.9361 94.7778 68.7089 94.7778C70.4596 94.7778 71.3349 95.6254 71.3349 97.3207V101.675C71.3349 102.373 71.6618 102.722 72.3155 102.722H73.6784C74.3321 102.722 74.659 102.373 74.659 101.675V97.4038C74.659 96.5506 74.8584 95.9024 75.2573 95.4592C75.6673 95.0049 76.3099 94.7778 77.1853 94.7778C77.6396 94.7778 78.0495 94.8719 78.4152 95.0603C78.7808 95.2376 79.0689 95.4924 79.2794 95.8248C79.7005 95.1268 80.3542 94.7778 81.2406 94.7778C82.947 94.7778 83.8001 95.6254 83.8001 97.3207V103.852H82.3542V97.304C82.3542 96.4619 81.9553 96.0409 81.1575 96.0409C80.3487 96.0409 79.9442 96.4786 79.9442 97.3539V103.852H78.4983V97.304C78.4983 96.9162 78.393 96.6115 78.1825 96.3899C77.972 96.1572 77.6783 96.0409 77.3016 96.0409C76.5038 96.0409 76.105 96.4786 76.105 97.3539V101.642C76.105 103.116 75.3238 103.852 73.7615 103.852H72.2324C70.6812 103.852 69.9056 103.116 69.9056 101.642V97.304C69.9056 96.4619 69.5067 96.0409 68.7089 96.0409C67.9001 96.0409 67.4957 96.4786 67.4957 97.3539V101.293C67.4957 102.113 67.9112 102.589 68.7422 102.722L68.443 103.852Z" fill="#4D3423" />
            <path d="M107.144 103.852C106.402 103.764 105.815 103.52 105.383 103.121C104.962 102.722 104.751 102.135 104.751 101.359V97.4038C104.751 95.6531 105.637 94.7778 107.41 94.7778C109.161 94.7778 110.036 95.6254 110.036 97.3207V99.581H111.682V98.5173C111.682 97.2985 111.992 96.3733 112.612 95.7417C113.233 95.0991 114.158 94.7778 115.388 94.7778C117.848 94.7778 119.078 95.9744 119.078 98.3677V103.852H117.648V98.3511C117.648 96.811 116.895 96.0409 115.388 96.0409C113.881 96.0409 113.128 96.8276 113.128 98.401V99.581C113.881 99.5921 114.485 99.8082 114.939 100.229C115.405 100.65 115.637 101.204 115.637 101.891C115.637 102.323 115.554 102.689 115.388 102.988C115.233 103.276 115.011 103.492 114.723 103.636C114.435 103.78 114.092 103.852 113.693 103.852C113.05 103.852 112.551 103.697 112.197 103.387C111.853 103.066 111.682 102.584 111.682 101.941V100.828H110.036V103.852H108.607V97.304C108.607 96.4619 108.208 96.0409 107.41 96.0409C106.601 96.0409 106.197 96.4786 106.197 97.3539V101.293C106.197 102.113 106.613 102.589 107.444 102.722L107.144 103.852ZM113.759 102.672C114.003 102.672 114.164 102.606 114.241 102.473C114.33 102.329 114.374 102.141 114.374 101.908C114.374 101.553 114.258 101.287 114.025 101.11C113.804 100.922 113.504 100.828 113.128 100.828V101.924C113.128 102.423 113.338 102.672 113.759 102.672Z" fill="#4D3423" />
            <path d="M65.9987 110.596H80.8694M105.362 110.596H120.233" strokeWidth="1.7495" strokeLinecap="round" stroke="#E5DED7" />
            <path d="M56.3764 115.845C58.792 115.845 60.7502 112.711 60.7502 108.847C60.7502 104.982 58.792 101.849 56.3764 101.849C53.9609 101.849 52.0027 104.982 52.0027 108.847C52.0027 112.711 53.9609 115.845 56.3764 115.845Z" fill="#A8D800" strokeWidth="1.31212" stroke="#52632F" />
            <path d="M129.855 115.845C132.271 115.845 134.229 112.711 134.229 108.847C134.229 104.982 132.271 101.849 129.855 101.849C127.44 101.849 125.482 104.982 125.482 108.847C125.482 112.711 127.44 115.845 129.855 115.845Z" fill="#A8D800" strokeWidth="1.31212" stroke="#52632F" />
          </g>
        )}

        {clampedBab === 2 && (
          <g className="aksa-profil-book">
            <path d="M31.627 84.2845C42.7071 81.9518 55.5368 83.7013 70.116 89.533C84.6951 83.7013 97.5248 81.9518 108.605 84.2845V122.774C96.3585 121.024 83.5288 122.774 70.116 128.022C56.7031 122.774 43.8735 121.024 31.627 122.774V84.2845Z" fill="#4D3423" />
            <path d="M34.2512 80.7855C45.9146 79.6191 57.8695 81.9518 70.116 87.7835V123.648C57.8695 118.4 45.9146 116.942 34.2512 119.274V80.7855Z" fill="#FFFAF0" strokeWidth="1.7495" strokeLinejoin="round" stroke="#4D3423" />
            <path d="M105.981 80.7855C94.3174 79.6191 82.3625 81.9518 70.116 87.7835V123.648C82.3625 118.4 94.3174 116.942 105.981 119.274V80.7855Z" fill="#FFF4D5" strokeWidth="1.7495" strokeLinejoin="round" stroke="#4D3423" />
            <path d="M45.2946 103.783C44.5523 103.695 43.965 103.451 43.5329 103.052C43.1119 102.653 42.9013 102.066 42.9013 101.29V97.3348C42.9013 95.5841 43.7877 94.7088 45.5606 94.7088C47.3112 94.7088 48.1866 95.5564 48.1866 97.2517V99.512H49.832V98.3819C49.832 95.9331 51.0674 94.7088 53.5383 94.7088C54.9787 94.7088 55.9981 95.1188 56.5964 95.9387C57.0507 95.1188 57.7211 94.7088 58.6075 94.7088C60.2584 94.7088 61.0839 95.5564 61.0839 97.2517V103.783H59.6379V97.2351C59.6379 96.393 59.239 95.9719 58.4413 95.9719C57.6324 95.9719 57.228 96.4096 57.228 97.2849V103.783H55.7986V98.2821C55.7986 96.742 55.0452 95.9719 53.5383 95.9719C52.0314 95.9719 51.2779 96.7586 51.2779 98.332V99.512C52.0314 99.5231 52.6353 99.7392 53.0895 100.16C53.5549 100.581 53.7876 101.135 53.7876 101.822C53.7876 102.254 53.7045 102.62 53.5383 102.919C53.3832 103.207 53.1616 103.423 52.8735 103.567C52.5854 103.711 52.2419 103.783 51.843 103.783C51.2004 103.783 50.7018 103.623 50.3472 103.301C50.0037 102.98 49.832 102.498 49.832 101.855V100.759H48.1866V103.783H46.7572V97.2351C46.7572 96.393 46.3583 95.9719 45.5606 95.9719C44.7517 95.9719 44.3473 96.4096 44.3473 97.2849V101.224C44.3473 102.044 44.7628 102.52 45.5938 102.653L45.2946 103.783ZM51.9095 102.603C52.1533 102.603 52.3139 102.537 52.3915 102.404C52.4801 102.26 52.5245 102.072 52.5245 101.839C52.5245 101.484 52.4081 101.218 52.1754 101.041C51.9538 100.853 51.6547 100.759 51.2779 100.759V101.855C51.2779 102.354 51.4885 102.603 51.9095 102.603ZM56.1262 93.911L54.4642 93.6119C53.8105 93.49 53.2731 93.2628 52.8521 92.9304C52.4199 92.598 52.2039 92.177 52.2039 91.6673C52.2039 91.0357 52.4144 90.5648 52.8354 90.2546C53.2565 89.9332 53.7662 89.7726 54.3645 89.7726C55.0958 89.7726 55.6553 89.9776 56.0431 90.3875C56.4309 90.7864 56.6249 91.346 56.6249 92.0662V93.5952L56.1262 93.911ZM55.3119 92.6479V91.9664C55.3119 91.5897 55.2121 91.3127 55.0127 91.1354C54.8132 90.9471 54.5695 90.8529 54.2814 90.8529C54.0709 90.8529 53.8825 90.9138 53.7163 91.0357C53.5501 91.1465 53.467 91.3127 53.467 91.5343C53.467 91.8446 53.5667 92.0662 53.7662 92.1991C53.9545 92.3321 54.1817 92.4263 54.4476 92.4817L55.3119 92.6479Z" fill="#4D3423" />
            <path d="M82.0341 103.783C81.2918 103.695 80.7045 103.451 80.2724 103.052C79.8514 102.653 79.6408 102.066 79.6408 101.29V97.3348C79.6408 95.5841 80.5272 94.7088 82.3001 94.7088C84.0507 94.7088 84.9261 95.5564 84.9261 97.2517V99.512H86.5715V98.3819C86.5715 95.9331 87.8069 94.7088 90.2778 94.7088C91.7182 94.7088 92.7376 95.1188 93.3359 95.9387C93.7902 95.1188 94.4606 94.7088 95.347 94.7088C96.9979 94.7088 97.8234 95.5564 97.8234 97.2517V103.783H96.3774V97.2351C96.3774 96.393 95.9785 95.9719 95.1808 95.9719C94.3719 95.9719 93.9675 96.4096 93.9675 97.2849V103.783H92.5381V98.2821C92.5381 96.742 91.7847 95.9719 90.2778 95.9719C88.7709 95.9719 88.0174 96.7586 88.0174 98.332V99.512C88.7709 99.5231 89.3748 99.7392 89.829 100.16C90.2944 100.581 90.5271 101.135 90.5271 101.822C90.5271 102.254 90.444 102.62 90.2778 102.919C90.1227 103.207 89.9011 103.423 89.613 103.567C89.3249 103.711 88.9814 103.783 88.5825 103.783C87.9399 103.783 87.4413 103.623 87.0867 103.301C86.7432 102.98 86.5715 102.498 86.5715 101.855V100.759H84.9261V103.783H83.4967V97.2351C83.4967 96.393 83.0978 95.9719 82.3001 95.9719C81.4912 95.9719 81.0868 96.4096 81.0868 97.2849V101.224C81.0868 102.044 81.5023 102.52 82.3333 102.653L82.0341 103.783ZM88.649 102.603C88.8928 102.603 89.0534 102.537 89.131 102.404C89.2196 102.26 89.264 102.072 89.264 101.839C89.264 101.484 89.1476 101.218 88.9149 101.041C88.6933 100.853 88.3942 100.759 88.0174 100.759V101.855C88.0174 102.354 88.228 102.603 88.649 102.603ZM98.3839 117.562C97.0321 117.562 96.3563 116.664 96.3563 114.869V103.518H97.8022V115.285C97.8022 115.883 97.9906 116.182 98.3673 116.182C98.7551 116.182 98.949 115.883 98.949 115.285V105.396H100.395V114.869C100.395 116.664 99.7246 117.562 98.3839 117.562Z" fill="#4D3423" />
            <path d="M42.9987 110.527H57.8694M82.3624 110.527H97.2332" strokeWidth="1.7495" strokeLinecap="round" stroke="#E5DED7" />
            <path d="M33.3764 115.776C35.792 115.776 37.7502 112.642 37.7502 108.778C37.7502 104.913 35.792 101.78 33.3764 101.78C30.9609 101.78 29.0027 104.913 29.0027 108.778C29.0027 112.642 30.9609 115.776 33.3764 115.776Z" fill="#A8D800" strokeWidth="1.31212" stroke="#52632F" />
            <path d="M106.855 115.776C109.271 115.776 111.229 112.642 111.229 108.778C111.229 104.913 109.271 101.78 106.855 101.78C104.44 101.78 102.482 104.913 102.482 108.778C102.482 112.642 104.44 115.776 106.855 115.776Z" fill="#A8D800" strokeWidth="1.31212" stroke="#52632F" />
          </g>
        )}

        {clampedBab === 3 && (
          <g className="aksa-profil-book">
            <path d="M8.62695 83.2155C19.7071 80.8829 32.5368 82.6324 47.116 88.464C61.6951 82.6324 74.5248 80.8829 85.605 83.2155V121.705C73.3585 119.955 60.5288 121.705 47.116 126.953C33.7031 121.705 20.8735 119.955 8.62695 121.705V83.2155Z" fill="#4D3423" />
            <path d="M11.2512 79.7165C22.9146 78.5502 34.8695 80.8828 47.116 86.7145V122.579C34.8695 117.331 22.9146 115.873 11.2512 118.206V79.7165Z" fill="#FFFAF0" strokeWidth="1.7495" strokeLinejoin="round" stroke="#4D3423" />
            <path d="M82.9807 79.7165C71.3174 78.5502 59.3625 80.8828 47.116 86.7145V122.579C59.3625 117.331 71.3174 115.873 82.9807 118.206V79.7165Z" fill="#FFF4D5" strokeWidth="1.7495" strokeLinejoin="round" stroke="#4D3423" />
            <path d="M22.2946 102.714C21.5523 102.626 20.965 102.382 20.5329 101.983C20.1119 101.584 19.9013 100.997 19.9013 100.221V96.2658C19.9013 94.5152 20.7877 93.6398 22.5606 93.6398C24.3112 93.6398 25.1866 94.4875 25.1866 96.1827V98.4431H26.832V97.3129C26.832 94.8642 28.0674 93.6398 30.5383 93.6398C31.9787 93.6398 32.9981 94.0498 33.5964 94.8697C34.0507 94.0498 34.7211 93.6398 35.6075 93.6398C37.2584 93.6398 38.0839 94.4875 38.0839 96.1827V102.714H36.6379V96.1661C36.6379 95.324 36.239 94.903 35.4413 94.903C34.6324 94.903 34.228 95.3406 34.228 96.216V102.714H32.7986V97.2132C32.7986 95.673 32.0452 94.903 30.5383 94.903C29.0314 94.903 28.2779 95.6897 28.2779 97.263V98.4431C29.0314 98.4542 29.6353 98.6702 30.0895 99.0913C30.5549 99.5123 30.7876 100.066 30.7876 100.753C30.7876 101.185 30.7045 101.551 30.5383 101.85C30.3832 102.138 30.1616 102.354 29.8735 102.498C29.5854 102.642 29.2419 102.714 28.843 102.714C28.2004 102.714 27.7018 102.554 27.3472 102.232C27.0037 101.911 26.832 101.429 26.832 100.787V99.6896H25.1866V102.714H23.7572V96.1661C23.7572 95.324 23.3583 94.903 22.5606 94.903C21.7517 94.903 21.3473 95.3406 21.3473 96.216V100.155C21.3473 100.975 21.7628 101.451 22.5938 101.584L22.2946 102.714ZM28.9095 101.534C29.1533 101.534 29.3139 101.468 29.3915 101.335C29.4801 101.191 29.5245 101.003 29.5245 100.77C29.5245 100.415 29.4081 100.149 29.1754 99.9721C28.9538 99.7838 28.6547 99.6896 28.2779 99.6896V100.787C28.2779 101.285 28.4885 101.534 28.9095 101.534ZM31.3311 92.7091L30.766 91.8781L36.5665 87.9058L37.1482 88.7867L31.3311 92.7091Z" fill="#4D3423" />
            <path d="M55.7265 102.714C54.9841 102.626 54.3969 102.382 53.9647 101.983C53.5437 101.584 53.3332 100.997 53.3332 100.221V96.2658C53.3332 94.5152 54.2196 93.6398 55.9924 93.6398C57.7431 93.6398 58.6184 94.4875 58.6184 96.1827V98.4431H60.2638V97.3129C60.2638 94.8642 61.4992 93.6398 63.9701 93.6398C65.4105 93.6398 66.4299 94.0498 67.0283 94.8697C67.4825 94.0498 68.1529 93.6398 69.0393 93.6398C70.6902 93.6398 71.5157 94.4875 71.5157 96.1827V102.714H70.0698V96.1661C70.0698 95.324 69.6709 94.903 68.8731 94.903C68.0642 94.903 67.6598 95.3406 67.6598 96.216V102.714H66.2305V97.2132C66.2305 95.673 65.477 94.903 63.9701 94.903C62.4632 94.903 61.7098 95.6897 61.7098 97.263V98.4431C62.4632 98.4542 63.0671 98.6702 63.5214 99.0913C63.9867 99.5123 64.2194 100.066 64.2194 100.753C64.2194 101.185 64.1363 101.551 63.9701 101.85C63.815 102.138 63.5934 102.354 63.3053 102.498C63.0172 102.642 62.6737 102.714 62.2749 102.714C61.6322 102.714 61.1336 102.554 60.779 102.232C60.4356 101.911 60.2638 101.429 60.2638 100.787V99.6896H58.6184V102.714H57.1891V96.1661C57.1891 95.324 56.7902 94.903 55.9924 94.903C55.1836 94.903 54.7791 95.3406 54.7791 96.216V100.155C54.7791 100.975 55.1946 101.451 56.0256 101.584L55.7265 102.714ZM62.3413 101.534C62.5851 101.534 62.7458 101.468 62.8233 101.335C62.912 101.191 62.9563 101.003 62.9563 100.77C62.9563 100.415 62.8399 100.149 62.6073 99.9721C62.3857 99.7838 62.0865 99.6896 61.7098 99.6896V100.787C61.7098 101.285 61.9203 101.534 62.3413 101.534ZM69.9152 116.493C69.2615 116.493 68.6355 116.421 68.0372 116.277C67.4388 116.133 66.9513 115.894 66.5746 115.562C66.1978 115.241 66.0095 114.808 66.0095 114.266C66.0095 112.626 67.5441 111.44 70.6133 110.709L70.9956 111.889C69.8875 112.199 69.051 112.537 68.4859 112.903C67.9208 113.279 67.6383 113.695 67.6383 114.149C67.6383 114.825 68.3973 115.163 69.9152 115.163C70.6244 115.163 71.2393 115.08 71.7601 114.914C72.2698 114.748 72.6631 114.465 72.9401 114.066C73.2282 113.667 73.3723 113.13 73.3723 112.454V96.2658C73.3723 94.5152 74.1479 93.6398 75.6991 93.6398C77.2392 93.6398 78.0093 94.4875 78.0093 96.1827V114.083C78.0093 114.881 78.3916 115.279 79.1561 115.279V116.493C77.4276 116.493 76.5633 115.656 76.5633 113.983V96.1661C76.5633 95.324 76.2753 94.903 75.6991 94.903C75.1008 94.903 74.8016 95.3406 74.8016 96.216V112.387C74.8016 113.75 74.3916 114.775 73.5717 115.462C72.7518 116.149 71.5329 116.493 69.9152 116.493Z" fill="#4D3423" />
            <path d="M19.9987 109.458H34.8694M59.3624 109.458H74.2332" strokeWidth="1.7495" strokeLinecap="round" stroke="#E5DED7" />
            <path d="M10.3764 114.707C12.792 114.707 14.7502 111.573 14.7502 107.709C14.7502 103.844 12.792 100.711 10.3764 100.711C7.96088 100.711 6.00269 103.844 6.00269 107.709C6.00269 111.573 7.96088 114.707 10.3764 114.707Z" fill="#A8D800" strokeWidth="1.31212" stroke="#52632F" />
            <path d="M83.8554 114.707C86.271 114.707 88.2292 111.573 88.2292 107.709C88.2292 103.844 86.271 100.711 83.8554 100.711C81.4399 100.711 79.4817 103.844 79.4817 107.709C79.4817 111.573 81.4399 114.707 83.8554 114.707Z" fill="#A8D800" strokeWidth="1.31212" stroke="#52632F" />
          </g>
        )}
      </g>
    </svg>
  );
}
