import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

export const showNotification = {
  success: (message) => toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
      fontWeight: 'bold',
    },
  }),
  
  error: (message) => toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
      fontWeight: 'bold',
    },
  }),
  
  warning: (message) => toast(message, {
    duration: 3500,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
      fontWeight: 'bold',
    },
  }),
  
  critical: (message) => {
    toast.error(message, {
      duration: 6000,
      position: 'top-right',
      style: {
        background: '#dc2626',
        color: '#fff',
        fontWeight: 'bold',
      },
    });
    // Play alert sound
    if (typeof Audio !== 'undefined') {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgc7y2Yk3CBlou+3nn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAC');
      audio.play().catch(() => {});
    }
  }
};

const NotificationContainer = () => {
  return <Toaster />;
};

export default NotificationContainer;