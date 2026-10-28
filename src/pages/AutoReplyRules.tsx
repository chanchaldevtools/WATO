import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles, 
  ArrowUpDown, 
  HelpCircle, 
  Check, 
  X, 
  ChevronRight,
  Send,
  Sliders,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AutoReplyRule, TriggerType, MatchMode } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const AutoReplyRules: React.FC = () => {
  const { success, error, info } = useToast();
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<AutoReplyRule | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formTriggerType, setFormTriggerType] = useState<TriggerType>('contains');
  const [formKeywords, setFormKeywords] = useState('');
  const [formMatchMode, setFormMatchMode] = useState<MatchMode>('case_insensitive');
  const [formReplyMessage, setFormReplyMessage] = useState('');
  const [formPriority, setFormPriority] = useState(5);
  const [formIsEnabled, setFormIsEnabled] = useState(true);

  // Live Rule Tester state
  const [testInput, setTestInput] = useState('Can you tell me the pricing plans?');
  const [testResult, setTestResult] = useState<{
    matched: boolean;
    ruleId?: number;
    ruleName?: string;
    triggerType?: string;
    replyMessage?: string;
    reason?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const data = await api.getRules();
      setRules(data);
    } catch (err: any) {
      error('Failed to load rules', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormName('');
    setFormTriggerType('contains');
    setFormKeywords('');
    setFormMatchMode('case_insensitive');
    setFormReplyMessage('');
    setFormPriority(5);
    setFormIsEnabled(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormTriggerType(rule.trigger_type);
    setFormKeywords(rule.keywords || '');
    setFormMatchMode(rule.match_mode || 'case_insensitive');
    setFormReplyMessage(rule.reply_message);
    setFormPriority(rule.priority);
    setFormIsEnabled(Boolean(rule.is_enabled));
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formReplyMessage.trim()) {
      error('Validation Error', 'Rule name and reply message are required.');
      return;
    }

    try {
      const payload: Partial<AutoReplyRule> = {
        name: formName.trim(),
        trigger_type: formTriggerType,
        keywords: formKeywords.trim(),
        match_mode: formMatchMode,
        reply_message: formReplyMessage.trim(),
        priority: Number(formPriority),
        is_enabled: formIsEnabled ? 1 : 0,
      };

      if (editingRule) {
        await api.updateRule(editingRule.id, payload);
        success('Rule Updated', `Rule "${formName}" was successfully updated.`);
      } else {
        await api.createRule(payload);
        success('Rule Created', `Rule "${formName}" has been added to the engine.`);
      }

      setIsModalOpen(false);
      loadRules();
    } catch (err: any) {
      error('Failed to save rule', err.message);
    }
  };

  const handleToggleRule = async (id: number) => {
    try {
      const updated = await api.toggleRule(id);
      setRules(prev => prev.map(r => r.id === id ? updated : r));
      info('Status Toggled', `Rule is now ${updated.is_enabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      error('Failed to toggle rule', err.message);
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    try {
      await api.deleteRule(ruleToDelete.id);
      success('Rule Deleted', `Rule "${ruleToDelete.name}" was removed.`);
      setRuleToDelete(null);
      loadRules();
    } catch (err: any) {
      error('Failed to delete rule', err.message);
    }
  };

  const handleRunSimulatorTest = async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);
    try {
      const res = await api.testRuleMatch(testInput.trim());
      setTestResult(res);
    } catch (err: any) {
      error('Simulation failed', err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const filteredRules = rules.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.keywords && r.keywords.toLowerCase().includes(search.toLowerCase())) ||
      r.reply_message.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || r.trigger_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Auto Reply Automation Rules
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Define intelligent keyword triggers, pattern matches, and fallback automated responses.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Rule
        </button>
      </div>

      {/* Live Interactive Rule Testing Simulation Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 text-white border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Rule Evaluation Tester</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
              Sandbox Preview
            </span>
          </div>
          <span className="text-xs text-zinc-400">
            Simulate incoming text against your rules live
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type any test customer message, e.g. 'hi what is the price?'"
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleRunSimulatorTest}
            disabled={isTesting || !testInput.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isTesting ? 'Evaluating...' : 'Simulate Match'}
          </button>
        </div>

        {/* Test Result Box */}
        {testResult && (
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-zinc-300">
                {testResult.matched ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Match Successful: <strong className="text-emerald-400 font-extrabold">{testResult.ruleName}</strong>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    No Rule Matched
                  </>
                )}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                Trigger: {testResult.triggerType || 'None'}
              </span>
            </div>

            {testResult.replyMessage && (
              <div className="p-3 rounded-lg bg-zinc-900 border border-emerald-500/30 text-emerald-200 text-xs font-mono whitespace-pre-wrap">
                {testResult.replyMessage}
              </div>
            )}

            <p className="text-[11px] text-zinc-400">{testResult.reason}</p>
          </div>
        )}
      </div>

      {/* Rules Controls & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules, keywords, or replies..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="all">All Trigger Types</option>
            <option value="contains">Contains Keyword</option>
            <option value="exact">Exact Match</option>
            <option value="starts_with">Starts With</option>
            <option value="all">All Incoming</option>
            <option value="fallback">Fallback Only</option>
          </select>
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Rule Name</th>
                <th className="py-3.5 px-4">Trigger Type</th>
                <th className="py-3.5 px-4">Keywords</th>
                <th className="py-3.5 px-4">Reply Preview</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No matching auto-reply rules found. Click "Create New Rule" to get started.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const isEnabled = Boolean(rule.is_enabled);
                  return (
                    <tr
                      key={rule.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                        !isEnabled ? 'opacity-60 bg-zinc-50/50 dark:bg-zinc-950/20' : ''
                      }`}
                    >
                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          #{rule.priority}
                        </span>
                      </td>

                      {/* Rule Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {rule.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ID: {rule.id}
                        </span>
                      </td>

                      {/* Trigger Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rule.trigger_type === 'contains'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : rule.trigger_type === 'exact'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : rule.trigger_type === 'starts_with'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : rule.trigger_type === 'fallback'
                              ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {rule.trigger_type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Keywords */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {rule.trigger_type === 'fallback' ? (
                          <span className="text-zinc-400 italic text-[11px]">No keywords (Triggers when no other rule matches)</span>
                        ) : rule.trigger_type === 'all' ? (
                          <span className="text-zinc-400 italic text-[11px]">All incoming messages</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(rule.keywords || '').split(',').map((kw, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400"
                              >
                                {kw.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Reply Message Preview */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-zinc-600 dark:text-zinc-400" title={rule.reply_message}>
                        {rule.reply_message}
                      </td>

                      {/* Toggle status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className="flex items-center gap-1.5 cursor-pointer text-xs"
                          title="Click to toggle status"
                        >
                          {isEnabled ? (
                            <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-zinc-400" />
                          )}
                          <span className="font-semibold text-[11px]">
                            {isEnabled ? 'Active' : 'Disabled'}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                          title="Edit rule"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRuleToDelete(rule)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Bot className="w-6 h-6 text-emerald-600" />
                {editingRule ? 'Edit Auto Reply Rule' : 'Create New Auto Reply Rule'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Configure pattern conditions and response templates for the auto-responder.
              </p>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Greeting & Welcome"
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Trigger Type
                  </label>
                  <select
                    value={formTriggerType}
                    onChange={(e) => setFormTriggerType(e.target.value as TriggerType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="contains">Message Contains Keywords</option>
                    <option value="exact">Exact Keyword Match</option>
                    <option value="starts_with">Message Starts With</option>
                    <option value="all">All Incoming Messages</option>
                    <option value="fallback">Default Fallback Response</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Match Mode
                  </label>
                  <select
                    value={formMatchMode}
                    onChange={(e) => setFormMatchMode(e.target.value as MatchMode)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="case_insensitive">Case-Insensitive (Standard)</option>
                    <option value="case_sensitive">Case-Sensitive</option>
                    <option value="regex">Regular Expression (Regex)</option>
                  </select>
                </div>
              </div>

              {formTriggerType !== 'fallback' && formTriggerType !== 'all' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-zinc-700 dark:text-zinc-300">
                      Trigger Keywords * (Comma-separated)
                    </label>
                    <span className="text-[10px] text-zinc-400">e.g. price, cost, rate, plans</span>
                  </div>
                  <input
                    type="text"
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    placeholder="hi, hello, hey, start"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">
                    Reply Message Template *
                  </label>
                  <span className="text-[10px] text-zinc-400">
                    {formReplyMessage.length} characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={formReplyMessage}
                  onChange={(e) => setFormReplyMessage(e.target.value)}
                  placeholder="Hello! Welcome to our store. How can we help you today?"
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Priority (1 - 100, Higher = First)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formPriority}
                    onChange={(e) => setFormPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsEnabled}
                      onChange={(e) => setFormIsEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      Rule Active & Enabled
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingRule ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Rule Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(ruleToDelete)}
        title="Delete Auto Reply Rule?"
        message={`Are you sure you want to permanently delete "${ruleToDelete?.name}"? The engine will no longer evaluate incoming messages against this rule.`}
        confirmLabel="Delete Rule"
        onConfirm={handleDeleteRule}
        onCancel={() => setRuleToDelete(null)}
      />
    </div>
  );
};
