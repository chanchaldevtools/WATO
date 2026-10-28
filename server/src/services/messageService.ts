import { db } from '../database/db.js';
import { whatsappService } from './whatsappService.js';

export class MessageService {
  /**
   * Get all conversation threads with latest message & contact metadata
   */
  public static getConversations(search?: string) {
    let query = `
      SELECT 
        c.id,
        c.whatsapp_id,
        c.phone_number,
        c.display_name,
        c.updated_at,
        (
          SELECT message_body 
          FROM messages m 
          WHERE m.contact_id = c.id 
          ORDER BY m.created_at DESC, m.id DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at 
          FROM messages m 
          WHERE m.contact_id = c.id 
          ORDER BY m.created_at DESC, m.id DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT direction 
          FROM messages m 
          WHERE m.contact_id = c.id 
          ORDER BY m.created_at DESC, m.id DESC 
          LIMIT 1
        ) as last_message_direction,
        (
          SELECT is_auto_reply 
          FROM messages m 
          WHERE m.contact_id = c.id 
          ORDER BY m.created_at DESC, m.id DESC 
          LIMIT 1
        ) as last_message_is_auto_reply,
        (
          SELECT COUNT(*) 
          FROM messages m 
          WHERE m.contact_id = c.id AND m.direction = 'incoming' AND m.processing_status = 'received'
        ) as unread_count
      FROM contacts c
    `;

    const params: any[] = [];
    if (search && search.trim()) {
      query += ` WHERE c.display_name LIKE ? OR c.phone_number LIKE ?`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ` ORDER BY last_message_time DESC NULLS LAST, c.updated_at DESC`;

    return db.prepare(query).all(...params);
  }

  /**
   * Get messages for a specific conversation thread
   */
  public static getConversationMessages(contactId: number, limit: number = 50, offset: number = 0) {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
    if (!contact) return null;

    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE contact_id = ?
      ORDER BY created_at ASC, id ASC
      LIMIT ? OFFSET ?
    `).all(contactId, limit, offset);

    const totalCount = (db.prepare('SELECT COUNT(*) as count FROM messages WHERE contact_id = ?').get(contactId) as { count: number }).count;

    return {
      contact,
      messages,
      totalCount
    };
  }

  /**
   * Send a manual message from administrator to contact
   */
  public static async sendManualMessage(contactId: number, body: string) {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) as any;
    if (!contact) {
      throw new Error('Contact not found');
    }

    // Send via WhatsApp service
    const sendResult = await whatsappService.sendMessage(contact.whatsapp_id, body);
    if (!sendResult.success) {
      throw new Error(sendResult.error || 'Failed to send message via WhatsApp');
    }

    // Insert outgoing message
    const insert = db.prepare(`
      INSERT INTO messages (
        whatsapp_message_id, contact_id, direction, message_type,
        message_body, is_auto_reply, processing_status, created_at
      ) VALUES (?, ?, 'outgoing', 'chat', ?, 0, 'sent', datetime('now'))
    `);

    const result = insert.run(sendResult.messageId, contactId, body);

    // Update contact timestamp
    db.prepare('UPDATE contacts SET updated_at = datetime(\'now\') WHERE id = ?').run(contactId);

    const newMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

    return {
      success: true,
      message: newMsg
    };
  }

  /**
   * Filterable message history with pagination
   */
  public static getMessageHistory(filters: {
    search?: string;
    direction?: string;
    isAutoReply?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(10, filters.limit || 25));
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (filters.search && filters.search.trim()) {
      whereClauses.push(`(m.message_body LIKE ? OR c.phone_number LIKE ? OR c.display_name LIKE ?)`);
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term);
    }

    if (filters.direction && (filters.direction === 'incoming' || filters.direction === 'outgoing')) {
      whereClauses.push(`m.direction = ?`);
      params.push(filters.direction);
    }

    if (filters.isAutoReply !== undefined && filters.isAutoReply !== '') {
      whereClauses.push(`m.is_auto_reply = ?`);
      params.push(filters.isAutoReply === '1' || filters.isAutoReply === 'true' ? 1 : 0);
    }

    if (filters.status && filters.status.trim()) {
      whereClauses.push(`m.processing_status = ?`);
      params.push(filters.status.trim());
    }

    if (filters.startDate) {
      whereClauses.push(`date(m.created_at) >= date(?)`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereClauses.push(`date(m.created_at) <= date(?)`);
      params.push(filters.endDate);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total 
      FROM messages m
      JOIN contacts c ON m.contact_id = c.id
      ${whereSql}
    `;
    const totalCount = (db.prepare(countSql).get(...params) as { total: number }).total;

    const query = `
      SELECT 
        m.id,
        m.whatsapp_message_id,
        m.contact_id,
        m.direction,
        m.message_type,
        m.message_body,
        m.is_auto_reply,
        m.processing_status,
        m.error_message,
        m.created_at,
        c.phone_number as contact_phone,
        c.display_name as contact_name
      FROM messages m
      JOIN contacts c ON m.contact_id = c.id
      ${whereSql}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ? OFFSET ?
    `;

    const records = db.prepare(query).all(...params, limit, offset);

    return {
      records,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Export message history as CSV
   */
  public static exportMessagesCsv(filters: any) {
    const history = this.getMessageHistory({ ...filters, limit: 10000, page: 1 });
    
    // Header
    const headers = ['ID', 'WhatsApp Message ID', 'Contact Name', 'Contact Phone', 'Direction', 'Type', 'Is Auto Reply', 'Status', 'Timestamp', 'Message Body'];
    
    const rows = history.records.map((r: any) => {
      return [
        r.id,
        `"${(r.whatsapp_message_id || '').replace(/"/g, '""')}"`,
        `"${(r.contact_name || '').replace(/"/g, '""')}"`,
        `"${(r.contact_phone || '').replace(/"/g, '""')}"`,
        r.direction,
        r.message_type,
        r.is_auto_reply === 1 ? 'YES' : 'NO',
        r.processing_status,
        `"${r.created_at}"`,
        `"${(r.message_body || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Calculate dashboard overview statistics
   */
  public static getDashboardStats() {
    const sessionInfo = whatsappService.getSessionInfo();

    const totalIncoming = (db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE direction = 'incoming'
    `).get() as { count: number }).count;

    const autoRepliesSent = (db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE is_auto_reply = 1
    `).get() as { count: number }).count;

    const activeRules = (db.prepare(`
      SELECT COUNT(*) as count FROM auto_reply_rules WHERE is_enabled = 1
    `).get() as { count: number }).count;

    const todayIncoming = (db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE direction = 'incoming' AND date(created_at) = date('now')
    `).get() as { count: number }).count;

    const todayReplied = (db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE is_auto_reply = 1 AND date(created_at) = date('now')
    `).get() as { count: number }).count;

    const totalConversations = (db.prepare(`
      SELECT COUNT(*) as count FROM contacts
    `).get() as { count: number }).count;

    return {
      connectionStatus: sessionInfo.status,
      connectedAccount: sessionInfo.phoneNumber || null,
      accountName: sessionInfo.pushname || null,
      mode: sessionInfo.mode,
      lastConnectedAt: sessionInfo.connectedAt || null,
      totalIncoming,
      autoRepliesSent,
      activeRules,
      messagesReceivedToday: todayIncoming,
      messagesRepliedToday: todayReplied,
      totalConversations
    };
  }

  /**
   * Fetch recent activity logs
   */
  public static getRecentActivity(limit: number = 20) {
    return db.prepare(`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
  }
}
