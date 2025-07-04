import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ users: data.users || [] })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, userData } = await request.json()
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: userData
    })
    
    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error('Error in users POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 