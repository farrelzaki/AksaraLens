// Logika murni pemilihan adegan selingan (pembuka & penutup tiap tahap belajar).
// Adegan menyesuaikan kondisi pembelajar: pertama kali, mengulang, huruf yang sering salah,
// jumlah salah di sesi ini, kecepatan, kombo benar beruntun, tamat bab, dan waktu setempat.
// Variasi kalimat dipilih dengan angka acak dari luar agar bisa dites dan tidak monoton.

import type { JenisTahap } from '../../content/tahap';

export type Waktu = 'pagi' | 'siang' | 'sore' | 'malam';
export type AktivitasSelingan = JenisTahap | 'rayakan';

export type VarianPembuka = 'sambut-pertama' | 'mulai-bab' | 'ulang' | 'perkuat' | 'tantangan-akhir' | 'biasa';
export type VarianPenutup = 'tamat-bab' | 'kilat' | 'sempurna' | 'hebat' | 'bangkit';
export type Efek = 'konfeti' | 'piala' | 'kilat' | 'bintang' | 'semangat';

export interface KonteksPembuka {
  jenis: JenisTahap;
  nomor: number; // 1..5
  sudahPernah: boolean;
  totalSelesaiSemua: number;
  hurufLemah?: string;
  jam: number;
  acak: number; // 0..1
}

export interface KonteksPenutup {
  jenis: JenisTahap;
  nomor: number;
  total: number;
  salah: number;
  komboMaks: number;
  detik: number;
  sudahPernah: boolean;
  acak: number;
}

export interface AdeganPembuka {
  varian: VarianPembuka;
  aktivitas: AktivitasSelingan;
  waktu: Waktu;
  judul: string;
  sub: string;
}

export interface AdeganPenutup {
  varian: VarianPenutup;
  aktivitas: AktivitasSelingan;
  bintang: 1 | 2 | 3;
  efek: Efek;
  judul: string;
  sub: string;
  lencana?: string;
}

export function waktuDariJam(jam: number): Waktu {
  if (jam >= 4 && jam < 10) return 'pagi';
  if (jam >= 10 && jam < 15) return 'siang';
  if (jam >= 15 && jam < 18) return 'sore';
  return 'malam';
}

const pilih = <T,>(daftar: readonly T[], acak: number): T =>
  daftar[Math.min(daftar.length - 1, Math.max(0, Math.floor(acak * daftar.length)))];

const SALAM: Record<Waktu, string> = {
  pagi: 'Sugeng enjing',
  siang: 'Sugeng siang',
  sore: 'Sugeng sonten',
  malam: 'Sugeng dalu',
};

const AJAKAN: Record<JenisTahap, readonly string[]> = {
  kenali: ['Kenalan dulu, pelan-pelan saja.', 'Lihat bentuknya baik-baik, ya.', 'Yuk, sapa aksara baru!'],
  cocokkan: ['Saatnya mencocokkan bentuk!', 'Cari pasangan yang tepat.', 'Mata jeli, hati tenang.'],
  ingat: ['Coba ingat bunyinya.', 'Pejamkan mata sebentar, lalu ingat.', 'Ingatanmu lebih kuat dari kira.'],
  tulis: ['Ambil penamu, ayo menulis!', 'Ikuti goresannya pelan-pelan.', 'Tangan menulis, kepala mengingat.'],
  kuis: ['Tunjukkan yang sudah kamu pelajari!', 'Kuis kecil, langkah besar.', 'Siap? Aksa menyemangatimu!'],
};

export function pilihPembuka(k: KonteksPembuka): AdeganPembuka {
  const waktu = waktuDariJam(k.jam);
  const salam = SALAM[waktu];
  const base = { aktivitas: k.jenis as AktivitasSelingan, waktu };

  if (k.totalSelesaiSemua === 0) {
    return { ...base, varian: 'sambut-pertama', judul: `${salam}! Aku Aksa.`, sub: 'Ini langkah pertamamu. Kita mulai bersama, ya!' };
  }
  if (k.sudahPernah) {
    return {
      ...base,
      varian: 'ulang',
      judul: pilih(['Mengulang itu tanda rajin!', 'Latihan lagi? Mantap!', 'Biar makin lekat di ingatan.'], k.acak),
      sub: pilih(AJAKAN[k.jenis], k.acak),
    };
  }
  if (k.hurufLemah && k.jenis !== 'kenali') {
    return {
      ...base,
      varian: 'perkuat',
      judul: `Kita perkuat “${k.hurufLemah}”, yuk!`,
      sub: 'Kemarin sempat tertukar. Tidak apa-apa, sekarang pasti lebih lancar.',
    };
  }
  if (k.jenis === 'kuis') {
    return { ...base, varian: 'tantangan-akhir', judul: 'Tantangan terakhir bab ini!', sub: pilih(AJAKAN.kuis, k.acak) };
  }
  if (k.nomor === 1) {
    return { ...base, varian: 'mulai-bab', judul: `${salam}! Bab baru dimulai.`, sub: pilih(AJAKAN[k.jenis], k.acak) };
  }
  return { ...base, varian: 'biasa', judul: `${salam}!`, sub: pilih(AJAKAN[k.jenis], k.acak) };
}

export function pilihPenutup(k: KonteksPenutup): AdeganPenutup {
  const total = Math.max(1, k.total);
  const batasSalah = Math.max(1, Math.round(total * 0.34));
  const bintang: 1 | 2 | 3 = k.salah === 0 ? 3 : k.salah <= batasSalah ? 2 : 1;
  const cepat = k.salah === 0 && k.detik > 0 && k.detik <= total * 8;
  const lencanaKombo = k.komboMaks >= 3 ? `Kombo ${k.komboMaks}× benar beruntun` : undefined;

  if (k.nomor >= 5) {
    return {
      varian: 'tamat-bab',
      aktivitas: 'rayakan',
      bintang,
      efek: 'piala',
      judul: 'Bab tamat! Luar biasa!',
      sub: k.salah === 0 ? 'Tanpa satu pun salah. Kamu juara!' : 'Semua langkah bab ini sudah kamu lalui.',
      lencana: lencanaKombo,
    };
  }
  if (cepat) {
    return {
      varian: 'kilat',
      aktivitas: 'rayakan',
      bintang,
      efek: 'kilat',
      judul: pilih(['Secepat kilat!', 'Wah, kencang sekali!'], k.acak),
      sub: 'Benar semua dan cepat. Aksa sampai terkejut!',
      lencana: lencanaKombo,
    };
  }
  if (k.salah === 0) {
    return {
      varian: 'sempurna',
      aktivitas: 'rayakan',
      bintang,
      efek: 'konfeti',
      judul: k.sudahPernah ? 'Makin mantap!' : pilih(['Sempurna!', 'Tanpa cela!', 'Hebat sekali!'], k.acak),
      sub: k.sudahPernah ? 'Mengulang membuatmu makin lancar.' : 'Semua jawabanmu benar.',
      lencana: lencanaKombo,
    };
  }
  if (bintang === 2) {
    return {
      varian: 'hebat',
      aktivitas: 'rayakan',
      bintang,
      efek: 'bintang',
      judul: pilih(['Kerja bagus!', 'Hampir sempurna!', 'Bagus sekali!'], k.acak),
      sub: `Hanya ${k.salah} kali keliru. Sedikit lagi sempurna!`,
      lencana: lencanaKombo,
    };
  }
  return {
    varian: 'bangkit',
    aktivitas: 'kuis',
    bintang,
    efek: 'semangat',
    judul: pilih(['Pantang menyerah!', 'Kamu berhasil sampai akhir!', 'Keliru itu bagian dari belajar.'], k.acak),
    sub: 'Setiap kesalahan membuat ingatanmu lebih kuat. Coba ulangi kapan saja.',
    lencana: lencanaKombo,
  };
}
