import { supabase } from './supabase'

export async function registerUser(email: string, password: string, role: string, nama: string) {
  try {
    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          nama,
        },
      },
    })

    if (error) throw error

    // Create user record
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        role,
        nama,
      })
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    throw error
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  } catch (error) {
    return null
  }
}

export async function getUserRole(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.role
  } catch (error) {
    return null
  }
}
