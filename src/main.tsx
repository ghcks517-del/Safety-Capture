import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure installed PWA reloads once when a new Service Worker activates
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
