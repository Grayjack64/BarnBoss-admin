import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const updateData = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating organization member:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ member: data })
  } catch (error) {
    console.error('Error in organization-members PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 