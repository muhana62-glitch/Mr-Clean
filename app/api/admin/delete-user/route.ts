import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { targetUserId, callerToken } = await req.json()

    // Verifikasi caller adalah owner
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(callerToken)
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await supabaseAdmin
      .from('users').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'owner') {
      return NextResponse.json({ error: 'Hanya owner yang bisa menghapus akun.' }, { status: 403 })
    }

    // Pastikan tidak hapus diri sendiri
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri.' }, { status: 400 })
    }

    // Hapus dari Supabase Auth (cascade ke tabel users via FK)
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (deleteErr) throw deleteErr

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
