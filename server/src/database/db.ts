import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'whatsapp_autoreply.db');
export const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Contacts table
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      whatsapp_id TEXT UNIQUE NOT NULL,
      phone_number TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      whatsapp_message_id TEXT UNIQUE,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      direction TEXT NOT NULL CHECK(direction IN ('incoming', 'outgoing')),
      message_type TEXT NOT NULL DEFAULT 'chat',
      message_body TEXT NOT NULL,
      is_auto_reply INTEGER NOT NULL DEFAULT 0,
      processing_status TEXT NOT NULL DEFAULT 'received',
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
    CREATE INDEX IF NOT EXISTS idx_messages_is_auto_reply ON messages(is_auto_reply);

    -- Auto Reply Rules table
    CREATE TABLE IF NOT EXISTS auto_reply_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      trigger_type TEXT NOT NULL CHECK(trigger_type IN ('all', 'exact', 'contains', 'starts_with', 'fallback')),
      keywords TEXT, -- comma-separated or JSON list of triggers
      match_mode TEXT NOT NULL DEFAULT 'case_insensitive' CHECK(match_mode IN ('case_insensitive', 'case_sensitive', 'regex')),
      reply_message TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 1,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_rules_priority ON auto_reply_rules(priority DESC);
    CREATE INDEX IF NOT EXISTS idx_rules_enabled ON auto_reply_rules(is_enabled);

    -- Application Settings table
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Activity Logs table
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at DESC);

    -- Admin Users table for dashboard authentication
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default settings if empty
  const defaultSettings: Record<string, string> = {
    global_auto_reply_enabled: 'true',
    business_name: 'Nexus Digital Tech',
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    timezone: 'UTC',
    reply_delay_ms: '1500',
    ignore_group_messages: 'true',
    ignore_status_updates: 'true',
    ignore_self_messages: 'true',
    prevent_duplicate_replies: 'true',
    max_replies_per_contact_window: '5', // max 5 automatic replies
    rate_limit_window_minutes: '15',     // within 15 minutes window
    default_fallback_message: 'Thank you for reaching out! Our team is currently reviewing your message and will respond shortly.',
    disclaimer_accepted: 'true'
  };

  const insertSetting = db.prepare(`
    INSERT INTO app_settings (setting_key, setting_value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(setting_key) DO NOTHING
  `);

  for (const [key, val] of Object.entries(defaultSettings)) {
    insertSetting.run(key, val);
  }

  // Seed default starter rules if none exist
  const rulesCount = (db.prepare('SELECT COUNT(*) as count FROM auto_reply_rules').get() as { count: number }).count;
  if (rulesCount === 0) {
    const insertRule = db.prepare(`
      INSERT INTO auto_reply_rules (name, trigger_type, keywords, match_mode, reply_message, priority, is_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertRule.run(
      'Greeting & Welcome',
      'contains',
      'hi, hello, hey, start, good morning, good evening, greetings',
      'case_insensitive',
      'Hello! 👋 Welcome to Nexus Digital. We automate customer workflows and support. How can we assist you today?\n\nType *services* to see our offerings, or *price* for plans.',
      10,
      1
    );

    insertRule.run(
      'Product & Pricing Inquiry',
      'contains',
      'price, pricing, cost, rate, quote, plans, fee',
      'case_insensitive',
      'Thank you for your interest! 💼 Our packages start at $49/mo for Starter and $199/mo for Pro Enterprise. Visit https://nexus-digital.io/pricing or let us know if you would like a custom quote!',
      8,
      1
    );

    insertRule.run(
      'Working Hours & Location',
      'contains',
      'hours, opening, time, schedule, office, location, address',
      'case_insensitive',
      '⏰ Our official business hours are Monday through Friday, 9:00 AM - 6:00 PM (EST). Our headquarters is located at 100 Innovation Way, Suite 400.',
      7,
      1
    );

    insertRule.run(
      'Support & Escalation',
      'starts_with',
      'support, help, bug, urgent, emergency',
      'case_insensitive',
      'Got it! 🛠️ A high-priority support ticket has been flagged for our technical desk. An on-duty engineer will reach out to this WhatsApp number within 15 minutes.',
      9,
      1
    );

    insertRule.run(
      'Default Smart Fallback',
      'fallback',
      '',
      'case_insensitive',
      'Thank you for your message! 🙏 Our automated desk has logged your inquiry. A human representative will follow up with you as soon as possible during business hours.',
      1,
      1
    );
  }

  // Seed default admin user (admin / admin123)
  const adminCount = (db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number }).count;
  if (adminCount === 0) {
    // Standard secure hash for "admin123"
    // Using a simple crypto hash so no extra heavy bcrypt binary needed
    db.prepare(`
      INSERT INTO admin_users (username, password_hash, role)
      VALUES (?, ?, ?)
    `).run('admin', '0192023a7bbd73250516f069df18b500', 'admin');
  }

  // Seed initial contacts & demo messages if database is fresh
  const contactsCount = (db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number }).count;
  if (contactsCount === 0) {
    const insertContact = db.prepare(`
      INSERT INTO contacts (whatsapp_id, phone_number, display_name, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now', '-2 days'), datetime('now', '-10 minutes'))
    `);

    const c1 = insertContact.run('14155552671@c.us', '+1 (415) 555-2671', 'Sarah Jenkins');
    const c2 = insertContact.run('447700900123@c.us', '+44 7700 900123', 'David Miller');
    const c3 = insertContact.run('61491570156@c.us', '+61 491 570 156', 'Aria Chen (Apex Corp)');

    const insertMsg = db.prepare(`
      INSERT INTO messages (whatsapp_message_id, contact_id, direction, message_type, message_body, is_auto_reply, processing_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Sarah's conversation
    insertMsg.run('wamid_demo_101', c1.lastInsertRowid, 'incoming', 'chat', 'Hello there! Are you open right now?', 0, 'processed', new Date(Date.now() - 3600000).toISOString());
    insertMsg.run('wamid_demo_102', c1.lastInsertRowid, 'outgoing', 'chat', 'Hello! 👋 Welcome to Nexus Digital. We automate customer workflows and support. How can we assist you today?', 1, 'sent', new Date(Date.now() - 3598000).toISOString());
    insertMsg.run('wamid_demo_103', c1.lastInsertRowid, 'incoming', 'chat', 'Can you tell me the pricing plans?', 0, 'processed', new Date(Date.now() - 1200000).toISOString());
    insertMsg.run('wamid_demo_104', c1.lastInsertRowid, 'outgoing', 'chat', 'Thank you for your interest! 💼 Our packages start at $49/mo for Starter and $199/mo for Pro Enterprise.', 1, 'sent', new Date(Date.now() - 1195000).toISOString());

    // David's conversation
    insertMsg.run('wamid_demo_201', c2.lastInsertRowid, 'incoming', 'chat', 'Hey, what are your office hours this week?', 0, 'processed', new Date(Date.now() - 7200000).toISOString());
    insertMsg.run('wamid_demo_202', c2.lastInsertRowid, 'outgoing', 'chat', '⏰ Our official business hours are Monday through Friday, 9:00 AM - 6:00 PM (EST).', 1, 'sent', new Date(Date.now() - 7198000).toISOString());

    // Aria's conversation
    insertMsg.run('wamid_demo_301', c3.lastInsertRowid, 'incoming', 'chat', 'support needed for API webhook connectivity', 0, 'processed', new Date(Date.now() - 600000).toISOString());
    insertMsg.run('wamid_demo_302', c3.lastInsertRowid, 'outgoing', 'chat', 'Got it! 🛠️ A high-priority support ticket has been flagged for our technical desk.', 1, 'sent', new Date(Date.now() - 598000).toISOString());

    // Seed activity logs
    const insertLog = db.prepare(`
      INSERT INTO activity_logs (event_type, description, metadata, created_at)
      VALUES (?, ?, ?, ?)
    `);
    insertLog.run('system_startup', 'WhatsApp Auto Reply engine initialized', JSON.stringify({ version: '1.0.0' }), new Date(Date.now() - 86400000).toISOString());
    insertLog.run('auto_reply_sent', 'Automatic reply sent to +1 (415) 555-2671', JSON.stringify({ rule: 'Product & Pricing Inquiry' }), new Date(Date.now() - 1195000).toISOString());
    insertLog.run('auto_reply_sent', 'Automatic reply sent to +61 491 570 156', JSON.stringify({ rule: 'Support & Escalation' }), new Date(Date.now() - 598000).toISOString());
  }

  console.log('[SQLite] Database initialized at:', DB_PATH);
}
