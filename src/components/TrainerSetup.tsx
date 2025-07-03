'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'

interface TrainerFormData {
  name: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  ownerName: string
  ownerEmail: string
  ownerPassword: string
}

interface Props {
  onComplete: () => void
}

const DEFAULT_TRAINER_ROLES = [
  { name: 'Head Trainer', permissions: ['manage_organization', 'manage_horses', 'assign_tasks'], color: '#007AFF' },
  { name: 'Trainer', permissions: ['manage_horses', 'assign_tasks'], color: '#34C759' },
  { name: 'Assistant', permissions: ['view_assigned', 'update_tasks'], color: '#FF9500' },
  { name: 'Client', permissions: ['view_own_horses'], color: '#AF52DE' },
]

export default function TrainerSetup({ onComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [created, setCreated] = useState<any>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<TrainerFormData>()

  const onSubmit = async (data: TrainerFormData) => {
    setLoading(true)
    
    try {
      // Create user
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: data.ownerEmail,
        password: data.ownerPassword,
        email_confirm: true,
        user_metadata: { full_name: data.ownerName, role: 'trainer' }
      })

      if (userError) throw userError

      // Create organization
      const orgId = uuidv4()
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          id: orgId,
          name: data.name,
          type: 'trainer',
          description: data.description,
          owner_id: userData.user.id,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          settings: { is_trainer: true, accepts_training_requests: true },
          subscription_tier: 'premium',
          is_active: true,
          member_count: 1
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Create roles
      const rolesData = DEFAULT_TRAINER_ROLES.map(role => ({
        id: uuidv4(),
        organization_id: orgId,
        name: role.name,
        permissions: role.permissions,
        color: role.color,
        can_assign_tasks: role.permissions.indexOf('assign_tasks') !== -1,
        can_manage_horses: role.permissions.indexOf('manage_horses') !== -1,
        can_view_all_horses: role.permissions.indexOf('view_all') !== -1,
        can_manage_organization: role.permissions.indexOf('manage_organization') !== -1
      }))

      const { data: roles, error: rolesError } = await supabaseAdmin
        .from('roles')
        .insert(rolesData)
        .select()

      if (rolesError) throw rolesError

      // Add owner to organization
      const headTrainerRole = roles.find(r => r.name === 'Head Trainer')
      await supabaseAdmin
        .from('organization_members')
        .insert({
          id: uuidv4(),
          organization_id: orgId,
          user_id: userData.user.id,
          role_id: headTrainerRole?.id,
          is_active: true
        })

      setCreated({ organization: orgData, user: userData.user })
      setStep(2)
      toast.success('Trainer organization created successfully!')
      
    } catch (error) {
      console.error(error)
      toast.error('Failed to create trainer organization')
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Trainer Organization Created!</h2>
          <p className="text-gray-600">Setup completed successfully</p>
        </div>
        <button onClick={onComplete} className="btn btn-primary">
          Complete Setup
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Trainer Setup</h2>
        <p className="text-gray-600">Create a professional trainer organization</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Business Information</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Business Name *</label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="form-input"
                placeholder="Training business name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="form-label">Email</label>
              <input {...register('email')} type="email" className="form-input" />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <textarea {...register('description')} className="form-input" rows={3} />
            </div>

            <div>
              <label className="form-label">Phone</label>
              <input {...register('phone')} className="form-input" />
            </div>

            <div>
              <label className="form-label">Website</label>
              <input {...register('website')} className="form-input" />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Address</label>
              <input {...register('address')} className="form-input" />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium mb-4">Trainer Account</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Trainer Name *</label>
              <input
                {...register('ownerName', { required: 'Name is required' })}
                className="form-input"
              />
              {errors.ownerName && <p className="text-red-600 text-sm mt-1">{errors.ownerName.message}</p>}
            </div>

            <div>
              <label className="form-label">Email *</label>
              <input
                {...register('ownerEmail', { required: 'Email is required' })}
                type="email"
                className="form-input"
              />
              {errors.ownerEmail && <p className="text-red-600 text-sm mt-1">{errors.ownerEmail.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Password *</label>
              <input
                {...register('ownerPassword', { required: 'Password is required', minLength: 8 })}
                type="password"
                className="form-input"
              />
              {errors.ownerPassword && <p className="text-red-600 text-sm mt-1">{errors.ownerPassword.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating...' : 'Create Trainer Organization'}
          </button>
        </div>
      </form>
    </div>
  )
} 