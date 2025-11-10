import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './services/sw/register';
import { startOnlineMonitoring, startPeriodicSync } from './services/sync/syncService';
import { initDB } from './services/db/indexedDB';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// IndexedDBを初期化
initDB().catch((error) => {
  console.error('Failed to initialize IndexedDB:', error);
});

// オンライン監視と定期同期を開始
startOnlineMonitoring();
startPeriodicSync(60000); // 60秒ごとに同期

// Service Workerを登録（本番環境のみ）
if (import.meta.env.PROD) {
  registerServiceWorker();
}
