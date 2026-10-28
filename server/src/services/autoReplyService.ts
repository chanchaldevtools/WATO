import { db } from '../database/db.js';
import { whatsappService } from './whatsappService.js';
import { EventEmitter } from 'events';

export interface IncomingMessagePayload {
  id: string;
  from: string;
  body: string;
  notifyName?: string;
  fromMe?: boolean;
  timestamp?: number;
}

export interface RuleMatchResult {
  matched: boolean;
  ruleId?: number;
  ruleName?: string;
  triggerType?: string;
  replyMessage?: string;
  reason?: string;
}

class AutoReplyService extends EventEmitter {
  constructor() {
    super();
    // Register incoming message handler
    whatsappService.setIncomingMessageCallback(this.processIncomingMessage.bind(this));
  }

  /**
   * Helper to fetch setting value
   */
  public getSetting(key: string, defaultValue: string = ''): string {
    try {
      const row = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get(key) as { setting_value: string } | undefined;
      return row ? row.setting_value : defaultValue;
    } catch (_) {
      return defaultValue;
    }
  }

  /**
   * Evaluate a text against rules without modifying DB or sending messages (for Test Simulation tab)
   */
  public testRuleMatch(text: string): RuleMatchResult {
    const isGlobalEnabled = this.getSetting('global_auto_reply_enabled', 'true') === 'true';
    if (!isGlobalEnabled) {
      return {
        matched: false,
        reason: 'Global auto-reply is currently disabled in Settings.'
      };
    }

    const rules = db.prepare(`
      SELECT * FROM auto_reply_rules 
      WHERE is_enabled = 1 
      ORDER BY priority DESC, id ASC
    `).all() as any[];

    if (!rules || rules.length === 0) {
      return {
        matched: false,
        reason: 'No enabled rules found.'
      };
    }

    // Try finding specific rule match first (non-fallback)
    const specificRules = rules.filter(r => r.trigger_type !== 'fallback');
    for (const rule of specificRules) {
      if (this.evaluateRuleCondition(rule, text)) {
        return {
          matched: true,
          ruleId: rule.id,
          ruleName: rule.name,
          triggerType: rule.trigger_type,
          replyMessage: rule.reply_message,
          reason: `Matched rule "${rule.name}" via trigger type [${rule.trigger_type}] with priority ${rule.priority}`
        };
      }
    }

    // If no specific rule matched, check for fallback rule
    const fallbackRule = rules.find(r => r.trigger_type === 'fallback');
    if (fallbackRule) {
      return {
        matched: true,
        ruleId: fallbackRule.id,
        ruleName: fallbackRule.name,
        triggerType: 'fallback',
        replyMessage: fallbackRule.reply_message,
        reason: `No primary keyword matched. Triggered fallback rule "${fallbackRule.name}".`
      };
    }

    // Check default fallback message in settings
    const defaultFallback = this.getSetting('default_fallback_message');
    if (defaultFallback) {
      return {
        matched: true,
        triggerType: 'global_fallback',
        replyMessage: defaultFallback,
        reason: 'Triggered default system fallback response.'
      };
    }

    return {
      matched: false,
      reason: 'No rules or fallback matched the provided message.'
    };
  }

  /**
   * Evaluates if a given message text satisfies a rule
   */
  private evaluateRuleCondition(rule: any, rawText: string): boolean {
    const text = (rawText || '').trim();
    if (rule.trigger_type === 'all') {
      return text.length > 0;
    }

    const keywords = (rule.keywords || '')
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);

    if (keywords.length === 0 && rule.trigger_type !== 'fallback') {
      return false;
    }

    const isCaseInsensitive = rule.match_mode !== 'case_sensitive';
    const normalizedText = isCaseInsensitive ? text.toLowerCase() : text;

    for (const kw of keywords) {
      const normalizedKw = isCaseInsensitive ? kw.toLowerCase() : kw;

      if (rule.match_mode === 'regex') {
        try {
          const regex = new RegExp(kw, isCaseInsensitive ? 'i' : '');
          if (regex.test(text)) return true;
        } catch (_) {}
        continue;
      }

      switch (rule.trigger_type) {
        case 'exact':
          if (normalizedText === normalizedKw) return true;
          break;
        case 'contains':
          if (normalizedText.includes(normalizedKw)) return true;
          break;
        case 'starts_with':
          if (normalizedText.startsWith(normalizedKw)) return true;
          break;
      }
    }

    return false;
  }

  /**
   * Check if current time is within business hours if configured
   */
  private isWithinBusinessHours(): boolean {
    const startStr = this.getSetting('business_hours_start', '00:00');
    const endStr = this.getSetting('business_hours_end', '23:59');

    if (!startStr || !endStr) return true;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);

    if (startTotal <= endTotal) {
      return currentMinutes >= startTotal && currentMinutes <= endTotal;
    } else {
      // Overnight range (e.g. 22:00 to 06:00)
      return currentMinutes >= startTotal || currentMinutes <= endTotal;
    }
  }

  /**
   * Main pipeline to process incoming message
   */
  public async processIncomingMessage(msg: IncomingMessagePayload) {
    try {
      console.log(`[AutoReply] Processing incoming message from ${msg.from}: "${msg.body}"`);

      // 1. Ignore messages from connected account
      const ignoreSelf = this.getSetting('ignore_self_messages', 'true') === 'true';
      if (ignoreSelf && msg.fromMe) {
        console.log('[AutoReply] Ignored: sent by connected account.');
        return;
      }

      // 2. Ignore group messages
      const ignoreGroup = this.getSetting('ignore_group_messages', 'true') === 'true';
      if (ignoreGroup && (msg.from.includes('@g.us') || msg.from.includes('-'))) {
        console.log('[AutoReply] Ignored: group chat message.');
        return;
      }

      // 3. Ignore status broadcasts
      const ignoreStatus = this.getSetting('ignore_status_updates', 'true') === 'true';
      if (ignoreStatus && msg.from.includes('status@broadcast')) {
        console.log('[AutoReply] Ignored: status update broadcast.');
        return;
      }

      // 4. Duplicate incoming message prevention
      const existing = db.prepare('SELECT id FROM messages WHERE whatsapp_message_id = ?').get(msg.id);
      if (existing) {
        console.log(`[AutoReply] Ignored: duplicate message ID ${msg.id}`);
        return;
      }

      // 5. Find or create Contact
      const cleanPhone = msg.from.replace('@c.us', '').replace('@s.whatsapp.net', '');
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
      const displayName = msg.notifyName || formattedPhone;

      let contact = db.prepare('SELECT * FROM contacts WHERE whatsapp_id = ?').get(msg.from) as any;
      if (!contact) {
        const insertContact = db.prepare(`
          INSERT INTO contacts (whatsapp_id, phone_number, display_name, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `);
        const info = insertContact.run(msg.from, formattedPhone, displayName);
        contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(info.lastInsertRowid);
      } else {
        // Update contact name if changed
        if (msg.notifyName && contact.display_name !== msg.notifyName) {
          db.prepare('UPDATE contacts SET display_name = ?, updated_at = datetime(\'now\') WHERE id = ?')
            .run(msg.notifyName, contact.id);
          contact.display_name = msg.notifyName;
        } else {
          db.prepare('UPDATE contacts SET updated_at = datetime(\'now\') WHERE id = ?')
            .run(contact.id);
        }
      }

      // 6. Save incoming message
      const insertMsg = db.prepare(`
        INSERT INTO messages (
          whatsapp_message_id, contact_id, direction, message_type,
          message_body, is_auto_reply, processing_status, created_at
        ) VALUES (?, ?, 'incoming', 'chat', ?, 0, 'received', datetime('now'))
      `);
      const msgRecord = insertMsg.run(msg.id, contact.id, msg.body);
      const savedMsgId = msgRecord.lastInsertRowid;

      // Broadcast incoming message via Socket.IO
      this.emit('message:new', {
        id: savedMsgId,
        whatsapp_message_id: msg.id,
        contact_id: contact.id,
        contact_name: contact.display_name,
        contact_phone: contact.phone_number,
        direction: 'incoming',
        message_body: msg.body,
        is_auto_reply: 0,
        processing_status: 'received',
        created_at: new Date().toISOString()
      });

      // 7. Check if Global Auto Reply is enabled
      const globalEnabled = this.getSetting('global_auto_reply_enabled', 'true') === 'true';
      if (!globalEnabled) {
        db.prepare('UPDATE messages SET processing_status = \'ignored\' WHERE id = ?').run(savedMsgId);
        console.log('[AutoReply] Auto reply skipped: globally disabled.');
        return;
      }

      // 8. Rate limit check: Maximum auto replies per contact within window
      const maxReplies = parseInt(this.getSetting('max_replies_per_contact_window', '5'), 10) || 5;
      const windowMinutes = parseInt(this.getSetting('rate_limit_window_minutes', '15'), 10) || 15;

      const recentRepliesCount = (db.prepare(`
        SELECT COUNT(*) as count FROM messages
        WHERE contact_id = ? 
          AND direction = 'outgoing' 
          AND is_auto_reply = 1
          AND created_at >= datetime('now', '-' || ? || ' minutes')
      `).get(contact.id, windowMinutes) as { count: number }).count;

      if (recentRepliesCount >= maxReplies) {
        db.prepare('UPDATE messages SET processing_status = \'rate_limited\' WHERE id = ?').run(savedMsgId);
        console.log(`[AutoReply] Contact ${contact.phone_number} exceeded rate limit (${recentRepliesCount}/${maxReplies} in ${windowMinutes}m).`);
        return;
      }

      // 9. Match rule
      const match = this.testRuleMatch(msg.body);
      if (!match.matched || !match.replyMessage) {
        db.prepare('UPDATE messages SET processing_status = \'no_match\' WHERE id = ?').run(savedMsgId);
        console.log(`[AutoReply] No match found for message: "${msg.body}"`);
        return;
      }

      // 10. Configurable delay
      const delayMs = Math.min(Math.max(parseInt(this.getSetting('reply_delay_ms', '1500'), 10) || 1500, 300), 10000);
      if (delayMs > 0) {
        await new Promise(r => setTimeout(r, delayMs));
      }

      // 11. Send Reply via WhatsApp
      const sendResult = await whatsappService.sendMessage(contact.whatsapp_id, match.replyMessage);

      if (sendResult.success) {
        // 12. Save outgoing auto-reply message
        const insertReply = db.prepare(`
          INSERT INTO messages (
            whatsapp_message_id, contact_id, direction, message_type,
            message_body, is_auto_reply, processing_status, created_at
          ) VALUES (?, ?, 'outgoing', 'chat', ?, 1, 'sent', datetime('now'))
        `);
        const replyRecord = insertReply.run(sendResult.messageId, contact.id, match.replyMessage);
        
        // Mark incoming message as replied
        db.prepare('UPDATE messages SET processing_status = \'replied\' WHERE id = ?').run(savedMsgId);

        // Update contact last activity
        db.prepare('UPDATE contacts SET updated_at = datetime(\'now\') WHERE id = ?').run(contact.id);

        // Record activity log
        db.prepare(`
          INSERT INTO activity_logs (event_type, description, metadata, created_at)
          VALUES ('auto_reply_sent', ?, ?, datetime('now'))
        `).run(
          `Auto-reply sent to ${contact.display_name} (${contact.phone_number})`,
          JSON.stringify({
            ruleName: match.ruleName || 'Fallback',
            triggerType: match.triggerType,
            messageSnippet: match.replyMessage.slice(0, 50)
          })
        );

        // Broadcast outgoing message & stats
        this.emit('message:new', {
          id: replyRecord.lastInsertRowid,
          whatsapp_message_id: sendResult.messageId,
          contact_id: contact.id,
          contact_name: contact.display_name,
          contact_phone: contact.phone_number,
          direction: 'outgoing',
          message_body: match.replyMessage,
          is_auto_reply: 1,
          processing_status: 'sent',
          created_at: new Date().toISOString()
        });

        this.emit('reply:sent', {
          contactId: contact.id,
          replyText: match.replyMessage,
          ruleName: match.ruleName
        });

      } else {
        db.prepare('UPDATE messages SET processing_status = \'failed\', error_message = ? WHERE id = ?')
          .run(sendResult.error || 'Failed to send WhatsApp message', savedMsgId);
        console.error('[AutoReply] Message send failed:', sendResult.error);
      }

    } catch (err: any) {
      console.error('[AutoReply] Error in processIncomingMessage:', err);
    }
  }
}

export const autoReplyService = new AutoReplyService();
