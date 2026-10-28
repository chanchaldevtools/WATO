import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Bot, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { Message } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export const MessageHistory: React.FC = () => {
  const { error } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('');
  const [isAutoReply, setIsAutoReply] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected message for detail drawer
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    loadHistory();
  }, [currentPage, direction, isAutoReply, status, startDate, endDate]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMessageHistory({
        search,
        direction,
        isAutoReply,
        status,
        startDate,
        endDate,
        page: currentPage,
        limit: 25,
      });
      setMessages(res.records);
      setTotalCount(res.pagination.totalCount);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      error('Failed to load message history', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadHistory();
  };

  const handleExportCsv = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (direction) params.direction = direction;
    if (isAutoReply) params.isAutoReply = isAutoReply;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const url = api.getExportCsvUrl(params);
    window.location.href = url;
  };

  const resetFilters = () => {
    setSearch('');
    setDirection('');
    setIsAutoReply('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Audit Message History & Logs
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Complete searchable trail of all incoming customer requests, rules matched, and automated replies.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          Export History to CSV
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by phone, customer name, or message text..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 text-xs">
          {/* Direction */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Direction</label>
            <select
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
            >
              <option value="">All Directions</option>
              <option value="incoming">Incoming Only</option>
              <option value="outgoing">Outgoing Only</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Response Type</label>
            <select
              value={isAutoReply}
              onChange={(e) => {
                setIsAutoReply(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
            >
              <option value="">All Types</option>
              <option value="1">Automated Replies Only</option>
              <option value="0">Manual / Customer Only</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="replied">Replied</option>
              <option value="received">Received</option>
              <option value="rate_limited">Rate Limited</option>
              <option value="no_match">No Match</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs"
            />
          </div>

          {/* End Date & Reset */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-zinc-500">End Date</label>
              {(direction || isAutoReply || status || startDate || endDate || search) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Message Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Direction</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Message Body</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Loading message history...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No message records found matching your filters.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                      {new Date(msg.created_at).toLocaleDateString()}{' '}
                      <span className="text-[10px]">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                        {msg.contact_name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {msg.contact_phone}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {msg.direction === 'incoming' ? (
                        <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 text-[11px]">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          Incoming
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Outgoing
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {msg.is_auto_reply === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                          <Bot className="w-3 h-3" />
                          Auto Reply
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px]">
                          <User className="w-3 h-3" />
                          Manual / User
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-zinc-700 dark:text-zinc-300">
                      {msg.message_body}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          msg.processing_status === 'sent' || msg.processing_status === 'replied'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : msg.processing_status === 'rate_limited'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : msg.processing_status === 'failed'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {msg.processing_status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(msg);
                        }}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div>
            Showing <strong className="text-zinc-800 dark:text-zinc-200">{messages.length}</strong> of{' '}
            <strong className="text-zinc-800 dark:text-zinc-200">{totalCount}</strong> messages
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold px-2">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Message Detail Drawer / Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              Message Audit Inspector
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 font-mono text-[11px] break-all">
                <span className="text-zinc-400 block mb-1">WhatsApp Message ID:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {selectedMessage.whatsapp_message_id || 'System Generated'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Contact Name</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {selectedMessage.contact_name || 'Anonymous'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Contact Phone</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {selectedMessage.contact_phone}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Direction & Type</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                    {selectedMessage.direction} ({selectedMessage.is_auto_reply ? 'Auto Reply' : 'Manual'})
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Timestamp</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] mb-1">Message Content</span>
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {selectedMessage.message_body}
                </div>
              </div>

              {selectedMessage.error_message && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300">
                  <span className="font-bold block mb-0.5">Error Diagnostic:</span>
                  {selectedMessage.error_message}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
