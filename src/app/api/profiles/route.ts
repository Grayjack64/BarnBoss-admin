import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function POST(request: Request) {
  try {
    const profileData = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('user_account_profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Error in profiles POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 