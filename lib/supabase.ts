import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'owner' | 'karyawan' | 'pelanggan'

export interface UserProfile {
  id: string
  email: string
  nama: string
  no_hp: string | null
  role: UserRole
  alamat: string | null
  is_active: boolean
}
