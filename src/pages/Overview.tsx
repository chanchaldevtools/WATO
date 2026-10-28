import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Bot, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  QrCode, 
  RefreshCw, 
  Send, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  User, 
  Wifi, 
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardStats, WhatsAppSessionInfo, Contact, ActivityLog } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { SimulateMessageModal } from '../components/SimulateMessageModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface OverviewProps {
  stats: DashboardStats | null;
  sessionInfo: WhatsAppSessionInfo | null;
  onRefresh: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ stats, sessionInfo, onRefresh }) => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [conversations, setConversations] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setIsLoading(true);
      const [convs, acts] = await Promise.all([
        api.getConversations(),
        api.getRecentActivity(10),
      ]);
      setConversations(convs.slice(0, 5));
      setActivities(acts);
    } catch (err: any) {
      console.error('Error loading overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsActionPending(true);
    try {
      await api.connectWhatsApp();
      success('WhatsApp Initiated', 'Redirecting to connection terminal...');
      navigate('/connection');
    } catch (err: any) {
      error('Failed to initiate connection', err.message);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDisconnect = async () => {
    setIsActionPending(true);
    setShowDisconnectConfirm(false);
    try {
      await api.disconnectWhatsApp();
      success('Disconnected', 'WhatsApp session has been closed.');
      onRefresh();
    } catch (err: any) {
      error('Failed to disconnect', err.message);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReconnect = async () => {
    setIsActionPending(true);
    try {
      await api.reconnectWhatsApp();
      success('Reconnection Started', 'Generating fresh session token...');
      navigate('/connection');
    } catch (err: any) {
      error('Failed to reconnect', err.message);
    } finally {
      setIsActionPending(false);
    }
  };

  const isConnected = sessionInfo?.status === 'connected';
  const isQrReady = sessionInfo?.status === 'qr_ready';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-zinc-900 text-white shadow-xl shadow-emerald-950/10 relative overflow-hidden border border-emerald-500/20">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none">
          <Bot className="w-full h-full text-white" />
        </div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              Nexus Engine v2.4 Active
            </span>
            <span className="text-xs text-emerald-200/80 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 24/7 Rule Engine
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">WhatsApp Auto Reply Control Center</h1>
          <p className="text-sm text-zinc-300 max-w-xl leading-relaxed">
            Manage your automated customer interactions, keyword triggers, and live WhatsApp conversation threads in real time.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSimulateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Simulate Incoming Message
          </button>
          <Link
            to="/rules"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
          >
            <Bot className="w-4 h-4 text-emerald-300" />
            Manage Rules
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* WhatsApp Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">WhatsApp Session</span>
            {isConnected ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-zinc-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : isQrReady ? 'bg-amber-500' : 'bg-rose-500'}`} />
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 capitalize">
                {sessionInfo?.status === 'connected' ? 'Connected' : sessionInfo?.status === 'qr_ready' ? 'Scan Needed' : 'Offline'}
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
              {sessionInfo?.phoneNumber || 'No phone linked'}
            </p>
          </div>
        </div>

        {/* Total Incoming */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Incoming</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {stats?.totalIncoming ?? 0}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              {stats?.messagesReceivedToday ?? 0} received today
            </p>
          </div>
        </div>

        {/* Auto Replies Sent */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Replies Sent</span>
            <Bot className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.autoRepliesSent ?? 0}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              {stats?.messagesRepliedToday ?? 0} sent today
            </p>
          </div>
        </div>

        {/* Active Rules */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Active Rules</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {stats?.activeRules ?? 0}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Keyword triggers live
            </p>
          </div>
        </div>

        {/* Today Incoming */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Received Today</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {stats?.messagesReceivedToday ?? 0}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Last 24 hours
            </p>
          </div>
        </div>

        {/* Total Contacts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Conversations</span>
            <MessageSquare className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {stats?.totalConversations ?? 0}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Unique contacts
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: WhatsApp Connection Card & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WhatsApp Connection Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">WhatsApp Web Session</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Multi-Device Web Connection</p>
                </div>
              </div>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                  isConnected
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : isQrReady
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : isQrReady ? 'bg-amber-500' : 'bg-zinc-400'}`} />
                {isConnected ? 'Connected' : isQrReady ? 'Scan QR' : 'Disconnected'}
              </span>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500 dark:text-zinc-400">Account Phone:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {sessionInfo?.phoneNumber || 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500 dark:text-zinc-400">Device Name:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {sessionInfo?.pushname || 'AutoReply Node Gateway'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500 dark:text-zinc-400">Operating Mode:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase">
                  {sessionInfo?.mode === 'real' ? 'Real WhatsApp Web Engine' : 'Live Interactive Gateway'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Last Connected:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {sessionInfo?.connectedAt
                    ? new Date(sessionInfo.connectedAt).toLocaleTimeString()
                    : 'Not active'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            {!isConnected ? (
              <div className="flex gap-2">
                <Link
                  to="/connection"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  Connect WhatsApp
                </Link>
                <button
                  onClick={handleConnect}
                  disabled={isActionPending}
                  className="py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="Initialize connection"
                >
                  <RefreshCw className={`w-4 h-4 ${isActionPending ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  disabled={isActionPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  <WifiOff className="w-4 h-4" />
                  Disconnect Session
                </button>
                <button
                  onClick={handleReconnect}
                  disabled={isActionPending}
                  className="py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Reconnect"
                >
                  <RefreshCw className={`w-4 h-4 ${isActionPending ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
            <Link
              to="/connection"
              className="block text-center text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline pt-1 font-medium"
            >
              Open dedicated QR code terminal & settings →
            </Link>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Recent Conversations</h3>
              </div>
              <Link to="/conversations" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                View All
              </Link>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 mt-2">
              {conversations.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No conversations yet. Start by sending a test message!
                </div>
              ) : (
                conversations.map((c) => (
                  <Link
                    key={c.id}
                    to={`/conversations?contact=${c.id}`}
                    className="flex items-center justify-between py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {c.display_name}
                          </p>
                          {c.last_message_is_auto_reply === 1 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                              BOT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {c.last_message_direction === 'outgoing' ? 'You: ' : ''}
                          {c.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <p className="text-[10px] text-zinc-400">
                        {c.last_message_time
                          ? new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </p>
                      {c.unread_count && c.unread_count > 0 ? (
                        <span className="inline-block mt-1 w-4 h-4 text-[10px] rounded-full bg-emerald-500 text-white font-bold leading-4 text-center">
                          {c.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setShowSimulateModal(true)}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-400/80 dark:border-emerald-700/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Simulate Customer Reply to Thread
            </button>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Live Activity Feed</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                Socket Synced
              </span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 mt-2 space-y-1">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No activity events recorded yet.
                </div>
              ) : (
                activities.slice(0, 6).map((act) => (
                  <div key={act.id} className="py-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {act.description}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          {' • '}
                          <span className="uppercase text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
                            {act.event_type.replace(/_/g, ' ')}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link
              to="/history"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Browse full message audit history →
            </Link>
          </div>
        </div>
      </div>

      {/* Disconnect confirmation modal */}
      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        title="Disconnect WhatsApp Session?"
        message="Are you sure you want to disconnect this WhatsApp Web instance? Automatic replies will be paused until you re-link your device or restart the session."
        confirmLabel="Disconnect Now"
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnectConfirm(false)}
      />

      {/* Test Message Modal */}
      <SimulateMessageModal
        isOpen={showSimulateModal}
        onClose={() => setShowSimulateModal(false)}
        onSuccess={() => {
          loadOverviewData();
          onRefresh();
        }}
      />
    </div>
  );
};
