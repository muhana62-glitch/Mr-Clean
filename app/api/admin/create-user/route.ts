import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { email, password, nama, no_hp, posisi, callerToken } = await req.json()

    // Verifikasi caller adalah owner
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(callerToken)
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await supabaseAdmin
      .from('users').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'owner') {
      return NextResponse.json({ error: 'Hanya owner yang bisa membuat akun karyawan.' }, { status: 403 })
    }

    // Buat user baru di Supabase Auth
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createErr) throw createErr

    // Insert ke tabel users
    await supabaseAdmin.from('users').insert({
      id: newUser.user.id,
      email,
      nama,
      no_hp: no_hp || null,
      role: 'karyawan',
    })

    // Insert ke tabel karyawan
    await supabaseAdmin.from('karyawan').insert({
      user_id: newUser.user.id,
      posisi: posisi || 'Staff Laundry',
      status: 'aktif',
    })

    return NextResponse.json({ success: true, userId: newUser.user.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
