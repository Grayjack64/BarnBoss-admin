'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { 
  TransactionType, 
  TransactionCategory, 
  TransactionUnitType, 
  BillingFrequency,
  ServicePricingSetupRequest, 
  BusinessSetupResponse 
} from '../lib/types'
import { ArrowLeft, Plus, Trash2, Save, DollarSign, Clock, Calendar, Target } from 'lucide-react'
import toast from 'react-hot-toast'

interface ServicePricingProps {
  onBack: () => void
  selectedUserId: string | null
  selectedOrganizationId: string | null
}

interface ServicePricingFormData {
  transaction_types: Omit<TransactionType, 'id' | 'created_at' | 'updated_at' | 'created_by'>[]
}

const defaultTransactionType: Omit<TransactionType, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
  organization_id: '',
  name: '',
  description: '',
  default_rate: 0,
  unit_type: 'hour',
  billing_frequency: 'session',
  category: 'training',
  price_range_min: 0,
  price_range_max: 0,
  is_system_default: false,
  market_reference: '',
  is_active: true,
  is_recurring: false,
  billing_cycle_days: 0,
  auto_billing_enabled: false,
  service_tier: 'standard',
  requires_approval: false,
  max_tasks_per_cycle: 0
}

const categoryOptions: { value: TransactionCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'training', label: 'Training', icon: <Target className="h-4 w-4" /> },
  { value: 'boarding', label: 'Boarding', icon: <Calendar className="h-4 w-4" /> },
  { value: 'veterinary', label: 'Veterinary', icon: <Plus className="h-4 w-4" /> },
  { value: 'grooming', label: 'Grooming', icon: <Target className="h-4 w-4" /> },
  { value: 'farrier', label: 'Farrier', icon: <Target className="h-4 w-4" /> },
  { value: 'feed', label: 'Feed', icon: <Target className="h-4 w-4" /> },
  { value: 'medicine', label: 'Medicine', icon: <Plus className="h-4 w-4" /> },
  { value: 'transportation', label: 'Transportation', icon: <Target className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <Target className="h-4 w-4" /> }
]

const unitTypeOptions: { value: TransactionUnitType; label: string }[] = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'session', label: 'Session' },
  { value: 'month', label: 'Month' },
  { value: 'event', label: 'Event' },
  { value: 'task', label: 'Task' },
  { value: 'head', label: 'Per Horse' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Rate' }
]

const billingFrequencyOptions: { value: BillingFrequency; label: string }[] = [
  { value: 'session', label: 'Per Session' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'per_event', label: 'Per Event' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'per_task', label: 'Per Task' }
]

const serviceTiers = ['basic', 'standard', 'premium', 'enterprise']

// Common service templates by category
const serviceTemplates: Record<TransactionCategory, Array<Partial<TransactionType>>> = {
  training: [
    { name: 'Basic Training Session', default_rate: 75, unit_type: 'hour', billing_frequency: 'session', service_tier: 'standard' },
    { name: 'Advanced Training Session', default_rate: 100, unit_type: 'hour', billing_frequency: 'session', service_tier: 'premium' },
    { name: 'Group Training Session', default_rate: 50, unit_type: 'hour', billing_frequency: 'session', service_tier: 'basic' },
    { name: 'Competition Preparation', default_rate: 125, unit_type: 'hour', billing_frequency: 'session', service_tier: 'premium' }
  ],
  boarding: [
    { name: 'Full Board', default_rate: 600, unit_type: 'month', billing_frequency: 'monthly', service_tier: 'standard', is_recurring: true },
    { name: 'Pasture Board', default_rate: 300, unit_type: 'month', billing_frequency: 'monthly', service_tier: 'basic', is_recurring: true },
    { name: 'Training Board', default_rate: 1200, unit_type: 'month', billing_frequency: 'monthly', service_tier: 'premium', is_recurring: true }
  ],
  grooming: [
    { name: 'Basic Grooming', default_rate: 35, unit_type: 'session', billing_frequency: 'session', service_tier: 'basic' },
    { name: 'Full Grooming Service', default_rate: 60, unit_type: 'session', billing_frequency: 'session', service_tier: 'standard' },
    { name: 'Show Preparation', default_rate: 100, unit_type: 'session', billing_frequency: 'session', service_tier: 'premium' }
  ],
  veterinary: [
    { name: 'Routine Check-up', default_rate: 150, unit_type: 'event', billing_frequency: 'per_event', service_tier: 'standard' },
    { name: 'Emergency Call', default_rate: 300, unit_type: 'event', billing_frequency: 'per_event', service_tier: 'standard' },
    { name: 'Vaccination', default_rate: 75, unit_type: 'event', billing_frequency: 'per_event', service_tier: 'basic' }
  ],
  farrier: [
    { name: 'Trim Only', default_rate: 45, unit_type: 'event', billing_frequency: 'per_event', service_tier: 'basic' },
    { name: 'Shoe (4 shoes)', default_rate: 120, unit_type: 'event', billing_frequency: 'per_event', service_tier: 'standard' },
    { name: 'Corrective Shoeing', default_rate: 180, unit_type: 'event', billing_frequency: 'per_event', service_tier: 'premium' }
  ],
  feed: [
    { name: 'Hay (per bale)', default_rate: 12, unit_type: 'fixed', billing_frequency: 'per_event', service_tier: 'basic' },
    { name: 'Grain (per bag)', default_rate: 25, unit_type: 'fixed', billing_frequency: 'per_event', service_tier: 'basic' },
    { name: 'Supplements', default_rate: 50, unit_type: 'month', billing_frequency: 'monthly', service_tier: 'standard' }
  ],
  medicine: [
    { name: 'Deworming', default_rate: 25, unit_type: 'event', billing_frequency: 'per_event', service_tier: 'basic' },
    { name: 'Joint Injection', default_rate: 200, unit_type: 'event', billing_frequency: 'per_event', service_tier: 'premium' },
    { name: 'Medication Administration', default_rate: 15, unit_type: 'task', billing_frequency: 'per_task', service_tier: 'basic' }
  ],
  transportation: [
    { name: 'Local Transport', default_rate: 2, unit_type: 'fixed', billing_frequency: 'per_event', service_tier: 'standard' },
    { name: 'Long Distance Transport', default_rate: 5, unit_type: 'fixed', billing_frequency: 'per_event', service_tier: 'standard' },
    { name: 'Emergency Transport', default_rate: 10, unit_type: 'fixed', billing_frequency: 'per_event', service_tier: 'premium' }
  ],
  other: [
    { name: 'General Service', default_rate: 50, unit_type: 'hour', billing_frequency: 'session', service_tier: 'standard' }
  ]
}

export default function ServicePricing({
  onBack,
  selectedUserId,
  selectedOrganizationId
}: ServicePricingProps) {
  const [loading, setLoading] = useState(false)
  const [existingServices, setExistingServices] = useState<TransactionType[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('training')

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ServicePricingFormData>({
    defaultValues: {
      transaction_types: [{
        ...defaultTransactionType,
        organization_id: selectedOrganizationId || ''
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'transaction_types'
  })

  useEffect(() => {
    if (selectedOrganizationId) {
      loadExistingServices()
    }
  }, [selectedOrganizationId])

  const loadExistingServices = async () => {
    if (!selectedOrganizationId) return

    try {
      setLoadingExisting(true)
      const { data, error } = await supabase
        .from('transaction_types')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExistingServices(data || [])
    } catch (error) {
      console.error('Error loading existing services:', error)
      toast.error('Failed to load existing services')
    } finally {
      setLoadingExisting(false)
    }
  }

  const addNewService = (template?: Partial<TransactionType>) => {
    append({
      ...defaultTransactionType,
      ...template,
      organization_id: selectedOrganizationId || ''
    })
  }

  const addTemplateServices = (category: TransactionCategory) => {
    const templates = serviceTemplates[category] || []
    templates.forEach(template => {
      append({
        ...defaultTransactionType,
        ...template,
        category,
        organization_id: selectedOrganizationId || ''
      })
    })
    toast.success(`Added ${templates.length} ${category} service templates`)
  }

  const onSubmit = async (data: ServicePricingFormData) => {
    if (!selectedOrganizationId) {
      toast.error('Please select an organization first')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/business-setup/service-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: selectedOrganizationId,
          transaction_types: data.transaction_types.map(service => ({
            ...service,
            organization_id: selectedOrganizationId,
            default_rate: Number(service.default_rate) || 0,
            price_range_min: Number(service.price_range_min) || 0,
            price_range_max: Number(service.price_range_max) || 0,
            billing_cycle_days: Number(service.billing_cycle_days) || 0,
            max_tasks_per_cycle: Number(service.max_tasks_per_cycle) || 0
          }))
        } as ServicePricingSetupRequest),
      })

      if (!response.ok) {
        throw new Error('Failed to add service pricing')
      }

      const result: BusinessSetupResponse = await response.json()

      if (result.success) {
        toast.success(`Successfully added ${result.data?.transaction_types_created || 0} service types`)
        loadExistingServices()
      } else {
        throw new Error(result.message || 'Failed to add service pricing')
      }
    } catch (error) {
      console.error('Error adding service pricing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add service pricing')
    } finally {
      setLoading(false)
    }
  }

  if (!selectedOrganizationId) {
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
            <h1 className="text-3xl font-bold text-gray-900">Service Pricing</h1>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-900 mb-2">No Organization Selected</h3>
          <p className="text-yellow-700">
            Service pricing is organization-specific. Please select an organization first using the User Selector.
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
            <h1 className="text-3xl font-bold text-gray-900">Service Pricing Setup</h1>
            <p className="text-gray-600 mt-2">
              Configure transaction types and billing rates for the organization
            </p>
          </div>
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Current Selection</h3>
        <div className="text-sm text-blue-700">
          <p>Organization ID: {selectedOrganizationId}</p>
        </div>
      </div>

      {/* Service Template Categories */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add Service Templates by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {categoryOptions.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`p-4 border rounded-lg transition-colors flex flex-col items-center space-y-2 ${
                selectedCategory === category.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.icon}
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => addTemplateServices(selectedCategory)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {categoryOptions.find(c => c.value === selectedCategory)?.label} Templates
        </button>
      </div>

      {/* Existing Services */}
      {existingServices.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Existing Service Types</h2>
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {existingServices.map((service) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-gray-500">{service.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          service.category === 'training' ? 'bg-blue-100 text-blue-800' :
                          service.category === 'boarding' ? 'bg-green-100 text-green-800' :
                          service.category === 'veterinary' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${service.default_rate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.unit_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.billing_frequency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
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

      {/* Add New Services Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Service Types</h2>
          <button
            type="button"
            onClick={() => addNewService()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Service
          </button>
        </div>

        <div className="space-y-8">
          {fields.map((field, index) => {
            const watchedCategory = watch(`transaction_types.${index}.category`)
            const watchedUnitType = watch(`transaction_types.${index}.unit_type`)
            const watchedIsRecurring = watch(`transaction_types.${index}.is_recurring`)
            
            return (
              <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    {categoryOptions.find(c => c.value === watchedCategory)?.icon}
                    <span className="ml-2">
                      {categoryOptions.find(c => c.value === watchedCategory)?.label} Service {index + 1}
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
                        Service Name *
                      </label>
                      <input
                        {...register(`transaction_types.${index}.name`, { required: 'Service name is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Service name"
                      />
                      {errors.transaction_types?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.transaction_types[index]?.name?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        {...register(`transaction_types.${index}.category`, { required: 'Category is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categoryOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        {...register(`transaction_types.${index}.description`)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Service description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Tier
                      </label>
                      <select
                        {...register(`transaction_types.${index}.service_tier`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {serviceTiers.map(tier => (
                          <option key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing & Billing */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Pricing & Billing</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Rate * ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`transaction_types.${index}.default_rate`, { 
                          required: 'Default rate is required',
                          valueAsNumber: true,
                          min: { value: 0, message: 'Rate must be non-negative' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      {errors.transaction_types?.[index]?.default_rate && (
                        <p className="mt-1 text-sm text-red-600">{errors.transaction_types[index]?.default_rate?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Type *
                      </label>
                      <select
                        {...register(`transaction_types.${index}.unit_type`, { required: 'Unit type is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {unitTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Frequency *
                      </label>
                      <select
                        {...register(`transaction_types.${index}.billing_frequency`, { required: 'Billing frequency is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {billingFrequencyOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Rate ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`transaction_types.${index}.price_range_min`, { 
                            valueAsNumber: true,
                            min: { value: 0, message: 'Min rate must be non-negative' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Rate ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`transaction_types.${index}.price_range_max`, { 
                            valueAsNumber: true,
                            min: { value: 0, message: 'Max rate must be non-negative' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Market Reference
                      </label>
                      <input
                        {...register(`transaction_types.${index}.market_reference`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Market rate reference"
                      />
                    </div>
                  </div>

                  {/* Settings & Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Settings & Options</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register(`transaction_types.${index}.is_recurring`)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Recurring Service
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register(`transaction_types.${index}.auto_billing_enabled`)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Auto Billing Enabled
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register(`transaction_types.${index}.requires_approval`)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Requires Approval
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register(`transaction_types.${index}.is_active`)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Active
                        </label>
                      </div>
                    </div>

                    {watchedIsRecurring && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Billing Cycle (days)
                        </label>
                        <input
                          type="number"
                          {...register(`transaction_types.${index}.billing_cycle_days`, { 
                            valueAsNumber: true,
                            min: { value: 1, message: 'Billing cycle must be at least 1 day' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="30"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Tasks per Cycle
                      </label>
                      <input
                        type="number"
                        {...register(`transaction_types.${index}.max_tasks_per_cycle`, { 
                          valueAsNumber: true,
                          min: { value: 0, message: 'Max tasks must be non-negative' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0 (unlimited)"
                      />
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
              onClick={() => addNewService()}
              className="px-6 py-3 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Service
            </button>
            
            <button
              type="submit"
              disabled={loading || fields.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving Services...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Services ({fields.length})
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 