import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import {registerSW} from 'virtual:pwa-register';

// Register PWA service worker with auto-update without losing user data
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // When a new build is detected, skip waiting and update seamlessly
    updateSW(true);
  },
  onOfflineReady() {
    console.log('WargaQu: Cache offline siap digunakan.');
  },
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Periodic check for updates every 15 minutes
      setInterval(() => {
        registration.update().catch(() => {});
      }, 15 * 60 * 1000);
    }
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
