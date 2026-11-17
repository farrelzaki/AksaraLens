import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MaskotSplash } from '../../app/MaskotAksa';
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
    navigate('/onboarding', { replace: true });
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

    // Pengguna belum login: selalu arahkan ke Onboarding (1-3) lalu Intro sesuai userflow utama
    const timer = setTimeout(() => {
      navigate('/onboarding', { replace: true });
    }, 2300);

    return () => clearTimeout(timer);
  }, [pengguna, memuat, navigate]);

  return (
    <div onClick={lanjut} className="splash-v2-screen">
      {/* Ornamen dekorasi latar belakang berdenyut lembut */}
      <div className="splash-v2-aura" aria-hidden="true" />
      <div className="splash-v2-aura-warm" aria-hidden="true" />

      {/* Maskot Utama */}
      <div className="splash-v2-badge">
        <div className="splash-v2-mascot-wrap">
          <MaskotSplash />
        </div>
      </div>

      {/* Brand Lockup */}
      <div className="splash-v2-brand">
        <span className="splash-v2-brand-bold">Aksara</span>
        <span className="splash-v2-brand-light">Lensa</span>
      </div>

      {/* Tagline */}
      <p className="splash-v2-tagline">
        Belajar aksara Jawa dengan mudah, interaktif, dan menyenangkan.
      </p>

      {/* Indikator Memuat / Titik Aksara */}
      <div className="splash-v2-footer">
        <div className="splash-v2-dots" aria-hidden="true">
          <span className="splash-v2-dot splash-v2-dot-1" />
          <span className="splash-v2-dot splash-v2-dot-2" />
          <span className="splash-v2-dot splash-v2-dot-3" />
        </div>
        <span className="splash-v2-hint">Ketuk layar untuk mulai</span>
      </div>
    </div>
  );
}

