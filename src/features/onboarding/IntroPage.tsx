import { useNavigate } from 'react-router';

export function IntroPage() {
  const navigate = useNavigate();

  const handleJelajahi = () => {
    localStorage.setItem('hasSeenIntro', 'true');
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
          >
            Daftar sekarang
          </button>
          <button
            type="button"
            className="intro-btn-outline"
            onClick={() => navigate('/masuk')}
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
        <div className="intro-bubble">
          <span>
            Hai! Aku Aksa <span style={{ color: '#7E993B', marginLeft: '4px' }}>✦</span>
          </span>
        </div>
        <img
          src="/assets/maskot intro.svg"
          alt="Maskot Aksa"
          className="intro-mascot-img"
          draggable={false}
        />
      </div>
    </div>
  );
}
