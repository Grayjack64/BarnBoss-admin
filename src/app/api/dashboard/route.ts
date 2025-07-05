import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Fetch organizations with member counts
    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select(`
        id,
        name,
        type,
        description,
        created_at,
        is_active,
        organization_members(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (orgError) throw orgError

    // Fetch user profiles
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_account_profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Calculate statistics
    const stats = {
      totalOrganizations: organizations?.length || 0,
      trainerOrganizations: organizations?.filter(org => org.type === 'trainer').length || 0,
      stableOrganizations: organizations?.filter(org => org.type === 'stable').length || 0,
      enterpriseOrganizations: organizations?.filter(org => org.type === 'enterprise').length || 0,
      totalUsers: users?.length || 0,
      organizations: organizations?.map(org => ({
        ...org,
        member_count: org.organization_members?.[0]?.count || 0
      })) || [],
      users: users || []
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 