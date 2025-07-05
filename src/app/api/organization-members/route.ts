import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    
    let query = supabaseAdmin
      .from('organization_members')
      .select(`
        *,
        user_account_profiles(email, user_metadata),
        roles(name, color)
      `)
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    
    const { data, error } = await query.order('joined_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ members: data || [] })
  } catch (error) {
    console.error('Error fetching organization members:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch organization members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const memberData = await request.json()

    if (!memberData.organization_id || !memberData.user_id || !memberData.role_id) {
      return NextResponse.json(
        { error: 'organization_id, user_id, and role_id are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .insert(memberData)
      .select(`
        *,
        user_account_profiles(email, user_metadata),
        roles(name, color)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ member: data })
  } catch (error) {
    console.error('Error creating organization member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create organization member' },
      { status: 500 }
    )
  }
} 