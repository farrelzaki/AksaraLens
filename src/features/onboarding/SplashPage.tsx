import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export function SplashPage() {
  const navigate = useNavigate();
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Start exit animation at 3.5s, navigate at 4s
    const t1 = setTimeout(() => setAnimating(true), 3400);
    const t2 = setTimeout(() => {
      navigate('/onboarding');
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [navigate]);

  return (
    <div
      className={`splash-screen${animating ? ' splash-exit' : ''}`}
      onClick={() => navigate('/onboarding')}
      role="button"
      tabIndex={0}
      aria-label="Masuk ke onboarding"
      onKeyDown={(e) => e.key === 'Enter' && navigate('/onboarding')}
    >
      {/* Mascot - logo splash screen */}
      <div className="splash-mascot-wrap">
        <img
          src="/assets/logo splash screen.svg"
          alt="Maskot AksaraLens"
          className="splash-mascot-img"
          draggable={false}
        />
      </div>

      {/* Brand */}
      <div className="splash-brand-group">
        <h1 className="splash-brand-title">
          <span className="splash-brand-bold">Aksara</span>
          <span className="splash-brand-light">Lensa</span>
          <span className="splash-brand-dot">.</span>
        </h1>
        <p className="splash-tagline">Kenali. Tulis. Pahami.</p>
      </div>

      {/* Loading dots */}
      <div className="splash-loading-dots" aria-hidden="true">
        <span className="splash-dot splash-dot-1" />
        <span className="splash-dot splash-dot-2" />
        <span className="splash-dot splash-dot-3" />
      </div>
    </div>
  );
}
