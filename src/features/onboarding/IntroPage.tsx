import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { MaskotIntro } from '../../app/MaskotAksa';
import { useSesi } from '../../lib/sesi';

export function IntroPage() {
  const navigate = useNavigate();
  const { pengguna, memuat } = useSesi();
  const [ctaHovered, setCtaHovered] = useState(false);

  // Jika sudah login, tidak perlu menampilkan layar intro — langsung ke beranda
  if (!memuat && pengguna) {
    return <Navigate to="/belajar" replace />;
  }

  const handleJelajahi = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    localStorage.setItem('aksaralens_onboarding_done', 'true');
    navigate('/belajar');
  };

  return (
    <div className="intro-screen">
      <div className="intro-blob-green" aria-hidden="true" />
      <div className="intro-blob-brown" aria-hidden="true" />

      <div className="intro-content">
        <h1 className="intro-headline">
          Yuk, mulai<br />
          cerita <span className="highlight-text">aksaramu!</span>
        </h1>
        <p className="intro-desc">
          Dari belum kenal, jadi paham.<br />
          Belajar aksara Jawa bareng Lensa.
        </p>

        <div className="intro-btn-group">
          <button
            type="button"
            className="intro-btn-primary"
            onClick={() => navigate('/daftar')}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            onFocus={() => setCtaHovered(true)}
            onBlur={() => setCtaHovered(false)}
          >
            Daftar sekarang
          </button>
          <button
            type="button"
            className="intro-btn-outline"
            onClick={() => navigate('/masuk')}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            onFocus={() => setCtaHovered(true)}
            onBlur={() => setCtaHovered(false)}
          >
            Sudah punya akun? Masuk
          </button>
          <button
            type="button"
            className="btn-text-jelajahi"
            onClick={handleJelajahi}
          >
            Jelajahi dulu tanpa akun <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className="intro-bottom-mascot">
        <MaskotIntro interested={ctaHovered} />
      </div>
    </div>
  );
}
