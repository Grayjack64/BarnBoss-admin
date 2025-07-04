import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ organizations: data || [] })
  } catch (error) {
    console.error('Error in organizations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const orgData = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert(orgData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating organization:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ organization: data })
  } catch (error) {
    console.error('Error in organizations POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 