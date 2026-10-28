import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  RefreshCw, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  ExternalLink, 
  Sparkles, 
  HelpCircle,
  Clock,
  Terminal,
  Zap,
  Lock
} from 'lucide-react';
import { WhatsAppSessionInfo } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface WhatsAppConnectionProps {
  sessionInfo: WhatsAppSessionInfo | null;
  onRefresh: () => void;
}

export const WhatsAppConnection: React.FC<WhatsAppConnectionProps> = ({ sessionInfo, onRefresh }) => {
  const { success, error, info } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [simulatedPhone, setSimulatedPhone] = useState('+1 (415) 555-0192');
  const [simulatedName, setSimulatedName] = useState('Nexus Digital WhatsApp Business');

  const status = sessionInfo?.status || 'disconnected';
  const isConnected = status === 'connected';
  const isQrReady = status === 'qr_ready';
  const isInitializing = status === 'initializing';

  const handleConnect = async () => {
    setIsProcessing(true);
    try {
      await api.connectWhatsApp();
      info('Client Initializing', 'Generating high-resolution WhatsApp Web QR code...');
      onRefresh();
    } catch (err: any) {
      error('Failed to initialize client', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsProcessing(true);
    setShowDisconnectConfirm(false);
    try {
      await api.disconnectWhatsApp();
      success('WhatsApp Session Ended', 'Client safely logged out.');
      onRefresh();
    } catch (err: any) {
      error('Failed to disconnect', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReconnect = async () => {
    setIsProcessing(true);
    try {
      await api.reconnectWhatsApp();
      info('Reconnecting WhatsApp', 'Cleared stale tokens. Waiting for QR code...');
      onRefresh();
    } catch (err: any) {
      error('Failed to reconnect', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateScan = async () => {
    setIsProcessing(true);
    try {
      await api.simulateScan(simulatedPhone, simulatedName);
      success('WhatsApp Linked!', `Authenticated as ${simulatedPhone}`);
      onRefresh();
    } catch (err: any) {
      error('Scan simulation failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            WhatsApp Web Connection Terminal
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Authenticate using WhatsApp Web Multi-Device QR scanning. No Cloud API credentials required.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Main Terminal View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: QR Code Container or Active Session Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden">
            {/* Background WhatsApp motif */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/5 rounded-full pointer-events-none blur-2xl" />

            {/* Header within Card */}
            <div className="flex items-center justify-between pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : isQrReady
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-300'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {isConnected ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <Smartphone className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {isConnected
                      ? 'WhatsApp Account Connected'
                      : isQrReady
                      ? 'Scan QR Code to Authenticate'
                      : isInitializing
                      ? 'Initializing Client...'
                      : 'WhatsApp Client Disconnected'}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {isConnected
                      ? 'Your device is actively synced and ready to auto-reply.'
                      : isQrReady
                      ? 'Open WhatsApp on your mobile device and scan the QR code below.'
                      : 'Click the button below to initialize the WhatsApp session.'}
                  </p>
                </div>
              </div>

              {/* Status pill */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : isQrReady
                    ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected
                      ? 'bg-emerald-500'
                      : isQrReady
                      ? 'bg-amber-500'
                      : 'bg-zinc-400'
                  }`}
                />
                <span className="capitalize">{status.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Body: Connected details OR QR Code Display */}
            <div className="py-6">
              {isConnected ? (
                /* Connected State View */
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/30">
                          {sessionInfo?.pushname?.charAt(0) || 'W'}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                            {sessionInfo?.pushname || 'Verified WhatsApp Session'}
                          </h3>
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            {sessionInfo?.phoneNumber || '+1 555-0192'}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold uppercase tracking-wider">
                        Active Web Session
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-emerald-200/50 dark:border-emerald-900/50">
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Multi-Device Platform:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {sessionInfo?.platform || 'WhatsApp Web MD'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Synced Since:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {sessionInfo?.connectedAt
                            ? new Date(sessionInfo.connectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-300">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      Session Storage & Security
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Session tokens are isolated on the server filesystem (<code className="bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded text-[11px]">.wwebjs_auth</code>).
                      Credentials are never transmitted to the browser or stored in plaintext.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => setShowDisconnectConfirm(true)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <WifiOff className="w-4 h-4" />
                      Disconnect WhatsApp
                    </button>
                    <button
                      onClick={handleReconnect}
                      disabled={isProcessing}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      Restart Session
                    </button>
                  </div>
                </div>
              ) : isQrReady && sessionInfo?.qrDataUrl ? (
                /* QR Code Display View */
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                  <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-emerald-500/30 transition-transform hover:scale-102">
                    <img
                      src={sessionInfo.qrDataUrl}
                      alt="WhatsApp Web QR Code"
                      className="w-64 h-64 md:w-72 md:h-72 object-contain"
                    />
                  </div>

                  <div className="space-y-2 max-w-md">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      QR Code Active & Real-Time Synced
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Point your phone camera via WhatsApp Linked Devices. The QR code automatically refreshes periodically.
                    </p>
                  </div>

                  {/* Dev / Tester Quick Simulator */}
                  <div className="w-full pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-dashed border-emerald-500/40 text-left space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-emerald-500" />
                          Testing Sandbox / Simulation Scan
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          Instant Auth
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Testing in a cloud environment without a spare physical phone right now? You can simulate scanning this QR code in 1 click to test auto-replies immediately:
                      </p>
                      <button
                        onClick={handleSimulateScan}
                        disabled={isProcessing}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Simulate QR Scan & Connect Test Account
                      </button>
                    </div>
                  </div>
                </div>
              ) : isInitializing ? (
                /* Initializing View */
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 animate-spin">
                      <RefreshCw className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                      Starting WhatsApp Web Engine...
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
                      Bootstrapping session daemon and generating your encrypted multi-device QR code.
                    </p>
                  </div>
                </div>
              ) : (
                /* Disconnected View */
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                      Ready to Link WhatsApp
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Click the button below to initialize the background engine and generate a QR code for your device.
                    </p>
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={isProcessing}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    <QrCode className="w-5 h-5" />
                    {isProcessing ? 'Initializing Engine...' : 'Connect WhatsApp Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 4-Step Instructions & Anti-Ban Risk Documentation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step-by-step instructions card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              How to Link Your WhatsApp Device
            </h3>

            <ol className="space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-zinc-900 dark:text-zinc-100">Open WhatsApp</strong> on your phone (Android or iPhone).
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  Tap <strong className="text-zinc-900 dark:text-zinc-100">Menu (⋮)</strong> on Android or <strong className="text-zinc-900 dark:text-zinc-100">Settings (⚙)</strong> on iOS.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  Select <strong className="text-zinc-900 dark:text-zinc-100">Linked Devices</strong>, then tap <strong className="text-zinc-900 dark:text-zinc-100">Link a Device</strong>.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  Point your camera at this computer screen to capture the QR code.
                </div>
              </li>
            </ol>
          </div>

          {/* WhatsApp Unofficial Library Limitations & Account Protection Warnings (Section 1 & 16) */}
          <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-900/40 space-y-3.5">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Library Notice & Anti-Ban Safeguards</span>
            </div>

            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
              This system uses the open-source <strong className="font-semibold">whatsapp-web.js</strong> browser automation bridge to connect to WhatsApp Web Multi-Device without requiring the paid WhatsApp Cloud API.
            </p>

            <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider">
                Recommended Safe Practices:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                <li>
                  <strong>Only reply to incoming customer queries</strong>. Never use this for cold outbound bulk spam.
                </li>
                <li>
                  <strong>Keep reply delays natural</strong> (1,500ms to 3,000ms configured in Settings).
                </li>
                <li>
                  <strong>Enforce per-contact rate limits</strong> (default: 5 auto-replies / 15 minutes) to avoid automated spam flags.
                </li>
                <li>
                  For mission-critical production with &gt;100k messages/day, transition to Meta's official WhatsApp Business Cloud API.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect confirmation modal */}
      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        title="Unlink WhatsApp Device?"
        message="This will terminate the current multi-device WhatsApp session. You will need to scan a new QR code to re-link."
        confirmLabel="Unlink Device"
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnectConfirm(false)}
      />
    </div>
  );
};
