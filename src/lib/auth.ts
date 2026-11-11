import { supabase } from './supabase'
import { bersihkanAkunLokal, kosongkanTamu } from '../progres/penyimpanan'

// === Sinkronisasi Identitas Pengguna ===
export function sinkronkanUserMetadata(user: { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null) {
  if (!user) return
  try {
    const meta = user.user_metadata
    const nama =
      (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
      (typeof meta?.name === 'string' && meta.name.trim()) ||
      (typeof meta?.user_name === 'string' && meta.user_name.trim()) ||
      (typeof meta?.given_name === 'string' && meta.given_name.trim()) ||
      (user.email ? localStorage.getItem(`aksaralens:nama:${user.email.toLowerCase()}`) : null) ||
      (user.email ? user.email.split('@')[0] : '')

    if (nama) {
      localStorage.setItem('namaUser', nama)
    }
    if (user.email) {
      localStorage.setItem('emailUser', user.email)
    }
  } catch {
    /* abaikan */
  }
}

// === Login Google ===
export async function masukGoogle() {
  if (!supabase) {
    console.warn('Supabase belum siap — berjalan sebagai tamu')
    return { data: null, error: new Error('Tamu') }
  }

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`
    }
  })
}

// === Cek Pengguna ===
export async function dapatPengguna() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) sinkronkanUserMetadata(user)
  return user
}

// === Keluar ===
// Keluar mengembalikan pengguna ke halaman masuk (/masuk) atau intro dan mengosongkan seluruh sesi (PRD F6).
export async function keluar(tujuan: string = '/masuk') {
  try {
    if (supabase) {
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
      const uid = data?.session?.user?.id
      if (uid) bersihkanAkunLokal(uid)

      // Coba signOut global; bila gagal (mis. token kedaluwarsa atau offline), paksa signOut local
      const hasil = await supabase.auth.signOut().catch(() => null)
      if (hasil?.error) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
      }
    }
  } catch {
    // Abaikan kegagalan jaringan saat proses keluar
  } finally {
    // Bersihkan sesi Supabase lokal dan identitas profil dari perangkat
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
          localStorage.removeItem(k)
        }
      }
      localStorage.removeItem('namaUser')
      localStorage.removeItem('emailUser')
      localStorage.removeItem('selectedAvatarId')
    } catch {
      /* abaikan */
    }
    kosongkanTamu()
    window.location.replace(tujuan)
  }
}

// === Simpan Progres ===
export async function simpanProgres(lessonId: string) {
  if (!supabase) return
  const user = await dapatPengguna()
  if (!user) return // kalau tamu, simpan ke localStorage nanti

  return supabase.from('lesson_progress').upsert({
    user_id: user.id,
    lesson_id: lessonId,
    status: 'completed'
  })
}

// === Email + kata sandi ===
export type HasilAksi = { ok: true; butuhKonfirmasi?: boolean } | { ok: false; pesan: string }

/** Terjemahkan galat Supabase Auth ke bahasa Indonesia yang bisa ditindaklanjuti. */
export function terjemahkanGalat(pesan: string): string {
  const m = pesan.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email atau kata sandi salah.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Email ini sudah terdaftar. Coba masuk.'
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk untuk tautan konfirmasi.'
  if (m.includes('password') && (m.includes('at least') || m.includes('weak')))
    return 'Kata sandi terlalu lemah. Pakai minimal 6 karakter.'
  if (m.includes('valid email') || m.includes('invalid email')) return 'Format email belum benar.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Tidak ada koneksi. Periksa internet lalu coba lagi.'
  return 'Terjadi kendala. Coba lagi sebentar.'
}

const gagal = (e: unknown): HasilAksi => ({
  ok: false,
  pesan: terjemahkanGalat(e instanceof Error ? e.message : String(e)),
})

export async function daftarEmail(email: string, sandi: string, nama?: string): Promise<HasilAksi> {
  const emailBersih = email.trim().toLowerCase()
  const namaBersih = nama?.trim()

  // Simpan email ke daftar akun terdaftar lokal agar sinkron
  try {
    const daftarAkun: string[] = JSON.parse(localStorage.getItem('aksaralens:registered_emails') || '[]')
    if (!daftarAkun.includes(emailBersih)) {
      daftarAkun.push(emailBersih)
      localStorage.setItem('aksaralens:registered_emails', JSON.stringify(daftarAkun))
    }
    if (namaBersih) {
      localStorage.setItem(`aksaralens:nama:${emailBersih}`, namaBersih)
    }
  } catch {
    /* abaikan */
  }

  if (!supabase) {
    // Mode demo / offline tanpa Supabase
    try {
      const db = JSON.parse(localStorage.getItem('aksaralens:demo_accounts') || '{}')
      if (db[emailBersih]) {
        return { ok: false, pesan: 'Email ini sudah terdaftar. Silakan langsung masuk.' }
      }
      db[emailBersih] = { email: emailBersih, sandi, nama: namaBersih || emailBersih.split('@')[0] }
      localStorage.setItem('aksaralens:demo_accounts', JSON.stringify(db))
      return { ok: true, butuhKonfirmasi: false }
    } catch {
      return { ok: true, butuhKonfirmasi: false }
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: emailBersih,
    password: sandi,
    options: {
      data: namaBersih ? { full_name: namaBersih, name: namaBersih } : undefined,
      emailRedirectTo: `${window.location.origin}/profil`
    }
  })
  if (error) return gagal(error)
  // Email yang sudah terdaftar tidak memberi galat bila konfirmasi aktif; cirinya identities kosong.
  if (data.user && data.user.identities?.length === 0)
    return { ok: false, pesan: 'Email ini sudah terdaftar. Silakan langsung masuk.' }

  // Supabase secara bawaan membuat sesi setelah signUp jika email confirmation off.
  // Kita keluarkan secara lokal agar alur pendaftaran mewajibkan pengguna login terlebih dahulu.
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    /* abaikan */
  }

  return { ok: true, butuhKonfirmasi: false }
}

export async function masukEmail(email: string, sandi: string): Promise<HasilAksi> {
  const emailBersih = email.trim().toLowerCase()

  if (!supabase) {
    // Mode demo / offline tanpa Supabase: periksa ketat apakah email terdaftar
    try {
      const db = JSON.parse(localStorage.getItem('aksaralens:demo_accounts') || '{}')
      const user = db[emailBersih]
      if (!user) {
        return { ok: false, pesan: 'Email ini belum terdaftar. Silakan daftar akun baru terlebih dahulu.' }
      }
      if (user.sandi !== sandi) {
        return { ok: false, pesan: 'Kata sandi salah. Silakan periksa kembali kata sandimu.' }
      }
      localStorage.setItem('namaUser', user.nama)
      localStorage.setItem('emailUser', emailBersih)
      return { ok: true }
    } catch {
      return { ok: false, pesan: 'Terjadi kendala saat memeriksa akun.' }
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: emailBersih, password: sandi })
  if (error) {
    const m = error.message.toLowerCase()
    if (m.includes('invalid login credentials') || m.includes('user not found') || m.includes('invalid_grant')) {
      const daftarAkun: string[] = JSON.parse(localStorage.getItem('aksaralens:registered_emails') || '[]')
      if (!daftarAkun.includes(emailBersih)) {
        return { ok: false, pesan: 'Akun dengan email ini belum terdaftar. Harap lakukan pendaftaran akun terlebih dahulu.' }
      }
      return { ok: false, pesan: 'Kata sandi salah. Silakan periksa kembali kata sandimu.' }
    }
    return gagal(error)
  }

  if (data.user) {
    sinkronkanUserMetadata(data.user)
  }
  return { ok: true }
}

export async function lupaSandi(email: string): Promise<HasilAksi> {
  if (!supabase) return { ok: false, pesan: 'Akun belum tersedia.' }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/masuk?mode=ganti-sandi`,
  })
  return error ? gagal(error) : { ok: true }
}

export async function gantiSandi(sandiBaru: string): Promise<HasilAksi> {
  if (!supabase) return { ok: false, pesan: 'Akun belum tersedia.' }
  const { error } = await supabase.auth.updateUser({ password: sandiBaru })
  return error ? gagal(error) : { ok: true }
}

// === Hapus akun (BR-03) ===
// Memanggil fungsi SQL hapus_akun(); semua baris pengguna ikut terhapus (CASCADE).
export async function hapusAkun(): Promise<HasilAksi> {
  if (!supabase) return { ok: false, pesan: 'Akun belum tersedia.' }
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) return gagal(userError)
  if (!user) return { ok: false, pesan: 'Masuk terlebih dahulu untuk menghapus akun.' }

  const { error } = await supabase.rpc('hapus_akun')
  if (error) return gagal(error)

  bersihkanAkunLokal(user.id)
  kosongkanTamu()
  const hasilKeluar = await supabase.auth.signOut({ scope: 'local' })
  if (hasilKeluar.error) return gagal(hasilKeluar.error)
  window.location.assign('/')
  return { ok: true }
}