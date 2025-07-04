import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { ConsumableSetupRequest, BusinessSetupResponse } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: ConsumableSetupRequest = await request.json()
    const { user_id, organization_id, consumables } = body

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

    if (!consumables || consumables.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'At least one consumable is required',
          errors: ['consumables array cannot be empty']
        } as BusinessSetupResponse,
        { status: 400 }
      )
    }

    // Validate required fields
    const errors: string[] = []
    consumables.forEach((consumable, index) => {
      if (!consumable.name) {
        errors.push(`Consumable ${index + 1}: Name is required`)
      }
      if (!consumable.type) {
        errors.push(`Consumable ${index + 1}: Type is required`)
      }
      if (!consumable.category) {
        errors.push(`Consumable ${index + 1}: Category is required`)
      }
      if (consumable.default_quantity === undefined || consumable.default_quantity <= 0) {
        errors.push(`Consumable ${index + 1}: Default quantity must be greater than 0`)
      }
      if (!consumable.default_unit_type) {
        errors.push(`Consumable ${index + 1}: Unit type is required`)
      }
      if (consumable.current_stock === undefined || consumable.current_stock < 0) {
        errors.push(`Consumable ${index + 1}: Current stock must be non-negative`)
      }
      if (consumable.minimum_stock === undefined || consumable.minimum_stock < 0) {
        errors.push(`Consumable ${index + 1}: Minimum stock must be non-negative`)
      }
      if (consumable.reorder_point === undefined || consumable.reorder_point < 0) {
        errors.push(`Consumable ${index + 1}: Reorder point must be non-negative`)
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

    // Prepare consumables for insertion
    const consumablesToInsert = consumables.map(consumable => ({
      ...consumable,
      user_id: user_id || null,
      organization_id: organization_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Ensure numeric fields are properly typed
      default_quantity: Number(consumable.default_quantity),
      cost_per_unit: Number(consumable.cost_per_unit) || 0,
      current_stock: Number(consumable.current_stock),
      minimum_stock: Number(consumable.minimum_stock),
      reorder_point: Number(consumable.reorder_point),
      withdrawal_period_days: Number(consumable.withdrawal_period_days) || 0,
      // Ensure boolean fields are properly typed
      is_active: Boolean(consumable.is_active),
      is_default: Boolean(consumable.is_default),
      requires_prescription: Boolean(consumable.requires_prescription),
      // Ensure specifications is an object
      specifications: consumable.specifications || {}
    }))

    // Insert consumables into database
    const { data: insertedConsumables, error: insertError } = await supabase
      .from('consumables')
      .insert(consumablesToInsert)
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to insert consumables into database',
          errors: [insertError.message]
        } as BusinessSetupResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${insertedConsumables?.length || 0} consumables`,
      data: {
        consumables_created: insertedConsumables?.length || 0
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