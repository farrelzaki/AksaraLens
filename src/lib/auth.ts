import { supabase } from './supabase'
import { bersihkanAkunLokal, kosongkanTamu } from '../progres/penyimpanan'

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
  return user
}

// === Keluar ===
// Keluar mengembalikan pengguna ke mode tamu kosong (PRD F6).
export async function keluar() {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user.id
  const hasil = await supabase.auth.signOut()
  if (hasil.error) return hasil
  if (uid) bersihkanAkunLokal(uid)
  kosongkanTamu()
  window.location.reload()
  return hasil
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

export async function daftarEmail(email: string, sandi: string): Promise<HasilAksi> {
  if (!supabase) return { ok: false, pesan: 'Akun belum tersedia.' }
  const { data, error } = await supabase.auth.signUp({
    email,
    password: sandi,
    options: { emailRedirectTo: `${window.location.origin}/profil` }
  })
  if (error) return gagal(error)
  // Email yang sudah terdaftar tidak memberi galat bila konfirmasi aktif; cirinya identities kosong.
  if (data.user && data.user.identities?.length === 0)
    return { ok: false, pesan: 'Email ini sudah terdaftar. Coba masuk.' }
  // Bila konfirmasi email aktif, belum ada sesi sampai tautan diklik.
  return { ok: true, butuhKonfirmasi: data.session === null }
}

export async function masukEmail(email: string, sandi: string): Promise<HasilAksi> {
  if (!supabase) return { ok: false, pesan: 'Akun belum tersedia.' }
  const { error } = await supabase.auth.signInWithPassword({ email, password: sandi })
  return error ? gagal(error) : { ok: true }
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