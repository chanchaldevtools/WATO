import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Overview } from './pages/Overview';
import { WhatsAppConnection } from './pages/WhatsAppConnection';
import { AutoReplyRules } from './pages/AutoReplyRules';
import { Conversations } from './pages/Conversations';
import { MessageHistory } from './pages/MessageHistory';
import { SettingsPage } from './pages/Settings';
import { WhatsAppSessionInfo, DashboardStats } from './types';
import { api } from './services/api';
import { getSocket } from './services/socket';

function MainApp() {
  const { info, success, error } = useToast();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoreply_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });

  const [sessionInfo, setSessionInfo] = useState<WhatsAppSessionInfo | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('autoreply_dark_mode', String(darkMode));
  }, [darkMode]);

  // Initial load & Socket.IO real-time binding
  useEffect(() => {
    loadInitialData();

    const socket = getSocket();

    socket.on('whatsapp:status', (data: WhatsAppSessionInfo) => {
      setSessionInfo(data);
    });

    socket.on('whatsapp:qr', (data: { qrDataUrl: string; mode?: string }) => {
      setSessionInfo((prev) => ({
        ...(prev || { status: 'qr_ready', mode: 'real' }),
        status: 'qr_ready',
        qrDataUrl: data.qrDataUrl,
      }));
    });

    socket.on('whatsapp:ready', (data: WhatsAppSessionInfo) => {
      setSessionInfo(data);
      success('WhatsApp Connected', `Account ${data.phoneNumber || ''} is active!`);
      loadStats();
    });

    socket.on('whatsapp:authenticated', () => {
      setSessionInfo((prev) => prev ? { ...prev, status: 'authenticated' } : null);
    });

    socket.on('whatsapp:disconnected', () => {
      setSessionInfo((prev) => prev ? { ...prev, status: 'disconnected', qrDataUrl: null, phoneNumber: undefined } : null);
      info('WhatsApp Disconnected', 'Session has been terminated.');
    });

    socket.on('dashboard:stats', (stats: DashboardStats) => {
      setDashboardStats(stats);
    });

    return () => {
      socket.off('whatsapp:status');
      socket.off('whatsapp:qr');
      socket.off('whatsapp:ready');
      socket.off('whatsapp:authenticated');
      socket.off('whatsapp:disconnected');
      socket.off('dashboard:stats');
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [statusData, statsData] = await Promise.all([
        api.getWhatsAppStatus(),
        api.getDashboardStats(),
      ]);
      setSessionInfo(statusData);
      setDashboardStats(statsData);
    } catch (err) {
      console.error('Initial data load error:', err);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
    } catch (_) {}
  };

  const status = sessionInfo?.status || 'disconnected';

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        sessionInfo={sessionInfo}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onRefreshSession={loadInitialData}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            status={status}
            activeRulesCount={dashboardStats?.activeRules}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route
              path="/"
              element={
                <Overview
                  stats={dashboardStats}
                  sessionInfo={sessionInfo}
                  onRefresh={loadInitialData}
                />
              }
            />
            <Route
              path="/connection"
              element={
                <WhatsAppConnection
                  sessionInfo={sessionInfo}
                  onRefresh={loadInitialData}
                />
              }
            />
            <Route path="/rules" element={<AutoReplyRules />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/history" element={<MessageHistory />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </BrowserRouter>
  );
}
