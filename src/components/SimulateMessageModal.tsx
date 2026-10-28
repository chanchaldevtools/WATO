import React, { useState } from 'react';
import { Send, Sparkles, X, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

interface SimulateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultPhone?: string;
  defaultName?: string;
}

const SAMPLE_MESSAGES = [
  { label: 'Greeting', text: 'Hello! I want to inquire about your services' },
  { label: 'Pricing Inquiry', text: 'What are your product prices and cost?' },
  { label: 'Business Hours', text: 'What time is your office opening today?' },
  { label: 'Urgent Support', text: 'support: urgent bug in API webhook integration' },
  { label: 'Unknown Inquiry (Fallback)', text: 'Can you recommend a good coffee blend?' },
];

export const SimulateMessageModal: React.FC<SimulateMessageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPhone = '+1 (415) 890-4412',
  defaultName = 'Alex Rivera',
}) => {
  const { success, error } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [contactName, setContactName] = useState(defaultName);
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSubmitting(true);
    try {
      await api.simulateIncomingMessage(phoneNumber, messageText.trim(), contactName);
      success('Incoming Message Injected', `Auto-reply engine is evaluating "${messageText.slice(0, 30)}..."`);
      setMessageText('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to simulate message', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Simulate Incoming WhatsApp Message
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Live Test
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Inject a test incoming message to verify keyword match, priority sorting, rate limits, and auto-reply dispatch.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Sender Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Sender Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="+1 555-0100"
                className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Message Content
              </label>
              <span className="text-[11px] text-zinc-400">Try keywords: hi, price, time, support</span>
            </div>
            <textarea
              rows={3}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="e.g. Hello, what are your opening hours and price plans?"
              required
              className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Quick preset chips */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
              Quick Test Prompts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_MESSAGES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessageText(s.text)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-500 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer text-left"
                >
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{s.label}:</span>{' '}
                  <span className="opacity-80">"{s.text.slice(0, 24)}..."</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-normal">
              When submitted, this message will immediately be processed by the Auto Reply Engine, saved to SQLite, and sent as an outgoing reply if matching rules exist.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !messageText.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Processing...' : 'Send Test Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
