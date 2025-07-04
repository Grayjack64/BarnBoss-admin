import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { ServicePricingSetupRequest, BusinessSetupResponse } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: ServicePricingSetupRequest = await request.json()
    const { organization_id, transaction_types } = body

    if (!organization_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Organization ID is required',
          errors: ['organization_id must be provided']
        } as BusinessSetupResponse,
        { status: 400 }
      )
    }

    if (!transaction_types || transaction_types.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'At least one transaction type is required',
          errors: ['transaction_types array cannot be empty']
        } as BusinessSetupResponse,
        { status: 400 }
      )
    }

    // Validate required fields
    const errors: string[] = []
    transaction_types.forEach((transactionType, index) => {
      if (!transactionType.name) {
        errors.push(`Transaction type ${index + 1}: Name is required`)
      }
      if (!transactionType.category) {
        errors.push(`Transaction type ${index + 1}: Category is required`)
      }
      if (!transactionType.unit_type) {
        errors.push(`Transaction type ${index + 1}: Unit type is required`)
      }
      if (!transactionType.billing_frequency) {
        errors.push(`Transaction type ${index + 1}: Billing frequency is required`)
      }
      if (transactionType.default_rate === undefined || transactionType.default_rate < 0) {
        errors.push(`Transaction type ${index + 1}: Default rate must be non-negative`)
      }
      if (transactionType.price_range_min !== undefined && transactionType.price_range_min < 0) {
        errors.push(`Transaction type ${index + 1}: Price range min must be non-negative`)
      }
      if (transactionType.price_range_max !== undefined && transactionType.price_range_max < 0) {
        errors.push(`Transaction type ${index + 1}: Price range max must be non-negative`)
      }
      if (transactionType.price_range_min !== undefined && 
          transactionType.price_range_max !== undefined && 
          transactionType.price_range_min > transactionType.price_range_max) {
        errors.push(`Transaction type ${index + 1}: Price range min cannot be greater than max`)
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

    // Prepare transaction types for insertion
    const transactionTypesToInsert = transaction_types.map(transactionType => ({
      ...transactionType,
      organization_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Ensure numeric fields are properly typed
      default_rate: Number(transactionType.default_rate),
      price_range_min: transactionType.price_range_min ? Number(transactionType.price_range_min) : null,
      price_range_max: transactionType.price_range_max ? Number(transactionType.price_range_max) : null,
      billing_cycle_days: Number(transactionType.billing_cycle_days) || 0,
      max_tasks_per_cycle: Number(transactionType.max_tasks_per_cycle) || 0,
      // Ensure boolean fields are properly typed
      is_active: Boolean(transactionType.is_active),
      is_system_default: Boolean(transactionType.is_system_default),
      is_recurring: Boolean(transactionType.is_recurring),
      auto_billing_enabled: Boolean(transactionType.auto_billing_enabled),
      requires_approval: Boolean(transactionType.requires_approval)
    }))

    // Insert transaction types into database
    const { data: insertedTransactionTypes, error: insertError } = await supabase
      .from('transaction_types')
      .insert(transactionTypesToInsert)
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to insert transaction types into database',
          errors: [insertError.message]
        } as BusinessSetupResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${insertedTransactionTypes?.length || 0} transaction types`,
      data: {
        transaction_types_created: insertedTransactionTypes?.length || 0
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