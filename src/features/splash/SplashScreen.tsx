import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSesi } from '../../lib/sesi';

export function SplashScreen() {
  const navigate = useNavigate();
  const { pengguna, memuat } = useSesi();

  const lanjut = () => {
    if (memuat) return;
    if (pengguna) {
      navigate('/belajar', { replace: true });
      return;
    }
    const onboardingDone = localStorage.getItem('aksaralens_onboarding_done');
    if (onboardingDone) {
      navigate('/intro', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  };

  useEffect(() => {
    // Tunggu sampai status sesi Supabase selesai diperiksa
    if (memuat) return;

    if (pengguna) {
      // Pengguna sudah login (termasuk setelah redirect dari Google OAuth)
      const timer = setTimeout(() => {
        navigate('/belajar', { replace: true });
      }, 700);
      return () => clearTimeout(timer);
    }

    // Pengguna belum login: cek onboarding
    const onboardingDone = localStorage.getItem('aksaralens_onboarding_done');
    const timer = setTimeout(() => {
      if (onboardingDone) {
        navigate('/intro', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [pengguna, memuat, navigate]);

  return (
    <div
      onClick={lanjut}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F7F4F1',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        padding: '32px 24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Ornamen dekorasi latar belakang */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(156, 175, 108, 0.18) 0%, rgba(247, 244, 241, 0) 70%)',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Maskot / Ilustrasi Utama */}
      <div
        style={{
          width: '140px',
          height: '140px',
          borderRadius: '36px',
          background: '#E7EDDA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(67, 40, 28, 0.08)',
          marginBottom: '28px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <img
          src="/assets/icon profile 1.svg"
          alt="Maskot Aksa"
          style={{ width: '92px', height: '92px', objectFit: 'contain' }}
          draggable={false}
          onError={(e) => {
            // Fallback bila aset belum ada
            (e.target as HTMLImageElement).src = '/assets/maskot intro.svg';
          }}
        />
      </div>

      {/* Brand Lockup */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px',
          marginBottom: '8px',
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '32px',
            fontWeight: 800,
            color: '#43281C',
            letterSpacing: '-0.02em',
          }}
        >
          Aksara
        </span>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '32px',
            fontWeight: 400,
            color: '#7C7064',
            letterSpacing: '-0.02em',
          }}
        >
          Lensa
        </span>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '14px',
          fontWeight: 500,
          color: '#685A4E',
          margin: 0,
          textAlign: 'center',
          maxWidth: '260px',
          lineHeight: 1.5,
          zIndex: 2,
        }}
      >
        Belajar aksara Jawa dengan mudah, interaktif, dan menyenangkan.
      </p>

      {/* Indikator Memuat / Titik Aksara */}
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#9CAF6C',
              animation: 'pulse 1.2s infinite ease-in-out',
            }}
          />
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#C86A2E',
              animation: 'pulse 1.2s infinite ease-in-out 0.2s',
            }}
          />
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#43281C',
              animation: 'pulse 1.2s infinite ease-in-out 0.4s',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '11px',
            color: '#A0958B',
            letterSpacing: '0.04em',
          }}
        >
          Ketuk layar untuk mulai
        </span>
      </div>
    </div>
  );
}

