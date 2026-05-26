import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { targetUserId, newPassword, callerToken } = await req.json()

    // Verifikasi caller adalah owner
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(callerToken)
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await supabaseAdmin
      .from('users').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'owner') {
      return NextResponse.json({ error: 'Hanya owner yang bisa reset password.' }, { status: 403 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 })
    }

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )
    if (updateErr) throw updateErr

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
