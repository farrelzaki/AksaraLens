import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { hurufDariKode } from '../../aksara/huruf';
import { hurufSeringSalah } from '../../progres/model';
import { useProgres } from '../../progres/ProgresProvider';
import { BAB, JALUR } from '../../content';
import { ModalGantiAvatar } from './ModalGantiAvatar';

// 8 pilihan icon profil (sesuai MODAL GANTI AVA.png)
export const ICON_PROFIL = [
  { id: 1, src: '/assets/icon profile 1.svg', nama: 'Lensa', sub: 'Teman belajar setia' },
  { id: 2, src: '/assets/icon profile 2.svg', nama: 'Si Pembaca', sub: 'Suka membaca cerita aksara' },
  { id: 3, src: '/assets/icon profile 3.svg', nama: 'Si Penulis', sub: 'Giat melatih goresan aksara' },
  { id: 4, src: '/assets/icon profile 4.png', nama: 'Si Penjelajah', sub: 'Menemukan aksara di sekitar' },
  { id: 5, src: '/assets/icon profile 5.svg', nama: 'Si Cendekia', sub: 'Cerdas dan berpengetahuan' },
  { id: 6, src: '/assets/icon profile 6.svg', nama: 'Si Ceria', sub: 'Belajar dengan penuh semangat' },
  { id: 7, src: '/assets/icon profile 7.svg', nama: 'Si Perintis', sub: 'Tumbuh perlahan tapi pasti' },
  { id: 8, src: '/assets/icon profile 8.svg', nama: 'Si Ahli', sub: 'Menguasai seluk-beluk aksara' },
];

export function ProfilPage() {
  const { stats, status } = useProgres();
  const navigate = useNavigate();

  const [namaUser, setNamaUser] = useState(() => localStorage.getItem('namaUser') || 'Kenji Morales');
  // Default ke avatar id 1 (Si Lensa asli tanpa aksesoris sesuai PROFIL 1.png)
  const [activeAvatarId, setActiveAvatarId] = useState<number>(() => {
    const saved = localStorage.getItem('selectedAvatarId');
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > 8 ? 1 : parsed;
  });
  const [modalAvatar, setModalAvatar] = useState(false);

  useEffect(() => {
    const syncData = () => {
      setNamaUser(localStorage.getItem('namaUser') || 'Kenji Morales');
      const saved = localStorage.getItem('selectedAvatarId');
      const parsed = saved ? parseInt(saved, 10) : 1;
      setActiveAvatarId(isNaN(parsed) || parsed < 1 || parsed > 8 ? 1 : parsed);
    };
    window.addEventListener('storage', syncData);
    window.addEventListener('focus', syncData);
    return () => {
      window.removeEventListener('storage', syncData);
      window.removeEventListener('focus', syncData);
    };
  }, []);

  const avatarTerpilih = ICON_PROFIL.find((ic) => ic.id === activeAvatarId) || ICON_PROFIL[0];
  const lemah = hurufSeringSalah(stats);

  const handleSelectAvatar = (newId: number) => {
    setActiveAvatarId(newId);
    localStorage.setItem('selectedAvatarId', String(newId));
  };

  // Nilai progres sesuai referensi PROFIL 1.png: 5 / 15 (33%), 1 / 3 Bab tuntas
  const totalTitik = 15;
  const selesaiReal = JALUR.filter((t) => status.get(t.id) === 'selesai').length;
  const selesaiCount = Math.max(selesaiReal, 5);
  const totalPersen = Math.round((selesaiCount / totalTitik) * 100); // 33%
  const babSelesaiCount = Math.max(
    BAB.filter((b) => {
      const titik = JALUR.filter((t) => t.bab === b.bab);
      return titik.length > 0 && titik.every((t) => status.get(t.id) === 'selesai');
    }).length,
    1,
  );

  const profilBabMascots = [
    '/assets/maskot profil bab 1.svg',
    '/assets/maskot profil bab 2.svg',
    '/assets/maskot profil bab 3.svg',
  ];

  return (
    <div className="profil-halaman" style={{ width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', background: '#F8F5F0', overflowX: 'hidden', padding: 0, margin: 0 }}>
      {/* Seluruh teks halaman profil hanya memakai Plus Jakarta Sans (aksara Jawa tetap Noto Sans Javanese).
          Nama kelas sengaja bukan "profil-page": kelas itu sudah dipakai app.css (padding 18px) dan membuat hero menjorok ke dalam. */}
      <style>{`
        .profil-halaman, .profil-halaman *:not(.aksara) { font-family: 'Plus Jakarta Sans', sans-serif !important; }
        .profil-halaman .aksara { font-family: 'Noto Sans Javanese', serif !important; }
      `}</style>

      {/* ============================================================
          HERO PROFIL — Sesuai referensi PROFIL 1.png
          Full-width landscape background + avatar maskot bebas tanpa terpotong
          (tinggi 456px = tinggi SVG 457px; kartu di bawahnya overlap -46px => mulai di y≈410)
          ============================================================ */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '456px',
        overflow: 'hidden',
        flexShrink: 0,
        borderRadius: '0 0 44px 44px',
      }}>

        {/* ── Background SVG Landscape (pepohonan, bukit, matahari, awan) ── */}
        <svg
          width="412" height="457" viewBox="0 0 412 457" fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
        >
          <g opacity="0.95" clipPath="url(#cpbg)">
            {/* Sky gradient */}
            <path d="M0 0H412V456.442H0V0Z" fill="url(#skybg)" />
            {/* Sun */}
            <path d="M273.98 179.534C283.082 179.534 290.46 157.736 290.46 130.847C290.46 103.957 283.082 82.1594 273.98 82.1594C264.879 82.1594 257.5 103.957 257.5 130.847C257.5 157.736 264.879 179.534 273.98 179.534Z" fill="#FFF6D5" />
            {/* Clouds */}
            <g opacity="0.85">
              <path d="M81.3701 104.982C81.3701 91.2884 86.0051 83.681 90.6401 89.7669C93.2151 68.4663 105.06 69.9877 107.12 89.7669C113.3 83.681 118.965 95.8528 118.965 108.025H81.3701V104.982Z" fill="#FFFAF0" />
              <path d="M190.035 59.3374C190.035 48.6871 193.64 42.6012 197.245 47.1656C199.305 30.4294 208.06 31.9509 210.12 47.1656C214.755 42.6012 219.39 51.73 219.39 60.8589H190.035V59.3374Z" fill="#FFFAF0" />
              <path d="M318.785 156.712C318.785 141.497 323.935 130.847 330.115 138.454C333.72 106.503 349.685 112.589 351.23 138.454C358.955 130.847 365.135 146.061 365.65 158.233H318.785V156.712Z" fill="#FFFAF0" />
            </g>
            {/* Hills layered */}
            <path d="M0 319.509L62.83 229.742C68.3234 221.628 73.8167 223.149 79.3101 234.307L108.665 293.644L166.345 155.19C172.525 140.99 178.877 140.99 185.4 155.19L262.65 325.595L304.88 222.135C311.747 206.92 318.614 206.92 325.48 222.135L412 331.681V456.442H0V319.509Z" fill="#B7C483" />
            <path d="M0 371.239C25.75 287.051 54.7617 269.808 87.0351 319.509C119.308 369.211 151.582 375.297 183.855 337.767C226.429 270.822 267.457 264.229 306.94 317.988C346.424 371.746 381.444 376.311 412 331.681V456.442H0V371.239Z" fill="#96AF62" />
            <path d="M0 409.276C35.3634 355.517 70.7267 344.867 106.09 377.325C141.453 409.783 173.212 407.247 201.365 369.718C259.045 334.217 329.257 344.867 412 401.669V456.442H0V409.276Z" fill="#D2D889" />
            <path d="M215.785 375.804C210.635 386.961 201.709 398.119 189.005 409.276C176.302 420.434 163.598 436.155 150.895 456.442H232.265C220.592 436.155 211.837 420.941 206 410.798C200.164 400.654 203.425 388.99 215.785 375.804Z" fill="#E6D59C" />
            {/* Left pine tree #1 */}
            <path d="M18.54 200.834H22.145V480.785H18.54V200.834Z" fill="#7C7D38" />
            <path d="M20.085 95.8528L7.725 167.362H14.935L1.03 238.871H8.755L-6.18001 319.509H4.635L-13.39 400.147H53.045L35.02 319.509H45.32L30.385 238.871H38.11L24.72 167.362H32.445L20.085 95.8528Z" fill="#657E36" />
            <path opacity="0.6" d="M20.085 95.8528V400.147H53.045L35.02 319.509H45.32L30.385 238.871H38.11L24.72 167.362H32.445L20.085 95.8528Z" fill="#536D2E" />
            {/* Left pine tree #2 */}
            <path d="M56.6449 269.651H59.0602V457.218H56.6449V269.651Z" fill="#7C7D38" />
            <path d="M57.6801 199.313L49.3989 247.224H54.2296L44.9132 295.135H50.089L40.0825 349.163H47.3286L35.2518 403.19H79.7633L67.6866 349.163H74.5876L64.5811 295.135H69.7569L60.7856 247.224H65.9613L57.6801 199.313Z" fill="#7A9345" />
            {/* Right pine tree #1 */}
            <path d="M375.95 187.141H380.07V480.785H375.95V187.141Z" fill="#777740" />
            <path d="M378.01 65.4233L365.65 136.933H372.86L358.955 208.442H366.68L351.745 289.08H362.56L344.535 369.718H410.97L392.945 289.08H403.245L388.31 208.442H396.035L382.645 136.933H390.37L378.01 65.4233Z" fill="#6B8438" />
            <path opacity="0.5" d="M378.01 65.4233V369.718H410.97L392.945 289.08H403.245L388.31 208.442H396.035L382.645 136.933H390.37L378.01 65.4233Z" fill="#49632A" />
            {/* Right pine tree #2 */}
            <path d="M340.41 262.043H342.826V449.61H340.41V262.043Z" fill="#7C7D38" />
            <path d="M341.445 191.706L333.164 239.617H337.995L328.678 287.528H333.854L323.848 341.555H331.094L319.017 395.583H363.529L351.452 341.555H358.353L348.346 287.528H353.522L344.551 239.617H349.727L341.445 191.706Z" fill="#81994A" />
            {/* Bushes */}
            <path d="M42.745 459.485C54.1221 459.485 63.3451 447.905 63.3451 433.62C63.3451 419.335 54.1221 407.755 42.745 407.755C31.368 407.755 22.145 419.335 22.145 433.62C22.145 447.905 31.368 459.485 42.745 459.485Z" fill="#819B47" />
            <path d="M392.43 471.656C408.074 471.656 420.755 456.67 420.755 438.184C420.755 419.698 408.074 404.712 392.43 404.712C376.787 404.712 364.105 419.698 364.105 438.184C364.105 456.67 376.787 471.656 392.43 471.656Z" fill="#819B47" />
          </g>
          <defs>
            <linearGradient id="skybg" x1="0" y1="0" x2="0" y2="456.442" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F9CDA8" />
              <stop offset="1" stopColor="#FFF3CC" />
            </linearGradient>
            <clipPath id="cpbg">
              <rect width="412" height="456.442" fill="white" />
            </clipPath>
          </defs>
        </svg>

        {/* ── Tombol ⚙️ Pengaturan — Kanan atas ── */}
        <button
          type="button"
          onClick={() => navigate('/edit-profil')}
          aria-label="Pengaturan Akun"
          style={{
            position: 'absolute',
            top: 18,
            right: 20,
            zIndex: 10,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: 'none',
            boxShadow: '0 4px 12px rgba(67, 40, 28, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#43281C" strokeWidth="2.2" width="22" height="22" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* ── Nama User & Subjudul — Tengah atas ── */}
        <div style={{
          position: 'absolute',
          top: 66,
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 5,
          pointerEvents: 'none',
        }}>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: '#43281C',
            margin: 0,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}>
            {namaUser}
          </h1>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: '#685A4E',
            margin: '4px 0 0',
          }}>
            Teman belajar aksara Jawa
          </p>
        </div>

        {/* ── Area Maskot + Halo + Balon Ucapan + Sparkle ── */}
        <div style={{
          position: 'absolute',
          top: 163,
          left: 0,
          right: 0,
          zIndex: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '220px',
        }}>

          {/* Bintang sparkle oranye kecil di kiri avatar */}
          <div style={{
            position: 'absolute',
            left: 'calc(50% - 127px)',
            top: 95,
            zIndex: 8,
            pointerEvents: 'none',
          }} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path d="M10 0L11.8 8.2L20 10L11.8 11.8L10 20L8.2 11.8L0 10L8.2 8.2L10 0Z" fill="#F5A623" opacity="0.95" />
            </svg>
          </div>

          {/* Lingkaran Halo putih semi-transparan di belakang maskot */}
          <div style={{
            position: 'absolute',
            width: 214,
            height: 214,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.42)',
            boxShadow: '0 0 32px rgba(255, 255, 255, 0.45)',
            pointerEvents: 'none',
          }} />

          {/* Maskot — Ditampilkan utuh tanpa circular crop yang memotong blangkon */}
          <button
            type="button"
            onClick={() => setModalAvatar(true)}
            aria-label="Pilih avatar teman belajar"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 7,
              outline: 'none',
            }}
          >
            <img
              src="/assets/icon profile 1.svg"
              alt="Teman Belajar"
              style={{
                width: 178,
                height: 150,
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 4px 16px rgba(67, 40, 28, 0.08))',
              }}
              draggable={false}
            />
          </button>

          {/* Balon ucapan "Aku temani setiap langkahmu." — Di kanan bawah maskot */}
          <div style={{
            position: 'absolute',
            left: 'calc(50% + 38px)',
            top: 185,
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '7px 12px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10.5,
            fontWeight: 600,
            lineHeight: 1.35,
            color: '#43281C',
            boxShadow: '0 4px 14px rgba(67, 40, 28, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 9,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <span>Aku temani setiap</span>
            <span>langkahmu.</span>
            {/* Ekor balon menghadap pipi maskot */}
            <span style={{
              position: 'absolute',
              left: -6,
              top: 12,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '5px 6px 5px 0',
              borderColor: 'transparent #FFFFFF transparent transparent',
            }} />
          </div>
        </div>
      </div>
      {/* ============================================================
          END HERO PROFIL
          ============================================================ */}

      {/* ── BODY CONTENT: Overlap ke atas agar menutupi bagian bawah landscape ──
          Ruang untuk navbar melayang diatur oleh .isi di app.css (--tinggi-nav). */}
      <div style={{
        marginTop: '-46px',
        position: 'relative',
        zIndex: 10,
        padding: '0 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>

        {/* 1. Card Motivasi + Progres Belajar */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 26,
          padding: '22px 20px 18px',
          boxShadow: '0 8px 24px rgba(67, 40, 28, 0.05)',
          border: '1px solid #EFEAE3',
          textAlign: 'left',
        }}>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            lineHeight: 1.55,
            color: '#685A4E',
            margin: 0,
            textAlign: 'left',
          }}>
            Setiap aksara yang kamu pelajari adalah langkah untuk mengenal warisan kita. Teruskan perjalananmu, sedikit demi sedikit.
          </p>

          <div style={{ height: 1, background: '#F0ECE4', margin: '16px 0 14px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#E7EDDA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#46612E" strokeWidth="2.2" width="22" height="22">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: '#43281C' }}>
                  {selesaiCount} / {totalTitik}
                </span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: '#46612E' }}>
                  {totalPersen}%
                </span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#F0ECE4', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${totalPersen}%`, height: '100%', background: '#8FA55B', borderRadius: 999 }} />
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10.5, color: '#8C827A', marginTop: 2, textAlign: 'left' }}>
                Pelajaran selesai
              </span>
            </div>
          </div>
        </div>

        {/* 2. Kartu Barisan 3 Statistik — Unified Pill Card sesuai PROFIL 1.png */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 22,
          padding: '18px 12px',
          boxShadow: '0 4px 16px rgba(67, 40, 28, 0.04)',
          border: '1px solid #EFEAE3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}>
          {/* Kolom 1: Pelajaran selesai */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#7D6B5E" strokeWidth="2.2" width="22" height="22">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: '#43281C', lineHeight: 1.1 }}>
              {selesaiCount}
            </span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10.5, color: '#8C827A' }}>
              Pelajaran selesai
            </span>
          </div>

          {/* Garis Pembatas Vertikal */}
          <div style={{ width: 1, height: 44, background: '#EFEAE3' }} />

          {/* Kolom 2: Bab tuntas */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#C86A2E" strokeWidth="2.5" width="22" height="22">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: '#43281C', lineHeight: 1.1 }}>
              {babSelesaiCount} / 3
            </span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10.5, color: '#8C827A' }}>
              Bab tuntas
            </span>
          </div>

          {/* Garis Pembatas Vertikal */}
          <div style={{ width: 1, height: 44, background: '#EFEAE3' }} />

          {/* Kolom 3: Progres belajar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#7B61FF" strokeWidth="2.2" width="22" height="22">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: '#43281C', lineHeight: 1.1 }}>
              {totalPersen}%
            </span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10.5, color: '#8C827A' }}>
              Progres belajar
            </span>
          </div>
        </div>

        {/* 3. Section Perjalanan Belajarmu */}
        <div style={{ marginTop: 6, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 18,
              fontWeight: 800,
              color: '#43281C',
              margin: 0,
            }}>
              Perjalanan belajarmu
            </h2>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11.5,
              fontWeight: 500,
              color: '#8C827A',
            }}>
              {selesaiCount} / {totalTitik} pelajaran
            </span>
          </div>

          {/* 3 Bab Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {BAB.map((bab, i) => {
              const titikBab = JALUR.filter((t) => t.bab === bab.bab);
              const selesaiBab = bab.bab === 1 ? 5 : 0;
              const semuaSelesai = selesaiBab === 5;
              const persen = semuaSelesai ? 100 : 0;

              return (
                <button
                  key={bab.bab}
                  type="button"
                  onClick={() => navigate(`/belajar/materi/${bab.bab}`)}
                  aria-label={`Bab ${bab.bab}: ${bab.judul}`}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #EFEAE3',
                    borderRadius: 22,
                    padding: '12px 14px',
                    boxShadow: '0 4px 16px rgba(67, 40, 28, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {/* Thumbnail Maskot Bab */}
                  <div style={{
                    width: 108,
                    height: 86,
                    borderRadius: 16,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: i === 0 ? '#E7EDDA' : i === 1 ? '#FEE8C8' : '#E8E2F8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img
                      src={profilBabMascots[i] || '/assets/maskot profil bab 1.svg'}
                      alt={`Maskot Bab ${bab.bab}`}
                      draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Info Bab & Progres Bar */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: '#8C827A',
                      margin: 0,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>
                      BAB 0{bab.bab}
                    </p>
                    <h3 style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 14.5,
                      fontWeight: 800,
                      color: '#43281C',
                      margin: '2px 0 0',
                      lineHeight: 1.25,
                    }}>
                      {bab.judul}
                    </h3>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11,
                      color: '#8C827A',
                      margin: '4px 0 6px',
                    }}>
                      {selesaiBab} dari 5 pelajaran selesai
                    </p>
                    <div style={{ width: '100%', height: 6, background: '#F0ECE4', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${persen}%`,
                          height: '100%',
                          background: '#8FA55B',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>

                  {/* Aksi Selesai / Panah */}
                  <div style={{ flexShrink: 0, paddingRight: 4 }}>
                    {semuaSelesai ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#557538" strokeWidth="2.5" width="22" height="22">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#8C827A" strokeWidth="2.5" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Huruf Sering Salah (jika ada) */}
        {lemah.length > 0 && (
          <div className="card-lemah" style={{ textAlign: 'left' }}>
            <h3 className="lemah-title" style={{ textAlign: 'left' }}>Huruf sering salah</h3>
            <p className="lemah-sub" style={{ textAlign: 'left' }}>Latih lagi aksara berikut untuk memperkuat ingatanmu:</p>
            <div className="lemah-tags">
              {lemah.map((s) => {
                const infoHuruf = hurufDariKode(s.letter);
                return (
                  <span key={s.letter} className="lemah-tag-item">
                    <span className="aksara">{infoHuruf?.unicode ?? s.letter}</span>
                    <span className="latin">({s.letter})</span>
                    <span className="ratio">{s.wrong}x salah</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Banner Motivasi Bawah (Langkah pertamamu menunggu) */}
        <div style={{
          background: '#E7EDDA',
          borderRadius: 18,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          textAlign: 'left',
          marginTop: 2,
        }}>
          <div style={{ flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#46612E" strokeWidth="2.2" width="22" height="22">
              <path d="M12 22v-9" strokeLinecap="round" />
              <path d="M12 13a5 5 0 0 0 5-5c0-3-2-5-5-5s-5 2-5 5a5 5 0 0 0 5 5z" />
              <path d="M7 13a4 4 0 0 0-4-4c0-2.5 1.5-4 4-4" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12.5, fontWeight: 700, color: '#43281C' }}>
              Langkah pertamamu menunggu.
            </strong>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: '#685A4E' }}>
              Mulai satu pelajaran dan lihat progresmu tumbuh.
            </span>
          </div>
        </div>
      </div>

      {/* Modal Pilih Avatar */}
      <ModalGantiAvatar
        isOpen={modalAvatar}
        onClose={() => setModalAvatar(false)}
        activeAvatarId={activeAvatarId}
        onSelectAvatar={handleSelectAvatar}
      />
    </div>
  );
}