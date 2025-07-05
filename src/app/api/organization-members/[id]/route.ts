import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { id } = params
    const updateData = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ member: data })
  } catch (error) {
    console.error('Error updating organization member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update organization member' },
      { status: 500 }
    )
  }
} 