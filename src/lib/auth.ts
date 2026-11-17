import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { bersihkanAkunLokal, kosongkanTamu } from '../progres/penyimpanan'

export const KUNCI_SESI_DEMO = 'aksaralens:demo_session'
export const EVENT_SESI_DEMO = 'aksaralens:session-change'

function buatUserDemo(email: string, nama: string): User {
  const now = new Date().toISOString()
  return {
    id: `demo-${email}`,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    created_at: now,
    updated_at: now,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: nama, name: nama, display_name: nama },
    identities: [],
  }
}

export function bacaSesiDemo(): User | null {
  try {
    const raw = localStorage.getItem(KUNCI_SESI_DEMO)
    if (!raw) return null
    const parsed = JSON.parse(raw) as User
    return parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string' ? parsed : null
  } catch {
    return null
  }
}

function kirimEventSesiDemo() {
  window.dispatchEvent(new Event(EVENT_SESI_DEMO))
}

function catatEmailTerdaftar(emailBersih: string, namaBersih?: string) {
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
}

// === Sinkronisasi Identitas Pengguna ===
export function sinkronkanUserMetadata(user: { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null) {
  if (!user) return
  try {
    const meta = user.user_metadata
    const nama =
      (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
      (typeof meta?.name === 'string' && meta.name.trim()) ||
      (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
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
    } else {
      const demoUser = bacaSesiDemo()
      if (demoUser?.id) bersihkanAkunLokal(demoUser.id)
    }
  } catch {
    // Abaikan kegagalan jaringan saat proses keluar
  } finally {
    // Bersihkan sesi Supabase / demo lokal dan identitas profil dari perangkat
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
          localStorage.removeItem(k)
        }
      }
      localStorage.removeItem(KUNCI_SESI_DEMO)
      localStorage.removeItem('namaUser')
      localStorage.removeItem('emailUser')
      localStorage.removeItem('selectedAvatarId')
    } catch {
      /* abaikan */
    }
    kosongkanTamu()
    kirimEventSesiDemo()
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

  if (!supabase) {
    // Mode demo / offline tanpa Supabase
    try {
      const db = JSON.parse(localStorage.getItem('aksaralens:demo_accounts') || '{}')
      if (db[emailBersih]) {
        return { ok: false, pesan: 'Email ini sudah terdaftar. Silakan langsung masuk.' }
      }
      db[emailBersih] = { email: emailBersih, sandi, nama: namaBersih || emailBersih.split('@')[0] }
      localStorage.setItem('aksaralens:demo_accounts', JSON.stringify(db))
      catatEmailTerdaftar(emailBersih, namaBersih)
      return { ok: true, butuhKonfirmasi: false }
    } catch {
      return { ok: false, pesan: 'Gagal menyimpan akun demo di peramban.' }
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: emailBersih,
    password: sandi,
    options: {
      data: namaBersih ? { full_name: namaBersih, name: namaBersih, display_name: namaBersih } : undefined,
      emailRedirectTo: `${window.location.origin}/profil`
    }
  })
  if (error) return gagal(error)
  // Email yang sudah terdaftar tidak memberi galat bila konfirmasi aktif; cirinya identities kosong.
  if (data.user && data.user.identities?.length === 0)
    return { ok: false, pesan: 'Email ini sudah terdaftar. Silakan langsung masuk.' }

  catatEmailTerdaftar(emailBersih, namaBersih)
  const butuhKonfirmasi = data.session === null

  // Supabase secara bawaan membuat sesi setelah signUp jika email confirmation off.
  // Keluarkan secara lokal agar alur pendaftaran mewajibkan pengguna login terlebih dahulu.
  if (data.session) {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      /* abaikan */
    }
  }

  return { ok: true, butuhKonfirmasi }
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
      const demoUser = buatUserDemo(emailBersih, user.nama)
      localStorage.setItem(KUNCI_SESI_DEMO, JSON.stringify(demoUser))
      sinkronkanUserMetadata(demoUser)
      catatEmailTerdaftar(emailBersih, user.nama)
      kirimEventSesiDemo()
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
    catatEmailTerdaftar(emailBersih)
    sinkronkanUserMetadata(data.user)
  }
  return { ok: true }
}

export async function lupaSandi(email: string): Promise<HasilAksi> {
  if (!supabase) return { ok: false, pesan: 'Fitur reset sandi via email memerlukan koneksi Supabase (.env).' }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/masuk?mode=ganti-sandi`,
  })
  return error ? gagal(error) : { ok: true }
}

export async function gantiSandi(sandiBaru: string, emailOpsional?: string): Promise<HasilAksi> {
  if (!supabase) {
    const sesi = bacaSesiDemo()
    const targetEmail = (sesi?.email || emailOpsional || '').trim().toLowerCase()
    if (!targetEmail) {
      return { ok: false, pesan: 'Masuk terlebih dahulu untuk mengubah kata sandi.' }
    }
    try {
      const db = JSON.parse(localStorage.getItem('aksaralens:demo_accounts') || '{}')
      if (!db[targetEmail]) {
        return { ok: false, pesan: 'Akun demo tidak ditemukan.' }
      }
      db[targetEmail].sandi = sandiBaru
      localStorage.setItem('aksaralens:demo_accounts', JSON.stringify(db))
      return { ok: true }
    } catch {
      return { ok: false, pesan: 'Gagal menyimpan kata sandi baru.' }
    }
  }
  const { error } = await supabase.auth.updateUser({ password: sandiBaru })
  return error ? gagal(error) : { ok: true }
}

export async function perbaruiProfil(namaBaru: string): Promise<HasilAksi> {
  const namaBersih = namaBaru.trim()
  if (namaBersih.length < 2) {
    return { ok: false, pesan: 'Nama panggilan minimal 2 karakter.' }
  }

  try {
    localStorage.setItem('namaUser', namaBersih)
  } catch {
    /* abaikan */
  }

  if (!supabase) {
    const sesi = bacaSesiDemo()
    if (sesi?.email) {
      const emailBersih = sesi.email.toLowerCase()
      const diperbarui: User = {
        ...sesi,
        updated_at: new Date().toISOString(),
        user_metadata: {
          ...sesi.user_metadata,
          full_name: namaBersih,
          name: namaBersih,
          display_name: namaBersih,
        },
      }
      try {
        localStorage.setItem(KUNCI_SESI_DEMO, JSON.stringify(diperbarui))
        localStorage.setItem(`aksaralens:nama:${emailBersih}`, namaBersih)
        const db = JSON.parse(localStorage.getItem('aksaralens:demo_accounts') || '{}')
        if (db[emailBersih]) {
          db[emailBersih].nama = namaBersih
          localStorage.setItem('aksaralens:demo_accounts', JSON.stringify(db))
        }
      } catch {
        /* abaikan */
      }
    }
    kirimEventSesiDemo()
    return { ok: true }
  }

  const { data, error } = await supabase.auth.updateUser({
    data: { full_name: namaBersih, name: namaBersih, display_name: namaBersih },
  })
  if (error) return gagal(error)

  if (data.user) {
    sinkronkanUserMetadata(data.user)
    if (data.user.email) {
      try {
        localStorage.setItem(`aksaralens:nama:${data.user.email.toLowerCase()}`, namaBersih)
      } catch {
        /* abaikan */
      }
    }
    try {
      await supabase.from('profiles').update({ display_name: namaBersih }).eq('id', data.user.id)
    } catch {
      /* sinkronisasi tabel profiles bersifat pelengkap */
    }
  }
  return { ok: true }
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