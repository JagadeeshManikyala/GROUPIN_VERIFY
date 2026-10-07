export type JobStatus = 
  | 'PENDING'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface SingleCheckResponse {
  mobile_number: string;
  account_exists: boolean;
  user_id?: string | null;
  name?: string | null;
  status: string;
  error?: string | null;
  // Extended profile fields
  email?: string | null;
  dob?: string | null;
  alternate_phone?: string | null;
  about?: string | null;
  location?: string | null;
  registered_on?: string | null;
  user_type?: string | null;
  last_active?: string | null;
  verified?: boolean | null;
}

export interface UploadResponse {
  job_id: string;
  filename: string;
  total_numbers: number;
  valid_numbers: number;
  invalid_numbers: number;
  duplicate_numbers: number;
  sample_valid: string[];
  sample_invalid: { row: number; value: string; reason: string }[];
}

export interface JobStatusResponse {
  job_id: string;
  filename: string;
  status: JobStatus;
  total_numbers: number;
  valid_numbers: number;
  invalid_numbers: number;
  duplicate_numbers: number;
  processed_numbers: number;
  accounts_found: number;
  not_registered: number;
  failed: number;
  progress_percentage: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  elapsed_time_seconds?: number | null;
  estimated_remaining_seconds?: number | null;
  has_download: boolean;
}

export interface AccountResultItem {
  id: number;
  job_id: string;
  mobile_number: string;
  groupin_account_exists: boolean;
  groupin_user_id?: string | null;
  name?: string | null;
  status: string;
  error?: string | null;
  checked_at: string;
}

export interface ResultsPageResponse {
  items: AccountResultItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  accounts_found: number;
  not_registered: number;
  failed: number;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

