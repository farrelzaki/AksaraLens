import { DATASET, FONT_DAN_KODE, RUJUKAN, SITASI, TENTANG, TIM, type Sumber } from './sumberData';

// F7: Tentang & sumber data. Tampilan final: Choirun; isi & atribusi: Farrel (sumberData.ts).
export function TentangSumber() {
  return (
    <section>
      <h2>Tentang & sumber data</h2>
      <p>{TENTANG}</p>
      <p>Dibuat oleh {TIM.join(', ')}.</p>

      <h3>Dataset</h3>
      <DaftarSumber isi={DATASET} />
      <p>
        <small>Sitasi: {SITASI}</small>
      </p>

      <h3>Font & perangkat lunak</h3>
      <DaftarSumber isi={FONT_DAN_KODE} />

      <h3>Rujukan</h3>
      <ul>
        {RUJUKAN.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  );
}

function DaftarSumber({ isi }: { isi: Sumber[] }) {
  return (
    <ul>
      {isi.map((s) => (
        <li key={s.nama}>
          <a href={s.url} target="_blank" rel="noreferrer">
            {s.nama}
          </a>{' '}
          — {s.oleh.replace(/\.$/, '')}. Lisensi {s.lisensi}. Dipakai untuk: {s.dipakai}.
        </li>
      ))}
    </ul>
  );
}
