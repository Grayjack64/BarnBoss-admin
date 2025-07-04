'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { 
  Consumable, 
  ConsumableType, 
  ConsumableSetupRequest, 
  BusinessSetupResponse,
  ConsumableSpecifications 
} from '../lib/types'
import { ArrowLeft, Plus, Trash2, Save, Package, Pill, Apple, Wrench, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ConsumableManagementProps {
  onBack: () => void
  selectedUserId: string | null
  selectedOrganizationId: string | null
}

interface ConsumableFormData {
  consumables: Omit<Consumable, 'id' | 'created_at' | 'updated_at' | 'created_by'>[]
}

const defaultConsumable: Omit<Consumable, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
  name: '',
  type: 'feed',
  category: '',
  brand: '',
  specifications: {},
  default_quantity: 1,
  default_unit_type: 'unit',
  cost_per_unit: 0,
  supplier: '',
  current_stock: 0,
  minimum_stock: 10,
  reorder_point: 20,
  is_active: true,
  is_default: false,
  requires_prescription: false,
  withdrawal_period_days: 0,
  barcode: '',
  sku: '',
  storage_requirements: '',
  expiry_date: '',
  user_id: '',
  organization_id: ''
}

const consumableTypes: { value: ConsumableType; label: string; icon: React.ReactNode }[] = [
  { value: 'feed', label: 'Feed', icon: <Apple className="h-4 w-4" /> },
  { value: 'medicine', label: 'Medicine', icon: <Pill className="h-4 w-4" /> },
  { value: 'supplement', label: 'Supplement', icon: <Package className="h-4 w-4" /> },
  { value: 'equipment', label: 'Equipment', icon: <Wrench className="h-4 w-4" /> },
  { value: 'supply', label: 'Supply', icon: <Package className="h-4 w-4" /> }
]

const feedCategories = [
  'Hay', 'Grain', 'Pellets', 'Treats', 'Pasture', 'Silage', 'Chaff', 'Other Feed'
]

const medicineCategories = [
  'Antibiotics', 'Anti-inflammatory', 'Dewormer', 'Vaccines', 'Pain Relief', 
  'Joint Supplements', 'Topical Treatment', 'Respiratory', 'Digestive', 'Other Medicine'
]

const supplementCategories = [
  'Vitamins', 'Minerals', 'Probiotics', 'Joint Support', 'Coat & Hoof', 
  'Calming', 'Energy', 'Weight Gain', 'Electrolytes', 'Other Supplement'
]

const equipmentCategories = [
  'Grooming', 'Tack', 'Blankets', 'Boots & Wraps', 'Safety Equipment', 
  'Training Equipment', 'Stable Equipment', 'Medical Equipment', 'Other Equipment'
]

const supplyCategories = [
  'Bedding', 'Cleaning Supplies', 'Tools', 'Safety Items', 'Office Supplies', 'Other Supply'
]

const unitTypes = [
  'unit', 'kg', 'lbs', 'g', 'oz', 'ml', 'l', 'fl oz', 'cup', 'bag', 'bale', 'box', 'bottle', 'tube', 'dose'
]

export default function ConsumableManagement({
  onBack,
  selectedUserId,
  selectedOrganizationId
}: ConsumableManagementProps) {
  const [loading, setLoading] = useState(false)
  const [existingConsumables, setExistingConsumables] = useState<Consumable[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ConsumableFormData>({
    defaultValues: {
      consumables: [{
        ...defaultConsumable,
        user_id: selectedUserId || '',
        organization_id: selectedOrganizationId || ''
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'consumables'
  })

  useEffect(() => {
    if (selectedUserId || selectedOrganizationId) {
      loadExistingConsumables()
    }
  }, [selectedUserId, selectedOrganizationId])

  const loadExistingConsumables = async () => {
    if (!selectedUserId && !selectedOrganizationId) return

    try {
      setLoadingExisting(true)
      let query = supabase.from('consumables').select('*')

      if (selectedOrganizationId) {
        query = query.eq('organization_id', selectedOrganizationId)
      } else if (selectedUserId) {
        query = query.eq('user_id', selectedUserId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setExistingConsumables(data || [])
    } catch (error) {
      console.error('Error loading existing consumables:', error)
      toast.error('Failed to load existing consumables')
    } finally {
      setLoadingExisting(false)
    }
  }

  const getCategoriesForType = (type: ConsumableType) => {
    switch (type) {
      case 'feed': return feedCategories
      case 'medicine': return medicineCategories
      case 'supplement': return supplementCategories
      case 'equipment': return equipmentCategories
      case 'supply': return supplyCategories
      default: return []
    }
  }

  const addNewConsumable = (type?: ConsumableType) => {
    append({
      ...defaultConsumable,
      type: type || 'feed',
      user_id: selectedUserId || '',
      organization_id: selectedOrganizationId || ''
    })
  }

  const onSubmit = async (data: ConsumableFormData) => {
    if (!selectedUserId && !selectedOrganizationId) {
      toast.error('Please select a user or organization first')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/business-setup/consumables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          organization_id: selectedOrganizationId,
          consumables: data.consumables.map(consumable => ({
            ...consumable,
            user_id: selectedUserId || '',
            organization_id: selectedOrganizationId || '',
            cost_per_unit: Number(consumable.cost_per_unit) || 0,
            default_quantity: Number(consumable.default_quantity) || 1,
            current_stock: Number(consumable.current_stock) || 0,
            minimum_stock: Number(consumable.minimum_stock) || 10,
            reorder_point: Number(consumable.reorder_point) || 20,
            withdrawal_period_days: Number(consumable.withdrawal_period_days) || 0,
            specifications: consumable.specifications || {}
          }))
        } as ConsumableSetupRequest),
      })

      if (!response.ok) {
        throw new Error('Failed to add consumables')
      }

      const result: BusinessSetupResponse = await response.json()

      if (result.success) {
        toast.success(`Successfully added ${result.data?.consumables_created || 0} consumables`)
        loadExistingConsumables()
      } else {
        throw new Error(result.message || 'Failed to add consumables')
      }
    } catch (error) {
      console.error('Error adding consumables:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add consumables')
    } finally {
      setLoading(false)
    }
  }

  if (!selectedUserId && !selectedOrganizationId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consumable Management</h1>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-900 mb-2">No User Selected</h3>
          <p className="text-yellow-700">
            Please select a user and organization first using the User Selector.
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consumable Management</h1>
            <p className="text-gray-600 mt-2">
              Manage feed, medicine, supplements, and equipment for {selectedUserId ? 'selected user' : 'selected organization'}
            </p>
          </div>
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Current Selection</h3>
        <div className="text-sm text-blue-700">
          {selectedUserId && <p>User ID: {selectedUserId}</p>}
          {selectedOrganizationId && <p>Organization ID: {selectedOrganizationId}</p>}
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Add by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {consumableTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => addNewConsumable(type.value)}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center space-y-2"
            >
              {type.icon}
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Consumables */}
      {existingConsumables.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Existing Consumables</h2>
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {existingConsumables.map((consumable) => (
                    <tr key={consumable.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{consumable.name}</div>
                          {consumable.brand && (
                            <div className="text-sm text-gray-500">{consumable.brand}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          consumable.type === 'medicine' ? 'bg-red-100 text-red-800' :
                          consumable.type === 'feed' ? 'bg-green-100 text-green-800' :
                          consumable.type === 'supplement' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {consumable.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{consumable.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {consumable.current_stock <= consumable.minimum_stock && (
                            <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                          )}
                          {consumable.current_stock} {consumable.default_unit_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          consumable.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {consumable.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add New Consumables Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Consumables</h2>
          <button
            type="button"
            onClick={() => addNewConsumable()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Item
          </button>
        </div>

        <div className="space-y-8">
          {fields.map((field, index) => {
            const watchedType = watch(`consumables.${index}.type`)
            const categories = getCategoriesForType(watchedType)
            
            return (
              <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    {consumableTypes.find(t => t.value === watchedType)?.icon}
                    <span className="ml-2">
                      {consumableTypes.find(t => t.value === watchedType)?.label} {index + 1}
                    </span>
                  </h3>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        {...register(`consumables.${index}.name`, { required: 'Name is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Product name"
                      />
                      {errors.consumables?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.consumables[index]?.name?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <select
                        {...register(`consumables.${index}.type`, { required: 'Type is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {consumableTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        {...register(`consumables.${index}.category`, { required: 'Category is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      {errors.consumables?.[index]?.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.consumables[index]?.category?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand
                      </label>
                      <input
                        {...register(`consumables.${index}.brand`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brand name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier
                      </label>
                      <input
                        {...register(`consumables.${index}.supplier`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Supplier name"
                      />
                    </div>
                  </div>

                  {/* Inventory & Pricing */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Inventory & Pricing</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Quantity *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`consumables.${index}.default_quantity`, { 
                          required: 'Default quantity is required',
                          valueAsNumber: true,
                          min: { value: 0.01, message: 'Quantity must be greater than 0' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1"
                      />
                      {errors.consumables?.[index]?.default_quantity && (
                        <p className="mt-1 text-sm text-red-600">{errors.consumables[index]?.default_quantity?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Type *
                      </label>
                      <select
                        {...register(`consumables.${index}.default_unit_type`, { required: 'Unit type is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {unitTypes.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost per Unit
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`consumables.${index}.cost_per_unit`, { 
                          valueAsNumber: true,
                          min: { value: 0, message: 'Cost must be non-negative' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Stock *
                      </label>
                      <input
                        type="number"
                        {...register(`consumables.${index}.current_stock`, { 
                          required: 'Current stock is required',
                          valueAsNumber: true,
                          min: { value: 0, message: 'Stock must be non-negative' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Stock *
                      </label>
                      <input
                        type="number"
                        {...register(`consumables.${index}.minimum_stock`, { 
                          required: 'Minimum stock is required',
                          valueAsNumber: true,
                          min: { value: 0, message: 'Minimum stock must be non-negative' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reorder Point *
                      </label>
                      <input
                        type="number"
                        {...register(`consumables.${index}.reorder_point`, { 
                          required: 'Reorder point is required',
                          valueAsNumber: true,
                          min: { value: 0, message: 'Reorder point must be non-negative' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="20"
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Additional Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barcode
                      </label>
                      <input
                        {...register(`consumables.${index}.barcode`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Barcode number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU
                      </label>
                      <input
                        {...register(`consumables.${index}.sku`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="SKU code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Storage Requirements
                      </label>
                      <textarea
                        {...register(`consumables.${index}.storage_requirements`)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Storage conditions and requirements"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        {...register(`consumables.${index}.expiry_date`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Medicine-specific fields */}
                    {watchedType === 'medicine' && (
                      <>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            {...register(`consumables.${index}.requires_prescription`)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            Requires Prescription
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Withdrawal Period (days)
                          </label>
                          <input
                            type="number"
                            {...register(`consumables.${index}.withdrawal_period_days`, { 
                              valueAsNumber: true,
                              min: { value: 0, message: 'Withdrawal period must be non-negative' }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`consumables.${index}.is_active`)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => addNewConsumable()}
              className="px-6 py-3 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Item
            </button>
            
            <button
              type="submit"
              disabled={loading || fields.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving Items...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Items ({fields.length})
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 