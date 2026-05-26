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
    // Insert ke tabel users
    const { error: userErr } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      nama,
      no_hp,
      role: 'pelanggan',
    })
    if (userErr) throw userErr

    // Insert ke tabel pelanggan
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

// ─── Get User Profile (with role) ────────────────────────────────────────────
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

// ─── Get Role ─────────────────────────────────────────────────────────────────
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data.role as UserRole
}

// ─── Dashboard redirect berdasarkan role ─────────────────────────────────────
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
