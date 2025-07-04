'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
      // Create user account via API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.ownerEmail,
          password: data.ownerPassword,
          userData: {
            full_name: data.ownerName,
            role: 'owner'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      const userData = await response.json()
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
      
      // Create organization via API
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create organization')
      }

      const orgData = await response.json()
      setCreatedOrganization(orgData.organization)
      return orgData.organization
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

      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rolesData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create roles')
      }

      const responseData = await response.json()
      return responseData.roles
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

      const response = await fetch('/api/organization-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: uuidv4(),
          organization_id: organizationId,
          user_id: ownerId,
          role_id: adminRole.id,
          is_active: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add owner to organization')
      }
    } catch (error) {
      console.error('Error adding owner to organization:', error)
      throw error
    }
  }

  const createUserProfile = async (userId: string, data: OrganizationFormData) => {
    try {
      const accountType = data.type === 'trainer' ? 'trainer' : 'organization'
      
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          full_name: data.ownerName,
          email: data.ownerEmail,
          account_type: accountType,
          is_active: true,
          preferences: {
            notifications: {
              email: true,
              push: true
            }
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user profile')
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      setLoading(true)
      
      // Step 1: Create owner account
      const user = await createOwnerAccount(data)
      
      // Step 2: Create organization
      const organization = await createOrganization(data, user.id)
      
      // Step 3: Create roles
      const roles = await createRoles(organization.id, data.type)
      
      // Step 4: Add owner to organization
      await addOwnerToOrganization(organization.id, user.id, roles)
      
      // Step 5: Create user profile
      await createUserProfile(user.id, data)
      
      toast.success('Organization created successfully!')
      setStep(2)
      
    } catch (error: any) {
      console.error('Error creating organization:', error)
      toast.error(error.message || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Organization Created Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your organization has been created with the following details:</p>
                <ul className="mt-2 space-y-1">
                  <li><strong>Name:</strong> {createdOrganization?.name}</li>
                  <li><strong>Type:</strong> {createdOrganization?.type}</li>
                  <li><strong>Owner:</strong> {createdUser?.email}</li>
                  <li><strong>Organization ID:</strong> {createdOrganization?.id}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onComplete}
            className="btn btn-primary"
          >
            Continue to Dashboard
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
          Create a new organization with an owner account and default roles
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Organization Details */}
        <div className="card">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="form-label">
                Organization Name *
              </label>
              <input
                {...register('name', { required: 'Organization name is required' })}
                type="text"
                id="name"
                className="form-input"
                placeholder="Enter organization name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="type" className="form-label">
                Organization Type *
              </label>
              <select
                {...register('type', { required: 'Organization type is required' })}
                id="type"
                className="form-select"
              >
                <option value="organization">General Organization</option>
                <option value="stable">Stable</option>
                <option value="trainer">Trainer</option>
                <option value="enterprise">Enterprise</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={3}
                className="form-textarea"
                placeholder="Brief description of the organization"
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Organization Email *
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                id="email"
                className="form-input"
                placeholder="contact@organization.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="form-input"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="form-label">
                Address
              </label>
              <input
                {...register('address')}
                type="text"
                id="address"
                className="form-input"
                placeholder="123 Main Street, City, State, ZIP"
              />
            </div>

            <div>
              <label htmlFor="website" className="form-label">
                Website
              </label>
              <input
                {...register('website')}
                type="url"
                id="website"
                className="form-input"
                placeholder="https://www.organization.com"
              />
            </div>

            <div>
              <label htmlFor="subscriptionTier" className="form-label">
                Subscription Tier *
              </label>
              <select
                {...register('subscriptionTier', { required: 'Subscription tier is required' })}
                id="subscriptionTier"
                className="form-select"
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
              {errors.subscriptionTier && (
                <p className="mt-1 text-sm text-red-600">{errors.subscriptionTier.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Owner Account */}
        <div className="card">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-medium text-gray-900">Owner Account</h3>
            <p className="mt-1 text-sm text-gray-600">
              Create an account for the organization owner
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="ownerName" className="form-label">
                Owner Name *
              </label>
              <input
                {...register('ownerName', { required: 'Owner name is required' })}
                type="text"
                id="ownerName"
                className="form-input"
                placeholder="John Doe"
              />
              {errors.ownerName && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="ownerEmail" className="form-label">
                Owner Email *
              </label>
              <input
                {...register('ownerEmail', { 
                  required: 'Owner email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                id="ownerEmail"
                className="form-input"
                placeholder="john@example.com"
              />
              {errors.ownerEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerEmail.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="ownerPassword" className="form-label">
                Owner Password *
              </label>
              <input
                {...register('ownerPassword', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type="password"
                id="ownerPassword"
                className="form-input"
                placeholder="Enter secure password"
              />
              {errors.ownerPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerPassword.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Default Roles Preview */}
        <div className="card">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-medium text-gray-900">Default Roles</h3>
            <p className="mt-1 text-sm text-gray-600">
              These roles will be created for your {organizationType}
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(DEFAULT_ROLES[organizationType as keyof typeof DEFAULT_ROLES] || DEFAULT_ROLES.organization).map((role, index) => (
              <div key={index} className="flex items-center p-3 border rounded-lg">
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: role.color }}
                />
                <div>
                  <div className="font-medium text-sm">{role.name}</div>
                  <div className="text-xs text-gray-500">
                    {role.permissions.length} permissions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  )
} 