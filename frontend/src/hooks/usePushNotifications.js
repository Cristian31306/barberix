import { useEffect } from 'react';
import api from '../lib/axios';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = (isAuthenticated) => {
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const setupPushNotifications = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          return;
        }

        // Register Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Get VAPID public key from backend
        const keyResponse = await api.get('/vapid-public-key');
        if (!keyResponse.data.key) return;

        const applicationServerKey = urlBase64ToUint8Array(keyResponse.data.key);
        
        // Subscribe
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        // Send to backend
        await api.post('/push-subscriptions', subscription.toJSON());
        
      } catch (e) {
        console.error('Error setting up push notifications', e);
      }
    };

    setupPushNotifications();
  }, [isAuthenticated]);
};
