import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) throw error
    
    return NextResponse.json({ users: data.users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { email, password, full_name, phone } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name,
        phone
      }
    })
    
    if (error) throw error
    
    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    )
  }
} 