import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const organizationId = searchParams.get('organization_id')
    
    if (!userId || !organizationId) {
      return NextResponse.json({ error: 'user_id and organization_id are required' }, { status: 400 })
    }
    
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching organization member:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ member: data || null })
  } catch (error) {
    console.error('Error in organization-members GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const memberData = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .insert(memberData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating organization member:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ member: data })
  } catch (error) {
    console.error('Error in organization-members POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 