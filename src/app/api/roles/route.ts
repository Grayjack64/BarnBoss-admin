import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ roles: data || [] })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const roleData = await request.json()

    if (!roleData.organization_id || !roleData.name) {
      return NextResponse.json(
        { error: 'organization_id and name are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('roles')
      .insert(roleData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ role: data })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create role' },
      { status: 500 }
    )
  }
} 