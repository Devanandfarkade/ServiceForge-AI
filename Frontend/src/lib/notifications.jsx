import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext(null);

const initialNotifications = [
  {
    id: 'n1',
    title: 'SLA risk detected',
    message: 'JOB-2026-0412 is approaching its SLA target.',
    time: '5 min ago',
    read: false,
    link: '/jobs/JOB-2026-0412',
    type: 'warning'
  },
  {
    id: 'n2',
    title: 'AI analysis ready',
    message: 'REQ-2026-0841 is ready for manager review.',
    time: '18 min ago',
    read: false,
    link: '/requests/REQ-2026-0841',
    type: 'ai'
  },
  {
    id: 'n3',
    title: 'Technician update',
    message: 'David Miller added a field update.',
    time: '32 min ago',
    read: false,
    link: '/jobs/JOB-2026-0412',
    type: 'info'
  }
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
