import { useState } from 'react';
import { useNavigate } from 'react-router';

const SCENES = [
  {
    stepCode: '01 / 03',
    stepLabel: 'KENALI AKSARANYA',
    title: 'Cerita besar.\nMulai dari\nsatu aksara.',
    desc: 'Kenali aksara Jawa lewat tiga bab dan pelajaran pendek. Satu langkah, satu hal baru.',
    image: '/assets/OnboardingScene 1.svg',
  },
  {
    stepCode: '02 / 03',
    stepLabel: 'COBA GORESANNYA',
    title: 'Lihat bentuknya.\nCoba tulis.\nKamu bisa!',
    desc: 'Lihat animasi contoh, tulis di kanvas dalam materi, lalu uji pemahamanmu dengan kuis.',
    image: '/assets/OnboardingScene 2.svg',
  },
  {
    stepCode: '03 / 03',
    stepLabel: 'TEMUKAN BUNYINYA',
    title: 'Dari bentuk,\njadi bunyi.\nJadi mengerti.',
    desc: 'Jelajahi Lensa untuk memahami teks Latin dan detail per suku kata. Hasil scan saat ini memakai contoh demo.',
    image: '/assets/OnboardingScene 3.svg',
  },
];

export function OnboardingPage() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();

  const goTo = (nextIndex: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setIndex(nextIndex);
      setAnimating(false);
    }, 240);
  };

  const handleNext = () => {
    if (index < SCENES.length - 1) {
      goTo(index + 1);
    } else {
      navigate('/intro');
    }
  };

  const handleLewati = () => {
    navigate('/intro');
  };

  const handleBack = () => {
    if (index > 0) {
      goTo(index - 1);
    } else {
      navigate('/splash');
    }
  };

  const current = SCENES[index];

  return (
    <div className="onboarding-screen">
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
        <button type="button" className="btn-lewati" onClick={handleLewati}>
          Lewati
        </button>
      </header>

      {/* Body: Step label + title + desc */}
      <div className="onboarding-body">
        <span className="onboarding-step-label">
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
        <img
          key={`scene-${index}`}
          src={current.image}
          alt={`Ilustrasi Onboarding ${index + 1}`}
          className={`onboarding-scene-img${animating ? ' onboarding-scene-fade-out' : ' onboarding-scene-fade-in'}`}
          draggable={false}
        />
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
