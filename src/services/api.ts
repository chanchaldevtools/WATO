import { 
  WhatsAppSessionInfo, 
  AutoReplyRule, 
  Contact, 
  Message, 
  AppSettings, 
  DashboardStats, 
  ActivityLog, 
  User 
} from '../types';

const ADMIN_TOKEN_KEY = 'autoreply_token';
// Default token provided for streamlined out-of-the-box administrator access
const DEFAULT_TOKEN = 'autoreply_admin_secret_token_session_2026';

export const getAuthToken = (): string => {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || DEFAULT_TOKEN;
};

export const setAuthToken = (token: string) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${getAuthToken()}`);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<{ success: boolean; token: string; user: User }> => {
    const res = await request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  getMe: async (): Promise<{ user: User }> => {
    return request<{ user: User }>('/auth/me');
  },

  // WhatsApp Session
  getWhatsAppStatus: async (): Promise<WhatsAppSessionInfo> => {
    return request<WhatsAppSessionInfo>('/whatsapp/status');
  },

  connectWhatsApp: async (): Promise<{ success: boolean } & WhatsAppSessionInfo> => {
    return request<{ success: boolean } & WhatsAppSessionInfo>('/whatsapp/connect', { method: 'POST' });
  },

  disconnectWhatsApp: async (): Promise<{ success: boolean } & WhatsAppSessionInfo> => {
    return request<{ success: boolean } & WhatsAppSessionInfo>('/whatsapp/disconnect', { method: 'POST' });
  },

  reconnectWhatsApp: async (): Promise<{ success: boolean } & WhatsAppSessionInfo> => {
    return request<{ success: boolean } & WhatsAppSessionInfo>('/whatsapp/reconnect', { method: 'POST' });
  },

  simulateScan: async (phoneNumber?: string, name?: string): Promise<{ success: boolean } & WhatsAppSessionInfo> => {
    return request<{ success: boolean } & WhatsAppSessionInfo>('/whatsapp/simulate-scan', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, name }),
    });
  },

  simulateIncomingMessage: async (fromPhone: string, text: string, contactName?: string) => {
    return request<{ success: boolean; simulatedMessage: any }>('/whatsapp/simulate-incoming', {
      method: 'POST',
      body: JSON.stringify({ fromPhone, text, contactName }),
    });
  },

  // Auto Reply Rules
  getRules: async (): Promise<AutoReplyRule[]> => {
    return request<AutoReplyRule[]>('/auto-reply/rules');
  },

  createRule: async (rule: Partial<AutoReplyRule>): Promise<AutoReplyRule> => {
    return request<AutoReplyRule>('/auto-reply/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  },

  updateRule: async (id: number, rule: Partial<AutoReplyRule>): Promise<AutoReplyRule> => {
    return request<AutoReplyRule>(`/auto-reply/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  },

  deleteRule: async (id: number): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/auto-reply/rules/${id}`, {
      method: 'DELETE',
    });
  },

  toggleRule: async (id: number): Promise<AutoReplyRule> => {
    return request<AutoReplyRule>(`/auto-reply/rules/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  testRuleMatch: async (message: string): Promise<{
    matched: boolean;
    ruleId?: number;
    ruleName?: string;
    triggerType?: string;
    replyMessage?: string;
    reason?: string;
  }> => {
    return request('/auto-reply/test-match', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    return request<AppSettings>('/settings');
  },

  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    return request<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Conversations
  getConversations: async (search?: string): Promise<Contact[]> => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Contact[]>(`/conversations${q}`);
  },

  getConversationMessages: async (contactId: number, limit = 50, offset = 0): Promise<{ contact: Contact; messages: Message[]; totalCount: number }> => {
    return request(`/conversations/${contactId}/messages?limit=${limit}&offset=${offset}`);
  },

  sendManualMessage: async (contactId: number, body: string): Promise<{ success: boolean; message: Message }> => {
    return request(`/conversations/${contactId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },

  // Message History
  getMessageHistory: async (params: {
    search?: string;
    direction?: string;
    isAutoReply?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ records: Message[]; pagination: { page: number; limit: number; totalCount: number; totalPages: number } }> => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.direction) query.set('direction', params.direction);
    if (params.isAutoReply !== undefined && params.isAutoReply !== '') query.set('isAutoReply', params.isAutoReply);
    if (params.status) query.set('status', params.status);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    return request(`/messages?${query.toString()}`);
  },

  getExportCsvUrl: (params: Record<string, string>): string => {
    const query = new URLSearchParams(params);
    return `/api/messages/export?${query.toString()}`;
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    return request<DashboardStats>('/dashboard/stats');
  },

  getRecentActivity: async (limit = 20): Promise<ActivityLog[]> => {
    return request<ActivityLog[]>(`/dashboard/activity?limit=${limit}`);
  },
};
