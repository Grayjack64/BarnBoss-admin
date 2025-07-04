'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Organization, User } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'

interface UserFormData {
  email: string
  name: string
  password: string
  organizationId: string
  roleId: string
}

interface Props {
  organizations: Organization[]
  users: User[]
  onComplete: () => void
}

export default function UserManagement({ organizations, users, onComplete }: Props) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create')
  const [loading, setLoading] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [orgRoles, setOrgRoles] = useState<any[]>([])

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<UserFormData>()

  const watchedOrgId = watch('organizationId')

  // Load roles when organization is selected
  const loadOrgRoles = async (orgId: string) => {
    try {
      const response = await fetch(`/api/roles?organization_id=${orgId}`)
      if (!response.ok) throw new Error('Failed to fetch roles')
      
      const data = await response.json()
      setOrgRoles(data.roles || [])
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load organization roles')
    }
  }

  // Load roles when organization changes
  useEffect(() => {
    if (watchedOrgId) {
      loadOrgRoles(watchedOrgId)
    }
  }, [watchedOrgId])

  const createUser = async (data: UserFormData) => {
    setLoading(true)
    
    try {
      // Create user account via API
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          userData: {
            full_name: data.name,
            role: 'user'
          }
        })
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      const userData = await userResponse.json()

      // Add user to organization via API
      const memberResponse = await fetch('/api/organization-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: uuidv4(),
          organization_id: data.organizationId,
          user_id: userData.user.id,
          role_id: data.roleId,
          is_active: true
        })
      })

      if (!memberResponse.ok) {
        const errorData = await memberResponse.json()
        throw new Error(errorData.error || 'Failed to add user to organization')
      }

      // Create user profile via API
      const profileResponse = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: uuidv4(),
          user_id: userData.user.id,
          account_type: 'organization',
          display_name: data.name,
          bio: `Member of ${organizations.find(org => org.id === data.organizationId)?.name}`,
          is_active: true
        })
      })

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json()
        throw new Error(errorData.error || 'Failed to create user profile')
      }

      toast.success('User created successfully!')
      reset()
      
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const assignUserToOrg = async (userId: string, orgId: string, roleId: string) => {
    try {
      setLoading(true)
      
      // Check if user is already in organization via API
      const checkResponse = await fetch(`/api/organization-members?user_id=${userId}&organization_id=${orgId}`)
      
      if (checkResponse.ok) {
        const existingData = await checkResponse.json()
        
        if (existingData.member) {
          // Update existing membership via API
          const updateResponse = await fetch(`/api/organization-members/${existingData.member.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role_id: roleId, is_active: true })
          })

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json()
            throw new Error(errorData.error || 'Failed to update user role')
          }
          
          toast.success('User role updated successfully!')
        }
      } else {
        // Create new membership via API
        const createResponse = await fetch('/api/organization-members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: uuidv4(),
            organization_id: orgId,
            user_id: userId,
            role_id: roleId,
            is_active: true
          })
        })

        if (!createResponse.ok) {
          const errorData = await createResponse.json()
          throw new Error(errorData.error || 'Failed to assign user to organization')
        }

        toast.success('User assigned to organization successfully!')
      }
      
    } catch (error: any) {
      console.error('Error assigning user:', error)
      toast.error(error.message || 'Failed to assign user to organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="mt-2 text-sm text-gray-600">
          Create new users or manage existing user assignments to organizations.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-ranch-burnt-sienna text-ranch-burnt-sienna'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create New User
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manage'
                ? 'border-ranch-burnt-sienna text-ranch-burnt-sienna'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Existing Users
          </button>
        </nav>
      </div>

      {activeTab === 'create' && (
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Create New User</h3>
          
          <form onSubmit={handleSubmit(createUser)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="form-input"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="form-label">Email *</label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="form-input"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="form-label">Password *</label>
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                />
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="form-label">Organization *</label>
                <select
                  {...register('organizationId', { required: 'Organization is required' })}
                  className="form-select"
                  onChange={(e) => setSelectedOrg(e.target.value)}
                >
                  <option value="">Select Organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                {errors.organizationId && <p className="text-red-600 text-sm mt-1">{errors.organizationId.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Role *</label>
                <select
                  {...register('roleId', { required: 'Role is required' })}
                  className="form-select"
                  disabled={!watchedOrgId}
                >
                  <option value="">Select Role</option>
                  {orgRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {errors.roleId && <p className="text-red-600 text-sm mt-1">{errors.roleId.message}</p>}
                {!watchedOrgId && (
                  <p className="text-gray-500 text-sm mt-1">Select an organization first</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Existing Users</h3>
          
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.email}</div>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <select
                      className="form-select w-48"
                      onChange={(e) => setSelectedOrg(e.target.value)}
                      value={selectedOrg}
                    >
                      <option value="">Select Organization</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                    
                    <select
                      className="form-select w-32"
                      disabled={!selectedOrg}
                    >
                      <option value="">Select Role</option>
                      {orgRoles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => {
                        // Handle assignment
                        const orgSelect = document.querySelector(`select[value="${selectedOrg}"]`) as HTMLSelectElement
                        const roleSelect = orgSelect?.nextElementSibling as HTMLSelectElement
                        if (selectedOrg && roleSelect?.value) {
                          assignUserToOrg(user.id, selectedOrg, roleSelect.value)
                        }
                      }}
                      disabled={!selectedOrg || loading}
                      className="btn btn-primary btn-sm"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={onComplete}
          className="btn btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
} 