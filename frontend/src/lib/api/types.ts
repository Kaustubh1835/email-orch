export interface EmailGenerateRequest {
  sender: string;
  receiver: string;
  subject: string;
  salutation?: string;
  user_intent: string;
}

export interface EmailGenerateResponse {
  email_id: string;
  formatted_email: string;
  intent: string;
  tone: string;
  status: string;
}

export interface EmailSendRequest {
  email_id: string;
}

export interface EmailSendResponse {
  success: boolean;
  gmail_message_id: string | null;
  sent_at: string | null;
}

export interface EmailSummary {
  id: string;
  sender: string;
  receiver: string;
  subject: string;
  intent: string | null;
  tone: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
}

export interface EmailDetail extends EmailSummary {
  body: string;
  gmail_message_id: string | null;
  error_message: string | null;
}

export interface EmailListResponse {
  emails: EmailSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface FollowupScheduleRequest {
  email_id: string;
  scheduled_at: string;
}

export interface FollowupResponse {
  id: string;
  email_id: string;
  scheduled_at: string;
  status: string;
  retry_count: number;
  created_at: string;
  executed_at: string | null;
}

export interface FollowupListResponse {
  followups: FollowupResponse[];
  total: number;
}
