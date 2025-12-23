// Shared API Types for IPC Communication

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Dentist Types
export interface Dentist {
  id: number;
  name: string;
  gender: 'male' | 'female';
  residence: string;
  phone: string;
  clinic_name?: string;
  specialization?: string;
  case_types: string; // JSON array - preferred case types
  payment_terms: 'immediate' | '7_days' | '15_days' | '30_days';
  discount_rate: number; // Permanent discount percentage
  cost: number;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface CreateDentistDto {
  name?: string;
  gender: 'male' | 'female';
  residence?: string;
  phone?: string;
  clinic_name?: string;
  specialization?: string;
  case_types: string[];
  payment_terms?: 'immediate' | '7_days' | '15_days' | '30_days';
  discount_rate?: number;
  cost: number;
  notes?: string;
}

export interface UpdateDentistDto extends Partial<CreateDentistDto> {
  id: number;
}

// Order Types
export interface Order {
  id: number;
  order_number: string;
  dentist_id: number;
  case_type: string;
  tooth_numbers: string; // JSON array
  shade: string;
  main_material: string;
  finish_type: string;
  notes?: string;
  quantity: number;
  date_received: number;
  date_due: number;
  date_delivered?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'ready' | 'delivered' | 'cancelled';
  urgency_level: 'normal' | 'urgent' | 'emergency';
  warranty_period: number; // in days
  revision_count: number;
  try_in_date?: number;
  remake_reason?: string;
  price: number;
  assigned_worker_id?: number;
  created_at: number;
  updated_at: number;
}

export interface CreateOrderDto {
  dentist_id: number;
  case_type?: string;
  tooth_numbers: string[];
  shade?: string;
  main_material?: string;
  finish_type?: string;
  notes?: string;
  quantity: number;
  date_received: number;
  date_due: number;
  urgency_level?: 'normal' | 'urgent' | 'emergency';
  warranty_period?: number;
  try_in_date?: number;
  remake_reason?: string;
  price: number;
  assigned_worker_id?: number;
}

export interface UpdateOrderDto extends Partial<CreateOrderDto> {
  id: number;
  status?: Order['status'];
  date_delivered?: number;
  revision_count?: number;
}

// Payment Types
export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  discount: number;
  date: number;
  payment_method: 'cash' | 'check' | 'transfer' | 'card';
  receipt_number?: string;
  received_by?: string;
  note?: string;
  created_at: number;
}

export interface CreatePaymentDto {
  order_id: number;
  amount: number;
  discount: number;
  date: number;
  payment_method?: 'cash' | 'check' | 'transfer' | 'card';
  receipt_number?: string;
  received_by?: string;
  note?: string;
}

// Material Types
export interface Material {
  id: number;
  code: string;
  name: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  cost_per_unit: number;
  supplier?: string;
  last_purchase_date?: number;
  expiry_date?: number;
  category?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface CreateMaterialDto {
  code?: string;
  name?: string;
  quantity: number;
  min_quantity: number;
  unit?: string;
  cost_per_unit: number;
  supplier?: string;
  last_purchase_date?: number;
  expiry_date?: number;
  category?: string;
  notes?: string;
}

export interface UpdateMaterialDto extends Partial<CreateMaterialDto> {
  id: number;
}

// Expense Types
export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: number;
  payment_method: 'cash' | 'check' | 'transfer' | 'card';
  receipt_number?: string;
  vendor?: string;
  notes?: string;
  created_at: number;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  category: string;
  date: number;
  payment_method?: 'cash' | 'check' | 'transfer' | 'card';
  receipt_number?: string;
  vendor?: string;
  notes?: string;
}

// Worker Types
export interface Worker {
  id: number;
  name: string;
  phone: string;
  salary: number;
  hire_date: number;
  status: 'active' | 'inactive';
  specialization?: string;
  performance_rating: number; // 0-5
  national_id?: string;
  address?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface CreateWorkerDto {
  name?: string;
  phone?: string;
  salary: number;
  hire_date: number;
  specialization?: string;
  performance_rating?: number;
  national_id?: string;
  address?: string;
  notes?: string;
}

export interface UpdateWorkerDto extends Partial<CreateWorkerDto> {
  id: number;
  status?: Worker['status'];
}

// Quality Control Types
export interface QualityControl {
  id: number;
  order_id: number;
  inspector_name: string;
  inspection_date: number;
  quality_rating: number; // 0-5
  passed: boolean;
  defects_found?: string; // JSON array
  notes?: string;
  created_at: number;
}

export interface CreateQualityControlDto {
  order_id: number;
  inspector_name: string;
  inspection_date: number;
  quality_rating: number;
  passed: boolean;
  defects_found?: string[];
  notes?: string;
}

// Filters and Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface OrderFilters {
  status?: Order['status'];
  dentist_id?: number;
  date_from?: number;
  date_to?: number;
  search?: string;
}

export interface PaymentFilters {
  order_id?: number;
  date_from?: number;
  date_to?: number;
}

export interface ExpenseFilters {
  category?: string;
  date_from?: number;
  date_to?: number;
}