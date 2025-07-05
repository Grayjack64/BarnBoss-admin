'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { Horse, HorseGender, HorseStatus, HorseSetupRequest, BusinessSetupResponse } from '../lib/types'
import { ArrowLeft, Plus, Trash2, Save, MapPin, User, Calendar, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

interface HorseManagementProps {
  onBack: () => void
  selectedUserId: string | null
  selectedOrganizationId: string | null
}

interface HorseFormData {
  horses: Omit<Horse, 'id' | 'created_at' | 'updated_at' | 'created_by'>[]
}

const defaultHorse: Omit<Horse, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
  name: '',
  registered_name: '',
  nickname: '',
  breed: '',
  gender: 'mare',
  birth_date: '',
  color: '',
  markings: '',
  registration_number: '',
  microchip_number: '',
  passport_number: '',
  height_hands: undefined,
  weight_kg: undefined,
  status: 'active',
  location: '',
  owner_name: '',
  owner_contact: '',
  insurance_details: {},
  medical_notes: '',
  dietary_restrictions: [],
  photos: [],
  is_active: true,
  user_id: '',
  organization_id: ''
}

const genderOptions: { value: HorseGender; label: string }[] = [
  { value: 'mare', label: 'Mare' },
  { value: 'stallion', label: 'Stallion' },
  { value: 'gelding', label: 'Gelding' },
  { value: 'filly', label: 'Filly' },
  { value: 'colt', label: 'Colt' }
]

const statusOptions: { value: HorseStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'training', label: 'In Training' },
  { value: 'breeding', label: 'Breeding' },
  { value: 'racing', label: 'Racing' },
  { value: 'injured', label: 'Injured' },
  { value: 'retired', label: 'Retired' }
]

const commonBreeds = [
  'Arabian',
  'Thoroughbred',
  'Quarter Horse',
  'Paint Horse',
  'Appaloosa',
  'Standardbred',
  'Tennessee Walking Horse',
  'Morgan',
  'Friesian',
  'Clydesdale',
  'Percheron',
  'Andalusian',
  'Warmblood',
  'Mustang',
  'Pinto',
  'Saddlebred',
  'Other'
]

const commonColors = [
  'Bay',
  'Chestnut',
  'Black',
  'Gray',
  'Palomino',
  'Buckskin',
  'Pinto',
  'Roan',
  'Dun',
  'Cremello',
  'Champagne',
  'Silver',
  'Other'
]

export default function HorseManagement({
  onBack,
  selectedUserId,
  selectedOrganizationId
}: HorseManagementProps) {
  const [loading, setLoading] = useState(false)
  const [existingHorses, setExistingHorses] = useState<Horse[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { register, control, handleSubmit, formState: { errors } } = useForm<HorseFormData>({
    defaultValues: {
      horses: [{ ...defaultHorse, user_id: selectedUserId || '', organization_id: selectedOrganizationId || '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'horses'
  })

  useEffect(() => {
    if (selectedUserId || selectedOrganizationId) {
      loadExistingHorses()
    }
  }, [selectedUserId, selectedOrganizationId])

  const loadExistingHorses = async () => {
    if (!selectedUserId && !selectedOrganizationId) return

    try {
      setLoadingExisting(true)
      
      const params = new URLSearchParams()
      if (selectedOrganizationId) {
        params.append('organization_id', selectedOrganizationId)
      }
      if (selectedUserId) {
        params.append('user_id', selectedUserId)
      }

      const response = await fetch(`/api/business-setup/horses/existing?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setExistingHorses(data.horses || [])
      console.log(`Loaded ${data.count || 0} existing horses`)
      
    } catch (error) {
      console.error('Error loading existing horses:', error)
      toast.error('Failed to load existing horses: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoadingExisting(false)
    }
  }

  const addNewHorse = () => {
    append({
      ...defaultHorse,
      user_id: selectedUserId || '',
      organization_id: selectedOrganizationId || ''
    })
  }

  const onSubmit = async (data: HorseFormData) => {
    if (!selectedUserId && !selectedOrganizationId) {
      toast.error('Please select a user or organization first')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/business-setup/horses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          organization_id: selectedOrganizationId,
          horses: data.horses.map(horse => ({
            ...horse,
            user_id: selectedUserId || '',
            organization_id: selectedOrganizationId || '',
            dietary_restrictions: horse.dietary_restrictions || [],
            photos: horse.photos || []
          }))
        } as HorseSetupRequest),
      })

      if (!response.ok) {
        throw new Error('Failed to add horses')
      }

      const result: BusinessSetupResponse = await response.json()

      if (result.success) {
        toast.success(`Successfully added ${result.data?.horses_created || 0} horses`)
        loadExistingHorses()
        // Reset form with one empty horse
        const emptyHorse = {
          ...defaultHorse,
          user_id: selectedUserId || '',
          organization_id: selectedOrganizationId || ''
        }
        // Reset the form to a single empty horse
        // This would require resetting the form, but for now just show success
      } else {
        throw new Error(result.message || 'Failed to add horses')
      }
    } catch (error) {
      console.error('Error adding horses:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add horses')
    } finally {
      setLoading(false)
    }
  }

  // Filter existing horses based on search term
  const filteredHorses = existingHorses.filter(horse => 
    horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    horse.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    horse.registered_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    horse.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    horse.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <h1 className="text-3xl font-bold text-gray-900">Horse Management</h1>
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
    <div className="max-w-6xl mx-auto p-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Horse Management</h1>
            <p className="text-gray-600 mt-2">
              Add horses for {selectedUserId ? 'selected user' : 'selected organization'}
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

      {/* Existing Horses */}
      {(existingHorses.length > 0 || loadingExisting) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Existing Horses 
              {!loadingExisting && <span className="text-sm font-normal text-gray-600 ml-2">({existingHorses.length} total)</span>}
            </h2>
            
            {existingHorses.length > 0 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search horses by name, breed, or registration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {loadingExisting ? (
            <div className="bg-white rounded-lg shadow border p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading existing horses...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              {filteredHorses.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {searchTerm ? `No horses found matching "${searchTerm}"` : 'No horses found for this organization.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHorses.map((horse) => (
                        <tr key={horse.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{horse.name}</div>
                              {horse.nickname && (
                                <div className="text-sm text-gray-500">"{horse.nickname}"</div>
                              )}
                              {horse.registered_name && horse.registered_name !== horse.name && (
                                <div className="text-xs text-gray-400">Reg: {horse.registered_name}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{horse.breed || '-'}</div>
                            {horse.color && (
                              <div className="text-xs text-gray-500">{horse.color}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">{horse.gender}</div>
                            {horse.birth_date && (
                              <div className="text-xs text-gray-500">
                                Born {new Date(horse.birth_date).getFullYear()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              horse.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : horse.status === 'injured'
                                ? 'bg-red-100 text-red-800'
                                : horse.status === 'retired'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {horse.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {horse.registration_number || '-'}
                            </div>
                            {horse.microchip_number && (
                              <div className="text-xs text-gray-500">
                                Chip: {horse.microchip_number}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {horse.created_at && new Date(horse.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add New Horses Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Horses</h2>
          <button
            type="button"
            onClick={addNewHorse}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Horse
          </button>
        </div>

        <div className="space-y-8">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Horse {index + 1}
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
                      {...register(`horses.${index}.name`, { required: 'Horse name is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Horse's name"
                    />
                    {errors.horses?.[index]?.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.horses[index]?.name?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registered Name
                    </label>
                    <input
                      {...register(`horses.${index}.registered_name`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Official registered name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nickname
                    </label>
                    <input
                      {...register(`horses.${index}.nickname`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Barn name or nickname"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Breed *
                    </label>
                    <select
                      {...register(`horses.${index}.breed`, { required: 'Breed is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select breed</option>
                      {commonBreeds.map(breed => (
                        <option key={breed} value={breed}>{breed}</option>
                      ))}
                    </select>
                    {errors.horses?.[index]?.breed && (
                      <p className="mt-1 text-sm text-red-600">{errors.horses[index]?.breed?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      {...register(`horses.${index}.gender`, { required: 'Gender is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {genderOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      {...register(`horses.${index}.birth_date`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Physical Characteristics */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Physical Characteristics</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <select
                      {...register(`horses.${index}.color`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select color</option>
                      {commonColors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Markings
                    </label>
                    <textarea
                      {...register(`horses.${index}.markings`)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe distinctive markings"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (hands)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register(`horses.${index}.height_hands`, { 
                        valueAsNumber: true,
                        min: { value: 8, message: 'Height must be at least 8 hands' },
                        max: { value: 20, message: 'Height must be less than 20 hands' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="14.2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      {...register(`horses.${index}.weight_kg`, { 
                        valueAsNumber: true,
                        min: { value: 100, message: 'Weight must be at least 100 kg' },
                        max: { value: 1500, message: 'Weight must be less than 1500 kg' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      {...register(`horses.${index}.status`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      {...register(`horses.${index}.location`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Barn, stall, or paddock location"
                    />
                  </div>
                </div>

                {/* Documentation & Health */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Documentation & Health</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      {...register(`horses.${index}.registration_number`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Registration number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Microchip Number
                    </label>
                    <input
                      {...register(`horses.${index}.microchip_number`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Microchip number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passport Number
                    </label>
                    <input
                      {...register(`horses.${index}.passport_number`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Passport number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner Name
                    </label>
                    <input
                      {...register(`horses.${index}.owner_name`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Horse owner's name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner Contact
                    </label>
                    <input
                      {...register(`horses.${index}.owner_contact`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phone or email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Notes
                    </label>
                    <textarea
                      {...register(`horses.${index}.medical_notes`)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Medical history, conditions, or notes"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              onClick={addNewHorse}
              className="px-6 py-3 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Horse
            </button>
            
            <button
              type="submit"
              disabled={loading || fields.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving Horses...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Horses ({fields.length})
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 