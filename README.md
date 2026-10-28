# AutoReply WhatsApp - Automation Platform

A complete, production-grade, web-based WhatsApp Auto Reply Automation System built with **Node.js, Express.js, Socket.IO, SQLite (WAL mode), whatsapp-web.js, React 19, TypeScript, Vite, and Tailwind CSS**.

The system enables businesses to automate 24/7 WhatsApp customer conversations, keyword triggers, priority-based auto-replies, rate-limited anti-spam protection, and audit logging using WhatsApp Web Multi-Device QR authentication—**without requiring the paid official WhatsApp Cloud API**.

---

## 🚀 Key Features

- **Multi-Device QR Code Authentication**:
  - Live QR code generation directly in the web browser.
  - Automatic token refresh & multi-device session caching via `.wwebjs_auth`.
  - Built-in Interactive Sandbox Simulator for headless cloud/container testing.
- **Rule-Based Auto Reply Engine**:
  - 5 Trigger Types: `Contains Keyword`, `Exact Match`, `Starts With`, `All Incoming`, and `Default Smart Fallback`.
  - Case-insensitive & Regex support with automated input normalization.
  - Priority scoring (1–100) ensuring higher-priority business rules evaluate first.
  - Interactive Rule Evaluation Tester: test any message string live in the UI without messaging real users.
- **Real-Time Two-Panel Conversations**:
  - WhatsApp Web-styled real-time messaging interface.
  - Socket.IO synchronized incoming and outgoing message bubbles.
  - Distinct `[🤖 Auto Reply]` indicators for automated responses.
  - Manual operator reply compose bar to take over any conversation thread seamlessly.
- **Audit Message History & CSV Export**:
  - Searchable by contact phone, name, and message body.
  - Multi-filter by direction (incoming/outgoing), status, response type, and date ranges.
  - One-click live CSV export of complete chat logs.
- **Anti-Ban Safeguards & Global Settings**:
  - Emulated human typing delay (configurable 500ms – 5,000ms slider).
  - Rate limiting: configurable maximum replies per contact within a time window (e.g. 5 replies / 15 minutes) to avoid infinite bot loops.
  - Ignored groups toggle, status broadcast drop, and self-message filter.
  - Master auto-reply pause/resume toggle.
- **Self-Contained SQLite Persistence**:
  - Fast, self-contained SQLite database with Write-Ahead Logging (`WAL`) enabled for high concurrency.
  - Contacts, messages, settings, rules, and activity logs survive server restarts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js (ES Modules), Express.js 4.x, Socket.IO 4.x, Better-SQLite3, Dotenv |
| **WhatsApp Engine** | `whatsapp-web.js` (Multi-Device LocalAuth) + QR Code generator |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons, Socket.IO Client |
| **Database** | SQLite 3 (WAL mode, Foreign Keys enabled) |

---

## 📂 Project Architecture

```
.
├── server.ts                       # Express + Socket.IO + Vite middleware server entry
├── server/
│   └── src/
│       ├── database/
│       │   └── db.ts               # SQLite schema, indices, default rules & seed data
│       ├── services/
│       │   ├── whatsappService.ts  # WhatsApp Web client, QR lifecycle & sandbox engine
│       │   ├── autoReplyService.ts # Priority rule engine, rate limiting & message flow
│       │   └── messageService.ts   # Chat threads, audit queries, CSV export & stats
│       ├── routes/
│       │   └── api.ts              # RESTful API endpoints (/api/whatsapp, /api/auto-reply, etc.)
│       └── socket/
│           └── socketHandler.ts    # Real-time Socket.IO bidirectional event broadcasts
├── src/
│   ├── components/                 # Navbar, Sidebar, ConfirmDialog, Toasts, Modals
│   ├── pages/                      # Overview, WhatsAppConnection, AutoReplyRules,
│   │                               # Conversations, MessageHistory, Settings
│   ├── services/                   # Frontend API fetch wrapper & Socket.IO client
│   ├── types/                      # Shared TypeScript models and interfaces
│   ├── App.tsx                     # React Router & Theme provider
│   └── main.tsx
├── data/                           # Persistent SQLite database folder (auto-created)
├── .wwebjs_auth/                   # Persisted WhatsApp session tokens (auto-created)
└── package.json
```

---

## 📦 Installation & Local Development

### 1. Prerequisites
- **Node.js**: v18.x or v20.x or v22.x LTS
- **npm** or **pnpm** or **yarn**

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Default `.env` settings:
```ini
PORT=3000
NODE_ENV=development
```

### 4. Start the Application

#### On Linux / macOS:
```bash
npm run dev
```

#### On Windows (PowerShell or CMD):
```powershell
npm run dev
```

Open your browser at **`http://localhost:3000`**. The full-stack app runs with live Vite bundling and backend API on port 3000.

---

## 🚀 Linux Production Deployment

For deploying on a Linux server (Ubuntu/Debian, CentOS, or Cloud VPS):

1. **Build the Frontend Assets**:
   ```bash
   npm run build
   ```

2. **System Dependencies for Puppeteer (Chromium)**:
   If running real Chromium via `whatsapp-web.js`:
   ```bash
   sudo apt-get update && sudo apt-get install -y \
     gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
     libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
     libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
     libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
     libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
     libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
     libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev
   ```

3. **Run with PM2 Process Manager**:
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name "whatsapp-autoreply"
   pm2 save
   pm2 startup
   ```

---

## 📲 How to Connect WhatsApp via QR Code

1. Navigate to **WhatsApp Connection** from the sidebar or click **Connect WhatsApp** on the dashboard.
2. Click the **"Connect WhatsApp Now"** button. The server initializes the engine and displays a high-resolution QR code.
3. Open WhatsApp on your primary mobile phone:
   - **Android**: Tap the three vertical dots `⋮` at the top right → **Linked Devices** → **Link a Device**.
   - **iPhone**: Tap **Settings (⚙)** at the bottom right → **Linked Devices** → **Link a Device**.
4. Point your phone's camera at the computer screen to scan the QR code.
5. Once scanned, the terminal updates instantly to **Connected** without a page refresh, displaying your linked phone number and device details.

> **Testing Sandbox**: If you are testing in a headless cloud container without a physical spare phone, you can use the **"Simulate QR Scan & Connect Test Account"** button on the connection screen to test all auto-reply pipelines immediately.

---

## 🤖 Adding and Testing Auto Reply Rules

1. Go to **Auto Reply Rules** in the sidebar.
2. Click **Create New Rule**.
3. Choose the Trigger Type:
   - **Contains**: Triggered if the customer message includes any of the specified comma-separated keywords (e.g. `price, cost, rate`).
   - **Exact**: Triggered only when the entire incoming message exactly matches a keyword.
   - **Starts With**: Triggered when the message begins with a keyword (e.g. `support, help`).
   - **All**: Responds to any incoming message.
   - **Fallback**: Triggers only when no other rule matches.
4. Set the **Priority** (e.g., `10` for high-priority emergency support, `5` for general inquiries, `1` for fallback).
5. Enter the **Reply Message Template** and click **Create Rule**.
6. **Test Without Real Messaging**: Use the **Rule Evaluation Tester** bar at the top of the rules page. Type any customer query (e.g., *"Hello, what are your prices?"*) and click **Simulate Match** to view the exact rule fired and output text!

---

## 💾 Backups & Maintenance

### 1. Database Backup
All rules, contacts, settings, and chat history are stored in `./data/whatsapp_autoreply.db`. To back it up:
```bash
# SQLite online safe backup
sqlite3 data/whatsapp_autoreply.db ".backup 'data/backup_$(date +%Y%m%d).db'"
```

### 2. Session Backup
WhatsApp Multi-Device authentication tokens are stored in the `./.wwebjs_auth/` directory. Back up this directory to maintain the session without needing to scan QR again.

---

## ⚠️ WhatsApp Account Safety & Anti-Ban Notice

Because `whatsapp-web.js` is an unofficial WhatsApp Web automation library:
- **Never send unsolicited cold promotional messages**: Only respond to inbound inquiries initiated by users.
- **Maintain human delays**: Keep the reply delay set to 1,500ms or higher in **Settings**.
- **Enforce per-contact rate limits**: Default setting allows 5 automated replies per contact per 15 minutes to prevent infinite loops with other bots.
- For high-volume enterprise outbound marketing (>100,000 messages/day), consider migrating to Meta's official WhatsApp Cloud API.
