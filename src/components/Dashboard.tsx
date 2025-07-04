'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin, Organization, User } from '../lib/supabase'
import { BuildingOfficeIcon, UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import OrganizationSetup from './OrganizationSetup'
import TrainerSetup from './TrainerSetup'
import UserManagement from './UserManagement'
import toast from 'react-hot-toast'

type SetupType = 'organization' | 'trainer' | 'user' | null

export default function Dashboard() {
  const [activeSetup, setActiveSetup] = useState<SetupType>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load organizations
      const { data: orgsData, error: orgsError } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (orgsError) throw orgsError
      
      // Load users
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (usersError) throw usersError
      
      setOrganizations(orgsData || [])
      setUsers(usersData.users || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setActiveSetup(null)
    loadData()
    toast.success('Setup completed successfully!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ranch-burnt-sienna"></div>
      </div>
    )
  }

  if (activeSetup) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => setActiveSetup(null)}
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        {activeSetup === 'organization' && (
          <OrganizationSetup onComplete={handleSetupComplete} />
        )}
        {activeSetup === 'trainer' && (
          <TrainerSetup onComplete={handleSetupComplete} />
        )}
        {activeSetup === 'user' && (
          <UserManagement 
            organizations={organizations}
            users={users}
            onComplete={handleSetupComplete}
          />
        )}
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Set up organizations, trainers, and users for the MJBalm application
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Organizations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {organizations.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Trainer Organizations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {organizations.filter(org => org.type === 'trainer').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Options */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="text-center">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-ranch-burnt-sienna" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Organization Setup
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Create and configure organizations with complete setup including roles, members, and initial data.
            </p>
            <button
              onClick={() => setActiveSetup('organization')}
              className="mt-4 btn btn-primary"
            >
              Setup Organization
            </button>
          </div>
        </div>

        <div className="card">
          <div className="text-center">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-ranch-olive" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Trainer Setup
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Set up professional trainer organizations with specialized features and client management.
            </p>
            <button
              onClick={() => setActiveSetup('trainer')}
              className="mt-4 btn btn-primary"
            >
              Setup Trainer
            </button>
          </div>
        </div>

        <div className="card">
          <div className="text-center">
            <UserIcon className="mx-auto h-12 w-12 text-ranch-sage" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              User Management
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Manage existing users, assign roles, and set up user accounts for organizations.
            </p>
            <button
              onClick={() => setActiveSetup('user')}
              className="mt-4 btn btn-primary"
            >
              Manage Users
            </button>
          </div>
        </div>
      </div>

      {/* Recent Organizations */}
      {organizations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Organizations</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {organizations.slice(0, 5).map((org) => (
                <li key={org.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-ranch-burnt-sienna flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {org.name}
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              org.type === 'trainer' ? 'bg-ranch-olive text-white' : 'bg-ranch-burnt-sienna text-white'
                            }`}>
                              {org.type}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {org.member_count} members • {org.subscription_tier}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(org.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
} 