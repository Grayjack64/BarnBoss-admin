import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    
    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }
    
    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')
    
    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ roles: data || [] })
  } catch (error) {
    console.error('Error in roles GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const rolesData = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('roles')
      .insert(rolesData)
      .select()
    
    if (error) {
      console.error('Error creating roles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ roles: data })
  } catch (error) {
    console.error('Error in roles POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 