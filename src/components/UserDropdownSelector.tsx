'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface UserOrganization {
  id: string
  name: string
  type: string
  description?: string
  role_name: string
  role_color?: string
  joined_at: string
}

interface UserWithOrganizations {
  id: string
  email: string
  created_at: string
  organizations: UserOrganization[]
  display_name: string
  has_organizations: boolean
}

interface UserDropdownSelectorProps {
  selectedUserId: string | null
  selectedOrganizationId: string | null
  selectedUserEmail: string | null
  selectedOrgName: string | null
  onUserSelected: (userId: string, organizationId: string | null, userEmail: string, orgName: string | null) => void
}

export default function UserDropdownSelector({
  selectedUserId,
  selectedOrganizationId,
  selectedUserEmail,
  selectedOrgName,
  onUserSelected
}: UserDropdownSelectorProps) {
  const [users, setUsers] = useState<UserWithOrganizations[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users-with-organizations')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      
      setUsers(data.users)
      console.log('Users loaded:', data.users.length)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelection = (user: UserWithOrganizations, organization?: UserOrganization) => {
    const orgId = organization?.id || user.organizations[0]?.id || null
    const orgName = organization?.name || user.organizations[0]?.name || null
    
    onUserSelected(user.id, orgId, user.email, orgName)
    setIsOpen(false)
    
    toast.success(`Selected ${user.email}${orgName ? ` (${orgName})` : ''}`)
  }

  const formatUserDisplay = (user: UserWithOrganizations) => {
    if (user.organizations.length === 0) {
      return `${user.email} (No organization)`
    }
    if (user.organizations.length === 1) {
      return `${user.email} (${user.organizations[0].name})`
    }
    return `${user.email} (${user.organizations.length} organizations)`
  }

  const getCurrentSelection = () => {
    if (!selectedUserId) return 'Select a user...'
    if (selectedUserEmail && selectedOrgName) {
      return `${selectedUserEmail} (${selectedOrgName})`
    }
    return selectedUserEmail || 'Unknown user'
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-300 rounded-md px-3 py-2">
        <div className="flex items-center">
          <div className="animate-pulse text-gray-500">Loading users...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className="flex items-center">
          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="block truncate text-gray-900">
            {getCurrentSelection()}
          </span>
        </span>
        <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {users.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-center">No users available</div>
          ) : (
            <>
              {/* Users without organizations */}
              {users.filter(user => !user.has_organizations).map((user) => (
                <button
                  key={`${user.id}-no-org`}
                  onClick={() => handleUserSelection(user)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">No organization</div>
                      </div>
                    </div>
                    {selectedUserId === user.id && !selectedOrganizationId && (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </button>
              ))}

              {/* Users with organizations */}
              {users.filter(user => user.has_organizations).map((user) => (
                <div key={user.id}>
                  {user.organizations.map((org) => (
                    <button
                      key={`${user.id}-${org.id}`}
                      onClick={() => handleUserSelection(user, org)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex items-center mr-2">
                            <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <BuildingOfficeIcon className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            <div className="text-xs text-gray-500">
                              {org.name} • {org.role_name}
                            </div>
                          </div>
                        </div>
                        {selectedUserId === user.id && selectedOrganizationId === org.id && (
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 