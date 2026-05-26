import { supabase, UserProfile, UserRole } from './supabase'

// ─── Login ────────────────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─── Register Pelanggan ───────────────────────────────────────────────────────
export async function registerPelanggan(
  email: string,
  password: string,
  nama: string,
  no_hp: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nama, role: 'pelanggan' } },
  })
  if (error) throw error

  if (data.user) {
    const { error: userErr } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      nama,
      no_hp,
      role: 'pelanggan',
    })
    if (userErr) throw userErr

    const { error: pelangganErr } = await supabase.from('pelanggan').insert({
      user_id: data.user.id,
    })
    if (pelangganErr) throw pelangganErr
  }

  return data
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─── Get Current User ─────────────────────────────────────────────────────────
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

// ─── Get User Profile ────────────────────────────────────────────────────────
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

// ─── Get Role — pakai session aktif ──────────────────────────────────────────
export async function getUserRole(userId: string): Promise<UserRole | null> {
  // Pastikan session aktif dulu
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) return null

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data.role as UserRole
}

// ─── Login dan langsung dapat role ───────────────────────────────────────────
export async function loginAndGetRole(email: string, password: string): Promise<{ userId: string; role: UserRole }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.user) throw new Error('Login gagal.')

  // Setelah signIn, session sudah aktif — langsung query
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (userError || !userData) {
    throw new Error('Akun tidak ditemukan di sistem. Hubungi admin.')
  }

  return { userId: data.user.id, role: userData.role as UserRole }
}

// ─── Dashboard path ───────────────────────────────────────────────────────────
export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    pelanggan: '/pelanggan/dashboard',
    karyawan: '/karyawan/dashboard',
    owner: '/owner/dashboard',
  }
  return paths[role] ?? '/'
}

export function getLoginPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    pelanggan: '/pelanggan/login',
    karyawan: '/karyawan/login',
    owner: '/owner/login',
  }
  return paths[role] ?? '/'
}
