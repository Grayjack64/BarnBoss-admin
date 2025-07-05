import { createClient } from '@supabase/supabase-js'
import { User } from '@supabase/auth-js'

// Environment variable validation with detailed error messages
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing Supabase URL. Checked: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL')
  throw new Error('Supabase URL is required but not set. Please set NEXT_PUBLIC_SUPABASE_URL.')
}

if (!supabaseAnonKey) {
  console.error('Missing Supabase anon key. Checked: NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY')
  throw new Error('Supabase anon key is required but not set. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY.')
}

if (!supabaseServiceRoleKey && typeof window === 'undefined') {
  // Only check for service role key on server side
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable (server-side)')
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations')
}

// Debug logging for environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment variables loaded:')
  console.log('- Supabase URL:', supabaseUrl?.substring(0, 30) + '...')
  console.log('- Supabase Anon Key:', supabaseAnonKey?.substring(0, 20) + '...')
  console.log('- Service Role Key available:', !!supabaseServiceRoleKey)
  console.log('- Source URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : 'SUPABASE_URL')
  console.log('- Source Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : 'SUPABASE_ANON_KEY')
}

// Client for regular operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// Admin client for service operations (server-side only)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Validation function to check if clients are properly initialized
export const validateSupabaseClients = () => {
  if (!supabase) {
    throw new Error('Supabase client failed to initialize')
  }
  
  if (typeof window === 'undefined' && !supabaseAdmin) {
    throw new Error('Supabase admin client failed to initialize (server-side)')
  }
  
  return true
}

// Helper function to get admin client with proper error handling
export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    throw new Error(
      'Supabase admin client is not available. Please ensure SUPABASE_SERVICE_ROLE_KEY is set in environment variables.'
    )
  }
  return supabaseAdmin
}

// Re-export User type from Supabase Auth
export type { User } from '@supabase/auth-js'

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

export interface UserProfile {
  id: string
  email: string
  created_at: string
  updated_at: string
  user_metadata: Record<string, any>
} 