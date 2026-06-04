import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { StoreHydrationGate } from './components/StoreHydrationGate.jsx';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreHydrationGate>
      <App />
    </StoreHydrationGate>
  </StrictMode>,
);
