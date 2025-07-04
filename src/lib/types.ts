// Business Entity Types for Admin Setup

// Horse Management Types
export type HorseGender = 'stallion' | 'mare' | 'gelding' | 'filly' | 'colt';
export type HorseStatus = 'active' | 'retired' | 'injured' | 'breeding' | 'training' | 'racing';

export interface Horse {
  id?: string;
  organization_id?: string;
  user_id?: string;
  name: string;
  registered_name?: string;
  nickname?: string;
  breed: string;
  gender: HorseGender;
  birth_date?: string;
  color?: string;
  markings?: string;
  registration_number?: string;
  microchip_number?: string;
  passport_number?: string;
  height_hands?: number;
  weight_kg?: number;
  status: HorseStatus;
  location?: string;
  owner_name?: string;
  owner_contact?: string;
  insurance_details?: Record<string, any>;
  medical_notes?: string;
  dietary_restrictions?: string[];
  photos?: string[];
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Consumable Management Types
export type ConsumableType = 'medicine' | 'feed' | 'supplement' | 'equipment' | 'supply';

export interface ConsumableSpecifications {
  [key: string]: any;
  // Medicine-specific
  activeIngredient?: string;
  concentration?: string;
  administrationRoutes?: string[];
  dosageGuidelines?: Record<string, string>;
  contraindications?: string[];
  // Feed-specific
  nutritionalInfo?: {
    protein?: number;
    fat?: number;
    fiber?: number;
    calories_per_kg?: number;
    minerals?: Record<string, number>;
  };
  ingredients?: string[];
  feedingGuidelines?: Record<string, string>;
  // Equipment-specific
  maintenanceSchedule?: string;
  warrantyInfo?: string;
  specifications?: Record<string, string>;
}

export interface Consumable {
  id?: string;
  organization_id?: string;
  user_id?: string;
  name: string;
  type: ConsumableType;
  category: string;
  brand?: string;
  specifications: ConsumableSpecifications;
  default_quantity?: number;
  default_unit_type?: string;
  cost_per_unit?: number;
  supplier?: string;
  current_stock: number;
  minimum_stock: number;
  reorder_point: number;
  is_active: boolean;
  is_default: boolean;
  requires_prescription: boolean;
  withdrawal_period_days?: number;
  barcode?: string;
  sku?: string;
  storage_requirements?: string;
  expiry_date?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// Task and Service Types
export type TaskAssignmentType = 'global' | 'individual' | 'role_based';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';

export interface OrganizationTask {
  id?: string;
  organization_id?: string;
  user_id?: string;
  title: string;
  description?: string;
  assignment_type: TaskAssignmentType;
  assigned_to_user_id?: string;
  assigned_to_role_id?: string;
  created_by?: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags?: string[];
  horse_ids?: string[];
  progress_percentage: number;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  completed_at?: string;
  completed_by?: string;
  parent_task_id?: string;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  metadata?: Record<string, any>;
  consumable_id?: string;
  quantity?: number;
  created_at?: string;
  updated_at?: string;
}

// Service Pricing and Transaction Types
export type TransactionCategory = 'training' | 'boarding' | 'veterinary' | 'grooming' | 'farrier' | 'feed' | 'medicine' | 'transportation' | 'other';
export type TransactionUnitType = 'hour' | 'day' | 'session' | 'month' | 'event' | 'task' | 'head' | 'percentage' | 'fixed';
export type BillingFrequency = 'daily' | 'session' | 'weekly' | 'monthly' | 'yearly' | 'per_event' | 'percentage' | 'per_task';

export interface TransactionType {
  id?: string;
  organization_id: string;
  name: string;
  description?: string;
  default_rate: number;
  unit_type: TransactionUnitType;
  billing_frequency: BillingFrequency;
  category: TransactionCategory;
  price_range_min?: number;
  price_range_max?: number;
  is_system_default: boolean;
  market_reference?: string;
  is_active: boolean;
  is_recurring: boolean;
  billing_cycle_days?: number;
  auto_billing_enabled: boolean;
  service_tier: string;
  requires_approval: boolean;
  max_tasks_per_cycle?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// Extended User Profile for Admin Management
export interface ExtendedUserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  account_type: 'personal' | 'organization';
  created_at: string;
  updated_at: string;
  // Organization memberships
  organizations?: Array<{
    id: string;
    name: string;
    type: string;
    role_name: string;
    is_active: boolean;
  }>;
}

// Admin Setup Request Types
export interface HorseSetupRequest {
  user_id?: string;
  organization_id?: string;
  horses: Omit<Horse, 'id' | 'created_at' | 'updated_at' | 'created_by'>[];
}

export interface ConsumableSetupRequest {
  user_id?: string;
  organization_id?: string;
  consumables: Omit<Consumable, 'id' | 'created_at' | 'updated_at' | 'created_by'>[];
}

export interface ServicePricingSetupRequest {
  organization_id: string;
  transaction_types: Omit<TransactionType, 'id' | 'created_at' | 'updated_at' | 'created_by'>[];
}

export interface TaskTypeSetupRequest {
  user_id?: string;
  organization_id?: string;
  task_templates: Omit<OrganizationTask, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'status' | 'progress_percentage' | 'due_date'>[];
}

// Business Setup Response Types
export interface BusinessSetupResponse {
  success: boolean;
  message: string;
  data?: {
    horses_created?: number;
    consumables_created?: number;
    transaction_types_created?: number;
    task_templates_created?: number;
  };
  errors?: string[];
}

// Default Templates for Business Setup
export interface DefaultConsumableTemplate {
  name: string;
  type: ConsumableType;
  category: string;
  brand?: string;
  specifications: ConsumableSpecifications;
  default_quantity: number;
  default_unit_type: string;
  current_stock: number;
  minimum_stock: number;
  reorder_point: number;
  requires_prescription: boolean;
  storage_requirements?: string;
}

export interface DefaultTransactionTypeTemplate {
  name: string;
  description: string;
  category: TransactionCategory;
  unit_type: TransactionUnitType;
  billing_frequency: BillingFrequency;
  default_rate: number;
  service_tier: string;
  is_recurring: boolean;
  requires_approval: boolean;
}

// Dashboard Statistics for Business Setup
export interface BusinessSetupStats {
  total_users: number;
  users_with_horses: number;
  users_with_consumables: number;
  organizations_with_pricing: number;
  total_horses_managed: number;
  total_consumables_managed: number;
  total_service_types: number;
} 