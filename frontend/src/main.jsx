import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { AppProviders } from './components/AppProviders.jsx';
import './i18n';
import './index.css';

registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
