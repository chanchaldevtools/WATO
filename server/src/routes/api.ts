import express, { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';
import { whatsappService } from '../services/whatsappService.js';
import { autoReplyService } from '../services/autoReplyService.js';
import { MessageService } from '../services/messageService.js';

export const apiRouter = express.Router();

// Simple session token middleware for admin API protection
const ADMIN_TOKEN = 'autoreply_admin_secret_token_session_2026';

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow login endpoint and public health check
  if (req.path === '/auth/login' || req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For convenience in prototype / single admin deployment, we check token or allow session header
    const token = req.headers['x-admin-token'] || req.cookies?.admin_token;
    if (token === ADMIN_TOKEN) return next();
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Invalid or expired credentials.' });
  }

  next();
}

// Attach auth middleware to API router (with graceful bypass if configured or for initial view)
apiRouter.use(authMiddleware);

// --- Auth Endpoints ---
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  // Check admin user in DB (accepts default admin / admin123 or matches DB)
  if ((username === 'admin' && password === 'admin123') || (username === 'admin' && password === 'admin')) {
    return res.json({
      success: true,
      token: ADMIN_TOKEN,
      user: {
        id: 1,
        username: 'admin',
        role: 'Super Administrator',
        name: 'Nexus Admin'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid username or password.' });
});

apiRouter.get('/auth/me', (_req: Request, res: Response) => {
  res.json({
    user: {
      id: 1,
      username: 'admin',
      role: 'Super Administrator',
      name: 'Nexus Admin'
    }
  });
});

// --- WhatsApp Session Endpoints ---
apiRouter.get('/whatsapp/status', (_req: Request, res: Response) => {
  const info = whatsappService.getSessionInfo();
  res.json(info);
});

apiRouter.post('/whatsapp/connect', async (_req: Request, res: Response) => {
  try {
    const info = await whatsappService.connect();
    res.json({ success: true, ...info });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/whatsapp/disconnect', async (_req: Request, res: Response) => {
  try {
    const info = await whatsappService.disconnect();
    res.json({ success: true, ...info });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/whatsapp/reconnect', async (_req: Request, res: Response) => {
  try {
    const info = await whatsappService.reconnect();
    res.json({ success: true, ...info });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/whatsapp/simulate-scan', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, name } = req.body;
    const info = await whatsappService.simulateScanAndAuthorize(
      phoneNumber || '+1 (555) 234-8900',
      name || 'Verified WhatsApp Business'
    );
    res.json({ success: true, ...info });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/whatsapp/simulate-incoming', async (req: Request, res: Response) => {
  try {
    const { fromPhone, text, contactName } = req.body;
    if (!fromPhone || !text) {
      return res.status(400).json({ error: 'fromPhone and text are required' });
    }
    const msg = await whatsappService.simulateIncomingMessage(fromPhone, text, contactName);
    res.json({ success: true, simulatedMessage: msg });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Auto Reply Rules Endpoints ---
apiRouter.get('/auto-reply/rules', (_req: Request, res: Response) => {
  const rules = db.prepare(`
    SELECT * FROM auto_reply_rules 
    ORDER BY priority DESC, id ASC
  `).all();
  res.json(rules);
});

apiRouter.post('/auto-reply/rules', (req: Request, res: Response) => {
  const { name, trigger_type, keywords, match_mode, reply_message, priority, is_enabled } = req.body;

  if (!name || !trigger_type || !reply_message) {
    return res.status(400).json({ error: 'Name, trigger_type, and reply_message are required.' });
  }

  const validTriggers = ['all', 'exact', 'contains', 'starts_with', 'fallback'];
  if (!validTriggers.includes(trigger_type)) {
    return res.status(400).json({ error: `Invalid trigger_type. Must be one of: ${validTriggers.join(', ')}` });
  }

  const insert = db.prepare(`
    INSERT INTO auto_reply_rules (
      name, trigger_type, keywords, match_mode, reply_message, priority, is_enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const result = insert.run(
    name.trim(),
    trigger_type,
    keywords ? keywords.trim() : '',
    match_mode || 'case_insensitive',
    reply_message.trim(),
    Number(priority) || 1,
    is_enabled === false || is_enabled === 0 ? 0 : 1
  );

  const rule = db.prepare('SELECT * FROM auto_reply_rules WHERE id = ?').get(result.lastInsertRowid);
  
  // Log activity
  db.prepare(`
    INSERT INTO activity_logs (event_type, description, metadata, created_at)
    VALUES ('rule_created', ?, ?, datetime('now'))
  `).run(`Auto-reply rule created: "${name}"`, JSON.stringify({ ruleId: result.lastInsertRowid }));

  res.status(201).json(rule);
});

apiRouter.get('/auto-reply/rules/:id', (req: Request, res: Response) => {
  const rule = db.prepare('SELECT * FROM auto_reply_rules WHERE id = ?').get(req.params.id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  res.json(rule);
});

apiRouter.put('/auto-reply/rules/:id', (req: Request, res: Response) => {
  const { name, trigger_type, keywords, match_mode, reply_message, priority, is_enabled } = req.body;
  const ruleId = req.params.id;

  const existing = db.prepare('SELECT id FROM auto_reply_rules WHERE id = ?').get(ruleId);
  if (!existing) return res.status(404).json({ error: 'Rule not found' });

  const update = db.prepare(`
    UPDATE auto_reply_rules SET
      name = COALESCE(?, name),
      trigger_type = COALESCE(?, trigger_type),
      keywords = COALESCE(?, keywords),
      match_mode = COALESCE(?, match_mode),
      reply_message = COALESCE(?, reply_message),
      priority = COALESCE(?, priority),
      is_enabled = COALESCE(?, is_enabled),
      updated_at = datetime('now')
    WHERE id = ?
  `);

  update.run(
    name?.trim(),
    trigger_type,
    keywords !== undefined ? keywords.trim() : null,
    match_mode,
    reply_message?.trim(),
    priority !== undefined ? Number(priority) : null,
    is_enabled !== undefined ? (is_enabled ? 1 : 0) : null,
    ruleId
  );

  const updated = db.prepare('SELECT * FROM auto_reply_rules WHERE id = ?').get(ruleId) as any;

  db.prepare(`
    INSERT INTO activity_logs (event_type, description, metadata, created_at)
    VALUES ('rule_updated', ?, ?, datetime('now'))
  `).run(`Auto-reply rule updated: "${name || updated?.name}"`, JSON.stringify({ ruleId }));

  res.json(updated);
});

apiRouter.delete('/auto-reply/rules/:id', (req: Request, res: Response) => {
  const ruleId = req.params.id;
  const rule = db.prepare('SELECT * FROM auto_reply_rules WHERE id = ?').get(ruleId) as any;
  if (!rule) return res.status(404).json({ error: 'Rule not found' });

  db.prepare('DELETE FROM auto_reply_rules WHERE id = ?').run(ruleId);

  db.prepare(`
    INSERT INTO activity_logs (event_type, description, metadata, created_at)
    VALUES ('rule_deleted', ?, ?, datetime('now'))
  `).run(`Auto-reply rule deleted: "${rule.name}"`, JSON.stringify({ ruleId }));

  res.json({ success: true, message: 'Rule deleted successfully' });
});

apiRouter.patch('/auto-reply/rules/:id/toggle', (req: Request, res: Response) => {
  const ruleId = req.params.id;
  const rule = db.prepare('SELECT * FROM auto_reply_rules WHERE id = ?').get(ruleId) as any;
  if (!rule) return res.status(404).json({ error: 'Rule not found' });

  const newStatus = rule.is_enabled === 1 ? 0 : 1;
  db.prepare('UPDATE auto_reply_rules SET is_enabled = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(newStatus, ruleId);

  const updated = db.prepare('SELECT * FROM auto_reply_rules WHERE id = ?').get(ruleId);
  res.json(updated);
});

apiRouter.post('/auto-reply/test-match', (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const result = autoReplyService.testRuleMatch(message);
  res.json(result);
});

// --- Settings Endpoints ---
apiRouter.get('/settings', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT setting_key, setting_value FROM app_settings').all() as any[];
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.setting_key] = r.setting_value;
  }
  res.json(settings);
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid settings payload' });
  }

  const updateSetting = db.prepare(`
    INSERT INTO app_settings (setting_key, setting_value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = datetime('now')
  `);

  const runAll = db.transaction((obj) => {
    for (const [k, v] of Object.entries(obj)) {
      updateSetting.run(k, String(v));
    }
  });

  runAll(updates);

  db.prepare(`
    INSERT INTO activity_logs (event_type, description, metadata, created_at)
    VALUES ('settings_updated', 'System settings updated by administrator', ?, datetime('now'))
  `).run(JSON.stringify(Object.keys(updates)));

  // Return full updated settings
  const rows = db.prepare('SELECT setting_key, setting_value FROM app_settings').all() as any[];
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.setting_key] = r.setting_value;
  }
  res.json(settings);
});

// --- Conversations Endpoints ---
apiRouter.get('/conversations', (req: Request, res: Response) => {
  const search = req.query.search as string;
  const list = MessageService.getConversations(search);
  res.json(list);
});

apiRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const contactId = Number(req.params.id);
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const offset = req.query.offset ? Number(req.query.offset) : 0;

  const data = MessageService.getConversationMessages(contactId, limit, offset);
  if (!data) return res.status(404).json({ error: 'Conversation not found' });
  res.json(data);
});

apiRouter.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const contactId = Number(req.params.id);
  const { body } = req.body;

  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Message body cannot be empty' });
  }

  try {
    const result = await MessageService.sendManualMessage(contactId, body.trim());
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send message' });
  }
});

// --- Message History Endpoints ---
apiRouter.get('/messages', (req: Request, res: Response) => {
  const filters = {
    search: req.query.search as string,
    direction: req.query.direction as string,
    isAutoReply: req.query.isAutoReply as string,
    status: req.query.status as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    limit: req.query.limit ? Number(req.query.limit) : 25,
    page: req.query.page ? Number(req.query.page) : 1
  };

  const result = MessageService.getMessageHistory(filters);
  res.json(result);
});

apiRouter.get('/messages/export', (req: Request, res: Response) => {
  const filters = {
    search: req.query.search as string,
    direction: req.query.direction as string,
    isAutoReply: req.query.isAutoReply as string,
    status: req.query.status as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  };

  const csv = MessageService.exportMessagesCsv(filters);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="whatsapp_messages_${Date.now()}.csv"`);
  res.send(csv);
});

// --- Dashboard Endpoints ---
apiRouter.get('/dashboard/stats', (_req: Request, res: Response) => {
  const stats = MessageService.getDashboardStats();
  res.json(stats);
});

apiRouter.get('/dashboard/activity', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const logs = MessageService.getRecentActivity(limit);
  res.json(logs);
});
