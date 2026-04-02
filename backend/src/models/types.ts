// ============================================
// AgriCore — Shared Type Definitions
// ============================================

export type UserRole = 'farmer' | 'government' | 'admin' | 'supervisor' | 'field_agent' | 'office_staff';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  department_id?: string;
  verification_status?: VerificationStatus;
}

export interface FarmerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  province: string;
  district: string;
  farm_size_hectares: number;
  address_line: string;
  town: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  profile_image_url: string | null;
  id_document_url: string | null;
  farm_images: string[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LivestockRecord {
  id: string;
  farmer_id: string;
  animal_type: string;
  total: number;
  born: number;
  twins: number;
  triplets: number;
  sold: number;
  consumed: number;
  young: number;
  last_dosed: string | null;
  diseases: string[];
  treatment: string;
  recorded_at: string;
}

export interface CropRecord {
  id: string;
  farmer_id: string;
  crop_name: string;
  hectares_planted: number;
  yield_tonnes: number;
  season: string;
  irrigation_type: string;
  recorded_at: string;
}

export interface SoilData {
  id: string;
  farmer_id: string;
  ph_level: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_matter: number;
  soil_type: string;
  recorded_at: string;
}

export interface WeatherRecord {
  id: string;
  farmer_id: string;
  date: string;
  temperature_min: number;
  temperature_max: number;
  rainfall: number;
  humidity_min: number;
  humidity_max: number;
  wind_speed: number;
  description: string;
  created_at: string;
}

export interface SupportPlan {
  id: string;
  farmer_id: string;
  created_by: string;
  created_by_role: UserRole;
  type: string;
  objectives: string;
  budget: number;
  timeline: string;
  status: 'Draft' | 'Pending' | 'Active' | 'Completed';
  approval_status: 'Pending' | 'Approved' | 'Rejected' | null;
  approved_date: string | null;
  created_at: string;
  updated_at: string;
}

// Request/response types
export interface DeletionRequest {
  id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  province?: string;
  district?: string;
  farmSize?: number | string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================
//  DEPARTMENT & WORKSPACE TYPES
// =============================================

export interface Department {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

// =============================================
//  TASK / JOB ASSIGNMENT TYPES
// =============================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_by: string;
  department_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
//  PERSONAL TODO TYPES
// =============================================

export interface TodoItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
//  NOTES TYPES
// =============================================

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_shared: boolean;
  shared_with: string[];
  created_at: string;
  updated_at: string;
}

// =============================================
//  FIELD VISIT TYPES
// =============================================

export interface FieldVisit {
  id: string;
  agent_id: string;
  farmer_id: string | null;
  visit_date: string;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  notes: string;
  images: string[];
  shared_with: string[];
  created_at: string;
  updated_at: string;
}

// =============================================
//  CHAT / MESSAGING TYPES
// =============================================

export interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  department_id: string | null;
  created_by: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface ChatMember {
  room_id: string;
  user_id: string;
  joined_at: string;
}

// =============================================
//  NOTIFICATION TYPES
// =============================================

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'visit_shared'
  | 'message_received'
  | 'note_shared'
  | 'system'
  | 'verification_request'
  | 'verification_approved'
  | 'verification_rejected'
  | 'data_pending'
  | 'data_approved'
  | 'data_rejected'
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_resolved'
  | 'deletion_approved'
  | 'deletion_rejected';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

// =============================================
//  ACTIVITY LOG / AUDIT TRAIL
// =============================================

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// =============================================
//  VERIFICATION SYSTEM
// =============================================

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export type VerificationDocumentType =
  | 'id_document'
  | 'farm_registration'
  | 'farm_details'
  | 'proof_of_employment'
  | 'employee_verification';

export interface VerificationDocument {
  id: string;
  user_id: string;
  document_type: VerificationDocumentType;
  file_url: string;
  file_path: string;
  uploaded_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  review_notes: string | null;
}

// =============================================
//  DATA APPROVAL SYSTEM
// =============================================

export type DataStatus = 'pending' | 'approved' | 'rejected';

export interface DataChangeRequest {
  id: string;
  user_id: string;
  resource_type: 'livestock' | 'crops' | 'soil_data' | 'support_plans' | 'farmer_profile';
  resource_id: string | null;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  status: DataStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

// =============================================
//  TICKETING / SUPPORT SYSTEM
// =============================================

export type TicketType = 'bug' | 'feature_request' | 'general_inquiry';
export type TicketUrgency = 'low' | 'medium' | 'high';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface Ticket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: TicketType;
  urgency: TicketUrgency;
  status: TicketStatus;
  attachment_url: string | null;
  attachment_path: string | null;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
//  LOGIN ACTIVITY TRACKING
// =============================================

export interface LoginActivity {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  login_at: string;
}

// =============================================
//  PROFILE EDIT PERMISSIONS
// =============================================

export interface ProfilePermission {
  id: string;
  user_id: string;
  can_edit_profile: boolean;
  granted_by: string | null;
  granted_at: string;
  notes: string | null;
}

// =============================================
//  ADMIN PROFILE EDIT AUDIT
// =============================================

export interface AdminProfileEdit {
  id: string;
  admin_id: string;
  target_user_id: string;
  fields_changed: Record<string, unknown>;
  previous_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  reason: string | null;
  edited_at: string;
}
