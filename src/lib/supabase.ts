import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for regular operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for service operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
export interface Organization {
  id: string
  name: string
  type: 'stable' | 'organization' | 'trainer' | 'enterprise'
  description: string | null
  owner_id: string
  address: string
  phone: string
  email: string
  website: string
  logo_url: string
  settings: Record<string, any>
  subscription_tier: string
  subscription_expires_at: string | null
  is_active: boolean
  member_count: number
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  organization_id: string
  name: string
  description: string
  permissions: string[]
  can_assign_tasks: boolean
  can_manage_horses: boolean
  can_view_all_horses: boolean
  can_manage_organization: boolean
  color: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role_id: string
  is_active: boolean
  joined_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  user_metadata: Record<string, any>
} 