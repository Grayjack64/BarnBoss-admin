'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'

interface OrganizationFormData {
  name: string
  type: 'stable' | 'organization' | 'trainer' | 'enterprise'
  description: string
  address: string
  phone: string
  email: string
  website: string
  subscriptionTier: 'basic' | 'premium' | 'enterprise'
  ownerEmail: string
  ownerName: string
  ownerPassword: string
}

interface Props {
  onComplete: () => void
}

const DEFAULT_ROLES = {
  organization: [
    { name: 'Administrator', permissions: ['manage_organization', 'manage_horses', 'assign_tasks', 'view_all'], color: '#007AFF' },
    { name: 'Manager', permissions: ['manage_horses', 'assign_tasks', 'view_all'], color: '#34C759' },
    { name: 'Staff', permissions: ['view_assigned', 'update_tasks'], color: '#FF9500' },
    { name: 'Veterinarian', permissions: ['view_all', 'manage_medical'], color: '#AF52DE' },
  ],
  trainer: [
    { name: 'Head Trainer', permissions: ['manage_organization', 'manage_horses', 'assign_tasks', 'view_all'], color: '#007AFF' },
    { name: 'Trainer', permissions: ['manage_horses', 'assign_tasks', 'view_assigned'], color: '#34C759' },
    { name: 'Assistant Trainer', permissions: ['view_assigned', 'update_tasks'], color: '#FF9500' },
    { name: 'Client', permissions: ['view_own_horses'], color: '#AF52DE' },
  ],
  stable: [
    { name: 'Stable Owner', permissions: ['manage_organization', 'manage_horses', 'assign_tasks', 'view_all'], color: '#007AFF' },
    { name: 'Stable Manager', permissions: ['manage_horses', 'assign_tasks', 'view_all'], color: '#34C759' },
    { name: 'Staff', permissions: ['view_assigned', 'update_tasks'], color: '#FF9500' },
    { name: 'Boarder', permissions: ['view_own_horses'], color: '#AF52DE' },
  ],
  enterprise: [
    { name: 'Administrator', permissions: ['manage_organization', 'manage_horses', 'assign_tasks', 'view_all'], color: '#007AFF' },
    { name: 'Manager', permissions: ['manage_horses', 'assign_tasks', 'view_all'], color: '#34C759' },
    { name: 'Staff', permissions: ['view_assigned', 'update_tasks'], color: '#FF9500' },
    { name: 'Veterinarian', permissions: ['view_all', 'manage_medical'], color: '#AF52DE' },
  ]
}

export default function OrganizationSetup({ onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [createdOrganization, setCreatedOrganization] = useState<any>(null)
  const [createdUser, setCreatedUser] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<OrganizationFormData>({
    defaultValues: {
      subscriptionTier: 'basic',
      type: 'organization'
    }
  })

  const organizationType = watch('type')

  const createOwnerAccount = async (data: OrganizationFormData) => {
    try {
      // Create user account
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: data.ownerEmail,
        password: data.ownerPassword,
        email_confirm: true,
        user_metadata: {
          full_name: data.ownerName,
          role: 'owner'
        }
      })

      if (userError) throw userError
      
      setCreatedUser(userData.user)
      return userData.user
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  const createOrganization = async (data: OrganizationFormData, ownerId: string) => {
    try {
      const orgId = uuidv4()
      
      // Create organization
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          id: orgId,
          name: data.name,
          type: data.type,
          description: data.description,
          owner_id: ownerId,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          settings: data.type === 'trainer' ? {
            is_trainer: true,
            accepts_training_requests: true,
            training_specializations: []
          } : {},
          subscription_tier: data.subscriptionTier,
          is_active: true,
          member_count: 1
        })
        .select()
        .single()

      if (orgError) throw orgError
      
      setCreatedOrganization(orgData)
      return orgData
    } catch (error) {
      console.error('Error creating organization:', error)
      throw error
    }
  }

  const createRoles = async (organizationId: string, type: string) => {
    try {
      const roles = DEFAULT_ROLES[type as keyof typeof DEFAULT_ROLES] || DEFAULT_ROLES.organization
      
      const rolesData = roles.map(role => ({
        id: uuidv4(),
        organization_id: organizationId,
        name: role.name,
        description: `${role.name} role for ${type}`,
        permissions: role.permissions,
        can_assign_tasks: role.permissions.includes('assign_tasks'),
        can_manage_horses: role.permissions.includes('manage_horses'),
        can_view_all_horses: role.permissions.includes('view_all'),
        can_manage_organization: role.permissions.includes('manage_organization'),
        color: role.color
      }))

      const { data: createdRoles, error: rolesError } = await supabaseAdmin
        .from('roles')
        .insert(rolesData)
        .select()

      if (rolesError) throw rolesError
      
      return createdRoles
    } catch (error) {
      console.error('Error creating roles:', error)
      throw error
    }
  }

  const addOwnerToOrganization = async (organizationId: string, ownerId: string, roles: any[]) => {
    try {
      // Find the admin/owner role
      const adminRole = roles.find(role => 
        role.name === 'Administrator' || 
        role.name === 'Head Trainer' || 
        role.name === 'Stable Owner'
      )

      if (!adminRole) throw new Error('Admin role not found')

      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          id: uuidv4(),
          organization_id: organizationId,
          user_id: ownerId,
          role_id: adminRole.id,
          is_active: true
        })

      if (memberError) throw memberError
    } catch (error) {
      console.error('Error adding owner to organization:', error)
      throw error
    }
  }

  const createUserProfile = async (userId: string, data: OrganizationFormData) => {
    try {
      const accountType = data.type === 'trainer' ? 'trainer' : 'organization'
      
      const { error: profileError } = await supabaseAdmin
        .from('user_account_profiles')
        .insert({
          id: uuidv4(),
          user_id: userId,
          account_type: accountType,
          display_name: data.ownerName,
          bio: `${data.ownerName} - ${data.type} owner`,
          is_active: true
        })

      if (profileError) throw profileError
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  const onSubmit = async (data: OrganizationFormData) => {
    setLoading(true)
    
    try {
      // Step 1: Create owner account
      const user = await createOwnerAccount(data)
      
      // Step 2: Create organization
      const organization = await createOrganization(data, user.id)
      
      // Step 3: Create default roles
      const roles = await createRoles(organization.id, data.type)
      
      // Step 4: Add owner to organization
      await addOwnerToOrganization(organization.id, user.id, roles)
      
      // Step 5: Create user profile
      await createUserProfile(user.id, data)
      
      toast.success('Organization created successfully!')
      setStep(2)
      
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error(`Failed to create organization: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Organization Created Successfully!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your organization has been set up with all necessary components.
          </p>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Setup Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Organization Name:</span>
                <span className="text-sm text-gray-900">{createdOrganization?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Type:</span>
                <span className="text-sm text-gray-900 capitalize">{createdOrganization?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Owner Email:</span>
                <span className="text-sm text-gray-900">{createdUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Subscription Tier:</span>
                <span className="text-sm text-gray-900 capitalize">{createdOrganization?.subscription_tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Default Roles Created:</span>
                <span className="text-sm text-gray-900">
                  {DEFAULT_ROLES[createdOrganization?.type as keyof typeof DEFAULT_ROLES]?.length || 0} roles
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onComplete}
            className="btn btn-primary"
          >
            Complete Setup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Organization Setup</h2>
        <p className="mt-2 text-sm text-gray-600">
          Create a new organization with complete setup including owner account and default roles.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Organization Details
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label">Organization Name *</label>
                <input
                  {...register('name', { required: 'Organization name is required' })}
                  className="form-input"
                  placeholder="Enter organization name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Organization Type *</label>
                <select
                  {...register('type', { required: 'Organization type is required' })}
                  className="form-input"
                >
                  <option value="organization">Organization</option>
                  <option value="stable">Stable</option>
                  <option value="trainer">Trainer</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="form-input"
                  placeholder="Brief description of the organization"
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="form-input"
                  placeholder="organization@example.com"
                />
              </div>

              <div>
                <label className="form-label">Phone</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="form-input"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Address</label>
                <input
                  {...register('address')}
                  className="form-input"
                  placeholder="Street address, city, state, zip"
                />
              </div>

              <div>
                <label className="form-label">Website</label>
                <input
                  {...register('website')}
                  type="url"
                  className="form-input"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="form-label">Subscription Tier *</label>
                <select
                  {...register('subscriptionTier', { required: 'Subscription tier is required' })}
                  className="form-input"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Owner Account
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label">Owner Name *</label>
                <input
                  {...register('ownerName', { required: 'Owner name is required' })}
                  className="form-input"
                  placeholder="Full name of the owner"
                />
                {errors.ownerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.ownerName.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Owner Email *</label>
                <input
                  {...register('ownerEmail', { 
                    required: 'Owner email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="form-input"
                  placeholder="owner@example.com"
                />
                {errors.ownerEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.ownerEmail.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Owner Password *</label>
                <input
                  {...register('ownerPassword', { 
                    required: 'Owner password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  type="password"
                  className="form-input"
                  placeholder="Minimum 8 characters"
                />
                {errors.ownerPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.ownerPassword.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Default Roles for {organizationType}:
          </h4>
          <div className="space-y-1">
            {DEFAULT_ROLES[organizationType as keyof typeof DEFAULT_ROLES]?.map((role, index) => (
              <div key={index} className="flex items-center text-sm text-blue-800">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: role.color }}
                />
                <span className="font-medium">{role.name}</span>
                <span className="ml-2 text-blue-600">
                  ({role.permissions.join(', ')})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Creating Organization...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  )
} 