import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Bot, 
  User, 
  CheckCheck, 
  Clock, 
  Sparkles, 
  Phone, 
  MoreVertical, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Contact, Message } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { getSocket } from '../services/socket';
import { SimulateMessageModal } from '../components/SimulateMessageModal';

export const Conversations: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contactParam = searchParams.get('contact');

  useEffect(() => {
    loadContacts();

    // Socket listener for real-time messages
    const socket = getSocket();
    const handleNewMessage = (msg: Message) => {
      // Refresh contact list to show updated last message
      loadContacts();

      // If viewing active conversation, append message
      if (selectedContact && msg.contact_id === selectedContact.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id || (m.whatsapp_message_id && m.whatsapp_message_id === msg.whatsapp_message_id))) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContacts = async () => {
    try {
      const data = await api.getConversations();
      setContacts(data);

      if (contactParam && !selectedContact) {
        const found = data.find((c) => String(c.id) === contactParam);
        if (found) {
          handleSelectContact(found);
        }
      } else if (!selectedContact && data.length > 0) {
        handleSelectContact(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load contacts:', err);
    }
  };

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    setSearchParams({ contact: String(contact.id) });
    setIsLoadingMessages(true);
    try {
      const res = await api.getConversationMessages(contact.id);
      setMessages(res.messages || []);
    } catch (err: any) {
      error('Failed to load messages', err.message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !replyText.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await api.sendManualMessage(selectedContact.id, replyText.trim());
      setMessages((prev) => [...prev, res.message]);
      setReplyText('');
      loadContacts();
      success('Message Sent', 'Outgoing WhatsApp message dispatched.');
    } catch (err: any) {
      error('Send Failed', err.message);
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone_number.includes(searchTerm)
  );

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden animate-in fade-in duration-300">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Contact Threads */}
        <div className="w-80 md:w-96 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/60 dark:bg-zinc-950/40">
          {/* Search bar */}
          <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search WhatsApp chats..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No conversations found.
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isSelected = selectedContact?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectContact(c)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                        : 'hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {c.display_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {c.display_name}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {c.last_message_time
                            ? new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                          {c.last_message_is_auto_reply === 1 && (
                            <span className="inline-block px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-[9px] text-emerald-700 dark:text-emerald-300 font-extrabold shrink-0">
                              BOT
                            </span>
                          )}
                          <span className="truncate">{c.last_message || 'No messages'}</span>
                        </p>

                        {c.unread_count && c.unread_count > 0 ? (
                          <span className="ml-2 w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {c.unread_count}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Thread */}
        <div className="flex-1 flex flex-col bg-zinc-100/50 dark:bg-zinc-950/80">
          {selectedContact ? (
            <>
              {/* Top Contact Bar */}
              <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {selectedContact.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {selectedContact.display_name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-mono">
                      <Phone className="w-3 h-3 text-emerald-500" />
                      {selectedContact.phone_number}
                    </p>
                  </div>
                </div>

                {/* Simulate test reply button */}
                <button
                  onClick={() => setShowSimulateModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Simulate User Message In This Chat
                </button>
              </div>

              {/* Message Bubble Wall */}
              <div className="flex-1 p-6 overflow-y-auto space-y-3.5">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full text-zinc-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Loading conversation messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                    <p>No messages in this conversation thread yet.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOutgoing = m.direction === 'outgoing';
                    const isBot = m.is_auto_reply === 1;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-lg rounded-2xl px-4 py-3 shadow-xs text-xs relative ${
                            isOutgoing
                              ? 'bg-emerald-600 text-white rounded-br-xs dark:bg-emerald-700'
                              : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-xs border border-zinc-200 dark:border-zinc-700/60'
                          }`}
                        >
                          {/* Bot or Manual indicator */}
                          {isOutgoing && (
                            <div className="flex items-center gap-1 mb-1 text-[10px] font-bold opacity-90">
                              {isBot ? (
                                <span className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded-md">
                                  <Bot className="w-3 h-3" />
                                  Automated Reply
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded-md">
                                  <User className="w-3 h-3" />
                                  Manual Operator
                                </span>
                              )}
                            </div>
                          )}

                          <p className="whitespace-pre-wrap leading-relaxed font-sans">
                            {m.message_body}
                          </p>

                          <div
                            className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                              isOutgoing ? 'text-emerald-100/80' : 'text-zinc-400'
                            }`}
                          >
                            <span>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOutgoing && <CheckCheck className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Manual Send Bar */}
              <form onSubmit={handleSendManual} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply manually to ${selectedContact.display_name}...`}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-400 p-8 space-y-3">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <h3 className="font-bold text-sm text-zinc-600 dark:text-zinc-400">
                Select a conversation to view chat history
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm">
                Choose a customer on the left or simulate a new incoming WhatsApp message.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simulator Modal pre-filled for this contact */}
      {selectedContact && (
        <SimulateMessageModal
          isOpen={showSimulateModal}
          onClose={() => setShowSimulateModal(false)}
          defaultPhone={selectedContact.phone_number}
          defaultName={selectedContact.display_name}
          onSuccess={() => {
            loadContacts();
          }}
        />
      )}
    </div>
  );
};
