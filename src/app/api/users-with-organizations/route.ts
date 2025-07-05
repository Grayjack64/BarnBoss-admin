import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // First, fetch all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_account_profiles')
      .select(`
        user_id,
        email,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Then, fetch organization members with organization and role data
    const { data: orgMembers, error: orgMembersError } = await supabaseAdmin
      .from('organization_members')
      .select(`
        user_id,
        organization_id,
        is_active,
        joined_at,
        organizations(
          id,
          name,
          type,
          description
        ),
        roles(
          id,
          name,
          color
        )
      `)
      .eq('is_active', true)

    if (orgMembersError) throw orgMembersError

    // Transform the data to combine users with their organizations
    const usersWithOrgs = users?.map(user => {
      // Find all organization memberships for this user
      const userOrgMemberships = orgMembers?.filter(member => member.user_id === user.user_id) || []
      
      const activeOrganizations = userOrgMemberships.map(member => ({
        id: member.organization_id,
        name: (member.organizations as any)?.name || 'Unknown Organization',
        type: (member.organizations as any)?.type || 'unknown',
        description: (member.organizations as any)?.description,
        role_name: (member.roles as any)?.name || 'Unknown Role',
        role_color: (member.roles as any)?.color,
        joined_at: member.joined_at
      }))

      return {
        id: user.user_id,
        email: user.email,
        created_at: user.created_at,
        organizations: activeOrganizations,
        display_name: user.email, // Use email as display name for now
        has_organizations: activeOrganizations.length > 0
      }
    }) || []

    return NextResponse.json({ users: usersWithOrgs })
  } catch (error) {
    console.error('Error fetching users with organizations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    )
  }
} 