import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BAB, JALUR } from '../../content';
import { useProgres } from '../../progres/ProgresProvider';

// F1 + F3: sakelar Jalur | Materi. Tampilan final: Choirun.
export function BelajarPage() {
  const [mode, setMode] = useState<'jalur' | 'materi'>('jalur');

  return (
    <>
      <div role="tablist">
        <button role="tab" aria-selected={mode === 'jalur'} onClick={() => setMode('jalur')}>Jalur</button>
        <button role="tab" aria-selected={mode === 'materi'} onClick={() => setMode('materi')}>Materi</button>
      </div>
      {mode === 'jalur' ? <Jalur /> : <DaftarMateri />}
    </>
  );
}

function Jalur() {
  const { status } = useProgres();
  const navigate = useNavigate();
  const [pesan, setPesan] = useState<string | null>(null);

  return (
    <>
      {BAB.map((bab) => (
        <section key={bab.bab}>
          <h2>Bab {bab.bab} · {bab.judul}</h2>
          <ol>
            {JALUR.filter((t) => t.bab === bab.bab).map((t) => {
              const s = status.get(t.id);
              return (
                <li key={t.id}>
                  <button
                    onClick={() =>
                      s === 'terkunci'
                        ? setPesan('Selesaikan titik sebelumnya dulu')
                        : navigate(t.type === 'writing' ? `/latihan/${t.id}` : `/pelajaran/${t.id}`)
                    }
                  >
                    {t.type === 'writing' ? 'Latihan · ' : ''}
                    {t.title} ({s})
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {pesan && <p role="status">{pesan}</p>}
    </>
  );
}

function DaftarMateri() {
  return (
    <ul>
      {BAB.map((b) => (
        <li key={b.bab}>
          <Link to={`/belajar/materi/${b.bab}`}>Bab {b.bab} · {b.judul}</Link>
        </li>
      ))}
    </ul>
  );
}
