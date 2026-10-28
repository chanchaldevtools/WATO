import React, { useState } from 'react';
import { 
  MessageSquareCode, 
  QrCode, 
  Sun, 
  Moon, 
  Send, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  LogOut,
  ChevronDown,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WhatsAppSessionInfo } from '../types';
import { SimulateMessageModal } from './SimulateMessageModal';

interface NavbarProps {
  sessionInfo: WhatsAppSessionInfo | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onRefreshSession?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sessionInfo,
  darkMode,
  setDarkMode,
  onRefreshSession,
}) => {
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const status = sessionInfo?.status || 'disconnected';
  const isConnected = status === 'connected';
  const isQrReady = status === 'qr_ready';
  const isInitializing = status === 'initializing';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 h-16 px-4 md:px-6 flex items-center justify-between transition-colors">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <MessageSquareCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base md:text-lg tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                AutoReply <span className="text-emerald-600 dark:text-emerald-400 font-black">WA</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 -mt-1">
                Automation Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* WhatsApp Connection Status Badge */}
          <Link
            to="/connection"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100'
                : isQrReady
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/80 hover:bg-amber-100 animate-pulse'
                : isInitializing
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800/80'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isConnected ? 'bg-emerald-400' : isQrReady ? 'bg-amber-400' : 'hidden'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected
                    ? 'bg-emerald-500'
                    : isQrReady
                    ? 'bg-amber-500'
                    : isInitializing
                    ? 'bg-blue-500'
                    : 'bg-zinc-400'
                }`}
              />
            </span>
            <span className="font-semibold hidden sm:inline">WhatsApp:</span>
            <span>
              {isConnected
                ? sessionInfo?.phoneNumber || 'Connected'
                : isQrReady
                ? 'Scan QR Required'
                : isInitializing
                ? 'Initializing...'
                : 'Disconnected'}
            </span>
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <QrCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            )}
          </Link>

          {/* Quick Simulation Trigger Button */}
          <button
            onClick={() => setShowSimulateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 transition-colors shadow-xs cursor-pointer"
            title="Inject an incoming test message to test auto-reply logic"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span className="hidden md:inline">Test Message Simulator</span>
            <span className="md:hidden">Test</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Admin Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <span className="hidden lg:inline font-semibold">Admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">Super Administrator</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">admin@nexus-digital.io</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    System Settings
                  </Link>
                  <Link
                    to="/connection"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    WhatsApp Device Manager
                  </Link>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1">
                  <div className="px-3.5 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Secure Local Admin
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Simulator Modal */}
      <SimulateMessageModal
        isOpen={showSimulateModal}
        onClose={() => setShowSimulateModal(false)}
      />
    </>
  );
};
