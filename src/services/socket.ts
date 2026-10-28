import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(window.location.origin, {
      auth: {
        token: getAuthToken(),
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket Client] Connected with ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket Client] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket Client] Connection error:', error.message);
    });
  }

  return socket;
};
