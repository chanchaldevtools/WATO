import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  QrCode, 
  Bot, 
  MessageSquare, 
  History, 
  Settings,
  HelpCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { WhatsAppStatus } from '../types';

interface SidebarProps {
  status: WhatsAppStatus;
  activeRulesCount?: number;
}

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/connection', label: 'WhatsApp Connection', icon: QrCode, badgeKey: 'connection' },
  { to: '/rules', label: 'Auto Reply Rules', icon: Bot, badgeKey: 'rules' },
  { to: '/conversations', label: 'Conversations', icon: MessageSquare },
  { to: '/history', label: 'Message History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ status, activeRulesCount }) => {
  return (
    <aside className="w-64 shrink-0 bg-zinc-50/80 dark:bg-zinc-950/50 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)] transition-colors">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-emerald-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {/* Status badges */}
                    {item.badgeKey === 'connection' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          status === 'connected'
                            ? isActive
                              ? 'bg-emerald-700 text-emerald-100'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : status === 'qr_ready'
                            ? isActive
                              ? 'bg-amber-600 text-amber-100'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : isActive
                            ? 'bg-zinc-700 text-zinc-200'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {status === 'connected' ? 'Active' : status === 'qr_ready' ? 'Scan' : 'Off'}
                      </span>
                    )}

                    {item.badgeKey === 'rules' && activeRulesCount !== undefined && activeRulesCount > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-emerald-700 text-emerald-100'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {activeRulesCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Safety & Compliance info footer */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Anti-Ban Safeguards</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Multi-device session preserved. Rate limits active to prevent spam detection.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
          <span>Engine v2.4 (SQLite WAL)</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            ● Online
          </span>
        </div>
      </div>
    </aside>
  );
};
