import { NextRequest, NextResponse } from 'next/server'
import { supabase, validateSupabaseClients } from '../../../../lib/supabase'
import { HorseSetupRequest, BusinessSetupResponse } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    // Validate Supabase clients are properly initialized
    validateSupabaseClients()
    
    const body: HorseSetupRequest = await request.json()
    const { user_id, organization_id, horses } = body

    if (!user_id && !organization_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User ID or Organization ID is required',
          errors: ['user_id or organization_id must be provided']
        } as BusinessSetupResponse,
        { status: 400 }
      )
    }

    if (!horses || horses.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'At least one horse is required',
          errors: ['horses array cannot be empty']
        } as BusinessSetupResponse,
        { status: 400 }
      )
    }

    // Validate required fields
    const errors: string[] = []
    horses.forEach((horse, index) => {
      if (!horse.name) {
        errors.push(`Horse ${index + 1}: Name is required`)
      }
      if (!horse.breed) {
        errors.push(`Horse ${index + 1}: Breed is required`)
      }
      if (!horse.gender) {
        errors.push(`Horse ${index + 1}: Gender is required`)
      }
    })

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation errors found',
          errors
        } as BusinessSetupResponse,
        { status: 400 }
      )
    }

    // Prepare horses for insertion
    const horsesToInsert = horses.map(horse => ({
      ...horse,
      user_id: user_id || null,
      organization_id: organization_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Ensure arrays are properly formatted
      dietary_restrictions: horse.dietary_restrictions || [],
      photos: horse.photos || [],
      // Ensure numeric fields are properly typed
      height_hands: horse.height_hands ? Number(horse.height_hands) : null,
      weight_kg: horse.weight_kg ? Number(horse.weight_kg) : null,
      // Ensure insurance_details is an object
      insurance_details: horse.insurance_details || {}
    }))

    // Insert horses into database
    const { data: insertedHorses, error: insertError } = await supabase
      .from('horses')
      .insert(horsesToInsert)
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to insert horses into database',
          errors: [insertError.message]
        } as BusinessSetupResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${insertedHorses?.length || 0} horses`,
      data: {
        horses_created: insertedHorses?.length || 0
      }
    } as BusinessSetupResponse)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      } as BusinessSetupResponse,
      { status: 500 }
    )
  }
} 