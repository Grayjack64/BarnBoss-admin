import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const includeOrganizations = searchParams.get('include_organizations') === 'true'

    if (includeOrganizations) {
      // Fetch profiles with organization data
      const { data, error } = await supabaseAdmin
        .from('user_account_profiles')
        .select(`
          *,
          organization_members(
            role_id,
            joined_at,
            is_active,
            organizations(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to flatten organization information
      const profiles = data?.map(profile => ({
        id: profile.id,
        email: profile.email,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        user_metadata: profile.user_metadata,
        organizations: profile.organization_members?.map((member: any) => ({
          id: member.organizations.id,
          name: member.organizations.name,
          type: member.organizations.type,
          description: member.organizations.description,
          member_role: member.role_id,
          joined_at: member.joined_at,
          is_active: member.is_active
        })) || []
      })) || []

      return NextResponse.json({ profiles })
    } else {
      // Fetch profiles without organization data
      const { data, error } = await supabaseAdmin
        .from('user_account_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ profiles: data || [] })
    }
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const profileData = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('user_account_profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Error creating user profile:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user profile' },
      { status: 500 }
    )
  }
} 