'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ExtendedUserProfile } from '../lib/types'
import { Search, User, Building, ArrowLeft, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserSelectorProps {
  onBack: () => void
  onUserSelected: (userId: string, organizationId: string | null) => void
  selectedUserId: string | null
  selectedOrganizationId: string | null
}

export default function UserSelector({
  onBack,
  onUserSelected,
  selectedUserId,
  selectedOrganizationId
}: UserSelectorProps) {
  const [users, setUsers] = useState<ExtendedUserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUserProfile[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    // Filter users based on search term
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organizations?.some(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const loadUsers = async () => {
    try {
      setLoading(true)

      // Get users with their organization memberships
      const { data: usersData, error: usersError } = await supabase
        .from('user_account_profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          avatar_url,
          account_type,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // For each user, get their organization memberships
      const usersWithOrgs = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: memberships, error: membershipError } = await supabase
            .from('organization_members')
            .select(`
              is_active,
              organization_id,
              organizations(
                id,
                name,
                type
              ),
              roles(
                id,
                name
              )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)

          if (membershipError) {
            console.error('Error loading memberships for user:', user.id, membershipError)
            return {
              ...user,
              organizations: []
            }
          }

          const organizations = (memberships || []).map(membership => ({
            id: membership.organization_id,
            name: (membership.organizations as any)?.name || 'Unknown Organization',
            type: (membership.organizations as any)?.type || 'Unknown',
            role_name: (membership.roles as any)?.name || 'Unknown Role',
            is_active: membership.is_active
          }))

          return {
            ...user,
            organizations
          }
        })
      )

      setUsers(usersWithOrgs)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = (user: ExtendedUserProfile, organizationId?: string) => {
    const orgId = organizationId || user.organizations?.[0]?.id || null
    onUserSelected(user.id, orgId)
    toast.success(`Selected ${user.full_name || user.email}${orgId ? ' for organization' : ''}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Select User for Business Setup</h1>
            <p className="text-gray-600 mt-2">
              Choose an existing user and organization to set up their business operations
            </p>
          </div>
        </div>
      </div>

      {/* Current Selection Display */}
      {selectedUserId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Current Selection</h3>
          <div className="text-sm text-blue-700">
            <p>User ID: {selectedUserId}</p>
            {selectedOrganizationId && <p>Organization ID: {selectedOrganizationId}</p>}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search users by name, email, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">
            {users.filter(u => u.organizations && u.organizations.length > 0).length}
          </div>
          <div className="text-sm text-gray-600">Users with Organizations</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">{filteredUsers.length}</div>
          <div className="text-sm text-gray-600">Filtered Results</div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available Users</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No users found matching your search.' : 'No users available.'}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-100 rounded-full p-3">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-lg font-medium text-gray-900">
                          {user.full_name || 'No Name'}
                        </h4>
                        {selectedUserId === user.id && (
                          <Check className="ml-2 h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-gray-600">{user.phone}</p>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.account_type === 'organization' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.account_type}
                        </span>
                        <span className="ml-4">
                          Joined {formatDate(user.created_at)}
                        </span>
                      </div>

                      {/* Organizations */}
                      {user.organizations && user.organizations.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Organizations:</h5>
                          <div className="space-y-2">
                            {user.organizations.map((org) => (
                              <div key={org.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center space-x-3">
                                  <Building className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{org.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {org.type} • {org.role_name}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleSelectUser(user, org.id)}
                                  className={`px-3 py-1 text-xs font-medium rounded ${
                                    selectedUserId === user.id && selectedOrganizationId === org.id
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  } transition-colors`}
                                >
                                  {selectedUserId === user.id && selectedOrganizationId === org.id
                                    ? 'Selected'
                                    : 'Select'
                                  }
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Select User Button (for users without organizations) */}
                  {(!user.organizations || user.organizations.length === 0) && (
                    <button
                      onClick={() => handleSelectUser(user)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        selectedUserId === user.id
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {selectedUserId === user.id ? 'Selected' : 'Select User'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </button>
        
        {selectedUserId && (
          <div className="text-sm text-gray-600 flex items-center">
            User selected! You can now proceed to other setup components.
          </div>
        )}
      </div>
    </div>
  )
} 