import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useSesi } from '../../lib/sesi';
import { OnboardingSceneArt } from './OnboardingSceneArt';

const SCENES = [
  {
    stepCode: '01 / 03',
    stepLabel: 'KENALI AKSARANYA',
    title: 'Cerita besar.\nMulai dari\nsatu aksara.',
    desc: 'Kenali aksara Jawa lewat tiga bab dan pelajaran pendek. Satu langkah, satu hal baru.',
    sceneLabel: 'Aksa mengenal huruf aksara Jawa dari buku belajar',
  },
  {
    stepCode: '02 / 03',
    stepLabel: 'COBA GORESANNYA',
    title: 'Lihat bentuknya.\nCoba tulis.\nKamu bisa!',
    desc: 'Lihat animasi contoh, tulis di kanvas dalam materi, lalu uji pemahamanmu dengan kuis.',
    sceneLabel: 'Aksa berlatih menulis goresan aksara Jawa di kanvas',
  },
  {
    stepCode: '03 / 03',
    stepLabel: 'TEMUKAN BUNYINYA',
    title: 'Dari bentuk,\njadi bunyi.\nJadi mengerti.',
    desc: 'Jelajahi Lensa untuk memahami teks Latin dan detail per suku kata. Hasil scan saat ini memakai contoh demo.',
    sceneLabel: 'Aksa memindai aksara Jawa dengan Lensa Aksara untuk mengetahui bunyinya',
  },
];

export function OnboardingPage() {
  const { pengguna, memuat } = useSesi();
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Jika sudah login, langsung ke beranda belajar
  if (!memuat && pengguna) {
    return <Navigate to="/belajar" replace />;
  }

  const handleSelesai = () => {
    localStorage.setItem('aksaralens_onboarding_done', 'true');
    navigate('/intro');
  };

  const goTo = (nextIndex: number) => {
    if (animating || nextIndex === index) return;
    setAnimating(true);
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      setIndex(nextIndex);
      setAnimating(false);
    }, 220);
  };

  const handleNext = () => {
    if (index < SCENES.length - 1) {
      goTo(index + 1);
    } else {
      handleSelesai();
    }
  };

  const handleBack = () => {
    if (index > 0) {
      goTo(index - 1);
    } else {
      navigate('/splash');
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < 42) return;
    if (deltaX < 0 && index < SCENES.length - 1) {
      goTo(index + 1);
    } else if (deltaX > 0 && index > 0) {
      goTo(index - 1);
    }
  };

  const current = SCENES[index];

  return (
    <div
      className="onboarding-screen"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="onboarding-header">
        <button
          type="button"
          className="btn-circle-nav-dark"
          onClick={handleBack}
          aria-label="Kembali"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="onboarding-brand">AKSARA LENSA</span>
        <button type="button" className="btn-lewati" onClick={handleSelesai}>
          Lewati
        </button>
      </header>

      {/* Body: Step label + title + desc */}
      <div className="onboarding-body">
        <span
          className={`onboarding-step-label${animating ? ' onboarding-slide-out' : ' onboarding-slide-in'}`}
          key={`label-${index}`}
        >
          {current.stepCode} · {current.stepLabel}
        </span>
        <h1
          className={`onboarding-title${animating ? ' onboarding-slide-out' : ' onboarding-slide-in'}`}
          key={`title-${index}`}
        >
          {current.title.split('\n').map((line, i) => (
            <span key={i}>{line}<br /></span>
          ))}
        </h1>
        <p
          className={`onboarding-desc${animating ? ' onboarding-slide-out' : ' onboarding-slide-in'}`}
          key={`desc-${index}`}
        >
          {current.desc}
        </p>
      </div>

      {/* Scene illustration */}
      <div className="onboarding-scene-container">
        <div
          key={`scene-${index}`}
          className={`onboarding-scene-wrap${animating ? ' onboarding-scene-fade-out' : ' onboarding-scene-fade-in'}`}
          role="img"
          aria-label={current.sceneLabel}
        >
          <OnboardingSceneArt step={index} />
        </div>
      </div>

      {/* Footer */}
      <footer className="onboarding-footer">
        <div className="slider-dots" role="tablist" aria-label="Langkah onboarding">
          {SCENES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`dot-bar${i === index ? ' active' : ''}`}
              onClick={() => i !== index && goTo(i)}
              aria-label={`Ke langkah ${i + 1}`}
              aria-selected={i === index}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn-onboarding-next"
          onClick={handleNext}
          aria-label={index === SCENES.length - 1 ? 'Mulai sekarang' : 'Lanjut'}
        >
          <span>{index === SCENES.length - 1 ? 'Mulai sekarang' : 'Lanjut'}</span>
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </footer>
    </div>
  );
}
