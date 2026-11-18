import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useProgres } from '../../progres/ProgresProvider';
import {
  AMBANG_DIKUASAI,
  LABEL_PENGUASAAN,
  detailAksara,
  detailPelajaran,
  ringkasAksara,
  type DetailTahap,
  type Penguasaan,
} from './dataProgres';
import './detail-progres.css';

export type TabDetail = 'pelajaran' | 'aksara' | 'menulis';
type Saring = 'semua' | Penguasaan;

interface Props {
  tab: TabDetail | null;
  saringAwal?: Saring;
  onTutup: () => void;
}

const NAMA_TAB: Record<TabDetail, string> = { pelajaran: 'Pelajaran', aksara: 'Aksara', menulis: 'Menulis' };

const rute = (t: Pick<DetailTahap, 'id' | 'jenis'>) => (t.jenis === 'tulis' ? `/latihan/${t.id}` : `/pelajaran/${t.id}`);

function IkonStatus({ status }: { status: DetailTahap['status'] }) {
  if (status === 'selesai')
    return (
      <span className="dp-ikon dp-ikon-selesai" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
      </span>
    );
  if (status === 'terbuka')
    return (
      <span className="dp-ikon dp-ikon-terbuka" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor"><path d="M6 4l10 6-10 6z" /></svg>
      </span>
    );
  return (
    <span className="dp-ikon dp-ikon-terkunci" aria-hidden="true">
      <svg viewBox="0 0 20 20" width="11" height="11" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
    </span>
  );
}

const LABEL_STATUS: Record<DetailTahap['status'], string> = { selesai: 'Selesai', terbuka: 'Berikutnya', terkunci: 'Terkunci' };

export function DetailProgres({ tab, saringAwal = 'semua', onTutup }: Props) {
  const { tahap, stats } = useProgres();
  const navigate = useNavigate();
  const [aktif, setAktif] = useState<TabDetail>('pelajaran');
  const [saring, setSaring] = useState<Saring>(saringAwal);
  const tutupRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!tab) return;
    setAktif(tab);
    setSaring(saringAwal);
    tutupRef.current?.focus({ preventScroll: true });
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onTutup();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [tab, saringAwal, onTutup]);

  const bab = useMemo(() => detailPelajaran(tahap), [tahap]);
  const kelompok = useMemo(() => detailAksara(tahap, stats), [tahap, stats]);
  const ringkas = useMemo(() => ringkasAksara(kelompok), [kelompok]);

  if (!tab) return null;
  const target = document.querySelector('.shell') ?? document.body;

  const selesaiSemua = bab.reduce((n, b) => n + b.selesai, 0);
  const totalSemua = bab.reduce((n, b) => n + b.total, 0);
  const tulis = bab.map((b) => ({ ...b, t: b.tahap.find((x) => x.jenis === 'tulis')! }));
  const tulisSelesai = tulis.filter((b) => b.t.status === 'selesai').length;

  const buka = (t: DetailTahap) => {
    if (t.status === 'terkunci') return;
    onTutup();
    navigate(rute(t));
  };

  return createPortal(
    <div className="dp-latar" onClick={onTutup}>
      <section
        className="dp-lembar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-judul"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dp-pegangan" aria-hidden="true" />
        <header className="dp-kepala">
          <h2 id="dp-judul" className="dp-judul">Detail progres</h2>
          <button ref={tutupRef} type="button" className="dp-tutup" onClick={onTutup} aria-label="Tutup detail progres">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <div className="dp-tab" role="tablist" aria-label="Jenis detail">
          {(Object.keys(NAMA_TAB) as TabDetail[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={aktif === k}
              className={`dp-tab-item ${aktif === k ? 'aktif' : ''}`}
              onClick={() => setAktif(k)}
            >
              {NAMA_TAB[k]}
            </button>
          ))}
        </div>

        <div className="dp-isi" role="tabpanel">
          {/* ================= PELAJARAN ================= */}
          {aktif === 'pelajaran' && (
            <>
              <p className="dp-ringkas">
                <strong>{selesaiSemua}</strong> dari {totalSemua} pelajaran selesai ·{' '}
                <strong>{bab.filter((b) => b.tuntas).length}</strong> dari {bab.length} bab tuntas
              </p>
              {bab.map((b) => (
                <div key={b.bab} className={`dp-kartu dp-bab${b.bab}`}>
                  <div className="dp-kartu-kepala">
                    <div>
                      <span className="dp-overline">BAB 0{b.bab}</span>
                      <h3 className="dp-kartu-judul">{b.judul}</h3>
                    </div>
                    <span className={`dp-pil ${b.tuntas ? 'dp-pil-sukses' : ''}`}>
                      {b.tuntas ? 'Tuntas' : `${b.selesai} / ${b.total}`}
                    </span>
                  </div>
                  <ol className="dp-daftar">
                    {b.tahap.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          className={`dp-baris dp-baris-${t.status}`}
                          disabled={t.status === 'terkunci'}
                          onClick={() => buka(t)}
                          aria-label={`${t.nomor}. ${t.nama}: ${LABEL_STATUS[t.status]}`}
                        >
                          <IkonStatus status={t.status} />
                          <span className="dp-baris-nama">
                            {t.nomor}. {t.nama}
                          </span>
                          <span className="dp-baris-status">
                            {t.status === 'selesai' ? 'Selesai · ulangi' : LABEL_STATUS[t.status]}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </>
          )}

          {/* ================= AKSARA ================= */}
          {aktif === 'aksara' && (
            <>
              <div className="dp-statistik">
                <div>
                  <strong>{ringkas.dipelajari}</strong>
                  <span>dari {ringkas.total} dipelajari</span>
                </div>
                <div>
                  <strong>{ringkas.dikuasai}</strong>
                  <span>dikuasai</span>
                </div>
                <div>
                  <strong>{ringkas.perluLatihan}</strong>
                  <span>perlu latihan</span>
                </div>
              </div>

              <div className="dp-penjelasan">
                <p>
                  <span className="dp-tanda dp-tanda-belajar" aria-hidden="true" /> <strong>Status belajar</strong>: aksara
                  sudah dikenalkan setelah tahap Kenali di babnya selesai.
                </p>
                <p>
                  <span className="dp-tanda dp-tanda-kuasai" aria-hidden="true" /> <strong>Penguasaan</strong>: dari ketepatan
                  jawabanmu di kuis dan latihan menulis. Dikuasai = minimal {AMBANG_DIKUASAI.benar}× benar dengan ketepatan{' '}
                  {Math.round(AMBANG_DIKUASAI.ketepatan * 100)}%.
                </p>
              </div>

              <div className="dp-saring" role="group" aria-label="Saring aksara">
                {(['semua', 'dikuasai', 'berkembang', 'perlu-latihan', 'belum-dicoba'] as Saring[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`dp-saring-item ${saring === s ? 'aktif' : ''}`}
                    aria-pressed={saring === s}
                    onClick={() => setSaring(s)}
                  >
                    {s === 'semua' ? 'Semua' : LABEL_PENGUASAAN[s]}
                  </button>
                ))}
              </div>

              {kelompok.map((k) => {
                const isi = k.aksara.filter((a) => saring === 'semua' || a.penguasaan === saring);
                if (isi.length === 0) return null;
                return (
                  <div key={k.bab} className="dp-kelompok">
                    <h3 className="dp-kelompok-judul">
                      BAB 0{k.bab} · {k.judul}
                    </h3>
                    <ul className="dp-grid">
                      {isi.map((a) => {
                        const total = a.benar + a.salah;
                        return (
                          <li key={a.huruf.kode} className={`dp-aksara dp-kuasai-${a.penguasaan}`}>
                            <span className="aksara dp-aksara-glyph" lang="jv">
                              {a.huruf.jenis === 'nglegena' ? a.huruf.unicode : `ꦏ${a.huruf.unicode}`}
                            </span>
                            <span className="dp-aksara-nama">{a.huruf.kode}</span>
                            <span className={`dp-label-belajar ${a.statusBelajar === 'sudah' ? 'sudah' : ''}`}>
                              {a.statusBelajar === 'sudah' ? 'Dipelajari' : 'Belum dipelajari'}
                            </span>
                            <span className="dp-label-kuasai">{LABEL_PENGUASAAN[a.penguasaan]}</span>
                            {total > 0 && (
                              <span className="dp-aksara-angka">
                                {a.benar} benar · {a.salah} salah
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
              {kelompok.every((k) => k.aksara.every((a) => saring !== 'semua' && a.penguasaan !== saring)) && (
                <p className="dp-kosong">Belum ada aksara dengan status ini.</p>
              )}
            </>
          )}

          {/* ================= MENULIS ================= */}
          {aktif === 'menulis' && (
            <>
              <p className="dp-ringkas">
                <strong>{tulisSelesai}</strong> dari {tulis.length} latihan menulis selesai
              </p>
              {tulis.map((b) => (
                <button
                  key={b.bab}
                  type="button"
                  className={`dp-kartu dp-kartu-tulis dp-bab${b.bab} dp-baris-${b.t.status}`}
                  disabled={b.t.status === 'terkunci'}
                  onClick={() => buka(b.t)}
                >
                  <IkonStatus status={b.t.status} />
                  <span className="dp-kartu-tulis-teks">
                    <span className="dp-overline">BAB 0{b.bab}</span>
                    <span className="dp-kartu-judul">Latihan menulis · {b.judul}</span>
                    <span className="dp-kartu-sub">
                      {b.bab === 1 ? 'Tulisanmu diperiksa model pengenal aksara.' : 'Latihan mandiri mengikuti panduan goresan.'}
                    </span>
                  </span>
                  <span className={`dp-pil ${b.t.status === 'selesai' ? 'dp-pil-sukses' : ''}`}>{LABEL_STATUS[b.t.status]}</span>
                </button>
              ))}
              <p className="dp-catatan">
                Hasil setiap tulisan ikut dihitung dalam <strong>penguasaan</strong> di tab Aksara, bersama jawaban kuis.
              </p>
            </>
          )}
        </div>
      </section>
    </div>,
    target,
  );
}
