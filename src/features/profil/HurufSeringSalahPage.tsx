// Menu "Huruf sering salah": dua daftar terpisah, salah ditebak (kuis) dan salah digambar
// (cek tulisan). Tombol "Sudah kukuasai" mengeluarkan huruf dari daftar (hitungan salah = 0);
// huruf itu bisa muncul lagi bila kemudian salah lagi.

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { hurufSeringSalah, type JenisStat } from '../../progres/model';
import { useProgres } from '../../progres/ProgresProvider';
import { aksaraDariKunciStat } from './dataProgres';
import './huruf-sering-salah.css';

const TAB: { jenis: JenisStat; label: string; kosong: string; sub: string }[] = [
  {
    jenis: 'tebak',
    label: 'Salah ditebak',
    sub: 'Aksara yang sering keliru kamu kenali saat menjawab soal.',
    kosong: 'Belum ada aksara yang sering salah ditebak. Pertahankan!',
  },
  {
    jenis: 'tulis',
    label: 'Salah digambar',
    sub: 'Aksara yang tulisannya sering belum tepat saat latihan menulis.',
    kosong: 'Belum ada aksara yang sering salah digambar. Goresanmu sudah rapi!',
  },
];

export function HurufSeringSalahPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { stats, kuasai } = useProgres();
  const jenis: JenisStat = params.get('jenis') === 'tulis' ? 'tulis' : 'tebak';
  const [konfirmasi, setKonfirmasi] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const daftar = {
    tebak: hurufSeringSalah(stats, Infinity, 'tebak'),
    tulis: hurufSeringSalah(stats, Infinity, 'tulis'),
  };
  const tab = TAB.find((t) => t.jenis === jenis)!;
  const isi = daftar[jenis];

  const gantiTab = (j: JenisStat) => {
    setKonfirmasi(null);
    setParams(j === 'tulis' ? { jenis: 'tulis' } : {}, { replace: true });
  };

  const tandai = (letter: string) => {
    kuasai(letter, jenis);
    setKonfirmasi(null);
    setToast(`“${letter}” dihapus dari daftar. Hebat!`);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="profil-edit-page-container">
      {toast && (
        <div className="edit-toast-banner" role="status">
          <span>{toast}</span>
        </div>
      )}

      <div className="edit-nav-bar">
        <button type="button" className="btn-circle-nav-edit" onClick={() => navigate('/profil')} aria-label="Kembali ke profil">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="edit-page-title">Huruf Sering Salah</h1>
        <div style={{ width: '40px' }} aria-hidden="true" />
      </div>

      <div className="edit-scroll-body">
        <div className="hss-tabs" role="tablist" aria-label="Jenis kesalahan">
          {TAB.map((t) => (
            <button
              key={t.jenis}
              type="button"
              role="tab"
              aria-selected={t.jenis === jenis}
              className={`hss-tab${t.jenis === jenis ? ' aktif' : ''}`}
              onClick={() => gantiTab(t.jenis)}
            >
              {t.label}
              <span className="hss-tab-jumlah">{daftar[t.jenis].length}</span>
            </button>
          ))}
        </div>

        <p className="hss-sub">{tab.sub}</p>

        {isi.length === 0 ? (
          <div className="hss-kosong">{tab.kosong}</div>
        ) : (
          <ul className="hss-daftar" role="tabpanel">
            {isi.map((s) => {
              const total = s.correct + s.wrong;
              const tepat = Math.round((s.correct / total) * 100);
              const yakin = konfirmasi === s.letter;
              return (
                <li key={s.letter} className="hss-item">
                  <span className="hss-aksara aksara" aria-hidden="true">
                    {aksaraDariKunciStat(s.letter) ?? s.letter}
                  </span>
                  <div className="hss-info">
                    <strong className="hss-latin">{s.letter}</strong>
                    <span className="hss-hitung">
                      {s.wrong}x salah dari {total} percobaan
                    </span>
                    <span className="hss-bar" aria-label={`Ketepatan ${tepat}%`}>
                      <span style={{ width: `${tepat}%` }} />
                    </span>
                  </div>
                  {yakin ? (
                    <div className="hss-yakin">
                      <button type="button" className="hss-btn hss-btn-ya" onClick={() => tandai(s.letter)}>
                        Ya, hapus
                      </button>
                      <button type="button" className="hss-btn hss-btn-batal" onClick={() => setKonfirmasi(null)}>
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="hss-btn hss-btn-kuasai"
                      onClick={() => setKonfirmasi(s.letter)}
                      aria-label={`Tandai ${s.letter} sudah dikuasai`}
                    >
                      Sudah kukuasai
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="hss-catatan">
          Aksara yang ditandai dikuasai akan muncul lagi bila kamu kembali sering salah.
        </p>
      </div>
    </div>
  );
}
