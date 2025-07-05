import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select(`
        *,
        organization_members(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate member count for each organization
    const organizationsWithCount = data?.map(org => ({
      ...org,
      member_count: org.organization_members?.[0]?.count || 0
    })) || []

    return NextResponse.json({ organizations: organizationsWithCount })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const organizationData = await request.json()

    if (!organizationData.name || !organizationData.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert(organizationData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ organization: data })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create organization' },
      { status: 500 }
    )
  }
} 