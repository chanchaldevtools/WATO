import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Clock, 
  Building2, 
  ShieldCheck, 
  Sliders, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw, 
  Database, 
  AlertTriangle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { AppSettings } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export const SettingsPage: React.FC = () => {
  const { success, error, info } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [businessName, setBusinessName] = useState('Nexus Digital Tech');
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00');
  const [businessHoursEnd, setBusinessHoursEnd] = useState('18:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [replyDelayMs, setReplyDelayMs] = useState(1500);
  const [ignoreGroups, setIgnoreGroups] = useState(true);
  const [ignoreStatus, setIgnoreStatus] = useState(true);
  const [ignoreSelf, setIgnoreSelf] = useState(true);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [maxRepliesWindow, setMaxRepliesWindow] = useState(5);
  const [rateLimitMinutes, setRateLimitMinutes] = useState(15);
  const [defaultFallbackMessage, setDefaultFallbackMessage] = useState(
    'Thank you for contacting us! Our support desk has received your message and an agent will reply shortly.'
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSettings();
      setSettings(data);

      setGlobalEnabled(data.global_auto_reply_enabled === 'true');
      setBusinessName(data.business_name || 'Nexus Digital Tech');
      setBusinessHoursStart(data.business_hours_start || '09:00');
      setBusinessHoursEnd(data.business_hours_end || '18:00');
      setTimezone(data.timezone || 'America/New_York');
      setReplyDelayMs(Number(data.reply_delay_ms) || 1500);
      setIgnoreGroups(data.ignore_group_messages !== 'false');
      setIgnoreStatus(data.ignore_status_updates !== 'false');
      setIgnoreSelf(data.ignore_self_messages !== 'false');
      setPreventDuplicates(data.prevent_duplicate_replies !== 'false');
      setMaxRepliesWindow(Number(data.max_replies_per_contact_window) || 5);
      setRateLimitMinutes(Number(data.rate_limit_window_minutes) || 15);
      setDefaultFallbackMessage(
        data.default_fallback_message ||
        'Thank you for reaching out! Our team is currently reviewing your message and will respond shortly.'
      );
    } catch (err: any) {
      error('Failed to load settings', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<AppSettings> = {
        global_auto_reply_enabled: globalEnabled ? 'true' : 'false',
        business_name: businessName.trim(),
        business_hours_start: businessHoursStart,
        business_hours_end: businessHoursEnd,
        timezone,
        reply_delay_ms: String(replyDelayMs),
        ignore_group_messages: ignoreGroups ? 'true' : 'false',
        ignore_status_updates: ignoreStatus ? 'true' : 'false',
        ignore_self_messages: ignoreSelf ? 'true' : 'false',
        prevent_duplicate_replies: preventDuplicates ? 'true' : 'false',
        max_replies_per_contact_window: String(maxRepliesWindow),
        rate_limit_window_minutes: String(rateLimitMinutes),
        default_fallback_message: defaultFallbackMessage.trim(),
      };

      await api.updateSettings(payload);
      success('Settings Saved', 'Global configuration successfully persisted in SQLite.');
    } catch (err: any) {
      error('Failed to save settings', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center text-zinc-400 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading application settings...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Global Automation Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Configure business hours, anti-spam rate limiting, dispatch delays, and fallback behavior.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving Changes...' : 'Save All Settings'}
        </button>
      </div>

      {/* Global Master Switch */}
      <div className={`p-6 rounded-3xl border transition-all ${
        globalEnabled
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${globalEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Master Auto-Reply Switch
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xl">
              {globalEnabled
                ? 'Automatic responses are ACTIVE. Incoming messages matching your rules will automatically receive configured replies.'
                : 'Automatic responses are PAUSED. Messages will be stored in SQLite and conversations will update, but no automated replies will be sent.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setGlobalEnabled(!globalEnabled)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {globalEnabled ? (
              <ToggleRight className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Profile & Hours */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Business Profile & Hours
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Company / Brand Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hours Start (24h)
                </label>
                <input
                  type="time"
                  value={businessHoursStart}
                  onChange={(e) => setBusinessHoursStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hours End (24h)
                </label>
                <input
                  type="time"
                  value={businessHoursEnd}
                  onChange={(e) => setBusinessHoursEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="America/New_York">Eastern Time (US / New York)</option>
                <option value="America/Chicago">Central Time (US / Chicago)</option>
                <option value="America/Los_Angeles">Pacific Time (US / Los Angeles)</option>
                <option value="Europe/London">London (GMT / BST)</option>
                <option value="Europe/Paris">Central European Time (Paris / Berlin)</option>
                <option value="Asia/Dubai">Gulf Standard Time (Dubai)</option>
                <option value="Asia/Singapore">Singapore / Hong Kong (SGT)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Safety & Anti-Ban Rate Limiting */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Safety & Anti-Spam Rate Limits
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">
                  Reply Delay: {replyDelayMs} ms
                </label>
                <span className="text-[10px] text-zinc-400">Emulates human typing pace</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={replyDelayMs}
                onChange={(e) => setReplyDelayMs(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                <span>0.5s (Fast)</span>
                <span>1.5s (Recommended)</span>
                <span>5.0s (Deliberate)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Max Replies Per Contact
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxRepliesWindow}
                  onChange={(e) => setMaxRepliesWindow(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Within Window (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={rateLimitMinutes}
                  onChange={(e) => setRateLimitMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Prevents endless reply loops with contact auto-responders or bots.
            </p>
          </div>
        </div>
      </div>

      {/* Message Filtering Rules */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-600" />
          Message Ingestion Safeguards
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreGroups}
              onChange={(e) => setIgnoreGroups(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Ignore Group Chats</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Do not reply to group messages or mentions to prevent unwanted automated chat spam.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreStatus}
              onChange={(e) => setIgnoreStatus(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Ignore Status Updates</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Silently drop broadcast status story replies from contacts.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreSelf}
              onChange={(e) => setIgnoreSelf(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Ignore Self Messages</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Messages sent by the connected phone itself will never trigger auto-replies.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <input
              type="checkbox"
              checked={preventDuplicates}
              onChange={(e) => setPreventDuplicates(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Prevent Duplicate Message ID Processing</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Enforce unique WhatsApp message IDs in SQLite to discard re-delivered payloads.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Default Global Fallback Message */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Default System Fallback Response
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Sent when an incoming message doesn't trigger any active keyword rule and no specific fallback rule is configured.
        </p>

        <textarea
          rows={3}
          value={defaultFallbackMessage}
          onChange={(e) => setDefaultFallbackMessage(e.target.value)}
          className="w-full text-xs p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-sans"
        />
      </div>

      {/* Database & Storage Details */}
      <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-800 shadow-xs">
            <Database className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
              Persistent Storage: SQLite WAL Mode
            </h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
              Database path: <code className="font-mono">./data/whatsapp_autoreply.db</code>
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
};
