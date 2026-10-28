export type WhatsAppStatus = 
  | 'disconnected'
  | 'initializing'
  | 'qr_ready'
  | 'authenticated'
  | 'connected'
  | 'auth_failure'
  | 'error';

export interface WhatsAppSessionInfo {
  status: WhatsAppStatus;
  phoneNumber?: string;
  pushname?: string;
  platform?: string;
  connectedAt?: string;
  qrDataUrl?: string | null;
  lastError?: string | null;
  mode: 'real' | 'simulator';
}

export type TriggerType = 'all' | 'exact' | 'contains' | 'starts_with' | 'fallback';
export type MatchMode = 'case_insensitive' | 'case_sensitive' | 'regex';

export interface AutoReplyRule {
  id: number;
  name: string;
  trigger_type: TriggerType;
  keywords: string;
  match_mode: MatchMode;
  reply_message: string;
  priority: number;
  is_enabled: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  whatsapp_id: string;
  phone_number: string;
  display_name: string;
  last_message?: string;
  last_message_time?: string;
  last_message_direction?: 'incoming' | 'outgoing';
  last_message_is_auto_reply?: number;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  whatsapp_message_id: string;
  contact_id: number;
  direction: 'incoming' | 'outgoing';
  message_type: string;
  message_body: string;
  is_auto_reply: number;
  processing_status: 'received' | 'processed' | 'replied' | 'sent' | 'failed' | 'ignored' | 'rate_limited' | 'no_match';
  error_message?: string;
  created_at: string;
  contact_phone?: string;
  contact_name?: string;
}

export interface AppSettings {
  global_auto_reply_enabled: string;
  business_name: string;
  business_hours_start: string;
  business_hours_end: string;
  timezone: string;
  reply_delay_ms: string;
  ignore_group_messages: string;
  ignore_status_updates: string;
  ignore_self_messages: string;
  prevent_duplicate_replies: string;
  max_replies_per_contact_window: string;
  rate_limit_window_minutes: string;
  default_fallback_message: string;
  [key: string]: string;
}

export interface DashboardStats {
  connectionStatus: WhatsAppStatus;
  connectedAccount: string | null;
  accountName: string | null;
  mode: 'real' | 'simulator';
  lastConnectedAt: string | null;
  totalIncoming: number;
  autoRepliesSent: number;
  activeRules: number;
  messagesReceivedToday: number;
  messagesRepliedToday: number;
  totalConversations: number;
}

export interface ActivityLog {
  id: number;
  event_type: string;
  description: string;
  metadata?: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}
