'use client'

import React, { useState, useEffect } from 'react'
import { Organization, User } from '../lib/supabase'
import { BuildingOfficeIcon, UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import { supabase, validateSupabaseClients } from '../lib/supabase'
import OrganizationSetup from './OrganizationSetup'
import TrainerSetup from './TrainerSetup'
import UserManagement from './UserManagement'
import toast from 'react-hot-toast'
import { Building2, Users, UserPlus, BarChart3, Shield, MapPin, Package, DollarSign, ClipboardList, UserSearch } from 'lucide-react'
import UserSelector from './UserSelector'
import HorseManagement from './HorseManagement'
import ConsumableManagement from './ConsumableManagement'
import ServicePricing from './ServicePricing'

type SetupType = 'organization' | 'trainer' | 'user' | null

type ActiveComponent = 
  | 'dashboard' 
  | 'organization-setup' 
  | 'trainer-setup' 
  | 'user-management'
  | 'user-selector'
  | 'horse-management'
  | 'consumable-management'
  | 'service-pricing'

export default function Dashboard() {
  const [activeComponent, setActiveComponent] = useState<ActiveComponent>('dashboard')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)

  useEffect(() => {
    // Validate Supabase clients on component mount
    try {
      validateSupabaseClients()
      console.log('Supabase clients validated successfully')
    } catch (error) {
      console.error('Supabase validation failed:', error)
      toast.error('Supabase configuration error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }

    // Debug environment variables in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Environment check:')
      console.log('- NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      console.log('- NODE_ENV:', process.env.NODE_ENV)
    }

    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load organizations
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members(count)
        `)
        .order('created_at', { ascending: false })

      if (orgError) throw orgError

      // Transform the data to include member count
      const organizationsWithCount = orgs?.map(org => ({
        ...org,
        member_count: org.organization_members?.[0]?.count || 0
      })) || []

      setOrganizations(organizationsWithCount)

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('user_account_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError
      setUsers(usersData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setActiveComponent('dashboard')
    loadDashboardData()
    toast.success('Setup completed successfully!')
  }

  const renderStatsGrid = () => (
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
  )

  const renderMainCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Organization Setup */}
      <div 
        onClick={() => setActiveComponent('organization-setup')}
        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Organization Setup</h3>
            <p className="text-sm text-gray-600 mt-1">Create and configure organizations</p>
          </div>
          <Building2 className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      {/* Trainer Setup */}
      <div 
        onClick={() => setActiveComponent('trainer-setup')}
        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Trainer Setup</h3>
            <p className="text-sm text-gray-600 mt-1">Create trainer organizations</p>
          </div>
          <Shield className="h-8 w-8 text-purple-500" />
        </div>
      </div>

      {/* User Management */}
      <div 
        onClick={() => setActiveComponent('user-management')}
        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">Create and assign users to organizations</p>
          </div>
          <Users className="h-8 w-8 text-green-500" />
        </div>
      </div>
    </div>
  )

  const renderBusinessSetupCards = () => (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <ClipboardList className="h-6 w-6 mr-2 text-indigo-600" />
        Business Setup Management
      </h2>
      <p className="text-gray-600 mb-6">
        Set up complete business operations for existing users including horses, consumables, and service pricing.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* User Selection */}
        <div 
          onClick={() => setActiveComponent('user-selector')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Select User</h3>
              <p className="text-sm text-gray-600 mt-1">Choose existing user for setup</p>
            </div>
            <UserSearch className="h-8 w-8 text-indigo-500" />
          </div>
        </div>

        {/* Horse Management */}
        <div 
          onClick={() => setActiveComponent('horse-management')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-amber-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Horse Management</h3>
              <p className="text-sm text-gray-600 mt-1">Add horses with full details</p>
            </div>
            <MapPin className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        {/* Consumable Management */}
        <div 
          onClick={() => setActiveComponent('consumable-management')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-emerald-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Consumables</h3>
              <p className="text-sm text-gray-600 mt-1">Feed, medicine, supplements</p>
            </div>
            <Package className="h-8 w-8 text-emerald-500" />
          </div>
        </div>

        {/* Service Pricing */}
        <div 
          onClick={() => setActiveComponent('service-pricing')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Service Pricing</h3>
              <p className="text-sm text-gray-600 mt-1">Setup billing rates & services</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeComponent) {
      case 'organization-setup':
        return <OrganizationSetup onComplete={handleSetupComplete} />
      case 'trainer-setup':
        return <TrainerSetup onComplete={handleSetupComplete} />
      case 'user-management':
        return <UserManagement 
          organizations={organizations}
          users={users}
          onComplete={handleSetupComplete}
        />
      case 'user-selector':
        return (
          <UserSelector
            onBack={() => setActiveComponent('dashboard')}
            onUserSelected={(userId, organizationId) => {
              setSelectedUserId(userId)
              setSelectedOrganizationId(organizationId)
            }}
            selectedUserId={selectedUserId}
            selectedOrganizationId={selectedOrganizationId}
          />
        )
      case 'horse-management':
        return (
          <HorseManagement
            onBack={() => setActiveComponent('dashboard')}
            selectedUserId={selectedUserId}
            selectedOrganizationId={selectedOrganizationId}
          />
        )
      case 'consumable-management':
        return (
          <ConsumableManagement
            onBack={() => setActiveComponent('dashboard')}
            selectedUserId={selectedUserId}
            selectedOrganizationId={selectedOrganizationId}
          />
        )
      case 'service-pricing':
        return (
          <ServicePricing
            onBack={() => setActiveComponent('dashboard')}
            selectedUserId={selectedUserId}
            selectedOrganizationId={selectedOrganizationId}
          />
        )
      default:
        return (
          <div className="space-y-8">
            {/* Dashboard Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg">
              <div className="px-6 py-8">
                <h1 className="text-3xl font-bold text-white">Admin Setup Dashboard</h1>
                <p className="text-blue-100 mt-2">
                  Manage organizations, users, and complete business setup for the MJBalm platform
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            {renderStatsGrid()}

            {/* Organization & User Setup */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-6 w-6 mr-2 text-blue-600" />
                Organization & User Setup
              </h2>
              {renderMainCards()}
            </div>

            {/* Business Setup Management */}
            {renderBusinessSetupCards()}

            {/* Selected User/Organization Status */}
            {(selectedUserId || selectedOrganizationId) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Current Selection</h3>
                <div className="text-sm text-blue-700">
                  {selectedUserId && <p>Selected User ID: {selectedUserId}</p>}
                  {selectedOrganizationId && <p>Selected Organization ID: {selectedOrganizationId}</p>}
                </div>
                <button
                  onClick={() => {
                    setSelectedUserId(null)
                    setSelectedOrganizationId(null)
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ranch-burnt-sienna"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  )
} 