'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabaseAdmin, Organization, User } from '../lib/supabase'
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
      const { data: roles, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .eq('organization_id', orgId)
        .order('name')

      if (error) throw error
      setOrgRoles(roles || [])
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load organization roles')
    }
  }

  // Load roles when organization changes
  useState(() => {
    if (watchedOrgId) {
      loadOrgRoles(watchedOrgId)
    }
  })

  const createUser = async (data: UserFormData) => {
    setLoading(true)
    
    try {
      // Create user account
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.name,
          role: 'user'
        }
      })

      if (userError) throw userError

      // Add user to organization
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          id: uuidv4(),
          organization_id: data.organizationId,
          user_id: userData.user.id,
          role_id: data.roleId,
          is_active: true
        })

      if (memberError) throw memberError

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('user_account_profiles')
        .insert({
          id: uuidv4(),
          user_id: userData.user.id,
          account_type: 'organization',
          display_name: data.name,
          bio: `Member of ${organizations.find(org => org.id === data.organizationId)?.name}`,
          is_active: true
        })

      if (profileError) throw profileError

      toast.success('User created successfully!')
      reset()
      
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const assignUserToOrg = async (userId: string, orgId: string, roleId: string) => {
    try {
      setLoading(true)
      
      // Check if user is already in organization
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .single()

      if (existingMember) {
        // Update existing membership
        const { error } = await supabaseAdmin
          .from('organization_members')
          .update({ role_id: roleId, is_active: true })
          .eq('id', existingMember.id)

        if (error) throw error
        toast.success('User role updated successfully!')
      } else {
        // Create new membership
        const { error } = await supabaseAdmin
          .from('organization_members')
          .insert({
            id: uuidv4(),
            organization_id: orgId,
            user_id: userId,
            role_id: roleId,
            is_active: true
          })

        if (error) throw error
        toast.success('User assigned to organization successfully!')
      }
      
    } catch (error) {
      console.error('Error assigning user:', error)
      toast.error('Failed to assign user to organization')
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
                  placeholder="User's full name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="form-label">Email *</label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="form-input"
                  placeholder="user@example.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="form-label">Password *</label>
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  type="password"
                  className="form-input"
                  placeholder="Minimum 8 characters"
                />
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="form-label">Organization *</label>
                <select
                  {...register('organizationId', { required: 'Organization is required' })}
                  className="form-input"
                >
                  <option value="">Select Organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.type})
                    </option>
                  ))}
                </select>
                {errors.organizationId && <p className="text-red-600 text-sm mt-1">{errors.organizationId.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Role *</label>
                <select
                  {...register('roleId', { required: 'Role is required' })}
                  className="form-input"
                  disabled={!orgRoles.length}
                >
                  <option value="">
                    {orgRoles.length ? 'Select Role' : 'Select organization first'}
                  </option>
                  {orgRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.permissions.join(', ')}
                    </option>
                  ))}
                </select>
                {errors.roleId && <p className="text-red-600 text-sm mt-1">{errors.roleId.message}</p>}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Creating User...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium mb-4">Existing Users</h3>
            <p className="text-sm text-gray-600 mb-4">
              Total users: {users.length}
            </p>
            
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {user.user_metadata?.full_name || user.email}
                      </h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <select
                        className="text-sm border rounded px-2 py-1"
                        onChange={(e) => setSelectedOrg(e.target.value)}
                        value={selectedOrg}
                      >
                        <option value="">Select Organization</option>
                        {organizations.map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                      
                      {selectedOrg && (
                        <select
                          className="text-sm border rounded px-2 py-1"
                          onChange={(e) => {
                            if (e.target.value) {
                              assignUserToOrg(user.id, selectedOrg, e.target.value)
                            }
                          }}
                        >
                          <option value="">Assign Role</option>
                          {orgRoles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={onComplete} className="btn btn-primary">
              Complete Management
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 