import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const organizationId = searchParams.get('organization_id')

    if (!userId && !organizationId) {
      return NextResponse.json(
        { error: 'Either user_id or organization_id is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('horses')
      .select('*')
      .eq('is_active', true)

    // Prioritize organization_id if both are provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    } else if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: horses, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching horses:', error)
      throw error
    }

    return NextResponse.json({ 
      horses: horses || [],
      count: horses?.length || 0 
    })

  } catch (error) {
    console.error('Error fetching existing horses:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch horses' },
      { status: 500 }
    )
  }
} 