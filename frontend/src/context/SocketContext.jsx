import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (user?.id) {
        newSocket.emit('join_user_room', { userId: user.id });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('notification_received', (data) => {
      setUnreadCount((c) => c + 1);
      addToast({
        type: data.notification?.type || 'info',
        title: data.notification?.title || 'New Notification',
        message: data.notification?.message || '',
      });
    });

    newSocket.on('sos_activated', (data) => {
      addToast({
        type: 'emergency',
        title: '🚨 EMERGENCY SOS ACTIVATED',
        message: 'Emergency SOS alert received! Coordinates shared with inner circle.',
      });
    });

    newSocket.on('journey_delayed', (data) => {
      addToast({
        type: 'warning',
        title: '⏰ Journey Overdue Alert',
        message: data.message || 'Expected arrival time has passed. Please check in.',
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        toasts,
        addToast,
        removeToast,
        unreadCount,
        setUnreadCount
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

