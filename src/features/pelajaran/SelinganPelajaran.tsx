import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { MaskotPerjalanan } from '../../app/MaskotPerjalanan';
import type { AdeganPembuka, AdeganPenutup } from './selingan';
import './selingan.css';

/**
 * Selingan layar penuh ala "cutscene" di awal dan akhir tiap tahap belajar.
 * Adegan (gerak masuk maskot, langit, efek, kalimat) dipilih oleh selingan.ts dari kondisi pembelajar,
 * jadi animasinya tidak sama terus. Ditutup otomatis, atau ketuk di mana saja / tombol "Lewati".
 * Dirender ke dalam .shell (bingkai ponsel) lewat portal agar menutupi seluruh layar aplikasi.
 */

type Props =
  | { mode: 'pembuka'; adegan: AdeganPembuka; bab: 1 | 2 | 3; label: string; hurufLemah?: string; onSelesai: () => void }
  | { mode: 'penutup'; adegan: AdeganPenutup; bab: 1 | 2 | 3; label: string; onSelesai: () => void };

const DURASI = { pembuka: 2800, penutup: 4200 } as const;
const DURASI_KELUAR = 280;

const tunda = (detik: number): CSSProperties => ({ animationDelay: `${detik}s` });

// Potongan konfeti dengan posisi tetap (deterministik) agar ringan
const KONFETI = Array.from({ length: 26 }, (_, i) => ({
  kiri: (i * 37) % 100,
  tunda: ((i * 7) % 13) / 10,
  durasi: 1.8 + ((i * 5) % 9) / 10,
  warna: ['#FFD263', '#BBA4EF', '#9CAF6C', '#EE851B', '#DC9B8C', '#FFFFFF'][i % 6],
  putar: (i * 47) % 360,
  bulat: i % 4 === 0,
}));

function Langit({ waktu }: { waktu: AdeganPembuka['waktu'] }) {
  const malam = waktu === 'malam';
  return (
    <div className="sl-langit" aria-hidden="true">
      {malam ? (
        <>
          <svg className="sl-bulan" viewBox="0 0 60 60" width="60" height="60">
            <path d="M40 8 A24 24 0 1 0 52 44 A19 19 0 1 1 40 8 Z" fill="#FFF3C4" />
          </svg>
          {[[12, 18], [30, 10], [70, 22], [84, 12], [58, 30], [20, 34]].map(([x, y], i) => (
            <span key={i} className="sl-bintang-langit" style={{ left: `${x}%`, top: `${y}%`, ...tunda(i * 0.3) }} />
          ))}
        </>
      ) : (
        <div className={`sl-matahari sl-matahari-${waktu}`} />
      )}
      <svg className="sl-awan sl-awan-1" viewBox="0 0 90 36" width="90" height="36">
        <path d="M14 30 C2 30 2 16 14 16 C16 6 32 4 38 12 C44 2 64 4 64 16 C78 14 84 30 70 30 Z" fill="#FFFFFF" opacity={malam ? 0.18 : 0.85} />
      </svg>
      <svg className="sl-awan sl-awan-2" viewBox="0 0 90 36" width="70" height="28">
        <path d="M14 30 C2 30 2 16 14 16 C16 6 32 4 38 12 C44 2 64 4 64 16 C78 14 84 30 70 30 Z" fill="#FFFFFF" opacity={malam ? 0.14 : 0.7} />
      </svg>
    </div>
  );
}

function Bukit() {
  return (
    <svg className="sl-bukit" viewBox="0 0 412 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 52 C80 20 150 26 220 44 C290 62 350 30 412 38 L412 120 L0 120 Z" fill="#B7C98A" />
      <path d="M0 74 C70 56 140 60 206 70 C280 82 340 60 412 66 L412 120 L0 120 Z" fill="#9CAF6C" />
      {[30, 86, 150, 268, 330, 384].map((x, i) => (
        <path
          key={x}
          className="sl-rumput"
          style={tunda(-i * 0.4)}
          d={`M${x - 8} 74 C${x - 7} 69 ${x - 6} 66 ${x - 4} 63 C${x - 3} 68 ${x - 2} 71 ${x - 1} 74 C${x} 69 ${x + 1} 64 ${x + 3} 60 C${x + 3.6} 66 ${x + 4} 70 ${x + 5} 74 Z`}
          fill="#7C9150"
        />
      ))}
    </svg>
  );
}

function Efek({ efek }: { efek: AdeganPenutup['efek'] }) {
  if (efek === 'konfeti' || efek === 'piala') {
    return (
      <div className="sl-konfeti" aria-hidden="true">
        {KONFETI.map((k, i) => (
          <span
            key={i}
            className={`sl-konfeti-potong ${k.bulat ? 'bulat' : ''}`}
            style={{
              left: `${k.kiri}%`,
              background: k.warna,
              animationDelay: `${k.tunda}s`,
              animationDuration: `${k.durasi}s`,
              ['--putar' as string]: `${k.putar}deg`,
            }}
          />
        ))}
      </div>
    );
  }
  if (efek === 'kilat') {
    return (
      <div className="sl-efek-kilat" aria-hidden="true">
        {[18, 34, 52, 70, 86].map((t, i) => (
          <span key={t} className="sl-garis-laju" style={{ top: `${t}%`, ...tunda(i * 0.12) }} />
        ))}
      </div>
    );
  }
  if (efek === 'bintang') {
    return (
      <div className="sl-efek-bintang" aria-hidden="true">
        {[[14, 30], [82, 26], [22, 58], [78, 54], [50, 16]].map(([x, y], i) => (
          <svg key={i} className="sl-kerlip" style={{ left: `${x}%`, top: `${y}%`, ...tunda(i * 0.25) }} viewBox="0 0 20 20" width="18" height="18">
            <path d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z" fill="#FFD263" />
          </svg>
        ))}
      </div>
    );
  }
  // semangat: hati-hati kecil melayang naik, hangat & menenangkan
  return (
    <div className="sl-efek-semangat" aria-hidden="true">
      {[20, 38, 62, 80].map((x, i) => (
        <svg key={x} className="sl-hati" style={{ left: `${x}%`, ...tunda(i * 0.45) }} viewBox="0 0 20 18" width="18" height="16">
          <path d="M10 17 C-4 8 2 -3 10 4 C18 -3 24 8 10 17 Z" fill="#DC9B8C" />
        </svg>
      ))}
    </div>
  );
}

function Piala() {
  return (
    <div className="sl-piala-wrap" aria-hidden="true">
      <div className="sl-sinar" />
      <svg className="sl-piala" viewBox="0 0 64 70" width="64" height="70">
        <path d="M16 6 H48 V22 C48 34 40 42 32 42 C24 42 16 34 16 22 Z" fill="#FFD263" stroke="#C99723" strokeWidth="2.5" />
        <path d="M16 12 H8 C8 24 12 28 18 29 M48 12 H56 C56 24 52 28 46 29" stroke="#C99723" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="28" y="42" width="8" height="12" fill="#C99723" />
        <rect x="18" y="54" width="28" height="9" rx="2.5" fill="#8C5426" />
        <path d="M24 14 Q26 26 32 30" stroke="#FFF3C4" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

function Bintang({ terisi, urut }: { terisi: boolean; urut: number }) {
  return (
    <svg
      className={`sl-bintang ${terisi ? 'terisi' : ''} ${urut === 1 ? 'tengah' : ''}`}
      style={tunda(0.45 + urut * 0.3)}
      viewBox="0 0 40 40"
      width={urut === 1 ? 50 : 40}
      height={urut === 1 ? 50 : 40}
      aria-hidden="true"
    >
      <path
        d="M20 2 L25 14 L38 15 L28 24 L31 37 L20 30 L9 37 L12 24 L2 15 L15 14 Z"
        fill={terisi ? '#FFD263' : '#E6E0D6'}
        stroke={terisi ? '#C99723' : '#D3CBBF'}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SelinganPelajaran(props: Props) {
  const { mode, bab, label, onSelesai } = props;
  const [keluar, setKeluar] = useState(false);
  const selesaiRef = useRef(false);
  const tombolRef = useRef<HTMLButtonElement | null>(null);

  const tutup = useCallback(() => {
    if (selesaiRef.current) return;
    selesaiRef.current = true;
    setKeluar(true);
    window.setTimeout(onSelesai, DURASI_KELUAR);
  }, [onSelesai]);

  useEffect(() => {
    const t = window.setTimeout(tutup, DURASI[mode]);
    tombolRef.current?.focus({ preventScroll: true });
    const tombolKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') tutup();
    };
    window.addEventListener('keydown', tombolKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', tombolKey);
    };
  }, [mode, tutup]);

  const target = typeof document !== 'undefined' ? document.querySelector('.shell') ?? document.body : null;
  if (!target) return null;

  const pembuka = props.mode === 'pembuka' ? props.adegan : null;
  const penutup = props.mode === 'penutup' ? props.adegan : null;
  const varian = pembuka?.varian ?? penutup!.varian;
  const latar = pembuka ? `sl-waktu-${pembuka.waktu}` : `sl-hasil-${penutup!.varian}`;

  return createPortal(
    <div
      className={`sl-layar sl-${mode} ${latar} sl-bab${bab} ${keluar ? 'sl-keluar' : ''}`}
      onClick={tutup}
      role="dialog"
      aria-modal="true"
      aria-label={pembuka ? `Pembuka tahap ${label}` : `Tahap ${label} selesai`}
    >
      {pembuka && <Langit waktu={pembuka.waktu} />}
      {penutup && <Efek efek={penutup.efek} />}

      <div className="sl-isi" aria-live="polite">
        <span className="sl-chip">{pembuka ? label : 'TAHAP SELESAI'}</span>

        {penutup && (
          <div className="sl-bintang-baris" aria-label={`${penutup.bintang} dari 3 bintang`}>
            {[0, 1, 2].map((i) => (
              <Bintang key={i} urut={i} terisi={i < penutup.bintang} />
            ))}
          </div>
        )}

        <div className="sl-panggung">
          {penutup?.efek === 'piala' && <Piala />}
          {pembuka?.varian === 'perkuat' && props.mode === 'pembuka' && props.hurufLemah && (
            <span className="sl-kartu-huruf">{props.hurufLemah}</span>
          )}
          <div className={`sl-maskot sl-masuk-${varian}`}>
            <MaskotPerjalanan aktivitas={pembuka?.aktivitas ?? penutup!.aktivitas} bab={bab} />
          </div>
        </div>

        <h2 className="sl-judul">{pembuka?.judul ?? penutup!.judul}</h2>
        <p className="sl-sub">{pembuka?.sub ?? penutup!.sub}</p>
        {penutup?.lencana && <span className="sl-lencana">🔥 {penutup.lencana}</span>}
      </div>

      {pembuka && <Bukit />}

      <button
        ref={tombolRef}
        type="button"
        className="sl-lewati"
        onClick={(e) => {
          e.stopPropagation();
          tutup();
        }}
      >
        {pembuka ? 'Mulai' : 'Lanjut'}
      </button>
      <div className="sl-penghitung" style={{ animationDuration: `${DURASI[mode]}ms` }} aria-hidden="true" />
    </div>,
    target,
  );
}
