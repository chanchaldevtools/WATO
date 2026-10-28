import { Server as SocketIOServer, Socket } from 'socket.io';
import { whatsappService } from '../services/whatsappService.js';
import { autoReplyService } from '../services/autoReplyService.js';
import { MessageService } from '../services/messageService.js';

export function setupSocketIO(io: SocketIOServer) {
  io.use((socket, next) => {
    // Optional socket authentication check
    const token = socket.handshake.auth.token || socket.handshake.headers['x-admin-token'];
    // In local / single-admin app, allow client connection
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Immediately push current WhatsApp status and dashboard stats
    socket.emit('whatsapp:status', whatsappService.getSessionInfo());
    socket.emit('dashboard:stats', MessageService.getDashboardStats());

    // Allow client to request fresh status
    socket.on('whatsapp:get_status', () => {
      socket.emit('whatsapp:status', whatsappService.getSessionInfo());
    });

    socket.on('dashboard:get_stats', () => {
      socket.emit('dashboard:stats', MessageService.getDashboardStats());
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Listen to whatsappService events
  whatsappService.on('status_change', (info) => {
    io.emit('whatsapp:status', info);
    io.emit('dashboard:stats', MessageService.getDashboardStats());
  });

  whatsappService.on('qr', (data) => {
    io.emit('whatsapp:qr', data);
  });

  whatsappService.on('authenticated', () => {
    io.emit('whatsapp:authenticated');
  });

  whatsappService.on('ready', (info) => {
    io.emit('whatsapp:ready', info);
    io.emit('dashboard:stats', MessageService.getDashboardStats());
  });

  whatsappService.on('activity', (act) => {
    io.emit('activity:new', act);
  });

  // Listen to autoReplyService events
  autoReplyService.on('message:new', (msg) => {
    io.emit('message:new', msg);
    io.emit('dashboard:stats', MessageService.getDashboardStats());
  });

  autoReplyService.on('reply:sent', (data) => {
    io.emit('reply:sent', data);
    io.emit('dashboard:stats', MessageService.getDashboardStats());
  });
}
